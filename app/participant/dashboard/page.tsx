import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { TestStatus } from "@prisma/client"
import { formatDate } from "@/lib/utils"
import { getSession } from "@/lib/auth"

export default async function ParticipantDashboard() {
  const session = await getSession()

  if (!session) {
    return <div>Not authenticated</div>
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { testsAttempted: true }
  })

  // Get upcoming tests
  const now = new Date()
  const upcomingTests = await prisma.test.findMany({
    where: {
      isActive: true,
      startTime: { lte: now },
      endTime: { gte: now },
      // Filter out tests the user has already completed
      NOT: {
        attempts: {
          some: {
            userId: user?.id,
            status: { in: [TestStatus.COMPLETED, TestStatus.PASSED, TestStatus.FAILED] }
          }
        }
      }
    },
    orderBy: { startTime: 'asc' },
    take: 2,
  })

  // Get recent results
  const recentResults = await prisma.testAttempt.findMany({
    where: {
      userId: user?.id,
      status: { in: [TestStatus.COMPLETED, TestStatus.PASSED, TestStatus.FAILED] }
    },
    include: { test: true },
    orderBy: { endTime: 'desc' },
    take: 2,
  })

  // Get statistics
  const allAttempts = await prisma.testAttempt.findMany({
    where: {
      userId: user?.id,
      status: { in: [TestStatus.COMPLETED, TestStatus.PASSED, TestStatus.FAILED] }
    },
    include: { test: true },
  })

  const totalAttempts = allAttempts.length
  const passedAttempts = allAttempts.filter(attempt => attempt.status === TestStatus.PASSED).length
  const averageScore = totalAttempts > 0
    ? Math.round(allAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts)
    : 0
  const highestScore = totalAttempts > 0
    ? Math.max(...allAttempts.map(attempt => attempt.score || 0))
    : 0

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Dasbor Peserta</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ujian Mendatang</CardTitle>
            <CardDescription>Ujian yang dijadwalkan untuk Anda dalam beberapa hari ke depan</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTests.length > 0 ? (
              <div className="space-y-4">
                {upcomingTests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-3">
                    <h3 className="font-medium">{test.title}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>Tanggal: {formatDate(test.startTime)}</p>
                      <p>Waktu: {test.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p>Durasi: {test.duration} menit</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada ujian yang dijadwalkan.</p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/participant/tests" className="w-full">
              <Button variant="outline" className="w-full">
                Lihat Semua Ujian
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hasil Terbaru</CardTitle>
            <CardDescription>Performa Anda dalam ujian terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-3">
                    <h3 className="font-medium">{result.test.title}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>Tanggal: {formatDate(result.endTime || result.startTime)}</p>
                      <p>Skor: {result.score || 0}/{100}</p>
                      <p>
                        Status:{" "}
                        <span className={result.status === TestStatus.PASSED ? "text-green-500" : "text-red-500"}>
                          {result.status === TestStatus.PASSED ? "Lulus" : "Tidak Lulus"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada hasil ujian.</p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/participant/results" className="w-full">
              <Button variant="outline" className="w-full">
                Lihat Semua Hasil
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistik Singkat</CardTitle>
            <CardDescription>Statistik ujian Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Ujian Diambil</p>
                <p className="text-2xl font-bold">{totalAttempts}</p>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Rata-rata Skor</p>
                <p className="text-2xl font-bold">{averageScore}%</p>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Skor Tertinggi</p>
                <p className="text-2xl font-bold">{highestScore}%</p>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Ujian Lulus</p>
                <p className="text-2xl font-bold">{passedAttempts}/{totalAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
