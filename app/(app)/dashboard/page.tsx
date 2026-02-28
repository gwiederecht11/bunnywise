import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  computeNetBalances,
  getUserSummary,
} from "@/lib/utils/calculations";

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
    memberships?.map(
      (m) =>
        (m as Record<string, unknown>).groups as {
          id: string;
          name: string;
          description: string;
        },
    ) ?? [];

  // Compute balances across all groups
  let totalOwed = 0;
  let totalOwe = 0;

  if (groups.length > 0) {
    const groupIds = groups.map((g) => g.id);

    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, amount, paid_by")
      .in("group_id", groupIds);

    const expenseIds = (expenses ?? []).map((e) => e.id);

    const { data: splits } = expenseIds.length > 0
      ? await supabase
          .from("expense_splits")
          .select("expense_id, user_id, share_amount")
          .in("expense_id", expenseIds)
      : { data: [] };

    const balances = computeNetBalances(expenses ?? [], splits ?? []);
    const summary = getUserSummary(user!.id, balances);
    totalOwed = summary.owed;
    totalOwe = summary.owes;
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
          <p className="text-2xl font-bold text-green-600">
            ${totalOwed.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60">You owe</p>
          <p className="text-2xl font-bold text-red-600">
            ${totalOwe.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60">Net balance</p>
          <p
            className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
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
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block rounded-lg border border-foreground/10 p-4 transition hover:border-foreground/30"
            >
              <h3 className="font-semibold">{group.name}</h3>
              {group.description && (
                <p className="mt-1 text-sm text-foreground/60">
                  {group.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
