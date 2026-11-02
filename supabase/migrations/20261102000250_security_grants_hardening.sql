-- Bayit security hardening: remove public/anonymous execution from internal SECURITY DEFINER functions.
-- Trigger and event-trigger functions do not need direct API execution grants.
begin;

revoke execute on function public.bayit_add_managed_member(uuid,text,text) from anon;
revoke execute on function public.bayit_create_family(text,text) from anon;
revoke all on function public.bayit_handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

commit;
