"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Calendar, CheckCircle, Clock, FileText, PlusCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function UserRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        const url = statusFilter === "all"
          ? "/api/participant/test-requests"
          : `/api/participant/test-requests?status=${statusFilter}`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch test requests")
        }

        const data = await response.json()
        setRequests(data.requests || [])
      } catch (error) {
        console.error("Error fetching test requests:", error)
        toast({
          title: "Error",
          description: "Gagal memuat permintaan ujian. Silakan coba lagi nanti.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [statusFilter, toast])

  const handleViewRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/participant/test-requests/${requestId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch request details")
      }

      const data = await response.json()
      setSelectedRequest(data)
    } catch (error) {
      console.error("Error fetching request details:", error)
      toast({
        title: "Error",
        description: "Gagal memuat detail permintaan. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  }

  const handleCloseDetails = () => {
    setSelectedRequest(null)
  }

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-[60px] ml-auto" /></TableCell>
      </TableRow>
    ))
  }

  // Render skeleton cards
  const renderCardSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Card key={`card-skeleton-${index}`} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-[80px]" />
            <Skeleton className="h-5 w-[100px]" />
          </div>
          <Skeleton className="h-5 w-full mt-2" />
          <Skeleton className="h-4 w-[150px] mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    ))
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/participant/tests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Permintaan Saya</h1>
        </div>
        <Button asChild>
          <Link href="/participant/tests/request">
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajukan Permintaan Baru
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Riwayat Permintaan</CardTitle>
          <CardDescription>Lihat status dan riwayat permintaan ujian Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="denied">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="list">Tampilan Daftar</TabsTrigger>
              <TabsTrigger value="cards">Tampilan Kartu</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ujian</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      renderSkeletons()
                    ) : requests.length > 0 ? (
                      requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.testTitle}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {request.type === "application" ? "Aplikasi Baru" : "Ujian Ulang"}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.requestDate}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.status === "pending"
                                  ? "outline"
                                  : request.status === "approved"
                                    ? "default"
                                    : "destructive"
                              }
                            >
                              {request.status === "pending"
                                ? "Menunggu"
                                : request.status === "approved"
                                  ? "Disetujui"
                                  : "Ditolak"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleViewRequest(request.id)}>
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Tidak ada permintaan yang ditemukan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="cards">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  renderCardSkeletons()
                ) : requests.length > 0 ? (
                  requests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <Badge
                            variant={
                              request.status === "pending"
                                ? "outline"
                                : request.status === "approved"
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            {request.status === "pending"
                              ? "Menunggu"
                              : request.status === "approved"
                                ? "Disetujui"
                                : "Ditolak"}
                          </Badge>
                          <Badge variant="outline">
                            {request.type === "application" ? "Aplikasi Baru" : "Ujian Ulang"}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-2">{request.testTitle}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Diajukan pada {request.requestDate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm line-clamp-2 mb-4">{request.reason || "Tidak ada alasan yang disebutkan"}</p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleViewRequest(request.id)}
                        >
                          Lihat Detail
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 text-muted-foreground">
                    Tidak ada permintaan yang ditemukan.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={handleCloseDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detail Permintaan</DialogTitle>
              <DialogDescription>Permintaan untuk {selectedRequest.testTitle}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Informasi Ujian</h3>
                <div className="bg-muted p-3 rounded-md space-y-2">
                  <div className="text-sm font-medium">{selectedRequest.testTitle}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {selectedRequest.type === "application" ? "Aplikasi Baru" : "Ujian Ulang"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Alasan Permintaan</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{selectedRequest.reason || "Tidak ada alasan yang disebutkan"}</p>
                </div>
              </div>

              {selectedRequest.type === "retake" && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Riwayat Ujian</h3>
                  <div className="bg-muted p-3 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nilai Sebelumnya:</span>
                      <span className="text-sm font-medium">{selectedRequest.previousScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Jumlah Percobaan:</span>
                      <span className="text-sm font-medium">{selectedRequest.previousAttempts}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-1">Status Permintaan</h3>
                <div className="bg-muted p-3 rounded-md flex items-center gap-2">
                  {selectedRequest.status === "pending" ? (
                    <>
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Menunggu Persetujuan</span>
                    </>
                  ) : selectedRequest.status === "approved" ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Disetujui pada {selectedRequest.approvedDate}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Ditolak pada {selectedRequest.approvedDate}</span>
                    </>
                  )}
                </div>
              </div>

              {selectedRequest.feedback && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Umpan Balik</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{selectedRequest.feedback}</p>
                  </div>
                </div>
              )}

              {selectedRequest.status === "approved" && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Tindakan</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm mb-2">Ujian ini telah disetujui dan tersedia untuk Anda ikuti.</p>
                    <Button size="sm" asChild>
                      <Link href={`/participant/tests/${selectedRequest.testId}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Lihat Ujian
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDetails}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
