import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET endpoint to fetch a test with its questions
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

    const testId = params.id

    // Check if user already has an attempt in progress
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: session.id,
        testId: testId,
        status: "IN_PROGRESS"
      }
    })

    // Get test from database
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questionSet: {
          include: {
            questions: {
              select: {
                id: true,
                text: true,
                type: true,
                options: true
              }
            }
          }
        }
      }
    })

    if (!test) {
      return new NextResponse(JSON.stringify({ error: 'Test tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if test is active
    const now = new Date()
    if (!test.isActive || now < test.startTime || now > test.endTime) {
      return new NextResponse(JSON.stringify({ error: 'Test Belum Dimulai' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Format the response
    let questions = test.questionSet.questions.map(question => {
      // Parse options from JSON
      const options = question.options as any
      const formattedOptions = options ?
        Object.entries(options).map(([id, text]) => ({ id, text })) :
        []

      return {
        id: question.id,
        text: question.text,
        type: question.type,
        options: formattedOptions
      }
    })

    // If configured, randomize questions order
    if (test.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5)
    }

    // If no existing attempt, create a new one
    let attempt = existingAttempt
    if (!attempt) {
      attempt = await prisma.testAttempt.create({
        data: {
          userId: session.id,
          testId: testId,
          status: "IN_PROGRESS",
          startTime: new Date()
        }
      })
    }

    return NextResponse.json({
      id: test.id,
      attemptId: attempt.id,
      title: test.title,
      description: test.description,
      duration: test.duration, // Duration in minutes
      totalQuestions: questions.length,
      endTime: test.endTime.toISOString(),
      questions
    })
  } catch (error) {
    console.error('Error fetching test:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
