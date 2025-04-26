import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for saving answers
const saveAnswersSchema = z.object({
  answers: z.record(z.string(), z.string())
})

// Validation schema for submitting test
const submitTestSchema = z.object({
  answers: z.record(z.string(), z.string())
})

// GET endpoint to retrieve current answers for a test attempt
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

    const attemptId = params.id

    // Get test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true
      }
    })

    if (!testAttempt) {
      return new NextResponse(JSON.stringify({ error: 'Test attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if this attempt belongs to the user
    if (testAttempt.userId !== session.id) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Format answers as a map of questionId -> answer
    const answers = testAttempt.answers.reduce((acc, answer) => {
      acc[answer.questionId] = answer.answer
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json({ answers })
  } catch (error) {
    console.error('Error fetching test attempt answers:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT endpoint to save answers for an ongoing test attempt
export async function PUT(
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

    const attemptId = params.id

    // Get test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId }
    })

    if (!testAttempt) {
      return new NextResponse(JSON.stringify({ error: 'Test attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if this attempt belongs to the user
    if (testAttempt.userId !== session.id) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if test is still in progress
    if (testAttempt.status !== "IN_PROGRESS") {
      return new NextResponse(JSON.stringify({ error: 'Test attempt is already completed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = saveAnswersSchema.safeParse(body)

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ error: validation.error.format() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { answers } = validation.data

    // Save or update answers
    for (const [questionId, answer] of Object.entries(answers)) {
      await prisma.answer.upsert({
        where: {
          testAttemptId_questionId: {
            testAttemptId: attemptId,
            questionId
          }
        },
        create: {
          testAttemptId: attemptId,
          questionId,
          answer
        },
        update: {
          answer
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving test answers:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST endpoint to submit and grade a test
export async function POST(
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

    const attemptId = params.id

    // Get test attempt with test and answers
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: true,
        answers: {
          include: {
            question: true
          }
        }
      }
    })

    if (!testAttempt) {
      return new NextResponse(JSON.stringify({ error: 'Test attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if this attempt belongs to the user
    if (testAttempt.userId !== session.id) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if test is still in progress
    if (testAttempt.status !== "IN_PROGRESS") {
      return new NextResponse(JSON.stringify({ error: 'Test attempt is already completed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse and validate any final answers
    const body = await request.json()
    const validation = submitTestSchema.safeParse(body)

    if (validation.success) {
      const { answers } = validation.data

      // Save any final answers
      for (const [questionId, answer] of Object.entries(answers)) {
        await prisma.answer.upsert({
          where: {
            testAttemptId_questionId: {
              testAttemptId: attemptId,
              questionId
            }
          },
          create: {
            testAttemptId: attemptId,
            questionId,
            answer
          },
          update: {
            answer
          }
        })
      }
    }

    // Get all questions from the test to calculate total possible score
    const allQuestions = await prisma.question.findMany({
      where: {
        questionSetId: testAttempt.test.questionSetId
      },
      select: {
        id: true,
        correctAnswer: true,
        points: true
      }
    })

    // Grade each answer
    let totalScore = 0
    let totalPossibleScore = 0

    // Update all answers with correct/incorrect status
    for (const question of allQuestions) {
      // Default to 1 point if no points specified
      const questionPoints = question.points || 1
      totalPossibleScore += questionPoints

      // Find if user answered this question
      const userAnswer = testAttempt.answers.find(a => a.questionId === question.id)

      // Only mark as correct if the question has a correctAnswer and it matches the user's answer
      if (userAnswer && question.correctAnswer && userAnswer.answer === question.correctAnswer) {
        totalScore += questionPoints

        // Mark answer as correct
        await prisma.answer.update({
          where: {
            id: userAnswer.id
          },
          data: {
            isCorrect: true,
            score: questionPoints
          }
        })
      } else if (userAnswer) {
        // Mark answer as incorrect
        await prisma.answer.update({
          where: {
            id: userAnswer.id
          },
          data: {
            isCorrect: false,
            score: 0
          }
        })
      }
    }

    // Calculate percentage score (avoid division by zero)
    const percentageScore = totalPossibleScore > 0
      ? Math.round((totalScore / totalPossibleScore) * 100)
      : 0

    // Determine if passed (default to 60% if not specified)
    const passingScore = testAttempt.test.passingScore || 60
    const passed = percentageScore >= passingScore

    // Update test attempt with results
    const updatedAttempt = await prisma.testAttempt.update({
      where: {
        id: attemptId
      },
      data: {
        status: passed ? "PASSED" : "FAILED",
        score: percentageScore,
        endTime: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      score: percentageScore,
      passed,
      attemptId: updatedAttempt.id
    })
  } catch (error) {
    console.error('Error submitting test:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
