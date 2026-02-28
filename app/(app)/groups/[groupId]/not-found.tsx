import Link from "next/link";

export default function GroupNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="mb-2 text-xl font-bold">Group not found</h2>
      <p className="mb-6 text-sm text-foreground/60">
        This group doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
