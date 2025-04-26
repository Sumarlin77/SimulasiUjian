import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TestStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get the test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        test: {
          include: {
            questionSet: {
              select: {
                id: true,
                title: true,
                subject: true,
                questions: {
                  select: {
                    id: true,
                    text: true,
                    type: true,
                    options: true,
                    // Only include correct answers and explanations for admins or completed tests
                    ...(session.role === "ADMIN" && {
                      correctAnswer: true,
                      explanation: true,
                    }),
                    points: true,
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            question: {
              createdAt: "asc",
            },
          },
        },
      },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { error: "Percobaan ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Participants can only see their own attempts
    if (
      session.role === "PARTICIPANT" &&
      testAttempt.userId !== session.id
    ) {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    // For participants with in-progress tests, add correct answers to their own completed tests
    if (
      session.role === "PARTICIPANT" &&
      testAttempt.status !== "IN_PROGRESS"
    ) {
      // Include correct answers and explanations for completed tests
      const testWithCorrectAnswers = await prisma.testAttempt.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          test: {
            include: {
              questionSet: {
                select: {
                  id: true,
                  title: true,
                  subject: true,
                  questions: {
                    select: {
                      id: true,
                      text: true,
                      type: true,
                      options: true,
                      correctAnswer: true,
                      explanation: true,
                      points: true,
                    },
                    orderBy: {
                      createdAt: "asc",
                    },
                  },
                },
              },
            },
          },
          answers: {
            include: {
              question: true,
            },
            orderBy: {
              question: {
                createdAt: "asc",
              },
            },
          },
        },
      });

      return NextResponse.json({ testAttempt: testWithCorrectAnswers });
    }

    return NextResponse.json({ testAttempt });
  } catch (error) {
    console.error("Get test attempt error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

// Admin can update test attempt status (e.g., grading essays)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Only admins can update test attempts
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Get the test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: true,
        answers: true,
      },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { error: "Percobaan ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Process answer updates if provided
    if (body.answers && Array.isArray(body.answers)) {
      const answerUpdates = body.answers.map(async (answerUpdate: any) => {
        const { id: answerId, score, isCorrect } = answerUpdate;

        if (!answerId) return null;

        // Find the answer in the test attempt
        const answer = testAttempt.answers.find((a) => a.id === answerId);

        if (!answer) return null;

        // Update the answer
        return prisma.answer.update({
          where: { id: answerId },
          data: {
            score: score !== undefined ? score : answer.score,
            isCorrect: isCorrect !== undefined ? isCorrect : answer.isCorrect,
          },
        });
      });

      await Promise.all(answerUpdates.filter(Boolean));

      // Recalculate the score if answers were updated
      if (answerUpdates.length > 0) {
        // Get all answers for this attempt
        const updatedAnswers = await prisma.answer.findMany({
          where: { testAttemptId: id },
        });

        // Calculate the total score
        const totalScore = updatedAnswers.reduce(
          (sum, answer) => sum + (answer.score || 0),
          0
        );

        // Get the total possible points
        const questions = await prisma.question.findMany({
          where: {
            id: { in: updatedAnswers.map((a) => a.questionId) },
          },
        });

        const totalPossiblePoints = questions.reduce(
          (sum, question) => sum + question.points,
          0
        );

        // Calculate percentage score
        const percentageScore = totalPossiblePoints > 0
          ? Math.round((totalScore / totalPossiblePoints) * 100)
          : 0;

        // Determine test status
        const status = percentageScore >= testAttempt.test.passingScore
          ? TestStatus.PASSED
          : TestStatus.FAILED;

        // Update test attempt
        body.score = percentageScore;
        body.status = status;
      }
    }

    // Update test attempt with other fields
    const { score, status } = body;

    const updatedTestAttempt = await prisma.testAttempt.update({
      where: { id },
      data: {
        score: score !== undefined ? score : testAttempt.score,
        status: status !== undefined ? status : testAttempt.status,
        ...(testAttempt.endTime === null && status
          && status !== TestStatus.IN_PROGRESS
          ? { endTime: new Date() }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        test: {
          select: {
            title: true,
            subject: true,
            passingScore: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    return NextResponse.json({ testAttempt: updatedTestAttempt });
  } catch (error) {
    console.error("Update test attempt error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
