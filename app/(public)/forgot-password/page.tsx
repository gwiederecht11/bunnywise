"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "@heroui/react";
import { requestPasswordReset } from "@/lib/actions/auth";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const invalidLinkError =
    searchParams.get("error") === "invalid-link"
      ? "That reset link is invalid or has expired. Request a new one."
      : null;
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const error = submissionError ?? invalidLinkError;

  async function handleSubmit(formData: FormData) {
    setSubmissionError(null);
    setLoading(true);
    const result = await requestPasswordReset(formData);

    if (result.error) {
      setSubmissionError(result.error);
      setLoading(false);
      return;
    }

    setEmailSent(true);
    setLoading(false);
  }

  if (emailSent) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold">Check your email</h1>
        <p className="mb-6 text-sm text-foreground/60">
          If an account exists for that email, we sent a password reset link.
        </p>
        <Link href="/login" className="text-sm font-medium underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-3xl font-bold">
        Reset your password
      </h1>
      <p className="mb-8 text-center text-sm text-foreground/60">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          variant="bordered"
          isRequired
        />

        <Button
          type="submit"
          color="primary"
          isLoading={loading}
          fullWidth
        >
          {loading ? "Sending link..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/60">
        <Link href="/login" className="font-medium text-foreground underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
