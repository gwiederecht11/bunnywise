export default function GroupLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 h-8 w-48 animate-pulse rounded bg-foreground/10" />
        <div className="h-4 w-64 animate-pulse rounded bg-foreground/10" />
      </div>

      <div className="mb-6 flex gap-1 border-b border-foreground/10 pb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded bg-foreground/10"
          />
        ))}
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-foreground/10 p-4"
          >
            <div className="mb-2 h-5 w-40 animate-pulse rounded bg-foreground/10" />
            <div className="h-4 w-56 animate-pulse rounded bg-foreground/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
