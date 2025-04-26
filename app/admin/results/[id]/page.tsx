"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Printer,
  User,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ResultData {
  id: string
  testId: string
  testTitle: string
  subject: string
  date: string
  startTime: string
  endTime: string
  duration: string
  timeSpent: string
  score: number
  totalScore: number
  status: string
  passingScore: number
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  questions: {
    id: string
    text: string
    options: { id: string; text: string }[]
    correctAnswer: string
    userAnswer: string
    isCorrect: boolean
    explanation: string
  }[]
  stats: {
    totalQuestions: number
    answeredQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    skippedQuestions: number
    timePerQuestion: string
  }
}

export default function ResultDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // TODO: In a future version of Next.js, params will be a Promise and we'll need to use React.use() to unwrap it
  // For now, direct access to properties is still supported during migration
  const resultId = params.id

  useEffect(() => {
    async function fetchResultData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/results/${resultId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Hasil ujian tidak ditemukan")
          }
          throw new Error("Gagal memuat data hasil ujian")
        }

        const data = await response.json()
        setResult(data)
      } catch (err) {
        console.error("Error fetching result:", err)
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data")
      } finally {
        setLoading(false)
      }
    }

    fetchResultData()
  }, [resultId])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/results/${resultId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus hasil ujian")
      }

      router.push("/admin/results")
    } catch (err) {
      console.error("Error deleting result:", err)
      alert("Gagal menghapus hasil ujian. Silakan coba lagi.")
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Memuat data hasil ujian...</p>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="container py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Tidak dapat memuat data hasil ujian"}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/admin/results")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Hasil
        </Button>
      </div>
    )
  }

  const correctAnswers = result.questions.filter((q) => q.isCorrect).length
  const incorrectAnswers = result.questions.filter((q) => !q.isCorrect).length
  const scorePercentage = (result.score / result.totalScore) * 100
  const passingPercentage = (result.passingScore / result.totalScore) * 100

  return (
    <div className="container py-10">
      {/* Header dengan navigasi kembali */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/results")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Detail Hasil Ujian</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/admin/tests/${result.testId}`}>
              <FileText className="h-4 w-4" />
              Lihat Ujian
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/admin/users/${result.user.id}`}>
              <User className="h-4 w-4" />
              Lihat Peserta
            </Link>
          </Button>
        </div>
      </div>

      {/* Ringkasan Hasil */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Kartu Nilai */}
        <Card className="overflow-hidden">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(to right, 
                ${scorePercentage >= passingPercentage ? "#3572EF" : "#ef4444"} ${scorePercentage}%, 
                #e5e7eb ${scorePercentage}%)`,
            }}
          />
          <CardHeader>
            <CardTitle>Nilai</CardTitle>
            <CardDescription>Performa pada ujian ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">
                {result.score}/{result.totalScore}
              </div>
              <Badge variant={result.status === "Lulus" ? "default" : "destructive"} className="text-sm px-3 py-1">
                {result.status}
              </Badge>
              <div className="mt-4 text-sm text-muted-foreground">
                Nilai minimum untuk lulus: {result.passingScore} ({passingPercentage}%)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kartu Informasi Peserta */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Peserta</CardTitle>
            <CardDescription>Detail peserta ujian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">{result.user.name}</h3>
                <p className="text-sm text-muted-foreground">{result.user.email}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ID Peserta:</span>
                <span className="text-sm font-medium">{result.user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Peran:</span>
                <span className="text-sm font-medium">
                  {result.user.role === "participant" ? "Peserta" : "Administrator"}
                </span>
              </div>
              <Link href={`/admin/users/${result.user.id}/results`} className="text-sm text-primary hover:underline">
                Lihat semua hasil peserta ini
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Kartu Detail Ujian */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Ujian</CardTitle>
            <CardDescription>Informasi tentang ujian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ujian:</span>
                <span className="text-sm font-medium">{result.testTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tanggal:</span>
                <span className="text-sm font-medium">{result.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Waktu:</span>
                <span className="text-sm font-medium">
                  {result.startTime} - {result.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Durasi:</span>
                <span className="text-sm font-medium">{result.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Waktu Digunakan:</span>
                <span className="text-sm font-medium">{result.timeSpent}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs untuk Jawaban dan Statistik */}
      <Tabs defaultValue="answers" className="mb-8">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="answers" className="gap-2">
            <FileText className="h-4 w-4" />
            Jawaban
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Statistik
          </TabsTrigger>
        </TabsList>

        {/* Tab Jawaban */}
        <TabsContent value="answers">
          <Card>
            <CardHeader>
              <CardTitle>Jawaban Peserta</CardTitle>
              <CardDescription>Tinjauan jawaban yang diberikan oleh peserta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {result.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg overflow-hidden">
                    <div
                      className={`p-3 ${question.isCorrect ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-1 flex-shrink-0 ${question.isCorrect ? "text-green-500" : "text-red-500"}`}>
                          {question.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">
                            Soal {index + 1}: {question.text}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`p-3 rounded-md border ${option.id === question.correctAnswer
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : option.id === question.userAnswer && !question.isCorrect
                                ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                                : "border-border"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.id.toUpperCase()}.</span>
                              <span>{option.text}</span>
                              {option.id === question.correctAnswer && (
                                <Badge
                                  variant="outline"
                                  className="ml-auto bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300 border-primary-500"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Benar
                                </Badge>
                              )}
                              {option.id === question.userAnswer && option.id !== question.correctAnswer && (
                                <Badge
                                  variant="outline"
                                  className="ml-auto bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-500"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Jawaban Peserta
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-2">Penjelasan:</h4>
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Statistik */}
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Statistik Hasil</CardTitle>
              <CardDescription>Analisis performa pada ujian ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Total Soal</p>
                  <p className="text-3xl font-bold">{result.stats.totalQuestions}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Jawaban Benar</p>
                  <p className="text-3xl font-bold">{result.stats.correctAnswers}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Jawaban Salah</p>
                  <p className="text-3xl font-bold">{result.stats.incorrectAnswers}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Akurasi</span>
                    <span>
                      {Math.round((result.stats.correctAnswers / result.stats.totalQuestions) * 100)}% (
                      {result.stats.correctAnswers}/{result.stats.totalQuestions})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${Math.round((result.stats.correctAnswers / result.stats.totalQuestions) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nilai vs Nilai Minimum</span>
                    <span>
                      {scorePercentage}% vs {passingPercentage}%
                    </span>
                  </div>
                  <div className="h-4 w-full bg-muted rounded-full overflow-hidden relative">
                    <div
                      className={`h-full ${scorePercentage >= passingPercentage ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${scorePercentage}%` }}
                    ></div>
                    <div
                      className="absolute top-0 h-full w-1 bg-yellow-500"
                      style={{ left: `${passingPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>Nilai Minimum: {passingPercentage}%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Waktu Pengerjaan</h3>
                    <div className="flex justify-between text-sm">
                      <span>Durasi Ujian:</span>
                      <span>{result.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Waktu Digunakan:</span>
                      <span>{result.timeSpent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rata-rata per Soal:</span>
                      <span>{result.stats.timePerQuestion}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Distribusi Jawaban</h3>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-green-500 rounded-sm"></div>
                      <span className="text-sm">Benar: {result.stats.correctAnswers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-red-500 rounded-sm"></div>
                      <span className="text-sm">Salah: {result.stats.incorrectAnswers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-300 rounded-sm"></div>
                      <span className="text-sm">Dilewati: {result.stats.skippedQuestions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tombol Aksi */}
      <div className="flex justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus Hasil"
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Ini akan secara permanen menghapus hasil ujian ini dari database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Cetak
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Ekspor PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
