"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import type { ExpenseItem } from "@/components/expenses/expense-list";

type Member = {
  user_id: string;
  full_name: string;
  email: string;
};

export function GroupActivityClient({
  groupId,
  currentUserId,
  members,
  expenses,
  allSettled,
}: {
  groupId: string;
  currentUserId: string;
  members: Member[];
  expenses: ExpenseItem[];
  allSettled: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expenses</h2>
        <Button
          color={showForm ? "default" : "primary"}
          variant={showForm ? "bordered" : "solid"}
          onPress={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add Expense"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-foreground/10 p-4">
          <ExpenseForm
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {!showForm && (
        expenses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-foreground/20 p-8 text-center">
            <p className="mb-2 text-foreground/60">No expenses yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-medium underline"
            >
              Add the first expense
            </button>
          </div>
        ) : (
          <ExpenseList
            expenses={expenses}
            groupId={groupId}
            allSettled={allSettled}
          />
        )
      )}
    </div>
  );
}
