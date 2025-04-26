import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET endpoint to fetch detailed test result for a specific attempt
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

    // Get test attempt with answers, questions and test details
    const testAttempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            subject: true,
            duration: true,
            passingScore: true,
            questionSet: {
              select: {
                id: true
              }
            }
          }
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
                options: true,
                correctAnswer: true,
                explanation: true
              }
            }
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

    // Calculate time spent (in minutes)
    const startTime = testAttempt.startTime
    const endTime = testAttempt.endTime || new Date()
    const timeSpentMs = endTime.getTime() - startTime.getTime()
    const timeSpentMinutes = Math.round(timeSpentMs / (1000 * 60))

    // Format date
    const formattedDate = testAttempt.endTime ?
      testAttempt.endTime.toISOString().split('T')[0].split('-').reverse().join('-') :
      testAttempt.startTime.toISOString().split('T')[0].split('-').reverse().join('-')

    // Format questions with user answers
    const questions = testAttempt.answers.map(answer => {
      // Parse options if needed (they're stored as JSON)
      const options = answer.question.options as any
      const correctAnswer = answer.question.correctAnswer

      return {
        id: answer.question.id,
        text: answer.question.text,
        userAnswer: answer.answer,
        correctAnswer: correctAnswer,
        isCorrect: answer.isCorrect,
        explanation: answer.question.explanation || `Jawaban yang benar adalah: ${correctAnswer}`
      }
    })

    // Calculate statistics
    const totalQuestions = questions.length
    const correctAnswers = questions.filter(q => q.isCorrect).length
    const incorrectAnswers = totalQuestions - correctAnswers
    const scorePercentage = testAttempt.score || 0
    const isPassed = testAttempt.status === "PASSED" ||
      (scorePercentage >= (testAttempt.test.passingScore || 0))

    // Format the response
    const result = {
      id: testAttempt.id,
      testId: testAttempt.test.id,
      title: testAttempt.test.title,
      date: formattedDate,
      score: scorePercentage,
      totalScore: 100,
      status: isPassed ? "Lulus" : "Gagal",
      subject: testAttempt.test.subject,
      duration: `${testAttempt.test.duration} menit`,
      timeSpent: `${timeSpentMinutes} menit`,
      questions,
      correctAnswers,
      incorrectAnswers,
      accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching test result:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
