"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Trash, Upload, ImageIcon, X, Plus, ArrowLeft, ArrowRight, Save, AlertCircle, CheckCircle } from "lucide-react"

// Interface for image state
interface ImageState {
  file: File | null
  preview: string | null
  filename: string | null
}

// Interface for question option
interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

// Interface for a single question
interface Question {
  id: string
  type: "multiple-choice" | "essay"
  text: string
  subject: string
  customSubject: string
  difficulty: string
  options: QuestionOption[]
  explanation: string
  image: ImageState
  isComplete: boolean
}

export default function NewQuestionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<"config" | "questions">("config")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Question type selection (checkbox-based)
  const [selectedTypes, setSelectedTypes] = useState<{ "multiple-choice": boolean; essay: boolean }>({
    "multiple-choice": true,
    essay: false,
  })

  // Question quantity
  const [quantity, setQuantity] = useState(1)
  const [multipleChoiceCount, setMultipleChoiceCount] = useState(1)
  const [essayCount, setEssayCount] = useState(0)

  // Questions array
  const [questions, setQuestions] = useState<Question[]>([])

  // Initialize questions based on quantity and selected types
  useEffect(() => {
    if (currentStep === "config") {
      // Calculate total questions based on selected types
      let totalQuestions = quantity
      let mcCount = multipleChoiceCount
      let esCount = essayCount

      // If both types are selected, use the specific counts
      if (selectedTypes["multiple-choice"] && selectedTypes.essay) {
        totalQuestions = mcCount + esCount
      } else {
        // If only one type is selected, all questions are of that type
        if (selectedTypes["multiple-choice"]) {
          mcCount = totalQuestions
          esCount = 0
        } else if (selectedTypes.essay) {
          mcCount = 0
          esCount = totalQuestions
        } else {
          // Default to multiple-choice if none selected
          mcCount = totalQuestions
          esCount = 0
        }
      }

      // Create new questions array based on distribution
      const newQuestions: Question[] = []

      // Add multiple choice questions
      for (let i = 0; i < mcCount; i++) {
        newQuestions.push({
          id: `question-mc-${i + 1}`,
          type: "multiple-choice",
          text: "",
          subject: "",
          customSubject: "",
          difficulty: "sedang",
          options: [
            { id: "a", text: "", isCorrect: false },
            { id: "b", text: "", isCorrect: false },
            { id: "c", text: "", isCorrect: false },
            { id: "d", text: "", isCorrect: false },
          ],
          explanation: "",
          image: { file: null, preview: null, filename: null },
          isComplete: false,
        })
      }

      // Add essay questions
      for (let i = 0; i < esCount; i++) {
        newQuestions.push({
          id: `question-es-${i + 1}`,
          type: "essay",
          text: "",
          subject: "",
          customSubject: "",
          difficulty: "sedang",
          options: [],
          explanation: "",
          image: { file: null, preview: null, filename: null },
          isComplete: false,
        })
      }

      setQuestions(newQuestions)
    }
  }, [quantity, selectedTypes, multipleChoiceCount, essayCount, currentStep])

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (value > 0 && value <= 50) {
      // Limit to reasonable number
      setQuantity(value)
    }
  }

  // Handle multiple choice count change
  const handleMultipleChoiceCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (value >= 0 && value + essayCount <= 50) {
      setMultipleChoiceCount(value)
    }
  }

  // Handle essay count change
  const handleEssayCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (value >= 0 && value + multipleChoiceCount <= 50) {
      setEssayCount(value)
    }
  }

  // Handle question type change
  const handleTypeChange = (type: "multiple-choice" | "essay", checked: boolean) => {
    // Ensure at least one type is selected
    if (!checked && !selectedTypes[type === "multiple-choice" ? "essay" : "multiple-choice"]) {
      return
    }

    const newSelectedTypes = { ...selectedTypes, [type]: checked }
    setSelectedTypes(newSelectedTypes)

    // Update counts based on selection
    if (newSelectedTypes["multiple-choice"] && newSelectedTypes.essay) {
      // Both types selected
      if (type === "multiple-choice" && checked) {
        // Just enabled multiple choice
        setMultipleChoiceCount(Math.max(1, quantity - essayCount))
      } else if (type === "essay" && checked) {
        // Just enabled essay
        setEssayCount(Math.max(1, quantity - multipleChoiceCount))
      }
    } else {
      // Only one type selected
      if (newSelectedTypes["multiple-choice"]) {
        setMultipleChoiceCount(quantity)
        setEssayCount(0)
      } else if (newSelectedTypes.essay) {
        setMultipleChoiceCount(0)
        setEssayCount(quantity)
      }
    }
  }

  // Handle question text change
  const handleQuestionTextChange = (text: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].text = text
    checkQuestionCompletion(updatedQuestions, currentQuestionIndex)
    setQuestions(updatedQuestions)
  }

  // Handle subject change
  const handleSubjectChange = (subject: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].subject = subject
    checkQuestionCompletion(updatedQuestions, currentQuestionIndex)
    setQuestions(updatedQuestions)
  }

  // Handle custom subject change
  const handleCustomSubjectChange = (customSubject: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].customSubject = customSubject
    checkQuestionCompletion(updatedQuestions, currentQuestionIndex)
    setQuestions(updatedQuestions)
  }

  // Handle difficulty change
  const handleDifficultyChange = (difficulty: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].difficulty = difficulty
    checkQuestionCompletion(updatedQuestions, currentQuestionIndex)
    setQuestions(updatedQuestions)
  }

  // Handle option text change
  const handleOptionChange = (optionId: string, text: string) => {
    const updatedQuestions = [...questions]
    const optionIndex = updatedQuestions[currentQuestionIndex].options.findIndex((o) => o.id === optionId)
    if (optionIndex !== -1) {
      updatedQuestions[currentQuestionIndex].options[optionIndex].text = text
      checkQuestionCompletion(updatedQuestions, currentQuestionIndex)
      setQuestions(updatedQuestions)
    }
  }

  // Handle correct answer change
  const handleCorrectAnswerChange = (optionId: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].options = updatedQuestions[currentQuestionIndex].options.map((option) => ({
      ...option,
      isCorrect: option.id === optionId,
    }))
    checkQuestionCompletion(updatedQuestions, currentQuestionIndex)
    setQuestions(updatedQuestions)
  }

  // Handle add option
  const handleAddOption = () => {
    const updatedQuestions = [...questions]
    const options = updatedQuestions[currentQuestionIndex].options
    const newId = String.fromCharCode(97 + options.length) // a, b, c, ...
    updatedQuestions[currentQuestionIndex].options.push({ id: newId, text: "", isCorrect: false })
    checkQuestionCompletion(updatedQuestions, currentQuestionIndex)
    setQuestions(updatedQuestions)
  }

  // Handle remove option
  const handleRemoveOption = (optionId: string) => {
    const updatedQuestions = [...questions]
    const options = updatedQuestions[currentQuestionIndex].options
    if (options.length > 2) {
      updatedQuestions[currentQuestionIndex].options = options.filter((o) => o.id !== optionId)
      checkQuestionCompletion(updatedQuestions, currentQuestionIndex)
      setQuestions(updatedQuestions)
    }
  }

  // Handle explanation change
  const handleExplanationChange = (explanation: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].explanation = explanation
    setQuestions(updatedQuestions)
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const preview = URL.createObjectURL(file)

      // Generate a unique filename: timestamp + original filename
      const timestamp = new Date().getTime()
      const originalFilename = file.name
      const filename = `${timestamp}-${originalFilename}`

      const updatedQuestions = [...questions]
      updatedQuestions[currentQuestionIndex].image = { file, preview, filename }
      setQuestions(updatedQuestions)
    }
  }

  // Handle remove image
  const handleRemoveImage = () => {
    const updatedQuestions = [...questions]
    if (updatedQuestions[currentQuestionIndex].image.preview) {
      URL.revokeObjectURL(updatedQuestions[currentQuestionIndex].image.preview)
    }
    updatedQuestions[currentQuestionIndex].image = { file: null, preview: null, filename: null }
    setQuestions(updatedQuestions)
  }

  // Check if a question is complete
  const checkQuestionCompletion = (questionsArray: Question[], index: number) => {
    const question = questionsArray[index]
    let isComplete = false

    if (question.text && question.subject) {
      if (question.subject === "custom" && !question.customSubject) {
        isComplete = false
      } else if (question.type === "multiple-choice") {
        // Check if all options have text and one is marked as correct
        const allOptionsHaveText = question.options.every((option) => option.text.trim() !== "")
        const hasCorrectOption = question.options.some((option) => option.isCorrect)
        isComplete = allOptionsHaveText && hasCorrectOption
      } else {
        // For essay questions, just need text and subject
        isComplete = true
      }
    }

    questionsArray[index].isComplete = isComplete
  }

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Start creating questions
  const handleStartCreating = () => {
    // Validate configuration
    if (selectedTypes["multiple-choice"] && selectedTypes.essay) {
      if (multipleChoiceCount + essayCount === 0) {
        return // Don't proceed if no questions
      }
    } else if (quantity === 0) {
      return // Don't proceed if no questions
    }

    setCurrentStep("questions")
    setCurrentQuestionIndex(0)
  }

  // Go back to configuration
  const handleBackToConfig = () => {
    setCurrentStep("config")
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // First upload all images and collect filenames
      const questionsWithImageData = await Promise.all(
        questions.map(async (question) => {
          let imageFilename = null

          if (question.image.file && question.image.filename) {
            // Create a FormData to upload the image
            const formData = new FormData()
            formData.append('file', question.image.file)
            formData.append('filename', question.image.filename)

            // Upload the image to the /api/upload endpoint
            const uploadResponse = await fetch('/api/upload/question-image', {
              method: 'POST',
              body: formData,
            })

            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json()
              imageFilename = uploadData.filename
            } else {
              throw new Error('Failed to upload image')
            }
          }

          // Return the question data with image filename
          return {
            ...question,
            nama_gambar: imageFilename,
          }
        })
      )

      // Then save the questions with image references
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: questionsWithImageData }),
      })

      if (!response.ok) {
        throw new Error('Failed to save questions')
      }

      // Redirect to questions list
      router.push('/admin/questions')
    } catch (error) {
      console.error('Error saving questions:', error)
      setIsSubmitting(false)
    }
  }

  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100

  // Count completed questions
  const completedQuestions = questions.filter((q) => q.isComplete).length

  // List of subjects for the dropdown
  const subjects = [
    "Matematika",
    "Sains",
    "Bahasa Inggris",
    "Geografi",
    "Sastra",
    "Sejarah",
    "Fisika",
    "Kimia",
    "Biologi",
    "Ekonomi",
    "Sosiologi",
    "Pendidikan Kewarganegaraan",
    "Seni Budaya",
    "Teknologi Informasi",
    "Pendidikan Jasmani",
  ]

  // Get current question
  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Buat Soal Baru</h1>
        <Link href="/admin/questions">
          <Button variant="outline">Batal</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        {currentStep === "config" ? (
          // Step 1: Question Type and Quantity Configuration
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Konfigurasi Soal</CardTitle>
              <CardDescription>Pilih tipe soal dan jumlah soal yang ingin dibuat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tipe Soal (Pilih minimal satu)</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="multiple-choice"
                      checked={selectedTypes["multiple-choice"]}
                      onCheckedChange={(checked) => handleTypeChange("multiple-choice", checked as boolean)}
                    />
                    <Label htmlFor="multiple-choice">Pilihan Ganda</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="essay"
                      checked={selectedTypes.essay}
                      onCheckedChange={(checked) => handleTypeChange("essay", checked as boolean)}
                    />
                    <Label htmlFor="essay">Esai</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah Soal</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="50"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full md:w-1/4"
                  disabled={selectedTypes["multiple-choice"] && selectedTypes.essay}
                />
                <p className="text-xs text-muted-foreground">Masukkan jumlah soal yang ingin dibuat (maksimal 50)</p>

                {/* Distribution fields when both types are selected */}
                {selectedTypes["multiple-choice"] && selectedTypes.essay && (
                  <div className="mt-4 space-y-4">
                    <div className="border p-4 rounded-md bg-muted/20">
                      <h3 className="font-medium mb-3">Distribusi Jumlah Soal</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mc-count">Jumlah Soal Pilihan Ganda</Label>
                          <Input
                            id="mc-count"
                            type="number"
                            min="0"
                            max="50"
                            value={multipleChoiceCount}
                            onChange={handleMultipleChoiceCountChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="essay-count">Jumlah Soal Esai</Label>
                          <Input
                            id="essay-count"
                            type="number"
                            min="0"
                            max="50"
                            value={essayCount}
                            onChange={handleEssayCountChange}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Total: {multipleChoiceCount + essayCount} soal (maksimal 50)
                      </p>
                      {multipleChoiceCount + essayCount === 0 && (
                        <p className="text-xs text-red-500 mt-1">Total jumlah soal harus lebih dari 0</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="button"
                onClick={handleStartCreating}
                disabled={
                  (selectedTypes["multiple-choice"] && selectedTypes.essay && multipleChoiceCount + essayCount === 0) ||
                  (!selectedTypes["multiple-choice"] && !selectedTypes.essay) ||
                  (!(selectedTypes["multiple-choice"] && selectedTypes.essay) && quantity === 0)
                }
              >
                Mulai Membuat Soal
              </Button>
            </CardFooter>
          </Card>
        ) : (
          // Step 2: Sequential Question Creation
          <>
            {/* Progress Bar and Navigation */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBackToConfig}
                      className="flex items-center gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Kembali ke Konfigurasi
                    </Button>
                  </div>
                  <div className="flex-1 max-w-md">
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        Soal {currentQuestionIndex + 1} dari {questions.length}
                      </span>
                      <span>
                        {completedQuestions} dari {questions.length} selesai
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleNextQuestion}
                        disabled={!currentQuestion?.isComplete}
                      >
                        Selanjutnya
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button type="submit" size="sm" disabled={isSubmitting || completedQuestions < questions.length}>
                        <Save className="h-4 w-4 mr-1" />
                        {isSubmitting ? "Menyimpan..." : "Simpan Semua"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Input Card */}
            {currentQuestion && (
              <Card className="mb-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      Soal {currentQuestionIndex + 1}:{" "}
                      {currentQuestion.type === "multiple-choice" ? "Pilihan Ganda" : "Esai"}
                    </CardTitle>
                    <div className="flex items-center">
                      {currentQuestion.isComplete ? (
                        <div className="flex items-center text-green-500">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm">Lengkap</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-500">
                          <AlertCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm">Belum Lengkap</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Isi detail untuk soal {currentQuestionIndex + 1} dari {questions.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="question-text">Teks Soal</Label>
                    <Textarea
                      id="question-text"
                      placeholder="Masukkan soal Anda di sini..."
                      className="min-h-[100px]"
                      value={currentQuestion.text}
                      onChange={(e) => handleQuestionTextChange(e.target.value)}
                      required
                    />
                  </div>

                  {/* Image upload section */}
                  <div className="space-y-2">
                    <Label htmlFor="question-image">Gambar Soal (Opsional)</Label>
                    <div className="border-2 border-dashed rounded-md p-4">
                      {currentQuestion.image.preview ? (
                        <div className="relative">
                          <img
                            src={currentQuestion.image.preview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-h-[300px] mx-auto rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">Unggah gambar untuk soal ini</p>
                          <Label
                            htmlFor="image-upload"
                            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Pilih Gambar
                          </Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format yang didukung: JPG, PNG, GIF. Ukuran maksimum: 5MB
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Mata Pelajaran</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Select value={currentQuestion.subject} onValueChange={handleSubjectChange}>
                          <SelectTrigger id="subject">
                            <SelectValue placeholder="Pilih mata pelajaran" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject} value={subject.toLowerCase().replace(/\s+/g, "-")}>
                                {subject}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Mata Pelajaran Lainnya</SelectItem>
                          </SelectContent>
                        </Select>

                        {currentQuestion.subject === "custom" && (
                          <div className="mt-2">
                            <Input
                              id="custom-subject"
                              placeholder="Masukkan mata pelajaran kustom"
                              value={currentQuestion.customSubject}
                              onChange={(e) => handleCustomSubjectChange(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Masukkan mata pelajaran jika tidak ada dalam daftar
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
                      <Select value={currentQuestion.difficulty} onValueChange={handleDifficultyChange}>
                        <SelectTrigger id="difficulty">
                          <SelectValue placeholder="Pilih tingkat kesulitan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mudah">Mudah</SelectItem>
                          <SelectItem value="sedang">Sedang</SelectItem>
                          <SelectItem value="sulit">Sulit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Question type specific content */}
                  {currentQuestion.type === "multiple-choice" && (
                    <div className="space-y-4">
                      <Label>Opsi Jawaban</Label>
                      <RadioGroup
                        value={currentQuestion.options.find((o) => o.isCorrect)?.id || ""}
                        onValueChange={handleCorrectAnswerChange}
                      >
                        {currentQuestion.options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                            <div className="flex-1 flex items-center space-x-2">
                              <Label htmlFor={`option-${option.id}`} className="w-6">
                                {option.id.toUpperCase()}.
                              </Label>
                              <Input
                                value={option.text}
                                onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                placeholder={`Opsi ${option.id.toUpperCase()}`}
                                className="flex-1"
                                required
                              />
                            </div>
                            {currentQuestion.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOption(option.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </RadioGroup>

                      {currentQuestion.options.length < 6 && (
                        <Button type="button" variant="outline" onClick={handleAddOption} className="mt-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Opsi
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="explanation">Penjelasan (Opsional)</Label>
                    <Textarea
                      id="explanation"
                      placeholder="Masukkan penjelasan untuk jawaban yang benar..."
                      className="min-h-[100px]"
                      value={currentQuestion.explanation}
                      onChange={(e) => handleExplanationChange(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentQuestionIndex < questions.length - 1 ? (
                      <Button type="button" onClick={handleNextQuestion} disabled={!currentQuestion?.isComplete}>
                        Selanjutnya
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isSubmitting || completedQuestions < questions.length}>
                        <Save className="h-4 w-4 mr-1" />
                        {isSubmitting ? "Menyimpan..." : "Simpan Semua"}
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )}

            {/* Question Navigation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Navigasi Soal</CardTitle>
                <CardDescription>Klik nomor soal untuk beralih ke soal tersebut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {questions.map((question, index) => (
                    <Button
                      key={question.id}
                      variant={currentQuestionIndex === index ? "default" : "outline"}
                      className={`h-10 w-10 p-0 ${question.isComplete
                        ? "border-primary-500 bg-primary-50 hover:bg-primary-100 text-primary-700"
                        : currentQuestionIndex === index
                          ? ""
                          : "bg-muted/30"
                        }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary"></div>
                    <span className="text-sm">Soal Saat Ini</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary-500"></div>
                    <span className="text-sm">Soal Lengkap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted"></div>
                    <span className="text-sm">Soal Belum Lengkap</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </form>
    </div>
  )
}
