import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Image src="/logo/logo2.jpg" alt="UMPTKIN Logo" width={32} height={32} className="rounded-full" />
              <span className="font-bold text-2xl">Simulasi Umptkin 2025</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-base">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-base">Daftar</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-b from-background to-primary-50/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Platform Ujian Online Terbaik
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
                    Buat, kelola, dan ikuti ujian dengan mudah. Sempurna untuk institusi pendidikan, program pelatihan,
                    dan ujian sertifikasi.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="w-full text-base">
                      Mulai Sekarang
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full text-base">
                      Masuk
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full max-w-[450px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg opacity-70 blur-2xl"></div>
                  <div className="relative h-full w-full bg-background rounded-lg shadow-lg p-6 flex flex-col justify-between border">
                    <div className="space-y-4">
                      <div className="h-5 w-3/4 bg-muted rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-2/3 bg-muted rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-10 bg-muted rounded"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-10 bg-muted rounded"></div>
                      </div>
                      <div className="h-10 bg-primary/10 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 md:py-24 bg-primary-50/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-[800px]">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Fitur Unggulan</h2>
                <p className="text-muted-foreground text-lg">
                  Semua yang Anda butuhkan untuk ujian online yang komprehensif
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-center space-y-3 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-500/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Ujian Aman</h3>
                <p className="text-center text-muted-foreground">
                  Autentikasi yang kuat dan lingkungan ujian yang aman
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center space-y-3 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-500/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M12 20v-6M6 20V10M18 20V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Analisis Detail</h3>
                <p className="text-center text-muted-foreground">Wawasan komprehensif tentang performa ujian</p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center space-y-3 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-500/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 9h6v6H9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Tipe Soal Fleksibel</h3>
                <p className="text-center text-muted-foreground">Mendukung pilihan ganda, teks, dan lainnya</p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center space-y-3 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-500/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Ujian Berbatas Waktu</h3>
                <p className="text-center text-muted-foreground">Atur batas waktu ujian dengan pengumpulan otomatis</p>
              </div>

              {/* Feature 5 */}
              <div className="flex flex-col items-center space-y-3 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-500/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Manajemen Pengguna</h3>
                <p className="text-center text-muted-foreground">Kelola peserta dan administrator dengan mudah</p>
              </div>

              {/* Feature 6 */}
              <div className="flex flex-col items-center space-y-3 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-500/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Bank Soal</h3>
                <p className="text-center text-muted-foreground">Buat dan organisasikan soal berdasarkan kategori</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-3 max-w-[800px]">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Siap Untuk Memulai?</h2>
                <p className="text-muted-foreground text-lg">
                  Daftar sekarang dan mulai buat ujian online Anda dalam hitungan menit.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="text-base bg-primary hover:bg-primary-600">
                    Daftar Gratis
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-base">
                    Pelajari Lebih Lanjut
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/50">
        <div className="container px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Simulasi Umptkin 2025</h3>
              <p className="text-sm text-muted-foreground">
                Platform ujian online terbaik untuk institusi pendidikan dan pelatihan.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Tautan</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Fitur
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Bantuan</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Kontak
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dukungan
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Syarat & Ketentuan
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                © 2025 Simulasi Umptkin 2025. Hak cipta dilindungi undang-undang.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Dibuat oleh</p>
              <span className="text-sm font-medium">anonymous</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
