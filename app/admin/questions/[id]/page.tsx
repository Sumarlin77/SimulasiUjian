"use client"

import { useState, useEffect } from "react"
import React from "react"
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
import { AlertCircle, CheckCircle2, Edit, Loader2, Trash2, ArrowLeft, FileText, BarChart2, History } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define Question interface based on our API
interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  text: string
  type: string
  subject: string
  difficulty: string
  createdAt: string
  updatedAt?: string
  createdBy?: string
  options: Option[]
  explanation?: string
  usedInTests?: Array<{ id: string; title: string; date: string }>
  stats?: {
    timesAnswered: number
    correctAnswers: number
    incorrectAnswers: number
    correctPercentage: number
  }
  tags?: string[]
  history?: Array<{ action: string; date: string; user: string }>
}

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Unwrap params using React.use()
  const { id: questionId } = React.use(params);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/questions/${questionId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Soal tidak ditemukan')
          }
          throw new Error('Gagal memuat data soal')
        }

        const data = await response.json()
        setQuestion(data)
      } catch (err) {
        console.error('Error fetching question:', err)
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestion()
  }, [questionId])

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus soal')
      }

      router.push("/admin/questions")
    } catch (err) {
      console.error('Error deleting question:', err)
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus soal')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Memuat data soal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/admin/questions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Soal
          </Button>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="container py-10">
        <Alert>
          <AlertDescription>Soal tidak ditemukan.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/admin/questions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Soal
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        {/* Header dengan navigasi kembali */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/questions")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Detail Soal</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/questions/${questionId}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Ini akan secara permanen menghapus soal ini dari database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Menghapus..." : "Hapus"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs untuk berbagai informasi */}
        <Tabs defaultValue="detail" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="detail" className="gap-2">
              <FileText className="h-4 w-4" />
              Detail
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-2">
              <BarChart2 className="h-4 w-4" />
              Statistik
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          {/* Tab Detail */}
          <TabsContent value="detail">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Informasi Soal */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Soal</CardTitle>
                  <CardDescription>Informasi lengkap tentang soal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Teks Soal</h3>
                    <div className="p-4 bg-muted rounded-md">{question.text}</div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Opsi Jawaban</h3>
                    <div className="space-y-2">
                      {question.options && question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-center p-3 rounded-md border ${option.isCorrect
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-border"
                            }`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-medium">{option.id.toUpperCase()}.</span>
                            <span>{option.text}</span>
                          </div>
                          {option.isCorrect && (
                            <Badge
                              variant="outline"
                              className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300 border-primary-500"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Jawaban Benar
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {question.explanation && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Penjelasan</h3>
                      <div className="p-4 bg-muted rounded-md">{question.explanation}</div>
                    </div>
                  )}

                  {question.tags && question.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Tag</h3>
                      <div className="flex flex-wrap gap-2">
                        {question.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                  <CardDescription>Informasi tambahan tentang soal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ID:</span>
                      <span className="text-sm font-medium">{question.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tipe:</span>
                      <span className="text-sm font-medium">{question.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mata Pelajaran:</span>
                      <span className="text-sm font-medium">{question.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Kesulitan:</span>
                      <Badge
                        variant="outline"
                        className={
                          question.difficulty === "Mudah"
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            : question.difficulty === "Sedang"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }
                      >
                        {question.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dibuat pada:</span>
                      <span className="text-sm font-medium">{question.createdAt}</span>
                    </div>
                    {question.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Diperbarui pada:</span>
                        <span className="text-sm font-medium">{question.updatedAt}</span>
                      </div>
                    )}
                    {question.createdBy && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Dibuat oleh:</span>
                        <span className="text-sm font-medium">{question.createdBy}</span>
                      </div>
                    )}
                  </div>

                  {question.usedInTests && question.usedInTests.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium mb-2">Digunakan dalam Ujian:</h3>
                        <div className="space-y-2">
                          {question.usedInTests.map((test) => (
                            <div key={test.id} className="text-sm p-2 bg-muted rounded-md">
                              <Link href={`/admin/tests/${test.id}`} className="font-medium hover:underline">
                                {test.title}
                              </Link>
                              <p className="text-xs text-muted-foreground">{test.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Statistik */}
          <TabsContent value="statistics">
            {question.stats ? (
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Soal</CardTitle>
                  <CardDescription>Analisis performa soal berdasarkan jawaban peserta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Total Dijawab</p>
                      <p className="text-3xl font-bold">{question.stats.timesAnswered}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Jawaban Benar</p>
                      <p className="text-3xl font-bold">{question.stats.correctAnswers}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Jawaban Salah</p>
                      <p className="text-3xl font-bold">{question.stats.incorrectAnswers}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Persentase Benar</p>
                      <p className="text-3xl font-bold">{question.stats.correctPercentage}%</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Distribusi Jawaban</h3>
                      <div className="space-y-3">
                        {question.options && question.options.map((option) => {
                          // Hitung persentase untuk setiap opsi
                          const percentage = option.isCorrect && question.stats
                            ? question.stats.correctPercentage
                            : question.stats
                              ? (100 - question.stats.correctPercentage) / (question.options.length - 1)
                              : 0;

                          return (
                            <div key={option.id} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-sm">
                                  Opsi {option.id.toUpperCase()}: {option.text}
                                </span>
                                <span className="text-sm font-medium">{Math.round(percentage)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${option.isCorrect ? "bg-green-500" : "bg-primary/60"
                                    }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Analisis Kesulitan</h3>
                      <div className="p-4 bg-muted rounded-md">
                        <p className="mb-2">
                          Berdasarkan tingkat keberhasilan menjawab, soal ini termasuk dalam kategori:
                        </p>
                        <Badge
                          className={
                            question.stats.correctPercentage > 80
                              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                              : question.stats.correctPercentage > 50
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          }
                        >
                          {question.stats.correctPercentage > 80
                            ? "Mudah"
                            : question.stats.correctPercentage > 50
                              ? "Sedang"
                              : "Sulit"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Belum ada data statistik tersedia untuk soal ini.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Riwayat */}
          <TabsContent value="history">
            {question.history && question.history.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Perubahan</CardTitle>
                  <CardDescription>Catatan perubahan yang dilakukan pada soal ini</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-muted-foreground/20 pl-6 ml-2">
                    {question.history.map((item, index) => (
                      <div key={index} className="mb-8 relative">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[1.65rem] top-1.5"></div>
                        <div className="flex flex-col">
                          <h3 className="text-lg font-semibold">{item.action}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{item.date}</span>
                            <span>•</span>
                            <span>{item.user}</span>
                          </div>
                          <p className="mt-2 text-sm">
                            {item.action === "Dibuat"
                              ? "Soal ini dibuat pertama kali."
                              : item.action === "Diperbarui"
                                ? "Soal ini diperbarui. Perubahan mungkin termasuk teks soal, opsi jawaban, atau metadata."
                                : "Tindakan lain dilakukan pada soal ini."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Belum ada data riwayat perubahan untuk soal ini.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
