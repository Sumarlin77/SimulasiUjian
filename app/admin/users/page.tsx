import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, UserSearch } from "lucide-react";
import { UserSearch as UserSearchComponent } from "@/components/user-search";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Loading component for Suspense
function UserSearchLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daftar Pengguna</h2>
      </div>
      <div className="h-12 w-full animate-pulse rounded-md bg-muted"></div>
      <div className="space-y-2">
        <div className="h-8 w-full animate-pulse rounded-md bg-muted"></div>
        <div className="h-64 w-full animate-pulse rounded-md bg-muted"></div>
      </div>
    </div>
  );
}

// Stats component
async function UserStats() {
  // Get total participants count
  const totalParticipants = await prisma.user.count({
    where: { role: UserRole.PARTICIPANT }
  });

  // Get participants who have taken tests
  const participantsWithTests = await prisma.user.count({
    where: {
      role: UserRole.PARTICIPANT,
      testsAttempted: { some: {} }
    }
  });

  // Participants who haven't taken tests
  const participantsWithoutTests = totalParticipants - participantsWithTests;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Total Peserta</CardTitle>
          <CardDescription>Jumlah peserta terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-primary mr-4" />
            <div className="text-3xl font-bold">{totalParticipants}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistik Peserta</CardTitle>
          <CardDescription>Berdasarkan aktivitas ujian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sudah mengikuti ujian</p>
              <p className="text-xl font-bold">{participantsWithTests}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Belum mengikuti ujian</p>
              <p className="text-xl font-bold">{participantsWithoutTests}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="container py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pengelolaan Peserta</h1>
      </div>

      <div className="space-y-8">
        {/* User Search Component with Suspense */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <Suspense fallback={<UserSearchLoading />}>
              <UserSearchComponent
                defaultRole={UserRole.PARTICIPANT}
                showNewButton={true}
                newUserUrl="/admin/users/new"
                showFilters={true}
                pageSize={10}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* User Stats */}
        <Suspense fallback={
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-32 w-full animate-pulse rounded-md bg-muted"></div>
            <div className="h-32 w-full animate-pulse rounded-md bg-muted"></div>
          </div>
        }>
          <UserStats />
        </Suspense>
      </div>
    </div>
  );
}
