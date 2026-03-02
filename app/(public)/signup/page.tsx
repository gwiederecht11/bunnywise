"use client";

import { useState } from "react";
import Link from "next/link";
import { Input, Button } from "@heroui/react";
import { signUp } from "@/lib/actions/auth";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setEmailSent(true);
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold">Check your email</h1>
        <p className="mb-6 text-sm text-foreground/60">
          We sent you a confirmation link. Click it to verify your email and sign in.
        </p>
        <Link href="/login" className="text-sm font-medium underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-3xl font-bold">Create an account</h1>
      <p className="mb-8 text-center text-sm text-foreground/60">
        Start splitting expenses with Bunnywise
      </p>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          name="fullName"
          type="text"
          label="Full name"
          placeholder="Jane Doe"
          variant="bordered"
          isRequired
        />

        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          variant="bordered"
          isRequired
        />

        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="At least 6 characters"
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
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
