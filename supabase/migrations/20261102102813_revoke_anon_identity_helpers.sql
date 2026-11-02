begin;
revoke execute on function public.bayit_current_profile_id() from anon;
revoke execute on function public.bayit_is_active_member(uuid) from anon;
commit;
