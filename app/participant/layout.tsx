import type React from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

const navItems = [
  {
    title: "Dasbor",
    href: "/participant/dashboard",
  },
  {
    title: "Ujian",
    href: "/participant/tests",
  },
  {
    title: "Hasil",
    href: "/participant/results",
  },
]

// Mock user data
const user = {
  name: "John Doe",
  email: "john@example.com",
}

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MainNav items={navItems} />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav user={user} />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
