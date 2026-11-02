-- Bayit / Phase 1-2 foundation
-- Review before applying. This migration is scoped to the Bayit Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  calendar_color text not null default '#A9C7E8' check (calendar_color ~ '^#[0-9A-Fa-f]{6}$'),
  timezone text not null default 'Europe/Madrid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  calendar_color text not null default '#B9C9B1' check (calendar_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','invited','left')),
  added_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(family_id, profile_id)
);

create index if not exists family_members_profile_status_idx on public.family_members(profile_id,status);
create index if not exists family_members_family_status_idx on public.family_members(family_id,status);

create or replace function public.bayit_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.bayit_touch_updated_at();

drop trigger if exists families_touch_updated_at on public.families;
create trigger families_touch_updated_at before update on public.families
for each row execute function public.bayit_touch_updated_at();

-- Create one profile for every new authenticated user.
create or replace function public.bayit_handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Nuevo usuario'
  );
  insert into public.profiles(id, display_name)
  values (new.id, left(v_name,80))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists bayit_on_auth_user_created on auth.users;
create trigger bayit_on_auth_user_created
after insert on auth.users
for each row execute function public.bayit_handle_new_user();

-- New family creation and owner membership are atomic.
create or replace function public.bayit_create_family(p_name text, p_color text default '#B9C9B1')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_family_id uuid;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
  if p_name is null or char_length(trim(p_name)) not between 1 and 80 then
    raise exception 'El nombre debe tener entre 1 y 80 caracteres.';
  end if;
  if p_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Color no válido.'; end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid()) then
    raise exception 'No se encuentra tu perfil.';
  end if;
  insert into public.families(name, calendar_color, created_by)
  values (trim(p_name), p_color, auth.uid())
  returning id into v_family_id;
  insert into public.family_members(family_id,profile_id,role,status,added_by)
  values (v_family_id,auth.uid(),'owner','active',auth.uid());
  return v_family_id;
end;
$$;

-- Admins can add a managed (not yet login-enabled) member to their own household.
create or replace function public.bayit_add_managed_member(p_family_id uuid, p_display_name text, p_color text default '#E9B9C5')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_profile_id uuid;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 80 then
    raise exception 'El nombre debe tener entre 1 y 80 caracteres.';
  end if;
  if p_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Color no válido.'; end if;
  if not exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id
      and fm.profile_id = auth.uid()
      and fm.status = 'active'
      and fm.role in ('owner','admin')
  ) then raise exception 'Solo un administrador del hogar puede añadir miembros.'; end if;

  insert into public.profiles(id,display_name,calendar_color)
  values (gen_random_uuid(),trim(p_display_name),p_color)
  returning id into v_profile_id;

  insert into public.family_members(family_id,profile_id,role,status,added_by)
  values (p_family_id,v_profile_id,'member','active',auth.uid());
  return v_profile_id;
end;
$$;

-- RLS helper: SECURITY DEFINER is narrowly scoped to avoid recursive policies
-- on family_members. It returns only whether the current user is an active member.
create or replace function public.bayit_is_active_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
      and fm.profile_id = (select auth.uid())
      and fm.status = 'active'
  );
$;
revoke all on function public.bayit_is_active_member(uuid) from public;
grant execute on function public.bayit_is_active_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;

drop policy if exists "profiles_read_self_or_household" on public.profiles;
create policy "profiles_read_self_or_household" on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1 from public.family_members theirs
    where theirs.profile_id = profiles.id
      and theirs.status = 'active'
      and public.bayit_is_active_member(theirs.family_id)
  )
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "families_read_members" on public.families;
create policy "families_read_members" on public.families
for select to authenticated
using (public.bayit_is_active_member(families.id));

drop policy if exists "families_update_admins" on public.families;
create policy "families_update_admins" on public.families
for update to authenticated
using (exists (
  select 1 from public.family_members fm
  where fm.family_id = families.id
    and fm.profile_id = (select auth.uid())
    and fm.status = 'active'
    and fm.role in ('owner','admin')
))
with check (exists (
  select 1 from public.family_members fm
  where fm.family_id = families.id
    and fm.profile_id = (select auth.uid())
    and fm.status = 'active'
    and fm.role in ('owner','admin')
));

drop policy if exists "family_members_read_household" on public.family_members;
create policy "family_members_read_household" on public.family_members
for select to authenticated
using (public.bayit_is_active_member(family_members.family_id));

-- Direct client-side inserts/deletes are intentionally disallowed.
revoke all on function public.bayit_create_family(text,text) from public;
revoke all on function public.bayit_add_managed_member(uuid,text,text) from public;
grant execute on function public.bayit_create_family(text,text) to authenticated;
grant execute on function public.bayit_add_managed_member(uuid,text,text) to authenticated;

comment on table public.profiles is 'Una persona, una identidad. Managed profiles have no auth.users entry until claimed.';
comment on column public.profiles.calendar_color is 'Soft personal calendar color; chosen from the Bayit pastel palette.';
comment on column public.families.calendar_color is 'Soft household calendar color; independent from member colors.';
