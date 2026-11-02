-- Bayit phase 3: invitation lifecycle.
-- Server-side RPCs only. Raw invitation tokens are returned once and never stored.
-- Apply after migrations 001 and 003-004 on the dedicated Bayit project.
begin;

create or replace function public.bayit_is_family_admin(p_family_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id
      and fm.profile_id = (select public.bayit_current_profile_id())
      and fm.status = 'active'
      and fm.role in ('owner','admin')
  )
$$;
revoke all on function public.bayit_is_family_admin(uuid) from public;
grant execute on function public.bayit_is_family_admin(uuid) to authenticated;

create or replace function public.bayit_create_household_invitation(
  p_family_id uuid,
  p_valid_days integer default 7
)
returns table(invitation_id uuid, invitation_token text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid;
  v_token text;
  v_id uuid;
  v_expiry timestamptz;
begin
  v_actor := public.bayit_current_profile_id();
  if auth.uid() is null or v_actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if not public.bayit_is_family_admin(p_family_id) then raise exception 'Solo un administrador puede invitar a otro hogar.'; end if;
  if p_valid_days is null or p_valid_days < 1 or p_valid_days > 14 then raise exception 'La invitación debe durar entre 1 y 14 días.'; end if;

  v_token := encode(extensions.gen_random_bytes(32),'hex');
  v_expiry := now() + make_interval(days => p_valid_days);

  insert into public.household_invitations(family_id,token_hash,created_by_profile_id,expires_at)
  values (p_family_id, encode(extensions.digest(v_token,'sha256'),'hex'), v_actor, v_expiry)
  returning id into v_id;

  insert into public.bayit_audit_log(actor_profile_id,family_id,resource_type,resource_id,action)
  values (v_actor,p_family_id,'household_invitation',v_id,'created');

  return query select v_id,v_token,v_expiry;
end;
$$;

create or replace function public.bayit_accept_household_invitation(
  p_invitation_token text,
  p_target_family_id uuid
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid;
  v_invitation public.household_invitations%rowtype;
  v_a uuid;
  v_b uuid;
  v_connection uuid;
begin
  v_actor := public.bayit_current_profile_id();
  if auth.uid() is null or v_actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if not public.bayit_is_family_admin(p_target_family_id) then raise exception 'Solo un administrador del hogar receptor puede aceptar.'; end if;
  if p_invitation_token is null or length(p_invitation_token) <> 64 or p_invitation_token !~ '^[0-9a-fA-F]+$' then
    raise exception 'Código de invitación no válido.';
  end if;

  select * into v_invitation
  from public.household_invitations hi
  where hi.token_hash = encode(extensions.digest(lower(p_invitation_token),'sha256'),'hex')
  for update;

  if not found or v_invitation.revoked_at is not null or v_invitation.accepted_at is not null or v_invitation.expires_at <= now() then
    raise exception 'La invitación no existe, ha caducado o ya no está disponible.';
  end if;
  if v_invitation.family_id = p_target_family_id then raise exception 'No puedes conectar un hogar consigo mismo.'; end if;

  v_a := least(v_invitation.family_id,p_target_family_id);
  v_b := greatest(v_invitation.family_id,p_target_family_id);

  insert into public.household_connections(family_a_id,family_b_id,status,created_from_invitation_id,created_by_profile_id)
  values (v_a,v_b,'active',v_invitation.id,v_actor)
  on conflict (family_a_id,family_b_id) do update
    set status = 'active', revoked_at = null
  returning id into v_connection;

  update public.household_invitations
  set accepted_by_family_id = p_target_family_id,
      accepted_by_profile_id = v_actor,
      accepted_at = now()
  where id = v_invitation.id;

  insert into public.bayit_audit_log(actor_profile_id,family_id,resource_type,resource_id,action,details)
  values
    (v_actor,p_target_family_id,'household_connection',v_connection,'accepted',jsonb_build_object('other_family_id',v_invitation.family_id)),
    (v_actor,v_invitation.family_id,'household_connection',v_connection,'accepted',jsonb_build_object('other_family_id',p_target_family_id));

  return v_connection;
end;
$$;

create or replace function public.bayit_revoke_household_invitation(p_invitation_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_family_id uuid;
  v_actor uuid;
begin
  v_actor := public.bayit_current_profile_id();
  select family_id into v_family_id
  from public.household_invitations
  where id = p_invitation_id and revoked_at is null and accepted_at is null;

  if v_family_id is null then return false; end if;
  if not public.bayit_is_family_admin(v_family_id) then raise exception 'No tienes permiso para revocar esta invitación.'; end if;

  update public.household_invitations set revoked_at = now() where id = p_invitation_id;
  insert into public.bayit_audit_log(actor_profile_id,family_id,resource_type,resource_id,action)
  values (v_actor,v_family_id,'household_invitation',p_invitation_id,'revoked');
  return true;
end;
$$;

revoke all on function public.bayit_create_household_invitation(uuid,integer) from public;
revoke all on function public.bayit_accept_household_invitation(text,uuid) from public;
revoke all on function public.bayit_revoke_household_invitation(uuid) from public;
grant execute on function public.bayit_create_household_invitation(uuid,integer) to authenticated;
grant execute on function public.bayit_accept_household_invitation(text,uuid) to authenticated;
grant execute on function public.bayit_revoke_household_invitation(uuid) to authenticated;

commit;
