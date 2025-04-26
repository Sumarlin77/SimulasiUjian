"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowLeft, FileText, Loader2, Mail, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  status: string
  testsTaken: number
  lastActive: string
  universityName: string
  major: string
  joinDate: string
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const userId = params.id

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "participant",
    universityName: "",
    major: "",
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/admin/users/${userId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch user')
        }

        const userData = await response.json()
        setUser(userData)

        // Initialize form data
        setFormData({
          name: userData.name,
          email: userData.email,
          password: "", // Don't set password from API
          role: userData.role,
          universityName: userData.universityName || "",
          major: userData.major || "",
        })

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // Prepare data for submission (only include password if it was changed)
      const submitData: {
        name: string;
        email: string;
        password?: string; // Make password optional
        role: string;
        universityName: string;
        major: string;
      } = { ...formData }

      if (!submitData.password) {
        delete submitData.password
      }

      // Submit form
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Terjadi kesalahan")
      }

      // Update the user data
      const updatedUser = await response.json()
      setUser(updatedUser)

      // Reset password field
      setFormData(prev => ({ ...prev, password: "" }))

      alert("Profil pengguna berhasil diperbarui")
    } catch (err) {
      console.error("Error updating user:", err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      router.push('/admin/users')
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Gagal menghapus pengguna. Silakan coba lagi.')
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Memuat data...</span>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Pengguna tidak ditemukan"}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/admin/users">Kembali ke Daftar Pengguna</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href="/admin/users" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Pengguna
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Profil Pengguna</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Peran</p>
                  <p className="font-medium">{user.role === "admin" ? "Administrator" : "Peserta"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{user.status === "active" ? "Aktif" : "Tidak Aktif"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ujian Diambil</p>
                  <p className="font-medium">{user.testsTaken}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Terakhir Aktif</p>
                  <p className="font-medium">{user.lastActive}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bergabung</p>
                  <p className="font-medium">{user.joinDate}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
                Hapus Pengguna
              </Button>
              {user.role === "participant" && (
                <Button asChild variant="outline">
                  <Link href={`/admin/users/${user.id}/results`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Lihat Hasil
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>

          {user.role === "participant" && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Akademik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Kampus</p>
                  <p className="font-medium">{user.universityName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jurusan</p>
                  <p className="font-medium">{user.major || "-"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="edit">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="edit">Edit Profil</TabsTrigger>
              <TabsTrigger value="activity">Aktivitas</TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profil</CardTitle>
                  <CardDescription>Perbarui informasi pengguna</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-3">
                      <Label htmlFor="name">Nama</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Masukkan nama lengkap"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Masukkan alamat email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="password">Password Baru (opsional)</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Kosongkan jika tidak ingin mengubah"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="role">Peran</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => handleSelectChange("role", value)}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Pilih peran" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="participant">Peserta</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.role === "participant" && (
                      <>
                        <div className="grid gap-3">
                          <Label htmlFor="universityName">Kampus</Label>
                          <Input
                            id="universityName"
                            name="universityName"
                            placeholder="Masukkan nama kampus"
                            value={formData.universityName}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor="major">Jurusan</Label>
                          <Input
                            id="major"
                            name="major"
                            placeholder="Masukkan jurusan"
                            value={formData.major}
                            onChange={handleInputChange}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Perubahan
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Aktivitas Terbaru</CardTitle>
                  <CardDescription>Riwayat aktivitas pengguna</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10 text-muted-foreground">
                    {user.testsTaken > 0 ? (
                      <p>Terakhir aktif pada {user.lastActive}</p>
                    ) : (
                      <p>Pengguna belum memiliki aktivitas</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 
