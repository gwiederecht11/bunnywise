"use client";

import { Button } from "@heroui/react";

export default function GroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="mb-2 text-xl font-bold">Something went wrong</h2>
      <p className="mb-6 text-sm text-foreground/60">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button color="primary" onPress={reset}>
        Try again
      </Button>
    </div>
  );
}
