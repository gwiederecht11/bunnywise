"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { updatePassword } from "@/lib/actions/auth";

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await updatePassword(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-3xl font-bold">
        Choose a new password
      </h1>
      <p className="mb-8 text-center text-sm text-foreground/60">
        Enter a new password for your Bunnywise account.
      </p>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          name="password"
          type="password"
          label="New password"
          placeholder="At least 6 characters"
          variant="bordered"
          isRequired
          minLength={6}
        />

        <Input
          name="passwordConfirmation"
          type="password"
          label="Confirm new password"
          placeholder="Enter your password again"
          variant="bordered"
          isRequired
          minLength={6}
        />

        <Button
          type="submit"
          color="primary"
          isLoading={loading}
          fullWidth
        >
          {loading ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
