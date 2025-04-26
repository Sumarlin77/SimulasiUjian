import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-48" />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[180px]" />
            </div>
          </div>

          <Skeleton className="h-10 w-full mb-6" />

          <div className="rounded-md border">
            <div className="h-10 border-b px-4 flex items-center">
              <div className="grid grid-cols-6 w-full">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 border-b px-4 flex items-center">
                <div className="grid grid-cols-6 w-full">
                  {[...Array(6)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-20" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
