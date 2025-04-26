"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, BookOpen, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Test {
  id: string
  title: string
  subject: string
  lastAttempt?: string
  score?: number
  attempts?: number
}

export default function RequestTestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableTests, setAvailableTests] = useState<Test[]>([])
  const [selectedTest, setSelectedTest] = useState("")
  const [requestType, setRequestType] = useState<"APPLICATION" | "RETAKE">("APPLICATION")
  const [reason, setReason] = useState("")

  useEffect(() => {
    const fetchAvailableTests = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/participant/available-tests")

        if (!response.ok) {
          throw new Error("Failed to fetch available tests")
        }

        const data = await response.json()
        setAvailableTests(data.tests)
      } catch (error) {
        console.error("Error fetching tests:", error)
        setError("Gagal memuat daftar ujian. Silakan muat ulang halaman.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableTests()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTest) {
      toast({
        title: "Error",
        description: "Silakan pilih ujian.",
        variant: "destructive",
      })
      return
    }

    if (!reason) {
      toast({
        title: "Error",
        description: "Silakan berikan alasan untuk permintaan ujian Anda.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/participant/test-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: selectedTest,
          type: requestType,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request")
      }

      // Get the selected test details for the success message
      const testDetails = availableTests.find((test) => test.id === selectedTest)

      toast({
        title: "Permintaan Berhasil Dikirim",
        description: `Permintaan ${requestType === "APPLICATION" ? "aplikasi" : "ujian ulang"} untuk ${testDetails?.title} telah berhasil dikirim dan sedang menunggu persetujuan.`,
      })

      // Redirect to the requests page after successful submission
      router.push("/participant/tests/requests")
    } catch (error) {
      console.error("Error submitting test request:", error)
      toast({
        title: "Terjadi Kesalahan",
        description: error instanceof Error ? error.message : "Gagal mengirim permintaan. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get selected test details
  const selectedTestDetails = selectedTest ? availableTests.find((test) => test.id === selectedTest) : null

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild className="border-[#3ABEF9] text-[#050C9C] hover:bg-[#A7E6FF]/20">
          <Link href="/participant/tests/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-[#050C9C]">Permintaan Ujian</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {isLoading ? (
            <Card className="border-[#A7E6FF] shadow-md">
              <CardContent className="flex flex-col items-center justify-center h-80">
                <Loader2 className="h-12 w-12 animate-spin text-[#3572EF]" />
                <p className="mt-4 text-[#050C9C]">Memuat daftar ujian...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-[#A7E6FF] shadow-md">
              <CardContent className="flex flex-col items-center justify-center h-80">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="mt-4 text-red-500">{error}</p>
                <Button
                  className="mt-4 bg-[#3572EF] hover:bg-[#050C9C]"
                  onClick={() => window.location.reload()}
                >
                  Muat Ulang
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              <Card className="border-[#A7E6FF] shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#A7E6FF]/10 to-transparent border-b border-[#A7E6FF]">
                  <CardTitle className="text-[#050C9C]">Formulir Permintaan Ujian</CardTitle>
                  <CardDescription>
                    Ajukan permintaan untuk mengikuti ujian baru atau mengulang ujian yang ingin Anda tingkatkan nilainya
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <Label className="text-[#050C9C] font-medium">Jenis Permintaan</Label>
                    <RadioGroup
                      value={requestType}
                      onValueChange={(value) => setRequestType(value as "APPLICATION" | "RETAKE")}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="application" value="APPLICATION" />
                        <Label htmlFor="application" className="font-normal">Aplikasi Baru (Belum pernah mengikuti ujian ini)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="retake" value="RETAKE" />
                        <Label htmlFor="retake" className="font-normal">Ujian Ulang (Sudah pernah mengikuti ujian ini)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test" className="text-[#050C9C] font-medium flex items-center gap-2">
                      Pilih Ujian
                    </Label>
                    <Select value={selectedTest} onValueChange={setSelectedTest}>
                      <SelectTrigger id="test" className="border-[#A7E6FF] focus:ring-[#3572EF]">
                        {selectedTest ?
                          <span>{availableTests.find(test => test.id === selectedTest)?.title || "Pilih ujian"}</span> :
                          <span>Pilih ujian</span>
                        }
                      </SelectTrigger>
                      <SelectContent>
                        {availableTests.length === 0 ? (
                          <SelectItem value="none" disabled>Tidak ada ujian tersedia</SelectItem>
                        ) : (
                          availableTests.map((test) => (
                            <SelectItem key={test.id} value={test.id}>
                              {test.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTestDetails && selectedTestDetails.lastAttempt && requestType === "RETAKE" && (
                    <div className="bg-[#A7E6FF]/20 p-5 rounded-md space-y-3 border border-[#3ABEF9]/30">
                      <h3 className="text-sm font-medium text-[#050C9C] flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[#3572EF]" />
                        Detail Ujian Terakhir
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-[#3572EF]">Mata Pelajaran:</span>
                          <div className="text-sm font-medium">{selectedTestDetails.subject}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-[#3572EF]">Tanggal Ujian Terakhir:</span>
                          <div className="text-sm font-medium">{selectedTestDetails.lastAttempt}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-[#3572EF]">Nilai Terakhir:</span>
                          <div className="text-sm font-medium text-red-500">{selectedTestDetails.score}/100</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-[#3572EF]">Jumlah Upaya:</span>
                          <div className="text-sm font-medium">{selectedTestDetails.attempts}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-[#050C9C] font-medium">
                      Alasan Permintaan
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder={requestType === "APPLICATION"
                        ? "Jelaskan alasan Anda ingin mengikuti ujian ini..."
                        : "Jelaskan alasan Anda ingin mengulang ujian ini..."
                      }
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={5}
                      required
                      className="border-[#A7E6FF] focus:ring-[#3572EF] resize-none"
                    />
                    <p className="text-xs text-[#3572EF]/80">
                      {requestType === "APPLICATION"
                        ? "Berikan alasan yang jelas mengapa Anda ingin mengikuti ujian ini."
                        : "Berikan alasan yang jelas mengapa Anda ingin mengulang ujian ini dan bagaimana Anda akan mempersiapkan diri lebih baik untuk meningkatkan nilai Anda."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-[#A7E6FF] py-4">
                  <Button
                    variant="outline"
                    type="button"
                    asChild
                    className="border-[#3ABEF9] text-[#050C9C] hover:bg-[#A7E6FF]/20"
                  >
                    <Link href="/participant/tests/requests">Batal</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-[#3572EF] hover:bg-[#050C9C] text-white">
                    {isSubmitting ? "Mengirim..." : "Kirim Permintaan"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          )}
        </div>

        <div>
          <Card className="border-[#A7E6FF] shadow-md sticky top-20">
            <CardHeader className="bg-gradient-to-r from-[#A7E6FF]/10 to-transparent border-b border-[#A7E6FF]">
              <CardTitle className="text-[#050C9C]">Informasi Permintaan Ujian</CardTitle>
              <CardDescription>Panduan dan kebijakan untuk permintaan ujian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-[#050C9C]">Proses Permintaan</h3>
                <ol className="text-sm text-[#3572EF]/80 space-y-2 list-decimal list-inside">
                  <li>Pilih jenis permintaan (aplikasi baru atau ujian ulang)</li>
                  <li>Pilih ujian yang ingin Anda ikuti</li>
                  <li>Berikan alasan yang jelas untuk permintaan Anda</li>
                  <li>Kirim permintaan untuk ditinjau oleh administrator</li>
                  <li>Tunggu notifikasi persetujuan</li>
                  <li>Jika disetujui, ujian akan tersedia di halaman Ujian Anda</li>
                </ol>
              </div>

              <div className="p-4 bg-[#A7E6FF]/20 rounded-md border border-[#3ABEF9]/30">
                <h3 className="text-sm font-medium mb-2 text-[#050C9C]">Kebijakan Ujian Ulang</h3>
                <ul className="text-sm text-[#3572EF]/80 space-y-2 list-disc list-inside">
                  <li>Setiap peserta dapat mengajukan maksimal 3 kali ujian ulang per mata pelajaran</li>
                  <li>Jarak antar ujian ulang minimal 7 hari</li>
                  <li>Nilai ujian ulang akan menggantikan nilai sebelumnya</li>
                  <li>Permintaan dapat ditolak jika alasan tidak memadai</li>
                </ul>
              </div>

              <div className="p-4 bg-[#A7E6FF]/20 rounded-md border border-[#3ABEF9]/30">
                <h3 className="text-sm font-medium mb-2 text-[#050C9C]">Tips Menulis Alasan</h3>
                <ul className="text-sm text-[#3572EF]/80 space-y-2 list-disc list-inside">
                  <li>Jelaskan secara spesifik mengapa Anda ingin mengikuti ujian ini</li>
                  <li>Untuk ujian ulang, jelaskan kesulitan yang Anda alami sebelumnya</li>
                  <li>Sebutkan langkah-langkah persiapan yang akan Anda lakukan</li>
                  <li>Tunjukkan komitmen Anda untuk meningkatkan nilai</li>
                  <li>Hindari alasan yang tidak relevan dengan akademik</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
