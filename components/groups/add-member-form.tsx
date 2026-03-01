"use client";

import { useState } from "react";
import { addMember } from "@/lib/actions/groups";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    setLoading(true);

    const result = await addMember(groupId, formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      // Clear the form
      const form = document.getElementById("add-member-form") as HTMLFormElement;
      form?.reset();
    }

    setLoading(false);
  }

  return (
    <div>
      {error && (
        <p className="mb-2 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mb-2 text-sm text-green-600">Member added</p>
      )}
      <form id="add-member-form" action={handleSubmit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Enter email address"
          aria-label="Member email address"
          className="flex-1 rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </form>
    </div>
  );
}
