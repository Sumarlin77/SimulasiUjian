"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Loader2, Calendar, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  // Get the test ID from unwrapped params
  const [testId, setTestId] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<any>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<'loading' | 'notStarted' | 'active' | 'error'>('loading')
  const [startTimeCountdown, setStartTimeCountdown] = useState<number | null>(null)

  // Unwrap params in useEffect
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const unwrappedParams = await params;
        setTestId(unwrappedParams.id);
      } catch (err) {
        console.error("Error unwrapping params:", err);
        setError("Failed to load test parameters");
        setTestStatus('error');
      }
    };

    unwrapParams();
  }, [params]);

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fetch test data
  useEffect(() => {
    if (!testId) return;

    const fetchTest = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/participant/tests/${testId}`)

        if (!response.ok) {
          const errorData = await response.json()

          if (response.status === 403 && errorData.error === 'Test Belum Dimulai') {
            const testDetailsResponse = await fetch(`/api/participant/tests/details/${testId}`)
            if (testDetailsResponse.ok) {
              const testDetails = await testDetailsResponse.json()
              setTest(testDetails)

              // Calculate time until test starts
              const startTime = new Date(testDetails.startTime).getTime()
              const now = new Date().getTime()
              const timeToStart = Math.max(0, Math.floor((startTime - now) / 1000))

              setStartTimeCountdown(timeToStart)
              setTestStatus('notStarted')
              return
            }
          }

          throw new Error(errorData.error || "Failed to fetch test")
        }

        const data = await response.json()
        setTest(data)
        setAttemptId(data.attemptId)
        setTestStatus('active')

        // Set timer
        const durationInSeconds = data.duration * 60
        const endTime = new Date(data.endTime).getTime()
        const now = new Date().getTime()
        const timeLeftSeconds = Math.min(
          durationInSeconds,
          Math.max(0, Math.floor((endTime - now) / 1000))
        )
        setTimeLeft(timeLeftSeconds)

        // Fetch existing answers if any
        if (data.attemptId) {
          const answersResponse = await fetch(`/api/participant/tests/attempts/${data.attemptId}`)
          if (answersResponse.ok) {
            const answersData = await answersResponse.json()
            setAnswers(answersData.answers || {})
          }
        }

        setError(null)
      } catch (err: any) {
        console.error("Error fetching test:", err)
        setError(err.message || "Failed to load test. Please try again.")
        setTestStatus('error')
        toast({
          title: "Error",
          description: err.message || "Failed to load test. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTest()
  }, [testId, toast])

  // Timer effect for countdown to test start
  useEffect(() => {
    if (startTimeCountdown === null || testStatus !== 'notStarted') return

    const timer = setInterval(() => {
      setStartTimeCountdown((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer)
          // Refresh the page to check if test has started
          window.location.reload()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [startTimeCountdown, testStatus])

  // Save answers periodically
  const saveAnswers = useCallback(async () => {
    if (!attemptId || Object.keys(answers).length === 0) return

    try {
      await fetch(`/api/participant/tests/attempts/${attemptId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ answers })
      })

      // No need to show success message for auto-saves
    } catch (err) {
      console.error("Error saving answers:", err)
      // Silent fail for auto-save to not disturb the user
    }
  }, [answers, attemptId])

  // Auto-save effect
  useEffect(() => {
    if (!attemptId) return

    const autoSave = setInterval(() => {
      saveAnswers()
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSave)
  }, [saveAnswers, attemptId])

  // Timer effect for test duration
  useEffect(() => {
    if (timeLeft === null) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer)
          handleSubmitTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Format time as MM:SS
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Format time as HH:MM:SS
  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return "00:00:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (value: string) => {
    if (!test) return

    const questionId = test.questions[currentQuestion].id
    setAnswers({
      ...answers,
      [questionId]: value,
    })
  }

  const handleNextQuestion = () => {
    if (!test) return

    if (currentQuestion < test.totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitTest = async () => {
    if (!attemptId) return

    setIsSubmitting(true)

    try {
      // Save answers one last time
      await saveAnswers()

      // Submit test
      const response = await fetch(`/api/participant/tests/attempts/${attemptId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ answers })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit test")
      }

      const data = await response.json()

      toast({
        title: "Ujian Berhasil Diselesaikan",
        description: `Skor Anda: ${data.score}%. ${data.passed ? "Selamat, Anda lulus!" : "Anda belum lulus."}`,
      })

      // Redirect to results page
      router.push(`/participant/results/${data.attemptId}`)
    } catch (err: any) {
      console.error("Error submitting test:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to submit test. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  if (loading || !testId) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat ujian...</p>
        </div>
      </div>
    )
  }

  // Render test not started UI
  if (testStatus === 'notStarted' && test) {
    return (
      <div className="container py-10 max-w-3xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="bg-primary-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary">{test.title}</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800">Ujian belum dimulai</h3>
                <p className="text-amber-700 text-sm mt-1">Silakan tunggu hingga waktu mulai ujian. Halaman akan otomatis refresh.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Detil Ujian</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Akan dimulai pada: </span>
                    <span className="font-medium">{formatDate(test.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Durasi: </span>
                    <span className="font-medium">{test.duration} menit</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Deskripsi</h3>
                <p className="text-muted-foreground">{test.description}</p>
              </div>

              <div className="space-y-3 bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="text-lg font-medium text-blue-700">Waktu Menuju Ujian</h3>
                <div className="flex justify-center">
                  <div className="text-3xl font-mono font-bold text-blue-700">
                    {formatCountdown(startTimeCountdown)}
                  </div>
                </div>
                <p className="text-sm text-blue-600 text-center">
                  Halaman akan refresh otomatis ketika ujian telah dimulai
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Persiapan</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Pastikan koneksi internet Anda stabil</li>
                  <li>Siapkan alat tulis jika diperlukan untuk perhitungan</li>
                  <li>Jangan menyegarkan (refresh) halaman saat ujian berlangsung</li>
                  <li>Jawaban Anda akan tersimpan secara otomatis</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/30 flex justify-between">
            <Button variant="outline" onClick={() => router.push('/participant/tests')}>
              Kembali ke Daftar Ujian
            </Button>
            <Button onClick={() => window.location.reload()} variant="default">
              Refresh Halaman
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button
            onClick={() => router.push("/participant/tests")}
            className="mt-4"
          >
            Kembali ke Daftar Ujian
          </Button>
        </div>
      </div>
    )
  }

  if (!test) return null

  // Render active test UI
  const progressPercentage = ((currentQuestion + 1) / test.totalQuestions) * 100
  const currentQuestionData = test.questions[currentQuestion]
  const currentAnswer = currentQuestionData ? answers[currentQuestionData.id] || "" : ""

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{test.title}</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Soal {currentQuestion + 1} dari {test.totalQuestions}
          </div>
          <div className="bg-muted px-3 py-1 rounded-md font-mono">Sisa waktu: {formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{currentQuestionData.text}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Display question image if available */}
              {currentQuestionData.nama_gambar && (
                <div className="mb-4">
                  <img
                    src={`/images/soal/${currentQuestionData.nama_gambar}`}
                    alt="Gambar soal"
                    className="max-w-full rounded-md border border-muted mx-auto max-h-[300px] object-contain"
                  />
                </div>
              )}

              <RadioGroup
                value={currentAnswer}
                onValueChange={handleAnswerChange}
                className="space-y-4"
              >
                {currentQuestionData.options.map((option: any) => {
                  // Asegurarse de que option.text es un string
                  const optionText = typeof option.text === 'object'
                    ? (option.text.text || String(option.text))
                    : String(option.text);

                  return (
                    <div key={option.id} className="flex items-center space-x-3 border p-4 rounded-md hover:bg-muted">
                      <RadioGroupItem value={option.id} id={`option-${option.id}`} className="h-5 w-5" />
                      <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer text-base font-normal text-gray-900">
                        {optionText}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestion === 0}>
                Sebelumnya
              </Button>
              {currentQuestion < test.totalQuestions - 1 ? (
                <Button onClick={handleNextQuestion}>Selanjutnya</Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>Kirim Ujian</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Anda akan mengirimkan ujian Anda. Anda tidak akan dapat mengubah jawaban setelah pengiriman.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmitTest} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengirim...
                          </span>
                        ) : "Kirim"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardFooter>
          </Card>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Kemajuan</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-primary-50" />
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Navigasi Soal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((question: any, i: number) => (
                  <Button
                    key={i}
                    variant={currentQuestion === i ? "default" : "outline"}
                    className={`h-10 w-10 p-0 ${answers[question.id] ? "border-primary-500 bg-primary-50 hover:bg-primary-100 text-primary-700" : ""
                      }`}
                    onClick={() => setCurrentQuestion(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span className="text-sm">Soal Saat Ini</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary-500"></div>
                  <span className="text-sm">Sudah Dijawab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted"></div>
                  <span className="text-sm">Belum Dijawab</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
