"use client";

import { useState, useMemo } from "react";
import { Input, Button, Checkbox, Select, SelectItem } from "@heroui/react";
import { createExpense, updateExpense } from "@/lib/actions/expenses";

type Member = {
  user_id: string;
  full_name: string;
  email: string;
};

export type ExpenseInitialData = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  expenseDate: string;
  splits: { userId: string; amount: number }[];
};

type SplitMode = "equal" | "full" | "custom";
type CustomSplitType = "equal" | "exact" | "percentage";

function getMemberName(member: Member, currentUserId: string) {
  const name = member.full_name || member.email;
  return member.user_id === currentUserId ? "You" : name;
}

function getMemberDisplayName(member: Member) {
  return member.full_name || member.email;
}

export function ExpenseForm({
  groupId,
  members,
  currentUserId,
  initialData,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  initialData?: ExpenseInitialData;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "");
  const [paidBy, setPaidBy] = useState(initialData?.paidBy ?? currentUserId);
  const [splitMode, setSplitMode] = useState<SplitMode>(
    initialData ? "custom" : "equal",
  );
  const [showMoreOptions, setShowMoreOptions] = useState(!!initialData);
  const [customSplitType, setCustomSplitType] = useState<CustomSplitType>(
    initialData ? "exact" : "equal",
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    initialData
      ? initialData.splits.map((s) => s.userId)
      : members.map((m) => m.user_id),
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>(
    initialData
      ? Object.fromEntries(initialData.splits.map((s) => [s.userId, String(s.amount)]))
      : {},
  );
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const parsedAmount = parseFloat(amount) || 0;
  const payer = members.find((m) => m.user_id === paidBy);
  const payerLabel =
    paidBy === currentUserId
      ? "You are"
      : payer ? `${getMemberDisplayName(payer)} is` : "They are";

  // Calculate splits based on current mode
  const splits = useMemo(() => {
    if (parsedAmount <= 0) return [];

    if (splitMode === "equal") {
      // Split equally among ALL members
      return distributeEqual(parsedAmount, members.map((m) => m.user_id));
    }

    if (splitMode === "full") {
      // Full amount owed by everyone except the payer
      const others = members.filter((m) => m.user_id !== paidBy).map((m) => m.user_id);
      if (others.length === 0) return [];
      return distributeEqual(parsedAmount, others);
    }

    // Custom mode
    if (customSplitType === "equal") {
      if (selectedMembers.length === 0) return [];
      return distributeEqual(parsedAmount, selectedMembers);
    }

    if (customSplitType === "exact") {
      return selectedMembers.map((userId) => ({
        userId,
        amount: parseFloat(exactAmounts[userId] || "0") || 0,
      }));
    }

    if (customSplitType === "percentage") {
      return selectedMembers.map((userId) => {
        const pct = parseFloat(percentages[userId] || "0") || 0;
        return {
          userId,
          amount: Math.round((parsedAmount * pct) / 100 * 100) / 100,
        };
      });
    }

    return [];
  }, [parsedAmount, splitMode, paidBy, members, customSplitType, selectedMembers, exactAmounts, percentages]);

  const splitsTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  const isValid =
    parsedAmount > 0 &&
    splits.length > 0 &&
    Math.abs(splitsTotal - parsedAmount) <= 0.01;

  function toggleMember(userId: string) {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    // Inject the computed splits as JSON
    formData.set("splits", JSON.stringify(splits));

    const result = initialData
      ? await updateExpense(initialData.id, groupId, formData)
      : await createExpense(groupId, formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Description */}
      <Input
        name="description"
        type="text"
        label="Description"
        placeholder="e.g. Dinner, Groceries, Uber"
        variant="bordered"
        isRequired
        defaultValue={initialData?.description}
      />

      {/* Amount */}
      <Input
        name="amount"
        type="number"
        label="Amount ($)"
        placeholder="0.00"
        variant="bordered"
        isRequired
        step={0.01}
        min={0.01}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* Date */}
      <Input
        name="expenseDate"
        type="date"
        label="Date"
        variant="bordered"
        isRequired
        defaultValue={initialData?.expenseDate ?? new Date().toISOString().split("T")[0]}
      />

      {/* Paid by */}
      <Select
        name="paidBy"
        label="Paid by"
        variant="bordered"
        disallowEmptySelection
        selectedKeys={new Set([paidBy])}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys as Set<string>)[0];
          if (selected) setPaidBy(selected);
        }}
      >
        {members.map((member) => (
          <SelectItem key={member.user_id} textValue={`${getMemberDisplayName(member)}${member.user_id === currentUserId ? " (you)" : ""}`}>
            {getMemberDisplayName(member)}
            {member.user_id === currentUserId ? " (you)" : ""}
          </SelectItem>
        ))}
      </Select>

      {/* Split options */}
      <div>
        <p className="mb-2 text-sm font-medium">How to split</p>

        {/* Default options */}
        <div className="space-y-2">
          <label
            className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition ${
              splitMode === "equal" && !showMoreOptions
                ? "border-foreground bg-foreground/5"
                : "border-foreground/10 hover:border-foreground/30"
            }`}
          >
            <input
              type="radio"
              name="splitMode"
              checked={splitMode === "equal"}
              onChange={() => {
                setSplitMode("equal");
                setShowMoreOptions(false);
              }}
              className="h-4 w-4"
            />
            <div className="flex-1">
              <span className="text-sm font-medium">Split equally</span>
              {parsedAmount > 0 && splitMode === "equal" && (
                <span className="ml-2 text-sm text-foreground/60">
                  (${(parsedAmount / members.length).toFixed(2)} each)
                </span>
              )}
            </div>
          </label>

          <label
            className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition ${
              splitMode === "full" && !showMoreOptions
                ? "border-foreground bg-foreground/5"
                : "border-foreground/10 hover:border-foreground/30"
            }`}
          >
            <input
              type="radio"
              name="splitMode"
              checked={splitMode === "full"}
              onChange={() => {
                setSplitMode("full");
                setShowMoreOptions(false);
              }}
              className="h-4 w-4"
            />
            <div className="flex-1">
              <span className="text-sm font-medium">
                {payerLabel} owed the full amount
              </span>
              {parsedAmount > 0 && splitMode === "full" && members.length > 1 && (
                <span className="ml-2 text-sm text-foreground/60">
                  (${(parsedAmount / (members.length - 1)).toFixed(2)} each from{" "}
                  {members.length - 1} {members.length - 1 === 1 ? "person" : "people"})
                </span>
              )}
            </div>
          </label>
        </div>

        {/* More options toggle */}
        {!showMoreOptions ? (
          <Button
            variant="light"
            size="sm"
            className="mt-3"
            onPress={() => {
              setShowMoreOptions(true);
              setSplitMode("custom");
              setCustomSplitType("equal");
              setSelectedMembers(members.map((m) => m.user_id));
            }}
          >
            More options...
          </Button>
        ) : (
          <div className="mt-4 rounded-lg border border-foreground/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">Custom split</p>
              <Button
                variant="light"
                size="sm"
                onPress={() => {
                  setShowMoreOptions(false);
                  setSplitMode("equal");
                }}
              >
                Close
              </Button>
            </div>

            {/* Custom split type tabs */}
            <div className="mb-4 flex gap-1 rounded-md bg-foreground/5 p-1">
              {(["equal", "exact", "percentage"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCustomSplitType(type)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    customSplitType === type
                      ? "bg-background shadow-sm"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {type === "equal"
                    ? "Equal"
                    : type === "exact"
                      ? "Exact amounts"
                      : "Percentages"}
                </button>
              ))}
            </div>

            {/* Member list with split inputs */}
            <div className="space-y-2">
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member.user_id);
                const memberSplit = splits.find(
                  (s) => s.userId === member.user_id,
                );

                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center gap-3 rounded-md border p-3 transition ${
                      isSelected
                        ? "border-foreground/20"
                        : "border-foreground/5 opacity-50"
                    }`}
                  >
                    <Checkbox
                      isSelected={isSelected}
                      onValueChange={() => toggleMember(member.user_id)}
                      size="sm"
                    />
                    <span className="flex-1 text-sm">
                      {getMemberName(member, currentUserId)}
                    </span>

                    {isSelected && customSplitType === "equal" && memberSplit && (
                      <span className="text-sm text-foreground/60">
                        ${memberSplit.amount.toFixed(2)}
                      </span>
                    )}

                    {isSelected && customSplitType === "exact" && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-foreground/40">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={exactAmounts[member.user_id] ?? ""}
                          onChange={(e) =>
                            setExactAmounts((prev) => ({
                              ...prev,
                              [member.user_id]: e.target.value,
                            }))
                          }
                          className="w-20 rounded border border-foreground/20 bg-background px-2 py-1 text-right text-sm outline-none focus:border-foreground/40"
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    {isSelected && customSplitType === "percentage" && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={percentages[member.user_id] ?? ""}
                          onChange={(e) =>
                            setPercentages((prev) => ({
                              ...prev,
                              [member.user_id]: e.target.value,
                            }))
                          }
                          className="w-16 rounded border border-foreground/20 bg-background px-2 py-1 text-right text-sm outline-none focus:border-foreground/40"
                          placeholder="0"
                        />
                        <span className="text-sm text-foreground/40">%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Validation feedback */}
            {parsedAmount > 0 && (
              <div className="mt-3">
                {customSplitType === "exact" && (
                  <p
                    className={`text-sm ${
                      Math.abs(splitsTotal - parsedAmount) <= 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${splitsTotal.toFixed(2)} of ${parsedAmount.toFixed(2)}{" "}
                    {Math.abs(splitsTotal - parsedAmount) <= 0.01
                      ? "-- amounts match"
                      : `-- $${Math.abs(parsedAmount - splitsTotal).toFixed(2)} ${
                          splitsTotal > parsedAmount ? "over" : "remaining"
                        }`}
                  </p>
                )}
                {customSplitType === "percentage" && (
                  <p
                    className={`text-sm ${
                      Math.abs(splitsTotal - parsedAmount) <= 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedMembers
                      .reduce(
                        (sum, id) =>
                          sum + (parseFloat(percentages[id] || "0") || 0),
                        0,
                      )
                      .toFixed(1)}
                    % allocated
                    {Math.abs(
                      selectedMembers.reduce(
                        (sum, id) =>
                          sum + (parseFloat(percentages[id] || "0") || 0),
                        0,
                      ) - 100,
                    ) <= 0.1
                      ? " -- percentages match"
                      : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        type="submit"
        color="primary"
        isLoading={loading}
        isDisabled={!isValid}
        fullWidth
      >
        {loading
          ? initialData ? "Saving..." : "Adding..."
          : initialData ? "Save Changes" : "Add Expense"}
      </Button>
    </form>
  );
}

/** Distribute an amount equally among userIds, handling rounding */
function distributeEqual(total: number, userIds: string[]) {
  if (userIds.length === 0) return [];
  const baseShare = Math.floor((total * 100) / userIds.length) / 100;
  const remainder = Math.round((total - baseShare * userIds.length) * 100);

  return userIds.map((userId, index) => ({
    userId,
    amount: index < remainder ? baseShare + 0.01 : baseShare,
  }));
}
