# Bunnywise — Improvement Plan

## Phase 1: Quick UX Wins

### 1.1 Active Tab Highlighting
The group tab navigation (Activity/Balances/Settings) doesn't highlight the active tab.

- **New file**: `components/groups/group-tabs.tsx` — client component using `usePathname()` to apply active styles (`border-foreground text-foreground` vs `border-transparent text-foreground/60`)
- **Modify**: `app/(app)/groups/[groupId]/layout.tsx` — replace inline tab links with `<GroupTabs>` component

### 1.2 Add Member Form Feedback
Success/error messages appear inline next to the button, causing layout shift.

- **Modify**: `components/groups/add-member-form.tsx` — move messages above the form in a dedicated container, outside the input/button flex row

### 1.3 Consistent Delete Confirmations
Expense delete uses raw `window.confirm()` while group delete has a nice two-step inline confirmation.

- **New file**: `components/ui/confirm-button.tsx` — reusable two-step confirmation button
- **Modify**: `components/expenses/delete-expense-button.tsx` — use inline confirmation pattern
- **Modify**: `components/groups/remove-member-button.tsx` — use inline confirmation pattern

---

## Phase 2: Core Feature Gaps

### 2.1 Expense Editing
Currently can only delete expenses, not edit them.

- **New file**: `app/(app)/groups/[groupId]/expenses/[expenseId]/edit/page.tsx` — edit page fetching existing expense data
- **New migration**: `supabase/migrations/004_add_expense_splits_update_policy.sql` — add UPDATE policy on expense_splits
- **Modify**: `lib/actions/expenses.ts` — add `updateExpense` server action (delete old splits, insert new)
- **Modify**: `components/expenses/expense-form.tsx` — accept optional `initialData` prop for pre-populating form
- **Modify**: `app/(app)/groups/[groupId]/page.tsx` — add "Edit" link on expenses (for the payer)

### 2.2 Settlement Recording (Settle Up)
Balances page shows suggested settlements but no way to record payment.

- **New file**: `components/balances/settle-button.tsx` — button with confirmation that records a settlement
- **Modify**: `lib/actions/expenses.ts` — add `recordSettlement` action (creates expense where payer=debtor, single split for creditor)
- **Modify**: `app/(app)/groups/[groupId]/balances/page.tsx` — add "Settle" button next to each settlement suggestion

### 2.3 Leave Group
RLS policy and `removeMember` action exist, but no UI for users to leave.

- **New file**: `components/groups/leave-group-button.tsx` — confirmation button that removes current user
- **Modify**: `app/(app)/groups/[groupId]/settings/page.tsx` — add "Leave Group" section for non-creator members
- **Modify**: `lib/actions/groups.ts` — add `leaveGroup` action (removes self, redirects to dashboard)

### 2.4 Profile Editing
Schema has `full_name` and `avatar_url` but no UI to edit them.

- **New file**: `app/(app)/profile/page.tsx` — profile page with edit form
- **New file**: `lib/actions/profile.ts` — `updateProfile` server action
- **Modify**: `components/ui/navbar.tsx` — add profile link in user menu
- **Modify**: `middleware.ts` — add `/profile` to protected routes

---

## Phase 3: Dashboard Enhancements

### 3.1 Per-Group Balance on Dashboard Cards
Group cards only show name/description, not the user's balance in each group.

- **Modify**: `app/(app)/dashboard/page.tsx` — compute per-group net balance using `computeNetBalances`/`getUserSummary`, display on each group card (e.g., "+$50.00" green or "-$25.00" red)

---

## Phase 4: Code Quality

### 4.1 Shared TypeScript Types
Replace `as unknown as { ... }` type assertions with proper types.

- **New file**: `lib/types/database.ts` — types for Profile, Group, Expense, ExpenseSplit, GroupMember and their join variants
- **Modify**: all pages with type assertions (`dashboard/page.tsx`, `groups/[groupId]/page.tsx`, `balances/page.tsx`, `settings/page.tsx`, `expenses/new/page.tsx`)

### 4.2 Accessibility
Color-only indicators for balances (red/green) are not colorblind-friendly.

- **Modify**: balance displays across dashboard, group activity, and balances pages — add `+`/`-` text prefixes and `aria-label` attributes
- **Modify**: all interactive buttons — add `aria-label` where icon-only

---

## Verification

After each phase:
1. **Phase 1**: Verify active tab highlights on group pages, add member shows feedback above form, delete confirmations are inline everywhere
2. **Phase 2**: Edit an expense and verify splits update correctly. Record a settlement and verify balances zero out. Leave a group and verify redirect. Edit profile name and verify it shows in navbar
3. **Phase 3**: Verify per-group balances show on dashboard cards
4. **Phase 4**: Run `npx tsc --noEmit` — no type assertion warnings. Check with browser accessibility tools
