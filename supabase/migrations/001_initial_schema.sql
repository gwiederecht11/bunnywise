-- ============================================================
-- Bunnywise: Initial Schema Migration
-- ============================================================

-- --------------------------------
-- Tables
-- --------------------------------

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text default '',
  avatar_url text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null check (amount > 0),
  paid_by uuid references profiles(id) on delete set null not null,
  expense_date date default current_date,
  created_at timestamptz default now()
);

create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  share_amount numeric(10,2) not null check (share_amount > 0),
  unique (expense_id, user_id)
);

-- --------------------------------
-- Indexes
-- --------------------------------

create index idx_group_members_user on group_members(user_id);
create index idx_expenses_group on expenses(group_id);
create index idx_expenses_paid_by on expenses(paid_by);
create index idx_expense_splits_expense on expense_splits(expense_id);
create index idx_expense_splits_user on expense_splits(user_id);

-- --------------------------------
-- Triggers: auto-create profile on signup
-- --------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------
-- Triggers: auto-update updated_at
-- --------------------------------

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger set_groups_updated_at
  before update on groups
  for each row execute function update_updated_at();

-- --------------------------------
-- Row Level Security
-- --------------------------------

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

-- profiles: anyone can read, only owner can update
create policy "Anyone can view profiles"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- groups: only members can view, creator can manage
create policy "Members can view groups"
  on groups for select
  using (id in (select group_id from group_members where user_id = auth.uid()));

create policy "Authenticated users can create groups"
  on groups for insert
  with check (auth.uid() = created_by);

create policy "Creator can update group"
  on groups for update
  using (created_by = auth.uid());

create policy "Creator can delete group"
  on groups for delete
  using (created_by = auth.uid());

-- group_members: members can view and add, users can remove themselves
create policy "Members can view group members"
  on group_members for select
  using (group_id in (select gm.group_id from group_members gm where gm.user_id = auth.uid()));

create policy "Members can add members"
  on group_members for insert
  with check (group_id in (select gm.group_id from group_members gm where gm.user_id = auth.uid()));

create policy "Members can leave group"
  on group_members for delete
  using (user_id = auth.uid());

-- expenses: group members can CRUD (payer can edit/delete)
create policy "Members can view expenses"
  on expenses for select
  using (group_id in (select group_id from group_members where user_id = auth.uid()));

create policy "Members can create expenses"
  on expenses for insert
  with check (group_id in (select group_id from group_members where user_id = auth.uid()));

create policy "Payer can update expense"
  on expenses for update
  using (paid_by = auth.uid());

create policy "Payer can delete expense"
  on expenses for delete
  using (paid_by = auth.uid());

-- expense_splits: group members can view/create/delete
create policy "Members can view splits"
  on expense_splits for select
  using (expense_id in (
    select id from expenses where group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  ));

create policy "Members can create splits"
  on expense_splits for insert
  with check (expense_id in (
    select id from expenses where group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  ));

create policy "Members can delete splits"
  on expense_splits for delete
  using (expense_id in (
    select id from expenses where group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  ));
