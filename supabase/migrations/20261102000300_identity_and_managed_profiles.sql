-- Bayit: identity/auth separation and managed profiles.
-- Apply only to the dedicated Bayit Supabase project after reviewing the full migration history.
begin;

-- 1) A person profile is an identity, not an authentication account.
alter table public.profiles
  add column if not exists auth_user_id uuid;

-- Preserve existing accounts: before this migration, profiles.id matched auth.users.id.
update public.profiles
set auth_user_id = id
where auth_user_id is null
  and exists (select 1 from auth.users u where u.id = profiles.id);

-- The auth link is optional for managed people, but unique when present.
create unique index if not exists profiles_auth_user_id_unique
  on public.profiles(auth_user_id)
  where auth_user_id is not null;

-- Remove the old identity = auth account constraint. Keep profile UUIDs stable,
-- so family_members and existing references do not change.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- Add FK on the nullable auth mapping.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_auth_user_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_auth_user_id_fkey
      foreign key (auth_user_id) references auth.users(id) on delete set null;
  end if;
end $$;

-- Resolve the Bayit profile for the current authenticated user.
create or replace function public.bayit_current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
  limit 1
$$;
revoke all on function public.bayit_current_profile_id() from public;
grant execute on function public.bayit_current_profile_id() to authenticated;

-- Rebuild the auth trigger: create an independent profile identity and link it.
create or replace function public.bayit_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Nuevo usuario'
  );
  insert into public.profiles(id, auth_user_id, display_name)
  values (gen_random_uuid(), new.id, left(v_name,80))
  on conflict (auth_user_id) where auth_user_id is not null do nothing;
  return new;
end;
$$;

-- Existing profiles were linked above. Trigger remains on auth.users.

-- Membership helper now resolves auth.uid() -> profile identity.
create or replace function public.bayit_is_active_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
      and fm.profile_id = (select public.bayit_current_profile_id())
      and fm.status = 'active'
  )
$$;
revoke all on function public.bayit_is_active_member(uuid) from public;
grant execute on function public.bayit_is_active_member(uuid) to authenticated;

