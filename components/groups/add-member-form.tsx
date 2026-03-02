"use client";

import { useState } from "react";
import { Input, Button } from "@heroui/react";
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
        <Input
          name="email"
          type="email"
          placeholder="Enter email address"
          variant="bordered"
          isRequired
          className="flex-1"
        />
        <Button
          type="submit"
          color="primary"
          isLoading={loading}
        >
          {loading ? "Adding..." : "Add"}
        </Button>
      </form>
    </div>
  );
}
