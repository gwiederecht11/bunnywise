# Bunnywise — Implementation Plan

## Step 1: Project Setup

### 1.1 Initialize Next.js
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

### 1.2 Install Supabase packages
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 1.3 Create `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### 1.4 Create Supabase client utilities

**`lib/supabase/client.ts`** — Browser client
- Uses `createBrowserClient` from `@supabase/ssr`
- Reads env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Export a `createClient()` function

**`lib/supabase/server.ts`** — Server client
- Uses `createServerClient` from `@supabase/ssr`
- Reads cookies from `next/headers` for session management
- Export an async `createClient()` function

### 1.5 Create middleware (`middleware.ts`)
- Import server Supabase client
- On every request to protected routes, call `supabase.auth.getUser()`
- If no user and path starts with `/(app)` routes (`/dashboard`, `/groups`), redirect to `/login`
- If user exists and path is `/login` or `/signup`, redirect to `/dashboard`
- Configure `matcher` to exclude static files, `_next`, and favicon

### Files created in this step:
```
lib/supabase/client.ts
lib/supabase/server.ts
middleware.ts
.env.local
```

---

## Step 2: Database + Auth

### 2.1 SQL Migration (`supabase/migrations/001_initial_schema.sql`)

**Tables:**

```sql
-- profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- group_members (junction)
create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null check (amount > 0),
  paid_by uuid references profiles(id) on delete set null not null,
  expense_date date default current_date,
  created_at timestamptz default now()
);

-- expense_splits
create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  share_amount numeric(10,2) not null check (share_amount > 0),
  unique (expense_id, user_id)
);
```

**Indexes:**
```sql
create index idx_group_members_user on group_members(user_id);
create index idx_expenses_group on expenses(group_id);
create index idx_expense_splits_expense on expense_splits(expense_id);
create index idx_expense_splits_user on expense_splits(user_id);
```

**Trigger — auto-create profile on signup:**
```sql
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
```

**Trigger — auto-update `updated_at`:**
```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger set_groups_updated_at before update on groups
  for each row execute function update_updated_at();
```

**RLS Policies:**
```sql
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

-- profiles: users can read any profile, update only their own
create policy "Anyone can view profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- groups: only members can see/modify
create policy "Members can view groups" on groups for select
  using (id in (select group_id from group_members where user_id = auth.uid()));
create policy "Authenticated users can create groups" on groups for insert
  with check (auth.uid() = created_by);
create policy "Creator can update group" on groups for update
  using (created_by = auth.uid());
create policy "Creator can delete group" on groups for delete
  using (created_by = auth.uid());

-- group_members: members can see other members, creator can manage
create policy "Members can view group members" on group_members for select
  using (group_id in (select group_id from group_members gm where gm.user_id = auth.uid()));
create policy "Members can add members" on group_members for insert
  with check (group_id in (select group_id from group_members gm where gm.user_id = auth.uid()));
create policy "Members can leave group" on group_members for delete
  using (user_id = auth.uid());

-- expenses: group members can CRUD
create policy "Members can view expenses" on expenses for select
  using (group_id in (select group_id from group_members where user_id = auth.uid()));
create policy "Members can create expenses" on expenses for insert
  with check (group_id in (select group_id from group_members where user_id = auth.uid()));
create policy "Payer can update expense" on expenses for update
  using (paid_by = auth.uid());
create policy "Payer can delete expense" on expenses for delete
  using (paid_by = auth.uid());

-- expense_splits: visible to group members
create policy "Members can view splits" on expense_splits for select
  using (expense_id in (
    select id from expenses where group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  ));
create policy "Members can create splits" on expense_splits for insert
  with check (expense_id in (
    select id from expenses where group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  ));
create policy "Members can delete splits" on expense_splits for delete
  using (expense_id in (
    select id from expenses where group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  ));
