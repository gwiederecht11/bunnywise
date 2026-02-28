import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { ExpenseInitialData } from "@/components/expenses/expense-form";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const { groupId, expenseId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the expense
  const { data: expense } = await supabase
    .from("expenses")
    .select("id, description, amount, paid_by")
    .eq("id", expenseId)
    .eq("group_id", groupId)
    .single();

  if (!expense) {
    notFound();
  }

  // Only the payer can edit
  if (expense.paid_by !== user!.id) {
    notFound();
  }

  // Fetch existing splits
  const { data: splits } = await supabase
    .from("expense_splits")
    .select("user_id, share_amount")
    .eq("expense_id", expenseId);

  // Fetch group members with profile info
  const { data: memberships } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, email, full_name)")
    .eq("group_id", groupId);

  const members =
    memberships?.map((m) => {
      const profile = m.profiles as unknown as {
        id: string;
        email: string;
        full_name: string;
      };
      return {
        user_id: m.user_id,
        full_name: profile?.full_name ?? "",
        email: profile?.email ?? "",
      };
    }) ?? [];

  const initialData: ExpenseInitialData = {
    id: expense.id,
    description: expense.description,
    amount: Number(expense.amount),
    paidBy: expense.paid_by,
    splits:
      splits?.map((s) => ({
        userId: s.user_id,
        amount: Number(s.share_amount),
      })) ?? [],
  };

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-6 text-xl font-bold">Edit Expense</h2>
      <ExpenseForm
        groupId={groupId}
        members={members}
        currentUserId={user!.id}
        initialData={initialData}
      />
    </div>
  );
}
