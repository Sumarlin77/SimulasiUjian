import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart } from "@/components/charts"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { TestStatus } from "@prisma/client"
import { getSession } from "@/lib/auth"

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session) {
    return <div>Not authenticated</div>
  }

  // No need to look up user, we already have role in session
  if (session.role !== 'ADMIN') {
    return <div>Access denied</div>
  }

  // Calculate database statistics
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  const [
    totalUsersCount,
    newUsersLastMonth,
    activeTestsCount,
    completedTestsCount,
    allAttempts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonth
        }
      }
    }),
    prisma.test.count({
      where: {
        isActive: true,
        endTime: { gte: now }
      }
    }),
    prisma.test.count({
      where: {
        endTime: { lt: now }
      }
    }),
    prisma.testAttempt.findMany({
      where: {
        status: { in: [TestStatus.COMPLETED, TestStatus.PASSED, TestStatus.FAILED] }
      },
      include: { test: true }
    })
  ])

  // Calculate average score
  const totalScores = allAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0)
  const averageScore = allAttempts.length > 0 ? Math.round(totalScores / allAttempts.length) : 0

  // Calculate monthly increase percentages
  const lastMonthPercentage = Math.round((newUsersLastMonth / totalUsersCount) * 100)

  // Get recent tests with participation info
  const recentTests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      attempts: {
        where: {
          status: { in: [TestStatus.COMPLETED, TestStatus.PASSED, TestStatus.FAILED] }
        }
      }
    }
  })

  // Format recent tests data
  const formattedRecentTests = recentTests.map(test => {
    const participantsCount = test.attempts.length
    const averageTestScore = participantsCount > 0
      ? Math.round(test.attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / participantsCount)
      : 0

    return {
      id: test.id,
      title: test.title,
      participants: participantsCount,
      averageScore: averageTestScore,
      date: formatDate(test.createdAt)
    }
  })

  const stats = {
    totalUsers: totalUsersCount,
    activeTests: activeTestsCount,
    completedTests: completedTestsCount,
    averageScore: averageScore,
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Dasbor Admin</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+{lastMonthPercentage}% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ujian Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeTests}</div>
            <p className="text-xs text-muted-foreground">Ujian yang sedang berjalan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ujian Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedTests}</div>
            <p className="text-xs text-muted-foreground">Ujian yang telah berakhir</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Nilai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Dari semua ujian</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Ikhtisar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Analitik
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partisipasi Ujian</CardTitle>
              <CardDescription>Jumlah peserta per ujian selama 30 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BarChart />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tren Nilai</CardTitle>
              <CardDescription>Rata-rata nilai ujian selama 6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <LineChart />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ujian Terbaru</CardTitle>
            <CardDescription>Ikhtisar ujian yang baru dibuat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formattedRecentTests.map((test) => (
                <div key={test.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{test.title}</h3>
                    <span className="text-sm text-muted-foreground">{test.date}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div className="flex justify-between mt-2">
                      <span>Peserta: {test.participants}</span>
                      <span>Rata-rata Nilai: {test.averageScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/admin/tests" className="w-full">
              <Button variant="outline" className="w-full">
                Lihat Semua Ujian
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tindakan Cepat</CardTitle>
            <CardDescription>Tugas administratif umum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/tests/new" className="w-full">
              <Button className="w-full">Buat Ujian Baru</Button>
            </Link>
            <Link href="/admin/questions/new" className="w-full">
              <Button variant="outline" className="w-full">
                Tambah Soal Baru
              </Button>
            </Link>
            <Link href="/admin/users" className="w-full">
              <Button variant="outline" className="w-full">
                Kelola Pengguna
              </Button>
            </Link>
            <Link href="/admin/results" className="w-full">
              <Button variant="outline" className="w-full">
                Lihat Hasil Ujian
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
