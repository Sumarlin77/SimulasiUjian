"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Search, Plus, Minus } from "lucide-react"

interface Question {
  id: string
  text: string
  subject: string
  difficulty: string
  type: string
}

export default function NewTestPage() {
  const router = useRouter()
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/admin/questions")
        if (!response.ok) {
          throw new Error("Gagal memuat data soal")
        }
        const data = await response.json()
        setQuestions(data)
        setFilteredQuestions(data)
      } catch (err) {
        console.error("Error fetching questions:", err)
        setError("Gagal memuat data soal. Silakan coba lagi nanti.")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  useEffect(() => {
    // Filter questions based on search term and subject filter
    const filtered = questions.filter((question) => {
      const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = subjectFilter === "all" || question.subject.toLowerCase() === subjectFilter.toLowerCase()
      return matchesSearch && matchesSubject
    })
    setFilteredQuestions(filtered)
  }, [searchTerm, subjectFilter, questions])

  const toggleQuestionSelection = (id: string) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter((qId) => qId !== id))
    } else {
      setSelectedQuestions([...selectedQuestions, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Collect form data
    const formData = new FormData(e.target as HTMLFormElement)
    const testTitle = formData.get("test-title") as string
    const subject = formData.get("subject") as string
    const duration = Number(formData.get("duration"))

    try {
      // We would also need to get the dates and times, but for simplicity:
      // Set start time to now and end time to 1 day later
      const startTime = new Date()
      const endTime = new Date()
      endTime.setDate(endTime.getDate() + 1)

      // First, we need to create a question set from the selected questions
      const createQuestionSetResponse = await fetch('/api/question-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Question Set for ${testTitle}`,
          subject: subject,
          description: `Auto-generated question set for test: ${testTitle}`
        })
      })

      if (!createQuestionSetResponse.ok) {
        throw new Error('Failed to create question set')
      }

      const questionSetData = await createQuestionSetResponse.json()
      const questionSetId = questionSetData.questionSet.id

      // Add selected questions to the question set
      for (const questionId of selectedQuestions) {
        await fetch(`/api/question-sets/${questionSetId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId })
        })
      }

      // Create the test using the question set
      const createTestResponse = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle,
          subject: subject,
          description: `Test created on ${new Date().toLocaleDateString()}`,
          duration: duration,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isActive: formData.get("status") === "active",
          passingScore: 60,
          randomizeQuestions: formData.get("randomize") === "on",
          questionSetId: questionSetId
        })
      })

      if (!createTestResponse.ok) {
        throw new Error('Failed to create test')
      }

      // Navigate to tests page on success
      router.push("/admin/tests")
    } catch (error) {
      console.error("Error creating test:", error)
      alert("Terjadi kesalahan saat membuat ujian. Silakan coba lagi.")
      setIsSubmitting(false)
    }
  }

  // Get unique subjects for the filter
  const subjects = Array.from(new Set(questions.map(q => q.subject)))

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Buat Ujian Baru</h1>
        <Link href="/admin/tests">
          <Button variant="outline">Batal</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detail Ujian</CardTitle>
            <CardDescription>Masukkan informasi dasar untuk ujian Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="test-title">Judul Ujian</Label>
              <Input id="test-title" name="test-title" placeholder="Masukkan judul ujian..." required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Select defaultValue="matematika" name="subject">
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
                <Input id="duration" name="duration" type="number" min="1" defaultValue="60" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <DatePicker />
              </div>

              <div className="space-y-2">
                <Label>Waktu Mulai</Label>
                <TimePicker />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <DatePicker />
              </div>

              <div className="space-y-2">
                <Label>Waktu Selesai</Label>
                <TimePicker />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Ujian</Label>
              <Tabs defaultValue="draft" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="draft">Draf</TabsTrigger>
                  <TabsTrigger value="scheduled">Terjadwal</TabsTrigger>
                  <TabsTrigger value="active">Aktif Sekarang</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pemilihan Soal</CardTitle>
            <CardDescription>Pilih soal untuk dimasukkan dalam ujian ini</CardDescription>
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
                value={subjectFilter}
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Memuat data soal...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Tidak ada soal yang ditemukan
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
              <Label>Tipe Akses</Label>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Semua Pengguna</TabsTrigger>
                  <TabsTrigger value="groups">Grup Pengguna</TabsTrigger>
                  <TabsTrigger value="specific">Pengguna Tertentu</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="allow-retake" name="allow-retake" />
                <Label htmlFor="allow-retake">Izinkan peserta mengulang ujian</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="show-results" name="show-results" defaultChecked />
                <Label htmlFor="show-results">Tampilkan hasil kepada peserta setelah selesai</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="randomize" name="randomize" defaultChecked />
                <Label htmlFor="randomize">Acak urutan soal</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/tests")}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedQuestions.length === 0}>
              {isSubmitting ? "Membuat..." : "Buat Ujian"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
