"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input, Button } from "@heroui/react";
import { signIn } from "@/lib/actions/auth";

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordUpdated = searchParams.get("passwordUpdated") === "true";

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-3xl font-bold">Welcome back</h1>
      <p className="mb-8 text-center text-sm text-foreground/60">
        Sign in to your Bunnywise account
      </p>

      <form action={handleSubmit} className="space-y-4">
        {passwordUpdated && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            Your password was updated. Sign in with your new password.
          </div>
        )}

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

        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Your password"
          variant="bordered"
          isRequired
          minLength={6}
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-foreground underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          color="primary"
          isLoading={loading}
          fullWidth
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/60">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-foreground underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
