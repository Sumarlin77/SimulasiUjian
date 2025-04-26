import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="border-[#A7E6FF] shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#A7E6FF]/10 to-transparent border-b border-[#A7E6FF]">
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              <Skeleton className="h-32 w-full rounded-md" />

              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
            <div className="p-6 flex justify-between border-t border-[#A7E6FF]">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-40 rounded-md" />
            </div>
          </Card>
        </div>

        <div>
          <Card className="border-[#A7E6FF] shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#A7E6FF]/10 to-transparent border-b border-[#A7E6FF]">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
