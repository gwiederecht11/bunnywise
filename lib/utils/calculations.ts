export type Expense = {
  id: string;
  amount: number;
  paid_by: string;
};

export type Split = {
  expense_id: string;
  user_id: string;
  share_amount: number;
};

export type Balance = {
  userId: string;
  amount: number; // positive = owed money, negative = owes money
};

export type Settlement = {
  from: string;
  to: string;
  amount: number;
};

/**
 * Compute net balance per user within a group.
 *
 * For each expense:
 * - Credit the payer with the full amount
 * - Debit each split participant with their share
 *
 * Result: positive = others owe this user, negative = this user owes others
 */
export function computeNetBalances(
  expenses: Expense[],
  splits: Split[],
): Balance[] {
  const balanceMap = new Map<string, number>();

  for (const expense of expenses) {
    const current = balanceMap.get(expense.paid_by) ?? 0;
    balanceMap.set(expense.paid_by, current + Number(expense.amount));
  }

  for (const split of splits) {
    const current = balanceMap.get(split.user_id) ?? 0;
    balanceMap.set(split.user_id, current - Number(split.share_amount));
  }

  return Array.from(balanceMap.entries())
    .map(([userId, amount]) => ({
      userId,
      amount: Math.round(amount * 100) / 100,
    }))
    .filter((b) => Math.abs(b.amount) > 0.005);
}

/**
 * Greedy debt simplification.
 *
 * Takes net balances and produces minimal settlement transactions.
 * Matches the largest debtor with the largest creditor repeatedly.
 */
export function simplifyDebts(balances: Balance[]): Settlement[] {
  const debtors: Balance[] = [];
  const creditors: Balance[] = [];

  for (const b of balances) {
    if (b.amount < -0.005) {
      debtors.push({ ...b, amount: Math.abs(b.amount) });
    } else if (b.amount > 0.005) {
      creditors.push({ ...b });
    }
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0.005) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 0.005) d++;
    if (creditor.amount < 0.005) c++;
  }

  return settlements;
}

/**
 * Compute how much a specific user is owed or owes across given balances.
 */
export function getUserSummary(
  userId: string,
  balances: Balance[],
): { owed: number; owes: number } {
  const userBalance = balances.find((b) => b.userId === userId);
  if (!userBalance) return { owed: 0, owes: 0 };

  return {
    owed: userBalance.amount > 0 ? userBalance.amount : 0,
    owes: userBalance.amount < 0 ? Math.abs(userBalance.amount) : 0,
  };
}
