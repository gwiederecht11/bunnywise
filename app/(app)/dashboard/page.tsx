import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  computeNetBalances,
  getUserSummary,
} from "@/lib/utils/calculations";
import type { GroupMemberWithGroup } from "@/lib/types/database";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch groups the user belongs to
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, description)")
    .eq("user_id", user!.id);

  const groups =
    (memberships as GroupMemberWithGroup[] | null)?.map((m) => m.groups) ?? [];

  // Compute per-group balances and overall totals
  let totalOwed = 0;
  let totalOwe = 0;
  const groupBalances = new Map<string, number>();

  if (groups.length > 0) {
    const groupIds = groups.map((g) => g.id);

    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, amount, paid_by, group_id")
      .in("group_id", groupIds);

    const expenseIds = (expenses ?? []).map((e) => e.id);

    const { data: splits } = expenseIds.length > 0
      ? await supabase
          .from("expense_splits")
          .select("expense_id, user_id, share_amount")
          .in("expense_id", expenseIds)
      : { data: [] };

    // Group expenses by group_id for per-group balance calculation
    const expensesByGroup = new Map<string, typeof expenses>();
    for (const expense of expenses ?? []) {
      const group = expensesByGroup.get(expense.group_id) ?? [];
      group.push(expense);
      expensesByGroup.set(expense.group_id, group);
    }

    // Build expense_id -> group_id lookup for splits
    const expenseToGroup = new Map<string, string>();
    for (const expense of expenses ?? []) {
      expenseToGroup.set(expense.id, expense.group_id);
    }

    // Group splits by group_id
    type SplitRow = { expense_id: string; user_id: string; share_amount: number };
    const splitsByGroup = new Map<string, SplitRow[]>();
    for (const split of splits ?? []) {
      const gid = expenseToGroup.get(split.expense_id);
      if (!gid) continue;
      const group = splitsByGroup.get(gid) ?? [];
      group.push(split);
      splitsByGroup.set(gid, group);
    }

    for (const g of groups) {
      const gExpenses = expensesByGroup.get(g.id) ?? [];
      const gSplits = splitsByGroup.get(g.id) ?? [];
      const balances = computeNetBalances(gExpenses, gSplits);
      const summary = getUserSummary(user!.id, balances);
      totalOwed += summary.owed;
      totalOwe += summary.owes;
      const net = summary.owed - summary.owes;
      groupBalances.set(g.id, net);
    }
  }

  const netBalance = totalOwed - totalOwe;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/groups/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          New Group
        </Link>
      </div>

      {/* Balance summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60">You are owed</p>
          <p className="text-2xl font-bold text-green-600" aria-label={`You are owed $${totalOwed.toFixed(2)}`}>
            ${totalOwed.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60">You owe</p>
          <p className="text-2xl font-bold text-red-600" aria-label={`You owe $${totalOwe.toFixed(2)}`}>
            ${totalOwe.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60">Net balance</p>
          <p
            className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            aria-label={`Net balance ${netBalance >= 0 ? "positive" : "negative"} $${Math.abs(netBalance).toFixed(2)}`}
          >
            {netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Groups list */}
      <h2 className="mb-4 text-lg font-semibold">Your Groups</h2>
      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-foreground/20 p-8 text-center">
          <p className="mb-2 text-foreground/60">
            You&apos;re not in any groups yet.
          </p>
          <Link
            href="/groups/new"
            className="text-sm font-medium underline"
          >
            Create your first group
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const bal = groupBalances.get(group.id) ?? 0;
            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block rounded-lg border border-foreground/10 p-4 transition hover:border-foreground/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    {group.description && (
                      <p className="mt-1 text-sm text-foreground/60">
                        {group.description}
                      </p>
                    )}
                  </div>
                  {Math.abs(bal) > 0.005 && (
                    <span
                      className={`text-sm font-semibold ${bal > 0 ? "text-green-600" : "text-red-600"}`}
                      aria-label={`${bal > 0 ? "You are owed" : "You owe"} $${Math.abs(bal).toFixed(2)}`}
                    >
                      {bal > 0 ? "+" : "-"}${Math.abs(bal).toFixed(2)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
