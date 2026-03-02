"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";

export type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  expense_date: string;
  payerName: string;
  isPayer: boolean;
  userShare: number | undefined;
};

export function ExpenseList({
  expenses,
  groupId,
  allSettled,
}: {
  expenses: ExpenseItem[];
  groupId: string;
  allSettled: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div>
      {allSettled && expenses.length > 0 && (
        <div className="mb-6 rounded-lg border border-dashed border-foreground/20 p-8 text-center">
          <p className="mb-3 text-foreground/60">You are all settled up</p>
          <Button
            variant="light"
            size="sm"
            onPress={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Hide expense history" : "Show expense history"}
          </Button>
        </div>
      )}

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: !allSettled || showHistory ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {expenses.map((expense) => {
            const date = new Date(expense.expense_date);
            const month = date
              .toLocaleDateString("en-US", { month: "short" })
              .toUpperCase();
            const day = date.getDate();
            const payerLabel = expense.isPayer
              ? "You paid"
              : `${expense.payerName} paid`;

            const isSettlement = expense.description === "Settlement";
            let oweLabel: string;
            let oweAmount: string | null;
            let oweColor: string;
            if (expense.isPayer) {
              oweLabel = isSettlement ? "You settled" : "You get back";
              oweAmount = isSettlement
                ? `$${expense.amount.toFixed(2)}`
                : `$${(expense.amount - (expense.userShare ?? 0)).toFixed(2)}`;
              oweColor = isSettlement ? "text-foreground/60" : "text-green-600";
            } else if (expense.userShare) {
              oweLabel = isSettlement ? "You received" : "You owe";
              oweAmount = `$${expense.userShare.toFixed(2)}`;
              oweColor = isSettlement ? "text-green-600" : "text-red-600";
            } else {
              oweLabel = "Not involved";
              oweAmount = null;
              oweColor = "text-foreground/40";
            }

            return (
              <div
                key={expense.id}
                className="flex items-center gap-4 border-b border-foreground/10 py-4"
              >
                {/* Date block */}
                <div className="shrink-0 w-12 text-center">
                  <p className="text-xs uppercase text-foreground/40">
                    {month}
                  </p>
                  <p className="text-xl font-bold">{day}</p>
                </div>

                {/* Description */}
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{expense.description}</p>
                </div>

                {/* Right: who-paid + owe/get-back */}
                <div className="shrink-0 flex">
                  {/* Paid column */}
                  <div className="w-28 text-right pr-4">
                    <p className="text-xs text-foreground/40">{payerLabel}</p>
                    <p className="font-bold">${expense.amount.toFixed(2)}</p>
                  </div>
                  {/* Owe/get-back column */}
                  <div className="w-28 text-left pl-4 border-l border-foreground/10">
                    <p className={`text-xs ${oweColor}`}>{oweLabel}</p>
                    {oweAmount && (
                      <p className={`font-bold ${oweColor}`}>{oweAmount}</p>
                    )}
                  </div>
                </div>

                {/* Edit/Delete */}
                <div className="shrink-0 flex items-center">
                  <div className="w-10 text-center">
                    <Button
                      as={Link}
                      href={`/groups/${groupId}/expenses/${expense.id}/edit`}
                      variant="light"
                      size="sm"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="w-14 text-center">
                    <DeleteExpenseButton
                      expenseId={expense.id}
                      groupId={groupId}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
