# HeroUI Migration Plan for Bunnywise

## Overview

Migrate from hand-built Tailwind components to HeroUI (`@heroui/react`). HeroUI is built on Tailwind + Framer Motion and provides polished, accessible components out of the box.

## Phase 1: Setup & Validation

**Goal:** Install HeroUI, configure Tailwind integration, add the provider, and verify a basic component renders.

### 1.1 Install dependencies
```
npm install @heroui/react framer-motion
```

### 1.2 Tailwind v4 + HeroUI integration
The project uses Tailwind v4 (CSS-first config). HeroUI requires a Tailwind plugin. Create a `tailwind.config.ts` and reference it from `globals.css` using Tailwind v4's `@config` directive:

- **NEW** `tailwind.config.ts` — minimal config with `heroui()` plugin, content paths for HeroUI node_modules
- **Modify** `app/globals.css` — add `@config "../tailwind.config.ts"` and import HeroUI styles

### 1.3 Add HeroUIProvider
- **NEW** `app/providers.tsx` — `"use client"` wrapper exporting `<HeroUIProvider>`
- **Modify** `app/layout.tsx` — wrap `{children}` in `<Providers>`

### Verification
- `npm run dev` starts without errors
- `npm run build` passes
- Existing UI unchanged

---

## Phase 2: Core Primitives (Button, Input, Select, Card)

**Goal:** Migrate the most-used elements. This is the bulk of the work.

### 2.1 Buttons (~35 instances)
Replace `<button className="rounded-md bg-foreground ...">` with HeroUI `<Button>`.

Variant mapping:
- Primary (`bg-foreground text-background`) → `<Button color="primary">`
- Outlined (`border border-foreground/20`) → `<Button variant="bordered">`
- Danger (`bg-red-600 text-white`) → `<Button color="danger">`
- Text/ghost (`text-foreground/60`) → `<Button variant="light">`
- Loading (`disabled={loading}`) → `<Button isLoading={loading}>`
- Links-as-buttons → `<Button as={Link} href="...">`

**Files:** `app/page.tsx`, `app/(public)/login/page.tsx`, `app/(public)/signup/page.tsx`, `app/(app)/dashboard/page.tsx`, `app/(app)/groups/new/page.tsx`, `app/(app)/groups/[groupId]/page.tsx`, `app/(app)/groups/[groupId]/error.tsx`, `app/(app)/groups/[groupId]/not-found.tsx`, `components/ui/confirm-button.tsx`, `components/ui/navbar.tsx`, `components/expenses/expense-form.tsx`, `components/expenses/expense-list.tsx`, `components/groups/add-member-form.tsx`, `app/(app)/profile/profile-form.tsx`

### 2.2 Inputs (~12 instances)
Replace `<input className="rounded-md border ...">` with HeroUI `<Input>`.

- Use `label` prop instead of separate `<label>` elements
- Map `type`, `required`, `placeholder`, `value`, `onChange`
- Number inputs: keep `step`, `min`, `max`
- Date input: use `<Input type="date">` (keep native for now)

**Files:** `app/(public)/login/page.tsx`, `app/(public)/signup/page.tsx`, `app/(app)/groups/new/page.tsx`, `components/expenses/expense-form.tsx`, `components/groups/add-member-form.tsx`, `app/(app)/profile/profile-form.tsx`

### 2.3 Select (1 instance)
Replace `<select>` with HeroUI `<Select>` + `<SelectItem>`.

**File:** `components/expenses/expense-form.tsx` (Paid by dropdown)

### 2.4 Cards (~20 instances)
Replace `<div className="rounded-lg border border-foreground/10 p-4">` with HeroUI `<Card>` + `<CardBody>`.

- Stat cards on dashboard
- Group cards (clickable) — use `isPressable` or wrap in Link
- Balance/settlement/member cards
- Empty state cards
- Error/not-found cards

**Files:** `app/(app)/dashboard/page.tsx`, `app/(app)/groups/[groupId]/balances/page.tsx`, `app/(app)/groups/[groupId]/settings/page.tsx`, `app/(app)/groups/[groupId]/error.tsx`, `app/(app)/groups/[groupId]/not-found.tsx`

### Verification
- All forms submit correctly
- Loading states show HeroUI spinners
- Cards render with consistent styling
- Mobile responsive

---

## Phase 3: Navigation Components

### 3.1 Navbar
Replace custom navbar with HeroUI `Navbar`, `NavbarBrand`, `NavbarContent`, `NavbarItem`, `NavbarMenuToggle`, `NavbarMenu`, `NavbarMenuItem`.

- Built-in mobile menu with animation (replaces custom hamburger SVG + dropdown)
- Preserve: brand link, profile link, sign out button

**File:** `components/ui/navbar.tsx`

