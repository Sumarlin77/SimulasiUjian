import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET endpoint to fetch the current user's test results
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

    // Get test attempts from database
    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        userId: session.id,
        NOT: { status: "IN_PROGRESS" } // Only completed attempts
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            subject: true,
            passingScore: true
          }
        }
      },
      orderBy: {
        endTime: 'desc'
      }
    })

    // Format the results
    const formattedResults = testAttempts.map(attempt => {
      const isPassed = attempt.status === "PASSED" ||
        (attempt.score && attempt.test.passingScore &&
          attempt.score >= attempt.test.passingScore);

      return {
        id: attempt.id,
        testId: attempt.test.id,
        title: attempt.test.title,
        date: attempt.endTime ? attempt.endTime.toISOString().split('T')[0] :
          attempt.createdAt.toISOString().split('T')[0],
        score: attempt.score || 0,
        totalScore: 100, // Assuming total score is always 100
        status: isPassed ? "Lulus" : "Gagal",
        subject: attempt.test.subject
      }
    })

    // Calculate performance metrics
    const metrics = {
      totalAttempts: formattedResults.length,
      averageScore: formattedResults.length > 0
        ? Math.round(formattedResults.reduce((acc, result) => acc + result.score, 0) / formattedResults.length)
        : 0,
      highestScore: formattedResults.length > 0
        ? Math.max(...formattedResults.map(result => result.score))
        : 0,
      passRate: formattedResults.length > 0
        ? Math.round((formattedResults.filter(result => result.status === "Lulus").length / formattedResults.length) * 100)
        : 0
    }

    return NextResponse.json({
      results: formattedResults,
      metrics
    })
  } catch (error) {
    console.error('Error fetching test results:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
