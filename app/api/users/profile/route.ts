import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from "zod"

// GET endpoint to fetch the current user's profile
export async function GET() {
  try {
    // Check authentication
    const session = await getSession()

    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        universityName: true,
        major: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password and other sensitive fields

        // Include count of test attempts
        _count: {
          select: {
            testsAttempted: true
          }
        },

        // Include test attempts for calculating average score
        testsAttempted: {
          select: {
            score: true,
            status: true
          },
          where: {
            status: "COMPLETED"
          }
        }
      }
    })

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Calculate average score from test attempts
    const completedTests = user.testsAttempted.filter(test => test.score !== null)
    const averageScore = completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, test) => sum + (test.score || 0), 0) / completedTests.length)
      : 0

    // Format the data to match the expected structure by the client
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      universityName: user.universityName || '',
      major: user.major || '',
      joinDate: user.createdAt.toISOString().split('T')[0],
      testsTaken: user._count.testsAttempted,
      averageScore
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Validation schema for updating profile
const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
  universityName: z.string().optional(),
  major: z.string().optional(),
})

// PUT endpoint to update the current user's profile
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
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ error: validation.error.format() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { name, universityName, major } = validation.data

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        name,
        universityName,
        major
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        universityName: true,
        major: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
