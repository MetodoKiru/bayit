-- Visibility-scoped reads for Bayit calendar and household tasks.
begin;
create or replace function public.bayit_list_calendar_events(p_from timestamptz,p_to timestamptz)
returns table(id uuid,title text,description text,category text,starts_at timestamptz,ends_at timestamptz,timezone text,is_all_day boolean,priority text,flexibility text,visibility text,status text,owner_family_id uuid,owner_profile_id uuid)
language plpgsql stable security definer set search_path=''
as $$
declare v_profile uuid;
begin
 v_profile:=public.bayit_current_profile_id();
 if auth.uid() is null or v_profile is null then raise exception 'Debes iniciar sesión.'; end if;
 if p_from is null or p_to is null or p_to<=p_from then raise exception 'Rango de fechas no válido.'; end if;
 return query select e.id,e.title,e.description,e.category,e.starts_at,e.ends_at,e.timezone,e.is_all_day,e.priority,e.flexibility,e.visibility,e.status,e.owner_family_id,e.owner_profile_id
 from public.calendar_events e
 where e.starts_at<p_to and e.ends_at>p_from and e.status='confirmed'
 and ((e.owner_family_id is not null and exists(select 1 from public.family_members fm where fm.family_id=e.owner_family_id and fm.profile_id=v_profile and fm.status='active'))
 or e.owner_profile_id=v_profile
 or (e.owner_profile_id is not null and exists(select 1 from public.family_members fm where fm.profile_id=e.owner_profile_id and fm.status='active' and public.bayit_can_manage_profile(fm.family_id,e.owner_profile_id,'calendar'))));
end; $$;
create or replace function public.bayit_list_household_tasks(p_family_id uuid)
returns table(id uuid,family_id uuid,title text,description text,category text,frequency text,assignment_mode text,fixed_assignee_profile_id uuid,rotation_profile_ids uuid[],rotation_cursor integer,next_due_at timestamptz,is_paused boolean,occurrence_id uuid,occurrence_due_at timestamptz,assigned_profile_id uuid,occurrence_status text,assignee_name text)
language plpgsql stable security definer set search_path=''
as $$
begin
 if auth.uid() is null or not public.bayit_is_active_member(p_family_id) then raise exception 'No perteneces a este hogar.'; end if;
 return query select t.id,t.family_id,t.title,t.description,t.category,t.frequency,t.assignment_mode,t.fixed_assignee_profile_id,t.rotation_profile_ids,t.rotation_cursor,t.next_due_at,t.is_paused,o.id,o.due_at,o.assigned_profile_id,o.status,p.display_name
 from public.household_tasks t
 left join lateral (select x.* from public.household_task_occurrences x where x.task_id=t.id and x.status<>'completed' order by x.due_at limit 1) o on true
 left join public.profiles p on p.id=o.assigned_profile_id
 where t.family_id=p_family_id and not t.is_paused order by t.next_due_at;
end; $$;
revoke all on function public.bayit_list_calendar_events(timestamptz,timestamptz) from public,anon;
revoke all on function public.bayit_list_household_tasks(uuid) from public,anon;
grant execute on function public.bayit_list_calendar_events(timestamptz,timestamptz) to authenticated;
grant execute on function public.bayit_list_household_tasks(uuid) to authenticated;
commit;
