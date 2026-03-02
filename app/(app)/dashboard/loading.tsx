import { Skeleton, Card, CardBody } from "@/components/ui/heroui";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="mb-2 h-4 w-24 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>

      <Skeleton className="mb-4 h-6 w-32 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="mb-2 h-5 w-32 rounded-lg" />
              <Skeleton className="h-4 w-48 rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
