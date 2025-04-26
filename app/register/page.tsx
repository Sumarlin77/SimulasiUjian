"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
// First, import the Eye and EyeOff icons from lucide-react
import { ArrowLeft, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  // Add state variables for password visibility after the existing state declarations
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)

      const firstName = formData.get("first-name") as string
      const lastName = formData.get("last-name") as string
      const name = `${firstName} ${lastName}`.trim()
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const confirmPassword = formData.get("confirm-password") as string
      const universityName = formData.get("university-name") as string
      const major = formData.get("major") as string

      // Validasi password
      if (password !== confirmPassword) {
        throw new Error("Kata sandi dan konfirmasi kata sandi tidak cocok")
      }

      // Panggil API register
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "participant",
          universityName,
          major,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan saat pendaftaran")
      }

      // Simpan data pengguna (dalam aplikasi nyata, kita akan menyimpan token)
      localStorage.setItem("user", JSON.stringify(data.user))

      // Tampilkan toast sukses
      toast({
        title: "Pendaftaran berhasil",
        description: "Akun Anda telah berhasil dibuat.",
      })

      // Redirect ke dashboard
      setTimeout(() => {
        router.push("/participant/dashboard")
      }, 500)
    } catch (error) {
      console.error("Register error:", error)
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat pendaftaran")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <div className="container flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          {/* Left side - Form */}
          <div className="w-full md:w-3/5 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Kembali</span>
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sudah punya akun?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Masuk
                </Link>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Buat Akun Baru</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Daftar untuk mengakses platform ujian online dan tingkatkan kemampuan Anda
              </p>
            </div>

            {error && (
              <div
                className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
                role="alert"
              >
                <div className="flex">
                  <div className="py-1">
                    <svg
                      className="h-5 w-5 text-red-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium">Pendaftaran gagal!</span>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-gray-700 dark:text-gray-300">
                    Nama Depan
                  </Label>
                  <Input
                    id="first-name"
                    name="first-name"
                    placeholder="Masukkan nama depan"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-gray-700 dark:text-gray-300">
                    Nama Belakang
                  </Label>
                  <Input
                    id="last-name"
                    name="last-name"
                    placeholder="Masukkan nama belakang"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contoh@email.com"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university-name" className="text-gray-700 dark:text-gray-300">
                  Nama Kampus
                </Label>
                <Input
                  id="university-name"
                  name="university-name"
                  placeholder="Masukkan nama kampus Anda"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="major" className="text-gray-700 dark:text-gray-300">
                  Jurusan
                </Label>
                <Input
                  id="major"
                  name="major"
                  placeholder="Masukkan jurusan Anda"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Replace the password input field with this updated version that includes the visibility toggle */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                    Kata Sandi
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Replace the confirm password input field with this updated version that includes the visibility toggle */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300">
                    Konfirmasi Kata Sandi
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi kata sandi"
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full py-6 bg-primary hover:bg-primary-600 text-primary-foreground font-medium rounded-lg transition-colors"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mendaftarkan Akun...
                    </>
                  ) : (
                    "Daftar Sekarang"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link href="#" className="underline">
                Syarat dan Ketentuan
              </Link>{" "}
              serta{" "}
              <Link href="#" className="underline">
                Kebijakan Privasi
              </Link>{" "}
              kami.
            </div>
          </div>

          {/* Right side - Illustration/Info */}
          <div className="hidden md:block md:w-2/5 bg-gradient-to-br from-primary-900 to-primary-500 dark:from-primary-900 dark:to-primary-700 p-8 text-white">
            <div className="h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-6">Bergabunglah dengan Platform Ujian Online Terbaik</h3>
                <p className="mb-8">
                  Akses berbagai ujian dan tingkatkan kemampuan akademik Anda dengan fitur-fitur unggulan kami.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-primary-50 mt-0.5" />
                  <p>Akses ke berbagai jenis ujian dari berbagai mata pelajaran</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-200 mt-0.5" />
                  <p>Analisis performa dan laporan hasil yang detail</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-200 mt-0.5" />
                  <p>Latihan soal dan pembahasan dari para ahli</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-200 mt-0.5" />
                  <p>Persiapkan diri untuk ujian nasional dan seleksi perguruan tinggi</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-blue-400 dark:border-blue-800">
                <div className="flex items-center justify-center space-x-4">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
