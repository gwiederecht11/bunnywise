# Security Hardening Plan for Bunnywise

## Step 1: Create auth/authz helper (`lib/utils/auth.ts` — NEW)

Create a small utility file with two helpers used by all server actions:

- **`requireAuth(supabase)`** — calls `supabase.auth.getUser()`, returns the user or throws/returns an error object. Replaces the repetitive auth boilerplate in every action.
- **`verifyGroupMembership(supabase, userId, groupId)`** — queries `group_members` to confirm the user belongs to the group. Returns `boolean`.
- **`verifyGroupCreator(supabase, userId, groupId)`** — queries `groups` to confirm `created_by === userId`. Returns `boolean`.

## Step 2: Harden `lib/actions/groups.ts`

- **`addMember()`** — Add auth check (`requireAuth`). Add group membership check. Fix email enumeration: return the same generic error (`"Could not add member. Check the email and try again."`) whether the user doesn't exist or is already a member.
- **`removeMember()`** — Add auth check. Add creator check (`verifyGroupCreator`) so only the group creator can remove members.
- **`deleteGroup()`** — Add auth check. Add creator check.
- **`createGroup()`** — Add input validation: name must be non-empty and <= 100 chars.

## Step 3: Harden `lib/actions/expenses.ts`

- **`deleteExpense()`** — Add auth check (currently missing entirely). RLS already restricts deletion to the payer, so no additional authz query needed — the DB will reject unauthorized deletes.
- **`createExpense()`** — Add group membership check for the authenticated user. Validate that `paidBy` is a group member. Validate that all split user IDs are group members. (Fetch group members once, check against that list.)
- **`updateExpense()`** — Same membership and split validation as `createExpense`.
- **`recordSettlement()`** — Add group membership check. Validate `amount > 0` and is finite. Validate `fromUserId !== toUserId`. Validate both `fromUserId` and `toUserId` are group members.

## Step 4: Harden `lib/actions/profile.ts`

- **`updateProfile()`** — Validate `full_name` is non-empty after trimming and <= 100 chars.

## Step 5: Add security headers in `next.config.ts`

Add a `headers()` function to the Next.js config returning standard security headers for all routes:

- `X-Frame-Options: DENY` (clickjacking prevention)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Skip CSP for now — Next.js + Tailwind require `unsafe-inline` and `unsafe-eval` which undermines the value, and misconfigured CSP can break the app. The other headers are safe to add without risk.

## Files Modified

| File | Change |
|---|---|
| `lib/utils/auth.ts` | **NEW** — auth/authz helpers |
| `lib/actions/groups.ts` | Add auth, authz, input validation, fix email enumeration |
| `lib/actions/expenses.ts` | Add auth to `deleteExpense`, add membership + input validation to all functions |
| `lib/actions/profile.ts` | Add input validation |
| `next.config.ts` | Add security headers |

## What this plan does NOT include (and why)

- **Rate limiting** — requires infrastructure (Redis, middleware-level counters, or a Vercel Edge config). Out of scope for a code-only change.
- **CSP headers** — too fragile with Next.js/Tailwind without nonce support. The other security headers provide value without risk.
- **Database migration for constraints** — the app-level validation is sufficient; adding DB constraints requires applying a migration to the live database.
- **Money/float-point rework** — the existing `distributeEqual()` in `expense-form.tsx` already uses cent-based integer math correctly (`Math.floor((total * 100) / ...)`). The `calculations.ts` rounding (`Math.round(amount * 100) / 100`) is adequate for display. This is low-risk and not worth the churn.
- **Transaction wrapping in `updateExpense`** — Supabase JS client doesn't support explicit transactions. The current approach (delete old splits, insert new) with RLS is acceptable. Worst case on partial failure: the expense has no splits, which is visible and recoverable.

## Verification

1. `npm run build` — confirm no type errors
2. `npm run lint` — confirm no lint errors
3. Manual testing:
   - Create/edit/delete expenses as a group member (should work)
   - Try adding a member with a non-existent email vs an existing member email (should get the same generic error)
   - Try deleting a group as a non-creator (should fail)
   - Try removing a member as a non-creator (should fail)
