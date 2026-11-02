-- Prevent recursive RLS evaluation between families and family_members.
-- Membership checks run through narrowly scoped SECURITY DEFINER helpers.
begin;

drop policy if exists "family_members_read_household" on public.family_members;
create policy "family_members_read_household" on public.family_members
for select to authenticated
using (public.bayit_is_active_member(family_members.family_id));

drop policy if exists "families_read_members" on public.families;
create policy "families_read_members" on public.families
for select to authenticated
using (public.bayit_is_active_member(families.id));

drop policy if exists "families_update_admins" on public.families;
create policy "families_update_admins" on public.families
for update to authenticated
using (public.bayit_is_family_admin(families.id))
with check (public.bayit_is_family_admin(families.id));

commit;
