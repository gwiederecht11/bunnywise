import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { GroupActivityClient } from "@/components/expenses/group-activity-client";
import type { ExpenseItem } from "@/components/expenses/expense-list";
import { computeNetBalances, simplifyDebts } from "@/lib/utils/calculations";
import type { ExpenseWithPayer, GroupMemberWithProfile } from "@/lib/types/database";

export default async function GroupActivityPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Batch 1: independent queries (getUser, members, expenses all use groupId)
  const [{ data: { user } }, { data: memberships }, { data: expenses }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("group_members")
        .select("user_id, profiles(id, email, full_name)")
        .eq("group_id", groupId),
      supabase
        .from("expenses")
        .select("id, description, amount, paid_by, expense_date, created_at, profiles!expenses_paid_by_fkey(full_name, email)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false }),
    ]);

  const members =
    (memberships as GroupMemberWithProfile[] | null)?.map((m) => ({
      user_id: m.user_id,
      full_name: m.profiles?.full_name ?? "",
      email: m.profiles?.email ?? "",
    })) ?? [];

  // Batch 2: splits depend on expense IDs
  const expenseIds = (expenses ?? []).map((e) => e.id);
  const { data: allSplits } = expenseIds.length > 0
    ? await supabase
        .from("expense_splits")
        .select("expense_id, user_id, share_amount")
        .in("expense_id", expenseIds)
    : { data: [] as { expense_id: string; user_id: string; share_amount: number }[] };

  // Filter user's splits from allSplits in memory (no separate query needed)
  const splitsMap = new Map(
    (allSplits ?? [])
      .filter((s) => s.user_id === user!.id)
      .map((s) => [s.expense_id, Number(s.share_amount)]),
  );

  const balances = computeNetBalances(
    (expenses ?? []).map((e) => ({ id: e.id, amount: Number(e.amount), paid_by: e.paid_by })),
    allSplits ?? [],
  );
  const settlements = simplifyDebts(balances);
  const allSettled = settlements.length === 0 && (expenses ?? []).length > 0;

  // Prepare serializable expense items
  const expenseItems: ExpenseItem[] = ((expenses ?? []) as unknown as ExpenseWithPayer[]).map((expense) => {
    const payer = expense.profiles;
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
    <GroupActivityClient
      groupId={groupId}
      currentUserId={user!.id}
      members={members}
      expenses={expenseItems}
      allSettled={allSettled}
    />
  );
}