### 3.2 Tabs
Replace custom GroupTabs with HeroUI `Tabs` + `Tab`.

- Use `selectedKey` based on `usePathname()`
- Use `href` prop for navigation

**File:** `components/groups/group-tabs.tsx`

### Verification
- Tab active state works on all group sub-pages
- Mobile menu opens/closes correctly
- Sign out works
- Navigation between pages works

---

## Phase 4: Interactive Components

### 4.1 Confirmation Modal
Replace inline ConfirmButton pattern with HeroUI `Modal`.

- Use `useDisclosure` hook for open/close
- `ModalHeader` for title, `ModalBody` for message, `ModalFooter` for confirm/cancel buttons
- Keep same component API (`onConfirm`, `label`, `confirmMessage`, etc.)
- All 6 consumers (delete expense, delete group, remove member, leave group, settle) get modal dialogs automatically

**File:** `components/ui/confirm-button.tsx`

### 4.2 Skeleton loading
Replace `animate-pulse` divs with HeroUI `Skeleton`.

**Files:** `app/(app)/dashboard/loading.tsx`, `app/(app)/groups/[groupId]/loading.tsx`

### 4.3 Checkbox & Radio
Replace native inputs with HeroUI `Checkbox` and `RadioGroup`/`Radio`.

**File:** `components/expenses/expense-form.tsx`

### Verification
- Confirmation modals appear with backdrop
- Modals close on cancel, execute on confirm
- Skeletons animate during loading
- Checkbox/radio state works in expense form

---

## Phase 5: Cleanup

- Remove unused Tailwind classes and old cursor/scrollbar rules from `globals.css` (HeroUI handles these)
- Remove `aria-label` attributes that HeroUI adds automatically
- Verify dark mode works with HeroUI's theme system
- Run `npm run build` and `npm run lint` for final check
- Update `CLAUDE.md` to mention HeroUI

---

## Files Modified Summary

| File | Phase | Change |
|---|---|---|
| `package.json` | 1 | Add `@heroui/react`, `framer-motion` |
| `tailwind.config.ts` | 1 | **NEW** — HeroUI plugin config |
| `app/globals.css` | 1 | Add `@config`, HeroUI styles |
| `app/providers.tsx` | 1 | **NEW** — HeroUIProvider wrapper |
| `app/layout.tsx` | 1 | Wrap in Providers |
| `app/page.tsx` | 2 | Button migration |
| `app/(public)/login/page.tsx` | 2 | Button + Input |
| `app/(public)/signup/page.tsx` | 2 | Button + Input |
| `app/(app)/dashboard/page.tsx` | 2 | Button + Card |
| `app/(app)/dashboard/loading.tsx` | 4 | Skeleton |
| `app/(app)/groups/new/page.tsx` | 2 | Button + Input |
| `app/(app)/groups/[groupId]/page.tsx` | 2 | Button |
| `app/(app)/groups/[groupId]/balances/page.tsx` | 2 | Card |
| `app/(app)/groups/[groupId]/settings/page.tsx` | 2 | Card |
| `app/(app)/groups/[groupId]/error.tsx` | 2 | Button + Card |
| `app/(app)/groups/[groupId]/not-found.tsx` | 2 | Button + Card |
| `app/(app)/groups/[groupId]/loading.tsx` | 4 | Skeleton |
| `app/(app)/groups/[groupId]/expenses/new/page.tsx` | — | No change (uses ExpenseForm) |
| `app/(app)/groups/[groupId]/expenses/[expenseId]/edit/page.tsx` | — | No change (uses ExpenseForm) |
| `app/(app)/profile/profile-form.tsx` | 2 | Button + Input |
| `components/ui/navbar.tsx` | 3 | HeroUI Navbar |
| `components/ui/confirm-button.tsx` | 4 | HeroUI Modal |
| `components/groups/group-tabs.tsx` | 3 | HeroUI Tabs |
| `components/groups/add-member-form.tsx` | 2 | Button + Input |
| `components/expenses/expense-form.tsx` | 2+4 | Input, Select, Button, Checkbox, Radio |
| `components/expenses/expense-list.tsx` | 2 | Button (Edit link) |

## Key Risk: Tailwind v4 Compatibility

HeroUI's Tailwind plugin was designed for Tailwind v3's `tailwind.config.js`. Tailwind v4 supports backward compatibility via `@config` directive. Phase 1 validates this works before proceeding. If it fails, options are:
1. Downgrade to Tailwind v3 (safest)
2. Use HeroUI without the Tailwind plugin (lose some theme integration)
3. Use individual `@heroui/*` packages with manual styling

## Verification (after all phases)

1. `npm run build` — no type errors
2. `npm run lint` — no new lint errors
3. Manual testing of all pages and flows
4. Mobile responsive check
5. Dark mode check