```

### 2.2 Auth pages

**`app/(public)/login/page.tsx`**
- Email + password form
- Optional "Sign in with Google" button
- Link to `/signup`
- Server action that calls `supabase.auth.signInWithPassword()`
- On success, redirect to `/dashboard`

**`app/(public)/signup/page.tsx`**
- Email, password, full name form
- Server action that calls `supabase.auth.signUp()` with `full_name` in metadata
- On success, show "check your email" or redirect to `/dashboard`

**`app/(public)/layout.tsx`**
- Simple centered layout for auth pages

### 2.3 OAuth callback (`app/api/auth/callback/route.ts`)
- GET handler that exchanges the `code` query param for a session
- Calls `supabase.auth.exchangeCodeForSession(code)`
- Redirects to `/dashboard`

### Files created in this step:
```
supabase/migrations/001_initial_schema.sql
app/(public)/layout.tsx
app/(public)/login/page.tsx
app/(public)/signup/page.tsx
app/api/auth/callback/route.ts
```

---

## Step 3: App Layout + Dashboard

### 3.1 App shell layout (`app/(app)/layout.tsx`)
- Fetch current user with `supabase.auth.getUser()`
- Top navigation bar with:
  - App logo/name ("Bunnywise") linking to `/dashboard`
  - User menu (email display + sign out button)
- Sign out action calls `supabase.auth.signOut()` and redirects to `/login`
- Wraps children in a max-width container

### 3.2 Navigation component (`components/ui/navbar.tsx`)
- Receives user profile as prop
- Responsive nav bar with links: Dashboard, New Group
- Mobile-friendly (hamburger or simple layout)

### 3.3 Dashboard (`app/(app)/dashboard/page.tsx`)
- Fetch user's groups via `group_members` join `groups`
- For each group, fetch expenses and splits to compute balances
- Display:
  - Summary card: "You are owed $X" / "You owe $X" total across all groups
  - List of groups as cards (name, member count, user's net balance in that group)
  - "Create a group" button/link
- Empty state: friendly message + CTA to create first group

### Files created in this step:
```
app/(app)/layout.tsx
components/ui/navbar.tsx
app/(app)/dashboard/page.tsx
```

---

## Step 4: Groups

### 4.1 Create group (`app/(app)/groups/new/page.tsx`)
- Form: group name (required), description (optional)
- Server action:
  1. Insert into `groups` with `created_by = auth.uid()`
  2. Insert into `group_members` (creator auto-joins)
  3. Redirect to `/groups/[newGroupId]`

### 4.2 Group detail page (`app/(app)/groups/[groupId]/page.tsx`)
- Fetch group info, members (join profiles for names), and expenses
- Display:
  - Group header (name, description, member avatars/names)
  - Activity feed: list of expenses, most recent first
  - Each expense card shows: description, amount, who paid, date, split info
  - "Add expense" button linking to `/groups/[groupId]/expenses/new`
  - Tabs or links to Balances and Settings
- Empty state if no expenses yet

### 4.3 Group layout (`app/(app)/groups/[groupId]/layout.tsx`)
- Shared layout for group sub-pages
- Tab navigation: Activity | Balances | Settings

### 4.4 Group settings (`app/(app)/groups/[groupId]/settings/page.tsx`)
- Show current members list
- "Add member" form: email input, look up profile by email, add to `group_members`
- If email not found, show error message
- Remove member option (for group creator)
- Delete group option (for group creator only)

### Files created in this step:
```
app/(app)/groups/new/page.tsx
app/(app)/groups/[groupId]/page.tsx
app/(app)/groups/[groupId]/layout.tsx
app/(app)/groups/[groupId]/settings/page.tsx
components/groups/group-card.tsx
components/groups/add-member-form.tsx
```

---

## Step 5: Expenses

### 5.1 Expense form (`app/(app)/groups/[groupId]/expenses/new/page.tsx`)
- Fetch group members
- Form fields:
  - Description (text, required)
  - Amount (number, required, > 0)
  - Paid by (select dropdown, defaults to current user)
  - Split among (checkboxes for each member, all checked by default)
- Client component for interactive split selection

### 5.2 Expense form component (`components/expenses/expense-form.tsx`)
- `"use client"` component
- Shows live split preview: "Each person pays $X.XX" based on amount / selected count
- Handles rounding: distribute remainder cents to first participants
- Submit calls a server action

### 5.3 Server action for creating expense (`lib/actions/expenses.ts`)
- Validate inputs
- Insert expense row
- Calculate equal split: `amount / selectedMembers.length`
- Handle rounding: total of splits must equal expense amount exactly
- Insert all `expense_splits` rows
- Revalidate group page path
- Redirect back to group detail

### 5.4 Expense card component (`components/expenses/expense-card.tsx`)
- Displays: description, amount, payer name, date
- "You paid $X" or "You owe $X" contextual text
- Delete button (for the payer only)

### Files created in this step:
```
app/(app)/groups/[groupId]/expenses/new/page.tsx
components/expenses/expense-form.tsx
components/expenses/expense-card.tsx
lib/actions/expenses.ts
```

---

## Step 6: Balances

### 6.1 Balance calculation utility (`lib/utils/calculations.ts`)

**Functions:**

```typescript
type Balance = { userId: string; amount: number };
type Settlement = { from: string; to: string; amount: number };

// Compute net balance per user within a group
function computeNetBalances(
  expenses: Expense[],
  splits: ExpenseSplit[]
): Balance[]

