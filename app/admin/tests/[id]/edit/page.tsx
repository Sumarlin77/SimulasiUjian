"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/date-picker"
import { TimePicker } from "@/components/time-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
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
import { AlertCircle, ArrowLeft, Search, Plus, Minus, Save, Trash2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TestData {
  id: string
  title: string
  subject: string
  description: string
  instructions: string
  duration: number
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  status: string
  passingScore: number
  accessType: string
  selectedQuestions: string[]
  settings: {
    allowRetake: boolean
    showResults: boolean
    randomizeQuestions: boolean
    showExplanation: boolean
  }
}

interface Question {
  id: string
  text: string
  subject: string
  difficulty: string
}

export default function EditTestPage() {
  const params = useParams()
  const testId = params.id as string

  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [testData, setTestData] = useState<TestData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")

  // Fetch test data
  useEffect(() => {
    async function fetchTestData() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/admin/tests/${testId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Ujian tidak ditemukan")
          }
          throw new Error("Gagal memuat data ujian")
        }

        const data = await response.json()
        setTestData(data)
        setSelectedQuestions(data.selectedQuestions)
      } catch (err) {
        console.error("Error fetching test:", err)
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestData()
  }, [testId])

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch("/api/admin/questions")

        if (!response.ok) {
          throw new Error("Gagal memuat data soal")
        }

        const data = await response.json()
        setQuestions(data)
      } catch (err) {
        console.error("Error fetching questions:", err)
        // We don't set global error here as it would override the test fetch error
      }
    }

    fetchQuestions()
  }, [])

  const toggleQuestionSelection = (id: string) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter((qId) => qId !== id))
    } else {
      setSelectedQuestions([...selectedQuestions, id])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const formData = new FormData(e.target as HTMLFormElement)

      // Combine date and time for start and end times
      const startDate = formData.get("startDate") as string || testData?.startDate || ""
      const startTime = formData.get("startTime") as string || testData?.startTime || ""
      const endDate = formData.get("endDate") as string || testData?.endDate || ""
      const endTime = formData.get("endTime") as string || testData?.endTime || ""

      const startDateTime = new Date(`${startDate}T${startTime}:00`)
      const endDateTime = new Date(`${endDate}T${endTime}:00`)

      // Prepare update data
      const updateData = {
        title: formData.get("test-title") as string,
        subject: formData.get("subject") as string,
        description: formData.get("description") as string,
        instructions: formData.get("instructions") as string,
        duration: parseInt(formData.get("duration") as string),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isActive: formData.get("status") === "active",
        passingScore: parseInt(formData.get("passing-score") as string),
        randomizeQuestions: formData.has("randomize"),
        settings: {
          allowRetake: formData.has("allow-retake"),
          showResults: formData.has("show-results"),
          randomizeQuestions: formData.has("randomize"),
          showExplanation: formData.has("show-explanation"),
        },
      }

      // Save test changes
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Gagal menyimpan perubahan")
      }

      // Update question set if needed (this would require additional API endpoint)
      // For simplicity, we're not implementing this part in this example

      router.push(`/admin/tests/${testId}`)
    } catch (err) {
      console.error("Error saving test:", err)
      alert("Gagal menyimpan perubahan. Silakan coba lagi.")
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus ujian")
      }

      router.push("/admin/tests")
    } catch (err) {
      console.error("Error deleting test:", err)
      alert("Gagal menghapus ujian. Silakan coba lagi.")
      setIsDeleting(false)
    }
  }

  // Filter questions based on search and subject filter
  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || question.subject.toLowerCase() === subjectFilter.toLowerCase()
    return matchesSearch && matchesSubject
  })

  // Get unique subjects for the filter
  const subjects = Array.from(new Set(questions.map(q => q.subject)))

  if (isLoading || !testData) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/tests")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Ujian</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p className="text-muted-foreground">Memuat data ujian...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/tests")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Ujian</h1>
          </div>
        </div>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/admin/tests")}>
          Kembali ke Daftar Ujian
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push(`/admin/tests/${testId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Ujian</h1>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Hapus Ujian
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan secara permanen menghapus ujian ini dan semua hasil
                  terkait dari database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    "Hapus"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detail Ujian</CardTitle>
            <CardDescription>Edit informasi dasar untuk ujian Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="test-title">Judul Ujian</Label>
              <Input id="test-title" name="test-title" defaultValue={testData.title} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Select defaultValue={testData.subject} name="subject">
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matematika">Matematika</SelectItem>
                    <SelectItem value="sains">Sains</SelectItem>
                    <SelectItem value="bahasa-inggris">Bahasa Inggris</SelectItem>
                    <SelectItem value="geografi">Geografi</SelectItem>
                    <SelectItem value="sastra">Sastra</SelectItem>
                    <SelectItem value="sejarah">Sejarah</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durasi (menit)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  defaultValue={testData.duration}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Ujian</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={testData.description}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instruksi untuk Peserta</Label>
              <Textarea
                id="instructions"
                name="instructions"
                defaultValue={testData.instructions}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passing-score">Nilai Minimum Kelulusan (%)</Label>
              <Input
                id="passing-score"
                name="passing-score"
                type="number"
                min="0"
                max="100"
                defaultValue={testData.passingScore}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pengaturan Waktu</CardTitle>
            <CardDescription>Edit jadwal ujian</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  name="startDate"
                  defaultValue={testData.startDate}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Waktu Mulai</Label>
                <Input
                  type="time"
                  name="startTime"
                  defaultValue={testData.startTime}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input
                  type="date"
                  name="endDate"
                  defaultValue={testData.endDate}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Waktu Selesai</Label>
                <Input
                  type="time"
                  name="endTime"
                  defaultValue={testData.endTime}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Ujian</Label>
              <Tabs defaultValue={testData.status} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="draft">Draf</TabsTrigger>
                  <TabsTrigger value="scheduled">Terjadwal</TabsTrigger>
                  <TabsTrigger value="active">Aktif Sekarang</TabsTrigger>
                </TabsList>
              </Tabs>
              <input type="hidden" name="status" value={testData.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pemilihan Soal</CardTitle>
            <CardDescription>Edit soal untuk dimasukkan dalam ujian ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari soal..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                defaultValue={subjectFilter}
                onValueChange={setSubjectFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject.toLowerCase()}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Pilih</TableHead>
                    <TableHead>Soal</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Kesulitan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        {questions.length === 0 ? "Memuat data soal..." : "Tidak ada soal yang ditemukan"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedQuestions.includes(question.id)}
                            onCheckedChange={() => toggleQuestionSelection(question.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{question.text}</TableCell>
                        <TableCell>{question.subject}</TableCell>
                        <TableCell>{question.difficulty}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{selectedQuestions.length} soal dipilih</div>
              <div className="flex items-center space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedQuestions([])}>
                  <Minus className="mr-2 h-4 w-4" />
                  Hapus Semua
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuestions(filteredQuestions.map((q) => q.id))}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Pilih Semua
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Akses Peserta</CardTitle>
            <CardDescription>Kontrol siapa yang dapat mengakses ujian ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accessType">Tipe Akses</Label>
              <Tabs defaultValue={testData.accessType} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Semua Pengguna</TabsTrigger>
                  <TabsTrigger value="groups">Grup Pengguna</TabsTrigger>
                  <TabsTrigger value="specific">Pengguna Tertentu</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-retake"
                  name="allow-retake"
                  defaultChecked={testData.settings.allowRetake}
                />
                <Label htmlFor="allow-retake">Izinkan peserta mengulang ujian</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-results"
                  name="show-results"
                  defaultChecked={testData.settings.showResults}
                />
                <Label htmlFor="show-results">Tampilkan hasil kepada peserta setelah selesai</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="randomize"
                  name="randomize"
                  defaultChecked={testData.settings.randomizeQuestions}
                />
                <Label htmlFor="randomize">Acak urutan soal</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-explanation"
                  name="show-explanation"
                  defaultChecked={testData.settings.showExplanation}
                />
                <Label htmlFor="show-explanation">Tampilkan penjelasan jawaban kepada peserta</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push(`/admin/tests/${testId}`)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSaving || selectedQuestions.length === 0} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
