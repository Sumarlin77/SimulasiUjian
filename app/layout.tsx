import type React from "react"
import "./globals.css"
import { ThemeProvider } from "../components/theme-provider"
import { Toaster } from "../components/toaster"

// Update the metadata title
export const metadata = {
  title: "Simulasi Umptkin 2025 - Platform Ujian Online",
  description: "Platform komprehensif untuk membuat dan mengikuti ujian online",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
