"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, MoreHorizontal, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Test {
  id: string
  title: string
  subject: string
  questions: number
  duration: string
  status: string
  participants: number
  createdAt: string
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTests() {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/tests")
        if (!response.ok) {
          throw new Error("Failed to fetch tests")
        }

        const data = await response.json()
        setTests(data)
      } catch (err) {
        console.error("Error fetching tests:", err)
        setError("Gagal memuat data ujian. Silakan coba lagi nanti.")
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [])

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ujian ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tests?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete test")
      }

      // Remove test from state
      setTests(tests.filter(test => test.id !== id))
    } catch (err) {
      console.error("Error deleting test:", err)
      alert("Gagal menghapus ujian. Silakan coba lagi.")
    }
  }

  const activeTestsCount = tests.filter((test) => test.status === "active").length
  const completedTestsCount = tests.filter((test) => test.status === "completed").length
  const draftTestsCount = tests.filter((test) => test.status === "draft" || test.status === "scheduled").length

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pengelolaan Ujian</h1>
        <Link href="/admin/tests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Ujian
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all-tests" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="all-tests">Semua Ujian</TabsTrigger>
          <TabsTrigger value="requests" asChild>
            <Link href="/admin/tests/requests">Permintaan</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-tests">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Semua Ujian</CardTitle>
              <CardDescription>Kelola ujian Anda dan lihat statusnya</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Memuat data...</span>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Soal</TableHead>
                        <TableHead>Durasi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead className="text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6">
                            Tidak ada data ujian yang ditemukan
                          </TableCell>
                        </TableRow>
                      ) : (
                        tests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell className="font-medium">{test.title}</TableCell>
                            <TableCell>{test.subject}</TableCell>
                            <TableCell>{test.questions}</TableCell>
                            <TableCell>{test.duration}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  test.status === "active"
                                    ? "default"
                                    : test.status === "completed"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {test.status === "active" ? "Aktif" : test.status === "completed" ? "Selesai" : "Draf"}
                              </Badge>
                            </TableCell>
                            <TableCell>{test.participants}</TableCell>
                            <TableCell>{test.createdAt}</TableCell>
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
                                    <Link href={`/admin/tests/${test.id}`} className="w-full">
                                      Lihat
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Link href={`/admin/tests/${test.id}/edit`} className="w-full">
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Link href={`/admin/tests/${test.id}/results`} className="w-full">
                                      Hasil
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteTest(test.id)}>Hapus</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ujian Aktif</CardTitle>
                <CardDescription>Ujian yang sedang berlangsung</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeTestsCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ujian Selesai</CardTitle>
                <CardDescription>Ujian yang telah selesai</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedTestsCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ujian Draf</CardTitle>
                <CardDescription>Ujian dalam mode draf</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{draftTestsCount}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
