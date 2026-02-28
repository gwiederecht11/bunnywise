-- ============================================================
-- Fix: infinite recursion in group_members RLS policies
--
-- The original policies on group_members referenced group_members
-- in their own subqueries, causing infinite recursion.
-- This migration adds a SECURITY DEFINER helper function that
-- bypasses RLS and replaces the recursive policies.
-- ============================================================

-- Helper function to check group membership (bypasses RLS)
create or replace function is_group_member(gid uuid)
returns boolean as $$
  select exists (
    select 1 from group_members where group_id = gid and user_id = auth.uid()
  );
$$ language sql security definer;

-- Drop the old recursive policies
drop policy "Members can view group members" on group_members;
drop policy "Members can add members" on group_members;
drop policy "Members can leave group" on group_members;

-- Recreate without recursion
create policy "Members can view group members"
  on group_members for select
  using (is_group_member(group_id));

create policy "Members can add members"
  on group_members for insert
  with check (
    is_group_member(group_id)
    OR group_id in (select id from groups where created_by = auth.uid())
  );

create policy "Members can leave group"
  on group_members for delete
  using (user_id = auth.uid());
