"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ParticipantResults() {
  const [results, setResults] = useState<any[]>([])
  const [metrics, setMetrics] = useState({
    totalAttempts: 0,
    averageScore: 0,
    highestScore: 0,
    passRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/participant/results")

      if (!response.ok) {
        throw new Error("Failed to fetch test results")
      }

      const data = await response.json()
      setResults(data.results)
      setMetrics(data.metrics)
      setError(null)
    } catch (err) {
      console.error("Error fetching test results:", err)
      setError("Failed to load test results. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load test results. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat hasil ujian...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button onClick={fetchResults} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Hasil Ujian</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ringkasan Performa</CardTitle>
          <CardDescription>Performa ujian Anda secara keseluruhan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Ujian Diambil</p>
              <p className="text-3xl font-bold">{metrics.totalAttempts}</p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
              <p className="text-3xl font-bold">{metrics.averageScore}%</p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Nilai Tertinggi</p>
              <p className="text-3xl font-bold">{metrics.highestScore}%</p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Tingkat Kelulusan</p>
              <p className="text-3xl font-bold">{metrics.passRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Ujian</CardTitle>
          <CardDescription>Hasil detail dari semua ujian yang telah Anda ikuti</CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Anda belum memiliki hasil ujian.</p>
              <Link href="/participant/tests">
                <Button className="mt-4">Cari Ujian</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ujian</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.title}</TableCell>
                    <TableCell>{result.subject}</TableCell>
                    <TableCell>{result.date}</TableCell>
                    <TableCell>
                      {result.score}/{result.totalScore}
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.status === "Lulus" ? "default" : "destructive"}>{result.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/participant/results/${result.id}`}>
                        <Button variant="outline" size="sm">
                          Lihat Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