// Greedy debt simplification
function simplifyDebts(balances: Balance[]): Settlement[]
```

**`computeNetBalances` logic:**
- For each expense: add `amount` to payer's balance
- For each split: subtract `share_amount` from participant's balance
- Return array of { userId, amount } where positive = owed, negative = owes

**`simplifyDebts` logic:**
- Separate into debtors (negative balance) and creditors (positive balance)
- Sort debtors by amount ascending, creditors by amount descending
- While debtors and creditors remain:
  - Take largest debtor and largest creditor
  - Settlement amount = min(abs(debtor.amount), creditor.amount)
  - Create settlement { from: debtor, to: creditor, amount }
  - Adjust both balances, remove if settled to zero

### 6.2 Balances page (`app/(app)/groups/[groupId]/balances/page.tsx`)
- Fetch all expenses and splits for the group
- Call `computeNetBalances()` then `simplifyDebts()`
- Display:
  - Each user's net balance (positive/negative, color-coded green/red)
  - Simplified settlements: "Alice owes Bob $25.00"
  - "All settled up!" message if no outstanding balances

### 6.3 Dashboard balance summary
- Update dashboard to use `computeNetBalances` across all user's groups
- Show total "You are owed" and "You owe" amounts

### Files created in this step:
```
lib/utils/calculations.ts
app/(app)/groups/[groupId]/balances/page.tsx
```

---

## Step 7: Polish + Deploy

### 7.1 UI Components (`components/ui/`)
- `button.tsx` — Reusable button with variants (primary, secondary, destructive)
- `card.tsx` — Card wrapper component
- `input.tsx` — Styled input with label and error state
- `loading.tsx` — Spinner / skeleton components
- `toast.tsx` — Simple toast notification system (optional, can use native alerts initially)

### 7.2 Loading & Error States
- Add `loading.tsx` files in route segments for Suspense fallbacks
- Add `error.tsx` files for error boundaries in key routes
- Add `not-found.tsx` for 404 handling in group routes

### 7.3 Responsive Design
- Ensure all pages work on mobile (min 320px)
- Nav bar collapses on mobile
- Forms stack vertically on small screens
- Cards are single-column on mobile, grid on desktop

### 7.4 Landing Page (`app/(public)/page.tsx` or `app/page.tsx`)
- Simple hero section: app name, tagline, CTA to sign up
- Brief feature highlights
- Link to login for existing users

### 7.5 Deployment
```bash
# Initialize git
git init
git add .
git commit -m "Initial Bunnywise implementation"

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Files created in this step:
```
components/ui/button.tsx
components/ui/card.tsx
components/ui/input.tsx
app/(app)/dashboard/loading.tsx
app/(app)/groups/[groupId]/loading.tsx
app/(app)/groups/[groupId]/error.tsx
app/page.tsx (landing page)
```

---

## Complete File Tree

```
Bunnywise/
├── CLAUDE.md
├── .env.local
├── middleware.ts
├── app/
│   ├── layout.tsx                          (root layout with globals)
│   ├── page.tsx                            (landing page)
│   ├── globals.css                         (Tailwind imports)
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts                (OAuth callback)
│   ├── (public)/
│   │   ├── layout.tsx                      (centered auth layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   └── (app)/
│       ├── layout.tsx                      (app shell with navbar)
│       ├── dashboard/
│       │   ├── page.tsx
│       │   └── loading.tsx
│       └── groups/
│           ├── new/
│           │   └── page.tsx
│           └── [groupId]/
│               ├── layout.tsx              (group tab navigation)
│               ├── page.tsx                (activity feed)
│               ├── loading.tsx
│               ├── error.tsx
│               ├── expenses/
│               │   └── new/
│               │       └── page.tsx
│               ├── balances/
│               │   └── page.tsx
│               └── settings/
│                   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── navbar.tsx
│   ├── groups/
│   │   ├── group-card.tsx
│   │   └── add-member-form.tsx
│   ├── expenses/
│   │   ├── expense-form.tsx
│   │   └── expense-card.tsx
│   └── balances/
│       └── settlement-list.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── actions/
│   │   ├── auth.ts                        (sign out action)
│   │   ├── groups.ts                      (create group, add member)
│   │   └── expenses.ts                    (create/delete expense)
│   └── utils/
│       └── calculations.ts               (balance + debt simplification)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── types/
    └── index.ts                           (shared TypeScript types)
```

---

## Verification Checklist

### After Step 1
- [ ] `npm run dev` starts without errors
- [ ] Supabase client files compile without type errors

### After Step 2
- [ ] Migration runs successfully in Supabase dashboard (SQL Editor)
- [ ] Sign up creates a user and profile row
- [ ] Login works and redirects to dashboard
- [ ] Unauthenticated users redirected to /login from protected routes

### After Step 3
- [ ] Dashboard renders with empty state for new users
- [ ] Nav bar shows user email and sign out works
- [ ] Sign out redirects to login

### After Step 4
- [ ] Can create a group and see it on dashboard
- [ ] Group detail page shows members
- [ ] Can add a member by email
- [ ] Non-members cannot access group (RLS enforced)

### After Step 5
- [ ] Can add an expense with split selection
- [ ] Split amounts sum exactly to expense total
- [ ] Activity feed shows expenses in reverse chronological order
- [ ] Payer can delete their expense

### After Step 6
- [ ] Balances page shows correct net amounts
- [ ] Debt simplification reduces to minimal transactions
- [ ] Dashboard shows overall balance summary

### After Step 7
- [ ] All pages responsive on mobile
- [ ] Loading states appear during data fetches
- [ ] App deploys to Vercel and works with production Supabase
