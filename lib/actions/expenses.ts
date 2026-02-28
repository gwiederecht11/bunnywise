"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type SplitEntry = {
  userId: string;
  amount: number;
};

export async function createExpense(
  groupId: string,
  formData: FormData,
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paidBy = formData.get("paidBy") as string;
  const splitsJson = formData.get("splits") as string;

  if (!description || isNaN(amount) || amount <= 0) {
    return { error: "Please enter a valid description and amount" };
  }

  let splitEntries: SplitEntry[];
  try {
    splitEntries = JSON.parse(splitsJson);
  } catch {
    return { error: "Invalid split data" };
  }

  if (splitEntries.length === 0) {
    return { error: "Select at least one person to split with" };
  }

  // Validate split amounts sum to total
  const splitTotal = splitEntries.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(splitTotal - amount) > 0.01) {
    return { error: `Split amounts ($${splitTotal.toFixed(2)}) must equal the total ($${amount.toFixed(2)})` };
  }

  // Insert the expense
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      group_id: groupId,
      description,
      amount,
      paid_by: paidBy,
    })
    .select("id")
    .single();

  if (expenseError) {
    return { error: expenseError.message };
  }

  const splits = splitEntries.map((entry) => ({
    expense_id: expense.id,
    user_id: entry.userId,
    share_amount: entry.amount,
  }));

  const { error: splitsError } = await supabase
    .from("expense_splits")
    .insert(splits);

  if (splitsError) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return { error: splitsError.message };
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function updateExpense(
  expenseId: string,
  groupId: string,
  formData: FormData,
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paidBy = formData.get("paidBy") as string;
  const splitsJson = formData.get("splits") as string;

  if (!description || isNaN(amount) || amount <= 0) {
    return { error: "Please enter a valid description and amount" };
  }

  let splitEntries: SplitEntry[];
  try {
    splitEntries = JSON.parse(splitsJson);
  } catch {
    return { error: "Invalid split data" };
  }

  if (splitEntries.length === 0) {
    return { error: "Select at least one person to split with" };
  }

  const splitTotal = splitEntries.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(splitTotal - amount) > 0.01) {
    return { error: `Split amounts ($${splitTotal.toFixed(2)}) must equal the total ($${amount.toFixed(2)})` };
  }

  // Update the expense
  const { error: expenseError } = await supabase
    .from("expenses")
    .update({
      description,
      amount,
      paid_by: paidBy,
    })
    .eq("id", expenseId);

  if (expenseError) {
    return { error: expenseError.message };
  }

  // Delete old splits and insert new ones
  const { error: deleteError } = await supabase
    .from("expense_splits")
    .delete()
    .eq("expense_id", expenseId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const splits = splitEntries.map((entry) => ({
    expense_id: expenseId,
    user_id: entry.userId,
    share_amount: entry.amount,
  }));

  const { error: splitsError } = await supabase
    .from("expense_splits")
    .insert(splits);

  if (splitsError) {
    return { error: splitsError.message };
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function recordSettlement(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Create a settlement expense (payer = debtor, split assigned to creditor)
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      group_id: groupId,
      description: "Settlement",
      amount,
      paid_by: fromUserId,
    })
    .select("id")
    .single();

  if (expenseError) {
    return { error: expenseError.message };
  }

  const { error: splitError } = await supabase
    .from("expense_splits")
    .insert({
      expense_id: expense.id,
      user_id: toUserId,
      share_amount: amount,
    });

  if (splitError) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return { error: splitError.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function deleteExpense(expenseId: string, groupId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
