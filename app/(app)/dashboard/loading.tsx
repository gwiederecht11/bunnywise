export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded bg-foreground/10" />
        <div className="h-10 w-28 animate-pulse rounded-md bg-foreground/10" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-foreground/10 p-4"
          >
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-foreground/10" />
            <div className="h-8 w-20 animate-pulse rounded bg-foreground/10" />
          </div>
        ))}
      </div>

      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-foreground/10" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-foreground/10 p-4"
          >
            <div className="mb-2 h-5 w-32 animate-pulse rounded bg-foreground/10" />
            <div className="h-4 w-48 animate-pulse rounded bg-foreground/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
