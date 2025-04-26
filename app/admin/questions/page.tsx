"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertCircle, Loader2, MoreHorizontal, Plus, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

// Helper function to translate question types to Indonesian
const getQuestionTypeIndonesian = (type: string): string => {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "Pilihan Ganda";
    case "ESSAY":
      return "Esai";
    default:
      return type;
  }
}

// Helper function to translate difficulty levels to Indonesian
const getDifficultyIndonesian = (difficulty: string): string => {
  switch (difficulty) {
    case "EASY":
      return "Mudah";
    case "MEDIUM":
      return "Sedang";
    case "HARD":
      return "Sulit";
    default:
      return difficulty;
  }
}

// Helper function to get badge class based on difficulty
const getDifficultyBadgeClass = (difficulty: string): string => {
  switch (difficulty) {
    case "EASY":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "HARD":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

// Define Question interface
interface Question {
  id: string
  text: string
  type: string
  subject: string
  difficulty: string
  createdAt: string
}

export default function QuestionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/questions')
        if (!response.ok) {
          throw new Error('Gagal memuat soal')
        }
        const data = await response.json() as Question[]
        setQuestions(data)

        // Extract unique subjects
        const uniqueSubjects = [...new Set(data.map(q => q.subject))].sort()
        setSubjects(uniqueSubjects)

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        setIsLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === "all" || question.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus soal')
      }

      // Remove the deleted question from the state
      setQuestions(questions.filter(q => q.id !== id))
      toast({
        title: "Berhasil",
        description: "Soal berhasil dihapus",
      })

      // Close the dialog
      setIsDeleteDialogOpen(false)
    } catch (err) {
      console.error('Error deleting question:', err)
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus soal',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bank Soal</h1>
        <Link href="/admin/questions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Soal
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pengelolaan Soal</CardTitle>
          <CardDescription>Buat, lihat, dan kelola soal untuk ujian Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari soal..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
          </div>

          {isLoading ? (
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
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="list">Tampilan Daftar</TabsTrigger>
                <TabsTrigger value="grid">Tampilan Grid</TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Soal</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Kesulitan</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead className="text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuestions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            Tidak ada data yang ditemukan
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredQuestions.map((question) => (
                          <TableRow key={question.id}>
                            <TableCell className="font-medium max-w-[300px] truncate">{question.text}</TableCell>
                            <TableCell>{question.subject}</TableCell>
                            <TableCell>{getQuestionTypeIndonesian(question.type)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getDifficultyBadgeClass(question.difficulty)}
                              >
                                {getDifficultyIndonesian(question.difficulty)}
                              </Badge>
                            </TableCell>
                            <TableCell>{question.createdAt}</TableCell>
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
                                    <Link href={`/admin/questions/${question.id}`} className="w-full">
                                      Lihat
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/questions/${question.id}/edit`} className="w-full">
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedQuestionId(question.id)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                  >
                                    Hapus
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
              </TabsContent>

              <TabsContent value="grid">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQuestions.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                      Tidak ada data yang ditemukan
                    </div>
                  ) : (
                    filteredQuestions.map((question) => (
                      <Card key={question.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <Badge
                              variant="outline"
                              className={getDifficultyBadgeClass(question.difficulty)}
                            >
                              {getDifficultyIndonesian(question.difficulty)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Buka menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/questions/${question.id}`} className="w-full">
                                    Lihat
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/questions/${question.id}/edit`} className="w-full">
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedQuestionId(question.id)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CardTitle className="text-base">{question.text}</CardTitle>
                          <CardDescription>
                            {question.subject} - {getQuestionTypeIndonesian(question.type)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs text-muted-foreground">Dibuat pada {question.createdAt}</div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedQuestionId && handleDelete(selectedQuestionId)}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
