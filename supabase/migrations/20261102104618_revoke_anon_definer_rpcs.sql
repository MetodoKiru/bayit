-- Prevent anonymous execution of authenticated Bayit SECURITY DEFINER RPCs.
begin;
revoke execute on function public.bayit_accept_household_invitation(text,uuid) from anon;
revoke execute on function public.bayit_add_managed_member(uuid,text,text) from anon;
revoke execute on function public.bayit_add_profile_representative(uuid,uuid,uuid,boolean,boolean,boolean,boolean,boolean) from anon;
revoke execute on function public.bayit_can_manage_profile(uuid,uuid,text) from anon;
revoke execute on function public.bayit_complete_task_occurrence(uuid) from anon;
revoke execute on function public.bayit_create_calendar_event(text,timestamptz,timestamptz,uuid,uuid,text,text,boolean,text,text,integer,integer,text,text,text) from anon;
revoke execute on function public.bayit_create_household_invitation(uuid,integer) from anon;
revoke execute on function public.bayit_create_household_task(uuid,text,text,text,uuid,uuid[],timestamptz) from anon;
revoke execute on function public.bayit_is_family_admin(uuid) from anon;
revoke execute on function public.bayit_revoke_household_invitation(uuid) from anon;
revoke execute on function public.bayit_revoke_profile_representative(uuid) from anon;
commit;