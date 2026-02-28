import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { ExpenseList } from "@/components/expenses/expense-list";
import type { ExpenseItem } from "@/components/expenses/expense-list";
import { computeNetBalances, simplifyDebts } from "@/lib/utils/calculations";

export default async function GroupActivityPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch expenses with payer info
  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, description, amount, paid_by, expense_date, created_at, profiles!expenses_paid_by_fkey(full_name, email)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  // Fetch splits for the current user to show "you owe" context
  const { data: userSplits } = await supabase
    .from("expense_splits")
    .select("expense_id, share_amount")
    .eq("user_id", user!.id);

  const splitsMap = new Map(
    userSplits?.map((s) => [s.expense_id, Number(s.share_amount)]) ?? [],
  );

  // Fetch all splits for balance calculation
  const { data: allSplits } = await supabase
    .from("expense_splits")
    .select("expense_id, user_id, share_amount")
    .in("expense_id", (expenses ?? []).map((e) => e.id));

  const balances = computeNetBalances(
    (expenses ?? []).map((e) => ({ id: e.id, amount: Number(e.amount), paid_by: e.paid_by })),
    allSplits ?? [],
  );
  const settlements = simplifyDebts(balances);
  const allSettled = settlements.length === 0 && (expenses ?? []).length > 0;

  // Prepare serializable expense items
  const expenseItems: ExpenseItem[] = (expenses ?? []).map((expense) => {
    const payer = expense.profiles as unknown as {
      full_name: string;
      email: string;
    };
    return {
      id: expense.id,
      description: expense.description,
      amount: Number(expense.amount),
      paid_by: expense.paid_by,
      expense_date: expense.expense_date,
      payerName: payer?.full_name || payer?.email || "Unknown",
      isPayer: expense.paid_by === user!.id,
      userShare: splitsMap.get(expense.id),
    };
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expenses</h2>
        <Link
          href={`/groups/${groupId}/expenses/new`}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          Add Expense
        </Link>
      </div>

      {!expenses || expenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-foreground/20 p-8 text-center">
          <p className="mb-2 text-foreground/60">No expenses yet.</p>
          <Link
            href={`/groups/${groupId}/expenses/new`}
            className="text-sm font-medium underline"
          >
            Add the first expense
          </Link>
        </div>
      ) : (
        <ExpenseList
          expenses={expenseItems}
          groupId={groupId}
          allSettled={allSettled}
        />
      )}
    </div>
  );
}
