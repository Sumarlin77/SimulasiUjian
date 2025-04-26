"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ParticipantTests() {
  const [availableTests, setAvailableTests] = useState<any[]>([])
  const [completedTests, setCompletedTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("available")
  const { toast } = useToast()

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/participant/tests/list")

      if (!response.ok) {
        throw new Error("Failed to fetch tests")
      }

      const data = await response.json()
      setAvailableTests(data.availableTests)
      setCompletedTests(data.completedTests)
      setError(null)
    } catch (err) {
      console.error("Error fetching tests:", err)
      setError("Failed to load tests. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load tests. Please try again.",
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
          <p>Memuat ujian...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button onClick={fetchTests} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#050C9C]">Ujian</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-[#3ABEF9] text-[#050C9C] hover:bg-[#A7E6FF]/20">
            <Link href="/participant/tests/requests">
              <ClipboardList className="h-4 w-4 mr-2" />
              Permintaan Saya
            </Link>
          </Button>
          <Button className="bg-[#3572EF] hover:bg-[#050C9C] text-white" asChild>
            <Link href="/participant/tests/request">
              <RefreshCw className="h-4 w-4 mr-2" />
              Ajukan Ujian Ulang
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="available"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="available">Ujian Tersedia</TabsTrigger>
          <TabsTrigger value="completed">Ujian Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          {availableTests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Tidak ada ujian yang tersedia saat ini.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableTests.map((test) => (
                <Card key={test.id} className="border-[#A7E6FF] shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-[#050C9C]">{test.title}</CardTitle>
                      <Badge className="bg-[#3572EF]">{test.subject}</Badge>
                    </div>
                    <CardDescription>
                      {test.date} pukul {test.time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[#3572EF]/80">Durasi:</span>
                        <span className="text-sm font-medium">{test.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[#3572EF]/80">Jumlah Soal:</span>
                        <span className="text-sm font-medium">{test.questions}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/participant/tests/${test.id}`} className="w-full">
                      <Button className="w-full bg-[#3572EF] hover:bg-[#050C9C] text-white">
                        {test.status === "upcoming" ? "Lihat Detail" : "Mulai Ujian"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedTests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Anda belum menyelesaikan ujian apa pun.</p>
              <Button
                className="mt-4"
                onClick={() => setActiveTab("available")}
              >
                Lihat Ujian Tersedia
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedTests.map((test) => (
                <Card key={test.id} className="border-[#A7E6FF] shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-[#050C9C]">{test.title}</CardTitle>
                      <Badge variant="outline" className="text-[#3572EF] border-[#3572EF]">
                        {test.subject}
                      </Badge>
                    </div>
                    <CardDescription>Selesai pada {test.date}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[#3572EF]/80">Nilai:</span>
                        <span className="text-sm font-medium">{test.score}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/participant/results/${test.id}`} className="w-full">
                      <Button variant="outline" className="w-full border-[#3ABEF9] text-[#050C9C] hover:bg-[#A7E6FF]/20">
                        Lihat Hasil
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
