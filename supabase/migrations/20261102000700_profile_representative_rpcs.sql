-- Bayit: profile representation management RPCs.
-- Representative links are household-scoped, require an administrator, and are
-- not directly readable/writable from the browser.
begin;

-- Correct the phase 1-2 family update policy after auth/profile identity separation.
drop policy if exists "families_update_admins" on public.families;
create policy "families_update_admins" on public.families
for update to authenticated
using (public.bayit_is_family_admin(families.id))
with check (public.bayit_is_family_admin(families.id));

create or replace function public.bayit_add_profile_representative(
  p_family_id uuid,
  p_managed_profile_id uuid,
  p_representative_profile_id uuid,
  p_can_view_calendar boolean default true,
  p_can_manage_events boolean default true,
  p_can_submit_planning boolean default true,
  p_can_manage_tasks boolean default false,
  p_can_receive_notifications boolean default true
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
  if not public.bayit_is_family_admin(p_family_id) then
    raise exception 'Solo un administrador del hogar puede asignar representantes.';
  end if;
  if p_managed_profile_id = p_representative_profile_id then
    raise exception 'Una persona no puede representarse a sí misma.';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_managed_profile_id and p.auth_user_id is null
  ) then raise exception 'El perfil indicado no es un perfil gestionado sin cuenta.'; end if;
  if not exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id and fm.profile_id = p_managed_profile_id and fm.status = 'active'
  ) then raise exception 'La persona gestionada no pertenece a este hogar.'; end if;
  if not exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id and fm.profile_id = p_representative_profile_id and fm.status = 'active'
  ) then raise exception 'El representante debe pertenecer al mismo hogar.'; end if;

  insert into public.profile_representatives(
    profile_id,representative_profile_id,family_id,
    can_view_calendar,can_manage_events,can_submit_planning,
    can_manage_tasks,can_receive_notifications,created_by,revoked_at
  ) values (
    p_managed_profile_id,p_representative_profile_id,p_family_id,
    coalesce(p_can_view_calendar,true),coalesce(p_can_manage_events,true),
    coalesce(p_can_submit_planning,true),coalesce(p_can_manage_tasks,false),
    coalesce(p_can_receive_notifications,true),v_actor,null
  )
  on conflict(profile_id,representative_profile_id,family_id)
  do update set
    can_view_calendar=excluded.can_view_calendar,
    can_manage_events=excluded.can_manage_events,
    can_submit_planning=excluded.can_submit_planning,
    can_manage_tasks=excluded.can_manage_tasks,
    can_receive_notifications=excluded.can_receive_notifications,
    revoked_at=null
  returning id into v_id;

  insert into public.bayit_audit_log(actor_profile_id,subject_profile_id,family_id,resource_type,resource_id,action)
  values(v_actor,p_managed_profile_id,p_family_id,'profile_representative',v_id,'granted');
  return v_id;
end;
$$;

create or replace function public.bayit_revoke_profile_representative(p_representative_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_row public.profile_representatives%rowtype;
  v_actor uuid;
begin
  v_actor := public.bayit_current_profile_id();
  select * into v_row from public.profile_representatives
  where id=p_representative_id and revoked_at is null for update;
  if not found then return false; end if;
  if not public.bayit_is_family_admin(v_row.family_id) then
    raise exception 'Solo un administrador del hogar puede retirar este permiso.';
  end if;
  update public.profile_representatives set revoked_at=now() where id=p_representative_id;
  insert into public.bayit_audit_log(actor_profile_id,subject_profile_id,family_id,resource_type,resource_id,action)
  values(v_actor,v_row.profile_id,v_row.family_id,'profile_representative',p_representative_id,'revoked');
  return true;
end;
$$;

revoke all on function public.bayit_add_profile_representative(uuid,uuid,uuid,boolean,boolean,boolean,boolean,boolean) from public;
revoke all on function public.bayit_revoke_profile_representative(uuid) from public;
grant execute on function public.bayit_add_profile_representative(uuid,uuid,uuid,boolean,boolean,boolean,boolean,boolean) to authenticated;
grant execute on function public.bayit_revoke_profile_representative(uuid) to authenticated;

commit;
