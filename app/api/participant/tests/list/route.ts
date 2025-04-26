import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET endpoint to fetch available tests and completed tests for the current user
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

    // Get current date
    const now = new Date()

    // Get available tests (active tests with future end time)
    const availableTests = await prisma.test.findMany({
      where: {
        isActive: true,
        endTime: {
          gte: now
        },
        // Optional: exclude tests the user has already completed
        NOT: {
          attempts: {
            some: {
              userId: session.id,
              NOT: {
                status: "IN_PROGRESS"
              }
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        subject: true,
        startTime: true,
        endTime: true,
        duration: true,
        questionSet: {
          select: {
            questions: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Get completed tests for the user
    const completedTests = await prisma.testAttempt.findMany({
      where: {
        userId: session.id,
        status: {
          in: ["COMPLETED", "PASSED", "FAILED"]
        },
        endTime: {
          not: null
        }
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            subject: true
          }
        }
      },
      orderBy: {
        endTime: 'desc'
      }
    })

    // Format the data for the frontend
    const formattedAvailableTests = availableTests.map(test => {
      const startTime = test.startTime
      const formattedDate = startTime.toISOString().split('T')[0].split('-').reverse().join('-')
      const formattedTime = startTime.toTimeString().substring(0, 5)

      return {
        id: test.id,
        title: test.title,
        subject: test.subject,
        date: formattedDate,
        time: formattedTime,
        duration: `${test.duration} menit`,
        questions: test.questionSet.questions.length,
        status: now < test.startTime ? "upcoming" : "active"
      }
    })

    const formattedCompletedTests = completedTests.map(attempt => {
      const endTime = attempt.endTime || new Date()
      const formattedDate = endTime.toISOString().split('T')[0].split('-').reverse().join('-')

      return {
        id: attempt.id,
        testId: attempt.test.id,
        title: attempt.test.title,
        subject: attempt.test.subject,
        date: formattedDate,
        score: `${attempt.score || 0}/100`,
        status: "completed"
      }
    })

    return NextResponse.json({
      availableTests: formattedAvailableTests,
      completedTests: formattedCompletedTests
    })
  } catch (error) {
    console.error('Error fetching tests:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
