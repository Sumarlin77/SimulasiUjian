"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "participant",
    universityName: "",
    major: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error("Nama, email, dan password diperlukan")
      }

      // Submit form
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Terjadi kesalahan")
      }

      // Redirect to users page
      router.push("/admin/users")
    } catch (err) {
      console.error("Error adding user:", err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
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
        <h1 className="text-3xl font-bold">Tambah Pengguna Baru</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Informasi Pengguna</CardTitle>
            <CardDescription>Masukkan detail pengguna baru</CardDescription>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pengguna baru akan dapat segera masuk ke platform setelah akun dibuat. Pastikan informasi yang diberikan sudah benar.
              </p>

              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Peran Pengguna:</h3>
                <ul className="mt-2 text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Peserta:</span> Dapat mengikuti ujian dan melihat hasil mereka.
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Administrator:</span> Dapat mengelola pengguna, soal, ujian, dan melihat semua hasil.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
