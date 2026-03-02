# Bunnywise — Project Instructions

## Overview
Bunnywise is a Splitwise-like expense splitting app for tracking shared expenses within groups and calculating simplified debts.

## Tech Stack
- **Next.js 14+** (App Router) with **TypeScript** (strict mode)
- **Supabase** (PostgreSQL, Auth, Row Level Security)
- **Tailwind CSS** for styling
- **HeroUI** (`@heroui/react`) for UI components (Button, Input, Select, Card, Modal, Tabs, Navbar, Skeleton, Checkbox)
- **Framer Motion** (HeroUI peer dependency)
- **@supabase/supabase-js** + **@supabase/ssr** for Supabase integration
- **Vercel** for deployment

## Project Structure
```
app/
  (public)/          # Landing, login, signup (no auth required)
    login/
    signup/
  (app)/             # Protected routes (auth required)
    dashboard/
    groups/
      new/
      [groupId]/
        expenses/new/
        balances/
        settings/
  api/auth/callback/ # OAuth callback route
components/
  ui/                # Shared UI primitives + HeroUI re-exports (heroui.tsx)
  auth/              # Auth-related components
  groups/            # Group-related components
  expenses/          # Expense form and list components
  balances/          # Balance display components
lib/
  supabase/
    client.ts        # Browser Supabase client (createBrowserClient)
    server.ts        # Server Supabase client (createServerClient with cookies)
  utils/
    calculations.ts  # Net balance calculation + greedy debt simplification
supabase/
  migrations/        # SQL migration files
middleware.ts        # Auth route protection
```

## Architecture Decisions
- **Server Actions** for all mutations (form submissions, data writes). No API routes except OAuth callback.
- **Server Components** by default; use `"use client"` only when interactivity is needed (forms, click handlers, client-side state).
- **Route Groups**: `(public)` for unauthenticated pages, `(app)` for authenticated pages. Each has its own layout.
- **Supabase clients**: use `createBrowserClient` in client components, `createServerClient` (with cookie handling) in server components/actions/middleware.
- **Profile creation**: Supabase DB trigger auto-creates a profile row on `auth.users` insert.
- **Equal splits only**: expenses are split equally among selected group members.
- **HeroUI components**: imported from `@heroui/react` in client components, or from `@/components/ui/heroui` (a `"use client"` re-export barrel) in server components. The re-export is needed because HeroUI components use React context internally.

## Database
- 5 tables: `profiles`, `groups`, `group_members`, `expenses`, `expense_splits`
- RLS enforced on all tables — users only access groups they belong to
- All IDs are UUIDs; amounts use `numeric(10,2)` for precision
- Migration files go in `supabase/migrations/`
- **Never modify existing migration files.** Always create a new sequentially numbered migration file for any schema, policy, or trigger changes (e.g., `002_fix_xxx.sql`, `003_add_yyy.sql`). Existing migrations represent what has already been applied to the database.

## Balance Calculation Algorithm
1. For each expense: credit the payer's balance, debit each split participant
2. Compute net balance per user (positive = owed money, negative = owes money)
3. Greedy simplification: match largest debtor with largest creditor, settle the minimum of the two amounts, repeat until all debts resolved

## Environment Variables
Required in `.env.local` (never commit this file):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Commands
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

## Conventions
- Use `async/await` throughout, no `.then()` chains
- Prefer named exports over default exports for components
- Use TypeScript types from Supabase generated types where possible
- Format currency as USD with 2 decimal places
- All Supabase queries in server components/actions should use the server client
- Handle errors with user-facing messages; no silent failures
- Keep components focused — one responsibility per file
