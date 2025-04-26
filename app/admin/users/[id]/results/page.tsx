"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  Calendar,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Printer,
  Search,
  User,
  Loader2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define interfaces for type safety
interface UserData {
  id: string
  name: string
  email: string
  role: string
  joinedAt: string
  lastActive: string
  avatar?: string
  universityName?: string
  major?: string
}

interface TestResult {
  id: string
  testId: string
  testTitle: string
  subject: string
  date: string
  score: number
  totalScore: number
  status: string
  duration: string
  timeSpent: string
  correctAnswers: number
  totalQuestions: number
}

export default function UserResultsPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  // Correctly unwrap params with React.use() as recommended by Next.js 15+
  const unwrappedParams = params instanceof Promise ? use(params) : params
  const userId = unwrappedParams.id

  // State for user and results data
  const [user, setUser] = useState<UserData | null>(null)
  const [results, setResults] = useState<TestResult[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user data and test results
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch user data
        const userResponse = await fetch(`/api/admin/users/${userId}`)
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data')
        }
        const userData = await userResponse.json()

        // Format user data
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          joinedAt: userData.joinDate,
          lastActive: userData.lastActive,
          avatar: userData.image,
          universityName: userData.universityName,
          major: userData.major
        })

        // Fetch test results
        const resultsResponse = await fetch(`/api/admin/users/${userId}/results`)
        if (!resultsResponse.ok) {
          throw new Error('Failed to fetch test results')
        }
        const resultsData = await resultsResponse.json()
        setResults(resultsData as TestResult[])

        // Extract unique subjects
        const uniqueSubjects = [...new Set(
          (resultsData as TestResult[]).map(result => result.subject)
            .filter((subject: string | undefined): subject is string => Boolean(subject))
        )].sort()

        setSubjects(uniqueSubjects)

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // Filter results based on search and filters
  const filteredResults = results.filter((result) => {
    const matchesSearch = result.testTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || result.subject === subjectFilter
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "recent" &&
        new Date(result.date.split("-").reverse().join("-")) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === "older" &&
        new Date(result.date.split("-").reverse().join("-")) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

    return matchesSearch && matchesSubject && matchesDate
  })

  // Calculate statistics
  const totalTests = results.length
  const averageScore = totalTests > 0
    ? Math.round(results.reduce((acc, result) => acc + (result.score / result.totalScore) * 100, 0) / totalTests)
    : 0
  const highestScore = results.length > 0
    ? Math.max(...results.map((result) => (result.score / result.totalScore) * 100))
    : 0
  const passRate = totalTests > 0
    ? Math.round((results.filter((result) => result.status === "Lulus").length / totalTests) * 100)
    : 0
  const averageAccuracy = totalTests > 0
    ? Math.round(results.reduce((acc, result) => acc + (result.correctAnswers / result.totalQuestions) * 100, 0) / totalTests)
    : 0

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Memuat data hasil ujian...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <div className="container py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "User tidak ditemukan"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/admin/users")}>
          Kembali ke Daftar Pengguna
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
      {/* Header dengan navigasi kembali */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Hasil Ujian Peserta</h1>
        </div>
        <Button variant="outline" onClick={() => router.push(`/admin/users/${unwrappedParams.id}`)}>
          Kembali ke Profil
        </Button>
      </div>

      {/* Informasi Pengguna */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline">{user.role === "admin" ? "Administrator" : "Peserta"}</Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Bergabung: {user.joinedAt}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display message when no results are available */}
      {results.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Belum Ada Hasil Ujian</h3>
            <p className="text-muted-foreground">
              Peserta ini belum mengambil ujian apapun.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Tabs untuk Hasil dan Statistik */
        <Tabs defaultValue="results" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="results" className="gap-2">
              <FileText className="h-4 w-4" />
              Hasil Ujian
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-2">
              <BarChart2 className="h-4 w-4" />
              Statistik Performa
            </TabsTrigger>
          </TabsList>

          {/* Tab Hasil Ujian */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Semua Hasil Ujian</CardTitle>
                <CardDescription>Riwayat ujian yang telah diambil oleh {user.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filter dan Pencarian */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="Cari ujian..."
                      className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Mata Pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tanggal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Waktu</SelectItem>
                      <SelectItem value="recent">30 Hari Terakhir</SelectItem>
                      <SelectItem value="older">Lebih dari 30 Hari</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabel Hasil */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ujian</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Nilai</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Akurasi</TableHead>
                        <TableHead className="text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.length > 0 ? (
                        filteredResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.testTitle}</TableCell>
                            <TableCell>{result.subject}</TableCell>
                            <TableCell>{result.date}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>
                                  {result.score}/{result.totalScore}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({Math.round((result.score / result.totalScore) * 100)}%)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={result.status === "Lulus" ? "default" : "destructive"}>
                                {result.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>
                                  {result.correctAnswers}/{result.totalQuestions}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({Math.round((result.correctAnswers / result.totalQuestions) * 100)}%)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Buka menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/results/${result.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      <span>Lihat Detail</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/tests/${result.testId}`}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      <span>Lihat Ujian</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Printer className="mr-2 h-4 w-4" />
                                    <span>Cetak Hasil</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Tidak ada hasil yang ditemukan.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Statistik */}
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kartu Statistik */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Performa</CardTitle>
                  <CardDescription>Statistik performa ujian {user.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Ujian</p>
                      <p className="text-2xl font-bold">{totalTests}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
                      <p className="text-2xl font-bold">{averageScore}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Nilai Tertinggi</p>
                      <p className="text-2xl font-bold">{highestScore}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Tingkat Kelulusan</p>
                      <p className="text-2xl font-bold">{passRate}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Rata-rata Akurasi</p>
                      <p className="text-2xl font-bold">{averageAccuracy}%</p>
                    </div>
                    {results.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Ujian Terakhir</p>
                        <p className="text-2xl font-bold">{results[0].date}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Performa Keseluruhan</span>
                        <span>{averageScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${averageScore >= 80 ? "bg-green-500" : averageScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                          style={{ width: `${averageScore}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tingkat Kelulusan</span>
                        <span>{passRate}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passRate >= 80 ? "bg-green-500" : passRate >= 60 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                          style={{ width: `${passRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Akurasi Jawaban</span>
                        <span>{averageAccuracy}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${averageAccuracy >= 80
                            ? "bg-green-500"
                            : averageAccuracy >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                            }`}
                          style={{ width: `${averageAccuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kartu Performa per Mata Pelajaran */}
              {subjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performa per Mata Pelajaran</CardTitle>
                    <CardDescription>Nilai rata-rata berdasarkan mata pelajaran</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {subjects.map((subject) => {
                        const subjectResults = results.filter((result) => result.subject === subject)
                        const subjectAverage = Math.round(
                          subjectResults.reduce((acc, result) => acc + (result.score / result.totalScore) * 100, 0) /
                          subjectResults.length,
                        )

                        return (
                          <div key={subject} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{subject}</span>
                              <span>{subjectAverage}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${subjectAverage >= 80
                                  ? "bg-green-500"
                                  : subjectAverage >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                  }`}
                                style={{ width: `${subjectAverage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Ujian: {subjectResults.length}</span>
                              <span>
                                Lulus: {subjectResults.filter((r) => r.status === "Lulus").length}/{subjectResults.length}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Kartu Tren Nilai */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Tren Nilai</CardTitle>
                  <CardDescription>Perkembangan nilai ujian dari waktu ke waktu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart2 className="h-16 w-16 mx-auto mb-4 text-muted" />
                      <p>Grafik tren nilai akan ditampilkan di sini.</p>
                      <p className="text-sm">Dalam implementasi nyata, ini akan menampilkan grafik interaktif.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Tombol Aksi */}
      {results.length > 0 && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Cetak Laporan
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Ekspor Data
          </Button>
        </div>
      )}
    </div>
  )
}
