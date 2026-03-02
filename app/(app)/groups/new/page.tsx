"use client";

import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { createGroup } from "@/lib/actions/groups";

export default function NewGroupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await createGroup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Create a Group</h1>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          name="name"
          type="text"
          label="Group name"
          placeholder="e.g. Apartment, Trip to Italy"
          variant="bordered"
          isRequired
        />

        <Input
          name="description"
          type="text"
          label="Description (optional)"
          placeholder="What's this group for?"
          variant="bordered"
        />

        <Button
          type="submit"
          color="primary"
          isLoading={loading}
          fullWidth
        >
          {loading ? "Creating..." : "Create Group"}
        </Button>
      </form>
    </div>
  );
}
