"use client";

import { useState } from "react";
import Link from "next/link";
import { Input, Button } from "@heroui/react";
import { signIn } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
