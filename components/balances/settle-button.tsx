"use client";

import { ConfirmButton } from "@/components/ui/confirm-button";
import { recordSettlement } from "@/lib/actions/expenses";

export function SettleButton({
  groupId,
  fromUserId,
  toUserId,
  amount,
}: {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
}) {
  return (
    <ConfirmButton
      onConfirm={() => recordSettlement(groupId, fromUserId, toUserId, amount)}
      label="Settle"
      confirmLabel="Yes, record"
      confirmMessage={`Record $${amount.toFixed(2)} payment?`}
    />
  );
}
