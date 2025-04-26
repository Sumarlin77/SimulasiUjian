"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ArrowLeft, Clock, Calendar, BookOpen, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ResultDetailPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // TODO: In a future version of Next.js, params will be a Promise and we'll need to use React.use() to unwrap it
  // For now, direct access to properties is still supported during migration
  const resultId = params.id

  useEffect(() => {
    fetchResultDetails()
  }, [])

  const fetchResultDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/participant/results/${resultId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch test result")
      }

      const data = await response.json()
      setResult(data)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching test result:", err)
      setError(err.message || "Failed to load test result. Please try again.")
      toast({
        title: "Error",
        description: err.message || "Failed to load test result. Please try again.",
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
          <Button onClick={fetchResultDetails} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  if (!result) return null

  const { correctAnswers, incorrectAnswers } = result
  const scorePercentage = (result.score / result.totalScore) * 100

  return (
    <div className="container py-10">
      {/* Header dengan navigasi kembali */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/participant/results">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-[#050C9C]">Hasil {result.title}</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/participant/results">Kembali ke Hasil</Link>
        </Button>
      </div>

      {/* Ringkasan Hasil */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Kartu Nilai */}
        <Card className="overflow-hidden border-t-4 border-t-[#3572EF] shadow-md">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(to right, 
                ${scorePercentage >= 70 ? "#3572EF" : "#ef4444"} ${scorePercentage}%, 
                #e5e7eb ${scorePercentage}%)`,
            }}
          />
          <CardHeader className="bg-gradient-to-br from-white to-[#A7E6FF]/10">
            <CardTitle className="text-[#050C9C]">Nilai</CardTitle>
            <CardDescription>Performa Anda pada ujian ini</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-4 text-[#3572EF]">
                {result.score}
                <span className="text-3xl text-gray-400">/{result.totalScore}</span>
              </div>
              <Badge
                variant={result.status === "Lulus" ? "default" : "destructive"}
                className="text-sm px-4 py-1 rounded-full"
                style={{
                  backgroundColor: result.status === "Lulus" ? "#3ABEF9" : "#ef4444",
                  color: "white",
                }}
              >
                {result.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Kartu Detail Ujian */}
        <Card className="shadow-md border-t-4 border-t-[#3ABEF9]">
          <CardHeader className="bg-gradient-to-br from-white to-[#A7E6FF]/10">
            <CardTitle className="text-[#050C9C]">Detail Ujian</CardTitle>
            <CardDescription>Informasi tentang ujian</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#A7E6FF]/30 p-2 rounded-full">
                  <BookOpen className="h-5 w-5 text-[#3572EF]" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Mata Pelajaran</span>
                  <p className="font-medium">{result.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#A7E6FF]/30 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-[#3572EF]" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tanggal</span>
                  <p className="font-medium">{result.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#A7E6FF]/30 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-[#3572EF]" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Durasi</span>
                  <p className="font-medium">{result.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#A7E6FF]/30 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-[#3572EF]" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Waktu Digunakan</span>
                  <p className="font-medium">{result.timeSpent}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kartu Ringkasan Jawaban */}
        <Card className="shadow-md border-t-4 border-t-[#050C9C]">
          <CardHeader className="bg-gradient-to-br from-white to-[#A7E6FF]/10">
            <CardTitle className="text-[#050C9C]">Ringkasan Jawaban</CardTitle>
            <CardDescription>Rincian jawaban Anda</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3" />
                  <span className="font-medium">Benar</span>
                </div>
                <span className="text-xl font-bold text-green-600">{correctAnswers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-6 w-6 text-red-500 mr-3" />
                  <span className="font-medium">Salah</span>
                </div>
                <span className="text-xl font-bold text-red-600">{incorrectAnswers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#A7E6FF]/20 rounded-lg">
                <span className="font-medium">Akurasi</span>
                <span className="text-xl font-bold text-[#3572EF]">
                  {result.accuracy || Math.round((correctAnswers / result.questions.length) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tombol Aksi */}
      <div className="flex justify-end gap-4 mt-10">
        <Button variant="outline" className="border-[#3ABEF9] text-[#3572EF] hover:bg-[#A7E6FF]/20">
          Unduh Hasil
        </Button>
        <Button className="bg-[#3572EF] hover:bg-[#050C9C]" asChild>
          <Link href="/participant/dashboard">Kembali ke Dasbor</Link>
        </Button>
      </div>
    </div>
  )
}
