"use client";

import { useState } from "react";

export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Yes, confirm",
  confirmMessage = "Are you sure?",
  variant = "inline",
}: {
  onConfirm: () => void | Promise<void>;
  label: string;
  confirmLabel?: string;
  confirmMessage?: string;
  variant?: "inline" | "danger";
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    setConfirming(false);
  }

  if (!confirming) {
    const className =
      variant === "danger"
        ? "rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        : "text-sm text-red-600 transition hover:text-red-800";

    return (
      <button onClick={() => setConfirming(true)} className={className}>
        {label}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-red-600">{confirmMessage}</span>
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "..." : confirmLabel}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-md border border-foreground/20 px-3 py-1 text-sm font-medium transition hover:bg-foreground/5"
      >
        Cancel
      </button>
    </div>
  );
}
