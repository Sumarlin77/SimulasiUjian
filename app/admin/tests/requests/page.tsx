"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, CheckCircle, Clock, Search, User, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function TestRequestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean
    action: "approve" | "deny" | null
    feedback: string
  }>({
    open: false,
    action: null,
    feedback: "",
  })
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch test requests from the API
  useEffect(() => {
    fetchRequests()
  }, [searchTerm, statusFilter, typeFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append("searchTerm", searchTerm)
      if (statusFilter !== "all") queryParams.append("statusFilter", statusFilter)
      if (typeFilter !== "all") queryParams.append("typeFilter", typeFilter)

      const response = await fetch(`/api/admin/tests/requests?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error("Gagal memuat permintaan ujian")
      }

      const data = await response.json()
      setRequests(data.data)
      setError(null)
    } catch (err) {
      console.error("Error fetching test requests:", err)
      setError("Gagal memuat permintaan ujian. Silakan coba lagi.")
      toast({
        title: "Error",
        description: "Gagal memuat permintaan ujian. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request)
  }

  const handleCloseDetails = () => {
    setSelectedRequest(null)
  }

  const handleActionClick = (request: any, action: "approve" | "deny") => {
    setSelectedRequest(request)
    setFeedbackDialog({
      open: true,
      action,
      feedback: "",
    })
  }

  const handleFeedbackSubmit = async () => {
    try {
      // Get the current user's ID (in a real app, this would come from auth)
      // For now we'll use a placeholder
      const adminId = "admin-user-id" // In production, get this from auth context

      const response = await fetch("/api/admin/tests/requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedRequest?.id,
          action: feedbackDialog.action,
          feedback: feedbackDialog.feedback,
          adminId,
        }),
      })

      if (!response.ok) {
        throw new Error("Gagal memuat permintaan ujian")
      }

      const { data } = await response.json()

      // Update local state with the updated request
      setRequests(prevRequests =>
        prevRequests.map(req => req.id === data.id ? data : req)
      )

      const actionText = feedbackDialog.action === "approve" ? "disetujui" : "ditolak"
      toast({
        title: `Permintaan ${actionText}`,
        description: `Permintaan dari ${selectedRequest?.userName} telah ${actionText}.`,
      })
    } catch (err) {
      console.error("Error updating test request:", err)
      toast({
        title: "Error",
        description: "Gagal memuat permintaan ujian. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setFeedbackDialog({
        open: false,
        action: null,
        feedback: "",
      })
      setSelectedRequest(null)
      // Refresh the requests
      fetchRequests()
    }
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Permintaan Ujian</h1>
      </div>

      <Tabs defaultValue="requests" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="all-tests" asChild>
            <Link href="/admin/tests">Semua Ujian</Link>
          </TabsTrigger>
          <TabsTrigger value="requests">Permintaan</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Kelola Permintaan</CardTitle>
              <CardDescription>Lihat dan kelola permintaan ujian dari peserta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama peserta atau ujian..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="denied">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="application">Aplikasi Baru</SelectItem>
                      <SelectItem value="retake">Ujian Ulang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                          <TableHead>Peserta</TableHead>
                          <TableHead>Ujian</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Tindakan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="ml-2">Memuat data...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : error ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-red-500">
                              {error}
                            </TableCell>
                          </TableRow>
                        ) : requests.length > 0 ? (
                          requests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.userName}</TableCell>
                              <TableCell>{request.testTitle}</TableCell>
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
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleViewRequest(request)}>
                                    Detail
                                  </Button>
                                  {request.status === "pending" && (
                                    <>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="bg-primary-600 hover:bg-primary-700"
                                        onClick={() => handleActionClick(request, "approve")}
                                      >
                                        Setujui
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleActionClick(request, "deny")}
                                      >
                                        Tolak
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
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
                      <div className="col-span-full flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Memuat data...</span>
                      </div>
                    ) : error ? (
                      <div className="col-span-full text-center py-10 text-red-500">
                        {error}
                      </div>
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
                              <User className="h-3 w-3" /> {request.userName}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                              <Calendar className="h-3 w-3" /> Diajukan pada {request.requestDate}
                            </div>
                            <p className="text-sm line-clamp-2 mb-4">{request.reason}</p>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewRequest(request)}>
                                Detail
                              </Button>
                              {request.status === "pending" && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-primary-600 hover:bg-primary-700"
                                    onClick={() => handleActionClick(request, "approve")}
                                  >
                                    Setujui
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleActionClick(request, "deny")}
                                  >
                                    Tolak
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
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
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={handleCloseDetails}>
          <DialogContent className="max-w-md md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Permintaan</DialogTitle>
              <DialogDescription>
                Permintaan dari {selectedRequest.userName} untuk {selectedRequest.testTitle}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Informasi Peserta</h3>
                  <div className="bg-muted p-3 rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedRequest.userName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{selectedRequest.userEmail}</div>
                  </div>
                </div>
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
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Alasan Permintaan</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{selectedRequest.reason}</p>
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
                      <span className="text-sm">
                        Disetujui pada {selectedRequest.approvedDate} oleh {selectedRequest.approvedBy}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">
                        Ditolak pada {selectedRequest.deniedDate} oleh {selectedRequest.deniedBy}
                      </span>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDetails}>
                Tutup
              </Button>
              {selectedRequest.status === "pending" && (
                <>
                  <Button
                    variant="default"
                    className="bg-primary-600 hover:bg-primary-700"
                    onClick={() => handleActionClick(selectedRequest, "approve")}
                  >
                    Setujui
                  </Button>
                  <Button variant="destructive" onClick={() => handleActionClick(selectedRequest, "deny")}>
                    Tolak
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ ...feedbackDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{feedbackDialog.action === "approve" ? "Setujui Permintaan" : "Tolak Permintaan"}</DialogTitle>
            <DialogDescription>
              {feedbackDialog.action === "approve"
                ? "Berikan umpan balik opsional untuk peserta tentang permintaan yang disetujui."
                : "Berikan alasan mengapa permintaan ini ditolak."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="feedback">Umpan Balik</Label>
              <Textarea
                id="feedback"
                placeholder="Masukkan umpan balik untuk peserta..."
                value={feedbackDialog.feedback}
                onChange={(e) => setFeedbackDialog({ ...feedbackDialog, feedback: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialog({ open: false, action: null, feedback: "" })}>
              Batal
            </Button>
            <Button
              variant={feedbackDialog.action === "approve" ? "default" : "destructive"}
              onClick={handleFeedbackSubmit}
              className={feedbackDialog.action === "approve" ? "bg-primary-600 hover:bg-primary-700" : ""}
            >
              {feedbackDialog.action === "approve" ? "Setujui" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
