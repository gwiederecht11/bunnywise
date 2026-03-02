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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch group members with profile info (needed for inline expense form)
  const { data: memberships } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, email, full_name)")
    .eq("group_id", groupId);

  const members =
    (memberships as GroupMemberWithProfile[] | null)?.map((m) => ({
      user_id: m.user_id,
      full_name: m.profiles?.full_name ?? "",
      email: m.profiles?.email ?? "",
    })) ?? [];

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
