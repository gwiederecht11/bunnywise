import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Card, CardBody } from "@/components/ui/heroui";
import {
  computeNetBalances,
  simplifyDebts,
} from "@/lib/utils/calculations";
import { SettleButton } from "@/components/balances/settle-button";
import type { GroupMemberWithProfile } from "@/lib/types/database";

export default async function GroupBalancesPage({
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

  // Fetch members with profile info
  const { data: memberships } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, email, full_name)")
    .eq("group_id", groupId);

  const memberMap = new Map<string, string>();
  (memberships as GroupMemberWithProfile[] | null)?.forEach((m) => {
    const profile = m.profiles;
    memberMap.set(
      m.user_id,
      profile?.full_name || profile?.email || "Unknown",
    );
  });

  function getName(userId: string) {
    if (userId === user!.id) return "You";
    return memberMap.get(userId) ?? "Unknown";
  }

  // Fetch all expenses and splits for this group
  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, amount, paid_by")
    .eq("group_id", groupId);

  const { data: splits } = await supabase
    .from("expense_splits")
    .select("expense_id, user_id, share_amount")
    .in(
      "expense_id",
      (expenses ?? []).map((e) => e.id),
    );

  const balances = computeNetBalances(expenses ?? [], splits ?? []);
  const settlements = simplifyDebts(balances);

  const allSettled = settlements.length === 0;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Balances</h2>

      {/* Per-user net balances */}
      <div className="mb-8 space-y-2">
        {balances.length === 0 ? (
          <p className="text-sm text-foreground/60">
            No expenses in this group yet.
          </p>
        ) : (
          balances
            .sort((a, b) => b.amount - a.amount)
            .map((balance) => (
              <Card key={balance.userId}>
                <CardBody className="flex-row items-center justify-between py-3">
                  <span className="text-sm font-medium">
                    {getName(balance.userId)}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      balance.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {balance.amount > 0 ? "+" : "-"}$
                    {Math.abs(balance.amount).toFixed(2)}
                  </span>
                </CardBody>
              </Card>
            ))
        )}
      </div>

      {/* Simplified settlements */}
      <h2 className="mb-4 text-lg font-semibold">Suggested Settlements</h2>
      {allSettled ? (
        <Card className="border border-dashed border-foreground/20">
          <CardBody className="text-center py-8">
            <p className="text-foreground/60">All settled up!</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {settlements.map((s, i) => (
            <Card key={i}>
              <CardBody className="flex-row items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{getName(s.from)}</span>
                  <span className="text-foreground/60"> owes </span>
                  <span className="font-medium">{getName(s.to)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">${s.amount.toFixed(2)}</span>
                  <SettleButton
                    groupId={groupId}
                    fromUserId={s.from}
                    toUserId={s.to}
                    amount={s.amount}
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
