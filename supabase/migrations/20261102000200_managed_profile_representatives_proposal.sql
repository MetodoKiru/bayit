-- Bayit: managed profile representation model (schema proposal)
-- Review against the existing phase 1-2 migration before applying.
create table if not exists public.profile_representatives (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  representative_user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  can_view_calendar boolean not null default true,
  can_manage_events boolean not null default true,
  can_submit_planning boolean not null default true,
  can_manage_tasks boolean not null default false,
  can_receive_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  unique(profile_id, representative_user_id, family_id)
);
create index if not exists profile_representatives_profile_idx on public.profile_representatives(profile_id);
create index if not exists profile_representatives_user_idx on public.profile_representatives(representative_user_id);
create index if not exists profile_representatives_family_idx on public.profile_representatives(family_id);
alter table public.profile_representatives enable row level security;
-- Intentionally no permissive client policies yet: access must be added only
-- after reviewing the existing family_members/profile ownership policies.
-- Keep this table inaccessible until the complete policy set is tested.
revoke all on public.profile_representatives from anon, authenticated;
