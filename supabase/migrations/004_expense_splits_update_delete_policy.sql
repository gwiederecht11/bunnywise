-- Allow expense payer to update and delete splits (needed for expense editing)
create policy "Payer can update splits" on expense_splits for update
  using (
    exists (
      select 1 from expenses
      where expenses.id = expense_splits.expense_id
        and expenses.paid_by = auth.uid()
    )
  );

create policy "Payer can delete splits" on expense_splits for delete
  using (
    exists (
      select 1 from expenses
      where expenses.id = expense_splits.expense_id
        and expenses.paid_by = auth.uid()
    )
  );
