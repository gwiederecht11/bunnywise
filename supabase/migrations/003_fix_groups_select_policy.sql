-- ============================================================
-- Fix: groups SELECT policy blocks creator from seeing their
-- own group immediately after creation (before being added
-- to group_members).
--
-- Allow the group creator to always view their own group.
-- ============================================================

drop policy "Members can view groups" on groups;

create policy "Members can view groups"
  on groups for select
  using (
    created_by = auth.uid()
    OR id in (select group_id from group_members where user_id = auth.uid())
  );
