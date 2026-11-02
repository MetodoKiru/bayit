-- Bayit phases 3-5: secure storage foundations for household connections,
-- event calendars, and recurring household tasks.
-- This migration intentionally creates NO client-readable policies.
-- Apply only to the dedicated Bayit Supabase project after reviewing all migrations.
begin;

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by_profile_id uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  accepted_by_family_id uuid references public.families(id) on delete set null,
  accepted_by_profile_id uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (not (accepted_at is not null and revoked_at is not null))
);
create index if not exists household_invitations_family_idx
  on public.household_invitations(family_id, created_at desc);

create table if not exists public.household_connections (
  id uuid primary key default gen_random_uuid(),
  family_a_id uuid not null references public.families(id) on delete cascade,
  family_b_id uuid not null references public.families(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  created_from_invitation_id uuid unique references public.household_invitations(id),
  created_by_profile_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (family_a_id <> family_b_id),
  check (family_a_id < family_b_id)
);
create unique index if not exists household_connections_pair_unique
  on public.household_connections(family_a_id,family_b_id);
create index if not exists household_connections_b_idx
  on public.household_connections(family_b_id,status);

-- Grants are directional and scoped to a specific connection and resource.
-- No grant means no sharing. Task resources are deliberately not supported.
create table if not exists public.household_sharing_grants (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.household_connections(id) on delete cascade,
  granting_family_id uuid not null references public.families(id) on delete cascade,
  resource_type text not null check (resource_type in ('household_calendar','personal_calendar','profile_availability')),
  resource_profile_id uuid references public.profiles(id) on delete cascade,
  visibility text not null check (visibility in ('availability','basic','full')),
  granted_by_profile_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (
    (resource_type = 'household_calendar' and resource_profile_id is null)
    or (resource_type in ('personal_calendar','profile_availability') and resource_profile_id is not null)
  )
);
create index if not exists household_sharing_grants_connection_idx
  on public.household_sharing_grants(connection_id,granting_family_id)
  where revoked_at is null;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_family_id uuid references public.families(id) on delete cascade,
  owner_profile_id uuid references public.profiles(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  category text not null default 'other',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Madrid',
  is_all_day boolean not null default false,
  priority text not null default 'flexible' check (priority in ('immovable','protected','preference','flexible')),
  flexibility text not null default 'fixed' check (flexibility in ('fixed','somewhat_flexible','flexible')),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes between 0 and 1440),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes between 0 and 1440),
  visibility text not null default 'hidden' check (visibility in ('hidden','availability','basic','full')),
  status text not null default 'confirmed' check (status in ('draft','proposed','confirmed','cancelled')),
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((owner_family_id is not null) <> (owner_profile_id is not null))
);
create index if not exists calendar_events_family_time_idx
  on public.calendar_events(owner_family_id,starts_at,ends_at)
  where status <> 'cancelled';
create index if not exists calendar_events_profile_time_idx
  on public.calendar_events(owner_profile_id,starts_at,ends_at)
  where status <> 'cancelled';

create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  external_name text,
  external_email text,
  response text not null default 'pending' check (response in ('pending','accepted','declined','suggested_change')),
  responded_at timestamptz,
  invited_by_profile_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (
    (profile_id is not null and external_name is null and external_email is null)
    or (profile_id is null and external_name is not null)
  )
);
create unique index if not exists event_participants_event_profile_unique
  on public.event_participants(event_id,profile_id)
  where profile_id is not null;

create table if not exists public.event_suggestions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  proposed_by_profile_id uuid not null references public.profiles(id),
  note text,
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.household_tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  category text not null default 'general',
  frequency text not null default 'once' check (frequency in ('once','daily','weekly','biweekly','monthly','custom')),
  recurrence_rule text,
  assignment_mode text not null default 'fixed' check (assignment_mode in ('fixed','rotation')),
  fixed_assignee_profile_id uuid references public.profiles(id) on delete set null,
  rotation_profile_ids uuid[] not null default '{}',
  rotation_cursor integer not null default 0 check (rotation_cursor >= 0),
  next_due_at timestamptz,
  is_paused boolean not null default false,
  created_by_profile_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (assignment_mode = 'fixed' and cardinality(rotation_profile_ids) = 0)
    or (assignment_mode = 'rotation' and fixed_assignee_profile_id is null and cardinality(rotation_profile_ids) > 0)
  ),
  check (cardinality(rotation_profile_ids) = 0 or rotation_cursor < cardinality(rotation_profile_ids))
);
create index if not exists household_tasks_family_due_idx
  on public.household_tasks(family_id,next_due_at)
  where is_paused = false;

create table if not exists public.household_task_occurrences (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.household_tasks(id) on delete cascade,
  due_at timestamptz not null,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','completed','skipped','reassigned')),
  completed_at timestamptz,
  completed_by_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(task_id,due_at)
);
create index if not exists household_task_occurrences_assignee_idx
  on public.household_task_occurrences(assigned_profile_id,due_at,status);

create table if not exists public.bayit_audit_log (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  subject_profile_id uuid references public.profiles(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  resource_type text not null,
  resource_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists bayit_audit_log_family_time_idx
  on public.bayit_audit_log(family_id,created_at desc);

-- updated_at triggers reuse the helper from the foundation migration.
drop trigger if exists calendar_events_touch_updated_at on public.calendar_events;
create trigger calendar_events_touch_updated_at before update on public.calendar_events
for each row execute function public.bayit_touch_updated_at();
drop trigger if exists household_tasks_touch_updated_at on public.household_tasks;
create trigger household_tasks_touch_updated_at before update on public.household_tasks
for each row execute function public.bayit_touch_updated_at();

-- Default-deny until each resource has complete, tested RLS policies and RPCs.
do $$
declare t text;
begin
  foreach t in array array[
    'household_invitations','household_connections','household_sharing_grants',
    'calendar_events','event_participants','event_suggestions',
    'household_tasks','household_task_occurrences','bayit_audit_log'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
  end loop;
end $$;

commit;
