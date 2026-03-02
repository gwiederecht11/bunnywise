import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/heroui";
import {
  computeNetBalances,
  getUserSummary,
  simplifyDebts,
} from "@/lib/utils/calculations";
import type { GroupMemberWithGroup } from "@/lib/types/database";
import { NewGroupModal } from "@/components/groups/new-group-modal";

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
  const settledGroups = new Set<string>();

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
      const settlements = simplifyDebts(balances);
      if (settlements.length === 0 && gExpenses.length > 0) {
        settledGroups.add(g.id);
      }
    }
  }

  const netBalance = totalOwed - totalOwe;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <NewGroupModal />
      </div>

      {/* Balance summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-foreground/60">You are owed</p>
            <p className="text-2xl font-bold text-green-600">
              ${totalOwed.toFixed(2)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-foreground/60">You owe</p>
            <p className="text-2xl font-bold text-red-600">
              ${totalOwe.toFixed(2)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-foreground/60">Net balance</p>
            <p
              className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toFixed(2)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Groups list */}
      <h2 className="mb-4 text-lg font-semibold">Your Groups</h2>
      {groups.length === 0 ? (
        <Card className="border border-dashed border-foreground/20">
          <CardBody className="text-center py-8">
            <p className="mb-2 text-foreground/60">
              You&apos;re not in any groups yet.
            </p>
            <Link
              href="/groups/new"
              className="text-sm font-medium underline"
            >
              Create your first group
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const bal = groupBalances.get(group.id) ?? 0;
            const isSettled = settledGroups.has(group.id);
            return (
              <Link key={group.id} href={`/groups/${group.id}`} className="h-full">
                <Card isPressable fullWidth className="h-full border border-foreground/10">
                  <CardBody className="flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      {group.description && (
                        <p className="mt-1 text-sm text-foreground/60">
                          {group.description}
                        </p>
                      )}
                    </div>
                    {isSettled ? (
                      <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-green-600">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Settled up
                      </p>
                    ) : Math.abs(bal) > 0.005 ? (
                      <p
                        className={`mt-3 text-sm font-semibold ${bal > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {bal > 0 ? "+" : "-"}${Math.abs(bal).toFixed(2)}
                      </p>
                    ) : null}
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
