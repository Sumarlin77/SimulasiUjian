import { type NextRequest, NextResponse } from "next/server"
import { login } from "@/lib/auth"
import { z } from "zod"
import { cookies } from "next/headers"

// Login input validation schema
const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Authenticate user
    const result = await login(email, password)

    if (!result) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak valid" },
        { status: 401 }
      )
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: result.user
    });

    // Set cookie in the response with more compatible settings
    response.cookies.set({
      name: "token",
      value: result.token,
      httpOnly: true,
      secure: false, // Set to false during development
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax", // Changed from strict to lax for better compatibility
    });

    return response;
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    )
  }
}
