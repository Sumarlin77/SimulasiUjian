"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Save, User } from "lucide-react"

export default function ProfilePage() {
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileFormLoading, setProfileFormLoading] = useState(false)
  const [passwordFormLoading, setPasswordFormLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    universityName: "",
    major: ""
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const { toast } = useToast()

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await fetch("/api/users/profile")

      if (!response.ok) {
        throw new Error("Failed to fetch user profile")
      }

      const userData = await response.json()
      setUser(userData)

      // Split name into first and last name for the form
      const nameParts = userData.name.split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      setFormData({
        firstName,
        lastName,
        universityName: userData.universityName || "",
        major: userData.major || ""
      })

      setError(null)
    } catch (err) {
      console.error("Error fetching user profile:", err)
      setError("Failed to load user profile. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load user profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileFormLoading(true)

    try {
      // Combine first and last name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: fullName,
          universityName: formData.universityName,
          major: formData.major
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      // Update the local user state with the response
      const updatedUser = await response.json()
      setUser((prev: any) => ({
        ...prev,
        name: updatedUser.name,
        universityName: updatedUser.universityName,
        major: updatedUser.major
      }))

      toast({
        title: "Profil diperbarui",
        description: "Informasi profil Anda telah berhasil diperbarui.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Gagal memperbarui profil",
        description: "Terjadi kesalahan saat memperbarui profil Anda.",
        variant: "destructive",
      })
    } finally {
      setProfileFormLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordFormLoading(true)

    try {
      const response = await fetch("/api/users/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(passwordData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error?.currentPassword) {
          throw new Error("Kata sandi saat ini tidak benar")
        } else if (errorData.error?.confirmPassword) {
          throw new Error("Kata sandi baru dan konfirmasi kata sandi tidak sama")
        } else {
          throw new Error(errorData.error || "Failed to update password")
        }
      }

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      toast({
        title: "Kata sandi diperbarui",
        description: "Kata sandi Anda telah berhasil diperbarui.",
      })
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast({
        title: "Gagal memperbarui kata sandi",
        description: error.message || "Terjadi kesalahan saat memperbarui kata sandi Anda.",
        variant: "destructive",
      })
    } finally {
      setPasswordFormLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data profil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button onClick={fetchUserProfile} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-6">
        <Link
          href="/participant/dashboard"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Kembali</span>
        </Link>
        <h1 className="text-3xl font-bold">Profil Saya</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>
            <CardTitle className="text-center mt-2">{user.name}</CardTitle>
            <CardDescription className="text-center">{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Peran</span>
                <span className="text-sm font-medium">
                  {user.role === "admin" ? "Admin" : "Peserta"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bergabung Sejak</span>
                <span className="text-sm font-medium">{user.joinDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ujian Diambil</span>
                <span className="text-sm font-medium">{user.testsTaken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rata-rata Skor</span>
                <span className="text-sm font-medium">{user.averageScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kampus</span>
                <span className="text-sm font-medium">{user.universityName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Jurusan</span>
                <span className="text-sm font-medium">{user.major || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pengaturan Akun</CardTitle>
            <CardDescription>Kelola informasi profil dan keamanan akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="password">Kata Sandi</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="mt-6">
                <form onSubmit={handleProfileUpdate}>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nama Depan</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nama Belakang</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user.email} disabled />
                      <p className="text-xs text-muted-foreground">
                        Email tidak dapat diubah. Hubungi administrator jika Anda perlu mengubah email.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="universityName">Nama Kampus</Label>
                      <Input
                        id="universityName"
                        value={formData.universityName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="major">Jurusan</Label>
                      <Input
                        id="major"
                        value={formData.major}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button type="submit" disabled={profileFormLoading}>
                      {profileFormLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Perubahan
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="password" className="mt-6">
                <form onSubmit={handlePasswordUpdate}>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button type="submit" disabled={passwordFormLoading}>
                      {passwordFormLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memperbarui...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Perbarui Kata Sandi
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

