import { Skeleton, Card, CardBody } from "@/components/ui/heroui";

export default function GroupLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      <div className="mb-6 flex gap-1 border-b border-foreground/10 pb-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="mb-2 h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-56 rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
