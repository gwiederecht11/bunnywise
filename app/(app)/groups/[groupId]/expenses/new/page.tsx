import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage({
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

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-6 text-xl font-bold">Add an Expense</h2>
      <ExpenseForm
        groupId={groupId}
        members={members}
        currentUserId={user!.id}
      />
    </div>
  );
}
