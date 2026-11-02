-- Bayit phase 5: transactional task completion and rotation.
-- A completion advances the rotation exactly once and creates the next occurrence.
-- Custom recurrence rules are intentionally not interpreted by this first RPC.
begin;

create or replace function public.bayit_complete_task_occurrence(p_occurrence_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_occ public.household_task_occurrences%rowtype;
  v_task public.household_tasks%rowtype;
  v_next_due timestamptz;
  v_next_cursor integer;
  v_next_assignee uuid;
  v_next_occurrence uuid;
begin
  v_actor := public.bayit_current_profile_id();
  if auth.uid() is null or v_actor is null then raise exception 'Debes iniciar sesión.'; end if;

  select * into v_occ
  from public.household_task_occurrences
  where id = p_occurrence_id
  for update;

  if not found then raise exception 'No se encuentra esta tarea.'; end if;
  if v_occ.status <> 'pending' then raise exception 'Esta tarea ya no está pendiente.'; end if;

  select * into v_task
  from public.household_tasks
  where id = v_occ.task_id
  for update;

  if not found or v_task.is_paused then raise exception 'La tarea no está activa.'; end if;

  if v_occ.assigned_profile_id is distinct from v_actor
     and not public.bayit_is_family_admin(v_task.family_id) then
    raise exception 'Solo la persona asignada o un administrador del hogar puede completar esta tarea.';
  end if;

  update public.household_task_occurrences
  set status = 'completed',
      completed_at = now(),
      completed_by_profile_id = v_actor
  where id = p_occurrence_id and status = 'pending';

  if not found then raise exception 'La tarea ya ha sido completada.'; end if;

  insert into public.bayit_audit_log(actor_profile_id,subject_profile_id,family_id,resource_type,resource_id,action,details)
  values (v_actor,v_occ.assigned_profile_id,v_task.family_id,'task_occurrence',p_occurrence_id,'completed',
          jsonb_build_object('task_id',v_task.id));

  if v_task.frequency = 'once' or v_task.frequency = 'custom' then
    return null;
  end if;

  v_next_due := case v_task.frequency
    when 'daily' then v_occ.due_at + interval '1 day'
    when 'weekly' then v_occ.due_at + interval '7 days'
    when 'biweekly' then v_occ.due_at + interval '14 days'
    when 'monthly' then v_occ.due_at + interval '1 month'
    else null
  end;
  if v_next_due is null then return null; end if;

  if v_task.assignment_mode = 'rotation' then
    v_next_cursor := (v_task.rotation_cursor + 1) % cardinality(v_task.rotation_profile_ids);
    v_next_assignee := v_task.rotation_profile_ids[v_next_cursor + 1];
    update public.household_tasks
    set rotation_cursor = v_next_cursor, next_due_at = v_next_due
    where id = v_task.id;
  else
    v_next_cursor := v_task.rotation_cursor;
    v_next_assignee := v_task.fixed_assignee_profile_id;
    update public.household_tasks
    set next_due_at = v_next_due
    where id = v_task.id;
  end if;

  insert into public.household_task_occurrences(task_id,due_at,assigned_profile_id,status)
  values (v_task.id,v_next_due,v_next_assignee,'pending')
  on conflict (task_id,due_at) do nothing
  returning id into v_next_occurrence;

  return v_next_occurrence;
end;
$$;

revoke all on function public.bayit_complete_task_occurrence(uuid) from public;
grant execute on function public.bayit_complete_task_occurrence(uuid) to authenticated;

commit;
