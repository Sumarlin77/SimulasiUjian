import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getSession()

    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Only admins or the user themselves can access user details
    if (session.role !== 'ADMIN' && session.id !== params.id) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const userId = params.id

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

        // Get count of test attempts
        _count: {
          select: {
            testsAttempted: true
          }
        },

        // Get the latest test attempt for "last active" information
        testsAttempted: {
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Format the data to match the expected structure by the client
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'admin' : 'participant',
      status: 'active', // Status field not in schema, default to active
      testsTaken: user._count.testsAttempted,
      lastActive: user.testsAttempted[0]?.updatedAt.toISOString().split('T')[0] || user.updatedAt.toISOString().split('T')[0],
      universityName: user.universityName || '',
      major: user.major || '',
      joinDate: user.createdAt.toISOString().split('T')[0],
      bio: '', // Bio field not in schema
      phoneNumber: '', // Phone number field not in schema
      address: '' // Address field not in schema
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
