"use client";

import { deleteExpense } from "@/lib/actions/expenses";
import { ConfirmButton } from "@/components/ui/confirm-button";

export function DeleteExpenseButton({
  expenseId,
  groupId,
}: {
  expenseId: string;
  groupId: string;
}) {
  return (
    <ConfirmButton
      onConfirm={async () => { await deleteExpense(expenseId, groupId); }}
      label="Delete"
      confirmLabel="Yes, delete"
      confirmMessage="Delete this expense?"
    />
  );
}
