"use client";

import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { updateProfile } from "@/lib/actions/profile";

export function ProfileForm({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    setLoading(true);

    const result = await updateProfile(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
          Profile updated
        </div>
      )}

      <Input
        type="email"
        label="Email"
        value={email}
        variant="bordered"
        isDisabled
        description="Email cannot be changed"
      />

      <Input
        name="full_name"
        type="text"
        label="Display Name"
        defaultValue={fullName}
        placeholder="Your name"
        variant="bordered"
      />

      <Button
        type="submit"
        color="primary"
        isLoading={loading}
        fullWidth
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
