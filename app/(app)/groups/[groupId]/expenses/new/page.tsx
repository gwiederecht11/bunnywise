import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { GroupMemberWithProfile } from "@/lib/types/database";

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
    (memberships as GroupMemberWithProfile[] | null)?.map((m) => ({
      user_id: m.user_id,
      full_name: m.profiles?.full_name ?? "",
      email: m.profiles?.email ?? "",
    })) ?? [];

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
