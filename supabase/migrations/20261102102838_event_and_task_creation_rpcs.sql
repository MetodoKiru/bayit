-- Bayit: guarded event and household-task creation RPCs.
-- Reads remain closed until the visibility-aware query layer is implemented.
begin;

create or replace function public.bayit_can_manage_profile(p_family_id uuid,p_profile_id uuid,p_permission text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    p_profile_id = (select public.bayit_current_profile_id())
    or exists (
      select 1 from public.profile_representatives pr
      where pr.family_id = p_family_id
        and pr.profile_id = p_profile_id
        and pr.representative_profile_id = (select public.bayit_current_profile_id())
        and pr.revoked_at is null
        and case p_permission
          when 'calendar' then pr.can_view_calendar
          when 'events' then pr.can_manage_events
          when 'planning' then pr.can_submit_planning
          when 'tasks' then pr.can_manage_tasks
          else false
        end
    )
$$;
revoke all on function public.bayit_can_manage_profile(uuid,uuid,text) from public;
grant execute on function public.bayit_can_manage_profile(uuid,uuid,text) to authenticated;

create or replace function public.bayit_create_calendar_event(
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_owner_family_id uuid default null,
  p_owner_profile_id uuid default null,
  p_category text default 'other',
  p_timezone text default 'Europe/Madrid',
  p_is_all_day boolean default false,
  p_priority text default 'flexible',
  p_flexibility text default 'fixed',
  p_buffer_before_minutes integer default 0,
  p_buffer_after_minutes integer default 0,
  p_visibility text default 'hidden',
  p_description text default null,
  p_status text default 'confirmed'
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid;
  v_id uuid;
begin
  v_actor := public.bayit_current_profile_id();
  if auth.uid() is null or v_actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if p_title is null or char_length(trim(p_title)) not between 1 and 160 then raise exception 'El título debe tener entre 1 y 160 caracteres.'; end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then raise exception 'El intervalo de fechas no es válido.'; end if;
  if (p_owner_family_id is null) = (p_owner_profile_id is null) then raise exception 'El evento debe pertenecer a un hogar o a una persona.'; end if;
  if p_priority not in ('immovable','protected','preference','flexible') then raise exception 'Prioridad no válida.'; end if;
  if p_flexibility not in ('fixed','somewhat_flexible','flexible') then raise exception 'Flexibilidad no válida.'; end if;
  if p_visibility not in ('hidden','availability','basic','full') then raise exception 'Visibilidad no válida.'; end if;
  if p_status not in ('draft','proposed','confirmed') then raise exception 'Estado no válido.'; end if;
  if coalesce(p_buffer_before_minutes,-1) not between 0 and 1440 or coalesce(p_buffer_after_minutes,-1) not between 0 and 1440 then raise exception 'Los márgenes deben estar entre 0 y 1440 minutos.'; end if;

  if p_owner_family_id is not null then
    if not public.bayit_is_active_member(p_owner_family_id) then raise exception 'No perteneces a este hogar.'; end if;
  else
    if not exists (
      select 1 from public.family_members fm
      where fm.profile_id = p_owner_profile_id and fm.status = 'active'
        and public.bayit_can_manage_profile(fm.family_id,p_owner_profile_id,'events')
    ) then raise exception 'No tienes permiso para gestionar el calendario de esta persona.'; end if;
  end if;

  insert into public.calendar_events(
    owner_family_id,owner_profile_id,created_by_profile_id,title,description,category,
    starts_at,ends_at,timezone,is_all_day,priority,flexibility,
    buffer_before_minutes,buffer_after_minutes,visibility,status
  ) values (
    p_owner_family_id,p_owner_profile_id,v_actor,trim(p_title),p_description,coalesce(p_category,'other'),
    p_starts_at,p_ends_at,coalesce(p_timezone,'Europe/Madrid'),coalesce(p_is_all_day,false),
    p_priority,p_flexibility,p_buffer_before_minutes,p_buffer_after_minutes,p_visibility,p_status
  ) returning id into v_id;

  insert into public.bayit_audit_log(actor_profile_id,subject_profile_id,family_id,resource_type,resource_id,action)
  values(v_actor,p_owner_profile_id,p_owner_family_id,'calendar_event',v_id,'created');
  return v_id;
end;
$$;

create or replace function public.bayit_create_household_task(
  p_family_id uuid,
  p_title text,
  p_frequency text default 'weekly',
  p_assignment_mode text default 'fixed',
  p_fixed_assignee_profile_id uuid default null,
  p_rotation_profile_ids uuid[] default '{}',
  p_next_due_at timestamptz default now()
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid;
  v_id uuid;
  v_assignee uuid;
begin
  v_actor := public.bayit_current_profile_id();
  if auth.uid() is null or v_actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if not public.bayit_is_family_admin(p_family_id) then raise exception 'Solo un administrador puede crear tareas.'; end if;
  if p_title is null or char_length(trim(p_title)) not between 1 and 160 then raise exception 'El título debe tener entre 1 y 160 caracteres.'; end if;
  if p_frequency not in ('once','daily','weekly','biweekly','monthly','custom') then raise exception 'Frecuencia no válida.'; end if;
  if p_assignment_mode not in ('fixed','rotation') then raise exception 'Asignación no válida.'; end if;

  if p_assignment_mode='fixed' then
    if p_fixed_assignee_profile_id is null or cardinality(coalesce(p_rotation_profile_ids,'{}')) <> 0 then raise exception 'Selecciona una persona responsable.'; end if;
    if not exists(select 1 from public.family_members fm where fm.family_id=p_family_id and fm.profile_id=p_fixed_assignee_profile_id and fm.status='active') then raise exception 'La persona responsable no pertenece al hogar.'; end if;
    v_assignee := p_fixed_assignee_profile_id;
  else
    if cardinality(coalesce(p_rotation_profile_ids,'{}')) < 1 then raise exception 'Añade al menos una persona a la rotación.'; end if;
    if exists (
      select 1 from unnest(p_rotation_profile_ids) x
      where not exists(select 1 from public.family_members fm where fm.family_id=p_family_id and fm.profile_id=x and fm.status='active')
    ) then raise exception 'Todos los participantes de la rotación deben pertenecer al hogar.'; end if;
    if cardinality(p_rotation_profile_ids) <> (select count(distinct x) from unnest(p_rotation_profile_ids) x) then raise exception 'No repitas personas en la rotación.'; end if;
    v_assignee := p_rotation_profile_ids[1];
  end if;

  insert into public.household_tasks(
    family_id,title,frequency,assignment_mode,fixed_assignee_profile_id,
    rotation_profile_ids,rotation_cursor,next_due_at,created_by_profile_id
  ) values (
    p_family_id,trim(p_title),p_frequency,p_assignment_mode,
    case when p_assignment_mode='fixed' then p_fixed_assignee_profile_id else null end,
    case when p_assignment_mode='rotation' then p_rotation_profile_ids else '{}'::uuid[] end,
    0,p_next_due_at,v_actor
  ) returning id into v_id;

  insert into public.household_task_occurrences(task_id,due_at,assigned_profile_id)
  values(v_id,p_next_due_at,v_assignee);

  insert into public.bayit_audit_log(actor_profile_id,family_id,resource_type,resource_id,action)
  values(v_actor,p_family_id,'household_task',v_id,'created');
  return v_id;
end;
$$;

revoke all on function public.bayit_create_calendar_event(text,timestamptz,timestamptz,uuid,uuid,text,text,boolean,text,text,integer,integer,text,text,text) from public;
revoke all on function public.bayit_create_household_task(uuid,text,text,text,uuid,uuid[],timestamptz) from public;
grant execute on function public.bayit_create_calendar_event(text,timestamptz,timestamptz,uuid,uuid,text,text,boolean,text,text,integer,integer,text,text,text) to authenticated;
grant execute on function public.bayit_create_household_task(uuid,text,text,text,uuid,uuid[],timestamptz) to authenticated;

commit;
