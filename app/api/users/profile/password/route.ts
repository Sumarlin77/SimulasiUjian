import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword, verifyPassword } from '@/lib/auth'
import { z } from "zod"

// Validation schema for password update
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Kata sandi saat ini diperlukan"),
  newPassword: z.string().min(8, "Kata sandi baru harus minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi kata sandi diperlukan"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Kata sandi baru dan konfirmasi kata sandi harus sama",
  path: ["confirmPassword"],
})

// PUT endpoint to update the current user's password
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getSession()

    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updatePasswordSchema.safeParse(body)

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ error: validation.error.format() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { currentPassword, newPassword } = validation.data

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        password: true
      }
    })

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password)
    if (!isValid) {
      return new NextResponse(JSON.stringify({ error: { currentPassword: ["Kata sandi saat ini tidak benar"] } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password in database
    await prisma.user.update({
      where: { id: session.id },
      data: {
        password: hashedPassword
      }
    })

    return NextResponse.json({ success: true, message: "Kata sandi berhasil diperbarui" })
  } catch (error) {
    console.error('Error updating password:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