-- A user may read their own identity and people in their active households.
drop policy if exists "profiles_read_self_or_household" on public.profiles;
create policy "profiles_read_self_or_household" on public.profiles
for select to authenticated
using (
  auth_user_id = (select auth.uid())
  or exists (
    select 1
    from public.family_members theirs
    where theirs.profile_id = profiles.id
      and theirs.status = 'active'
      and public.bayit_is_active_member(theirs.family_id)
  )
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
for update to authenticated
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

-- Household creation must use the stable profile ID, not auth.uid().
create or replace function public.bayit_create_family(
  p_name text,
  p_color text default '#B9C9B1'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family_id uuid;
  v_profile_id uuid;
begin
  v_profile_id := public.bayit_current_profile_id();
  if auth.uid() is null or v_profile_id is null then
    raise exception 'Debes iniciar sesión y tener un perfil.';
  end if;
  if p_name is null or char_length(trim(p_name)) not between 1 and 80 then
    raise exception 'El nombre debe tener entre 1 y 80 caracteres.';
  end if;
  if p_color is null or p_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Color no válido.';
  end if;

  insert into public.families(name, calendar_color, created_by)
  values (trim(p_name), p_color, v_profile_id)
  returning id into v_family_id;

  insert into public.family_members(family_id, profile_id, role, status, added_by)
  values (v_family_id, v_profile_id, 'owner', 'active', v_profile_id);
  return v_family_id;
end;
$$;

-- Managed people get a profile UUID but no auth.users row.
create or replace function public.bayit_add_managed_member(
  p_family_id uuid,
  p_display_name text,
  p_color text default '#E9B9C5'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_actor_profile_id uuid;
begin
  v_actor_profile_id := public.bayit_current_profile_id();
  if auth.uid() is null or v_actor_profile_id is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 80 then
    raise exception 'El nombre debe tener entre 1 y 80 caracteres.';
  end if;
  if p_color is null or p_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Color no válido.';
  end if;
  if not exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id
      and fm.profile_id = v_actor_profile_id
      and fm.status = 'active'
      and fm.role in ('owner','admin')
  ) then
    raise exception 'Solo un administrador del hogar puede añadir miembros.';
  end if;

  insert into public.profiles(id, auth_user_id, display_name, calendar_color)
  values (gen_random_uuid(), null, trim(p_display_name), p_color)
  returning id into v_profile_id;

  insert into public.family_members(family_id, profile_id, role, status, added_by)
  values (p_family_id, v_profile_id, 'member', 'active', v_actor_profile_id);

  return v_profile_id;
end;
$$;

-- Representation is granted to a profile identity, scoped to a household.
-- No client policies are opened here; the server-side authorization layer
-- must be reviewed before these records are exposed to authenticated clients.
create table if not exists public.profile_representatives (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  representative_profile_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  can_view_calendar boolean not null default true,
  can_manage_events boolean not null default true,
  can_submit_planning boolean not null default true,
  can_manage_tasks boolean not null default false,
  can_receive_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(id),
  check (profile_id <> representative_profile_id),
  unique(profile_id, representative_profile_id, family_id)
);
-- Reconcile the earlier proposal table if migration 002 created its legacy
-- representative_user_id / auth.users shape. Profile IDs remain stable in
-- this migration, so existing auth user IDs map to the same profile IDs.
alter table public.profile_representatives
  add column if not exists representative_profile_id uuid;

do $bayit$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profile_representatives'
      and column_name='representative_user_id'
  ) then
    update public.profile_representatives pr
    set representative_profile_id = p.id
    from public.profiles p
    where p.auth_user_id = pr.representative_user_id
      and pr.representative_profile_id is null;

    if exists (
      select 1 from public.profile_representatives
      where representative_profile_id is null
    ) then
      raise exception 'No se pudo asociar cada representante con un perfil de Bayit.';
    end if;

    alter table public.profile_representatives
      drop column representative_user_id;
  end if;

  -- created_by used to reference auth.users; it now references profile identity.
  if exists (
    select 1 from pg_constraint
    where conrelid='public.profile_representatives'::regclass
      and conname='profile_representatives_created_by_fkey'
  ) then
    alter table public.profile_representatives
      drop constraint profile_representatives_created_by_fkey;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.profile_representatives'::regclass
      and conname='profile_representatives_created_by_fkey'
  ) then
    alter table public.profile_representatives
      add constraint profile_representatives_created_by_fkey
      foreign key (created_by) references public.profiles(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.profile_representatives'::regclass
      and conname='profile_representatives_representative_profile_id_fkey'
  ) then
    alter table public.profile_representatives
      add constraint profile_representatives_representative_profile_id_fkey
      foreign key (representative_profile_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.profile_representatives'::regclass
      and conname='profile_representatives_profile_rep_family_key'
  ) then
    alter table public.profile_representatives
      add constraint profile_representatives_profile_rep_family_key
      unique (profile_id, representative_profile_id, family_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.profile_representatives'::regclass
      and conname='profile_representatives_distinct_profiles_check'
  ) then
    alter table public.profile_representatives
      add constraint profile_representatives_distinct_profiles_check
      check (profile_id <> representative_profile_id);
  end if;
end $bayit$;

alter table public.profile_representatives
  alter column representative_profile_id set not null;

create index if not exists profile_representatives_profile_idx
  on public.profile_representatives(profile_id);
create index if not exists profile_representatives_representative_idx
  on public.profile_representatives(representative_profile_id);
create index if not exists profile_representatives_family_idx
  on public.profile_representatives(family_id);
alter table public.profile_representatives enable row level security;
revoke all on public.profile_representatives from anon, authenticated;

-- Keep function execution limited to authenticated callers.
revoke all on function public.bayit_create_family(text,text) from public;
revoke all on function public.bayit_add_managed_member(uuid,text,text) from public;
grant execute on function public.bayit_create_family(text,text) to authenticated;
grant execute on function public.bayit_add_managed_member(uuid,text,text) to authenticated;

comment on column public.profiles.auth_user_id is
  'Nullable link to the login account. NULL means this person is a managed profile without credentials.';
comment on table public.profile_representatives is
  'Scoped adult representation of a person profile. Access stays closed until granular RLS policies are reviewed and tested.';

commit;
