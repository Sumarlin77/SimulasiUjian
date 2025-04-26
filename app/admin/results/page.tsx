"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Download } from "lucide-react"
import { format } from "date-fns"

interface TestAttempt {
  id: string
  testId: string
  test: {
    id: string
    title: string
  }
  userId: string
  user: {
    id: string
    name: string
  }
  score: number
  totalScore: number
  status: string
  completedAt: string
}

interface Test {
  id: string
  title: string
}

interface ResultItem {
  id: string
  testId: string
  testTitle: string
  participant: string
  participantId: string
  score: number
  totalScore: number
  status: string
  completedAt: string
}

export default function ResultsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [testFilter, setTestFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<ResultItem[]>([])
  const [tests, setTests] = useState<Test[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch test attempts (results)
        const attemptsRes = await fetch('/api/test-attempts?status=COMPLETED&status=PASSED&status=FAILED')
        const attemptsData = await attemptsRes.json()

        // Fetch tests
        const testsRes = await fetch('/api/tests')
        const testsData = await testsRes.json()

        setResults(attemptsData.testAttempts.map((attempt: TestAttempt) => ({
          id: attempt.id,
          testId: attempt.testId,
          testTitle: attempt.test.title,
          participant: attempt.user.name,
          participantId: attempt.userId,
          score: attempt.score || 0,
          totalScore: attempt.totalScore || 100,
          status: attempt.status === "PASSED" ? "Lulus" : "Gagal",
          completedAt: attempt.completedAt ? format(new Date(attempt.completedAt), 'dd-MM-yyyy') : "",
        })))

        setTests(testsData.tests)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Gagal memuat hasil ujian')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.participant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.testTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTest = testFilter === "all" || result.testId === testFilter
    return matchesSearch && matchesTest
  })

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Hasil Ujian</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Ekspor Hasil
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Semua Hasil</CardTitle>
          <CardDescription>Lihat dan analisis hasil ujian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan peserta atau ujian..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={testFilter} onValueChange={setTestFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Ujian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Ujian</SelectItem>
                {tests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ujian</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Selesai</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Memuat data...</TableCell>
                  </TableRow>
                ) : filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Tidak ada hasil yang ditemukan</TableCell>
                  </TableRow>
                ) : (
                  filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.testTitle}</TableCell>
                      <TableCell>{result.participant}</TableCell>
                      <TableCell>
                        {result.score}/{result.totalScore}
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.status === "Lulus" ? "default" : "destructive"}>{result.status}</Badge>
                      </TableCell>
                      <TableCell>{result.completedAt}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Link href={`/admin/results/${result.id}`} className="w-full">
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/admin/users/${result.participantId}`} className="w-full">
                                Lihat Peserta
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/admin/tests/${result.testId}`} className="w-full">
                                Lihat Ujian
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Hasil</CardTitle>
            <CardDescription>Semua pengiriman ujian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{results.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rata-rata Nilai</CardTitle>
            <CardDescription>Dari semua ujian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {results.length > 0
                ? Math.round(
                  results.reduce((acc, result) => acc + (result.score / result.totalScore) * 100, 0) / results.length
                )
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tingkat Kelulusan</CardTitle>
            <CardDescription>Persentase ujian yang lulus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {results.length > 0
                ? Math.round((results.filter((result) => result.status === "Lulus").length / results.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peserta Unik</CardTitle>
            <CardDescription>Jumlah peserta ujian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {results.length > 0 ? new Set(results.map((result) => result.participantId)).size : 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
