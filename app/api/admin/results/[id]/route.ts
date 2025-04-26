import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TestStatus } from "@prisma/client";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Only admins can access this endpoint
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get the test attempt with all related data
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        user: true,
        test: {
          include: {
            questionSet: {
              include: {
                questions: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { error: "Hasil ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculate duration and time spent
    const startTime = new Date(testAttempt.startTime);
    const endTime = testAttempt.endTime
      ? new Date(testAttempt.endTime)
      : new Date();

    const durationInMinutes = testAttempt.test.duration;
    const timeSpentInMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    // Process questions and answers into the format needed by the UI
    const questionsWithAnswers = testAttempt.test.questionSet.questions.map(question => {
      const userAnswer = testAttempt.answers.find(answer => answer.questionId === question.id);

      // Parse options from JSON
      const options = question.options ? JSON.parse(JSON.stringify(question.options)) : [];

      return {
        id: question.id,
        text: question.text,
        options,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer?.answer || "",
        isCorrect: userAnswer?.isCorrect || false,
        explanation: question.explanation || "Tidak ada penjelasan",
      };
    });

    // Calculate stats
    const totalQuestions = questionsWithAnswers.length;
    const answeredQuestions = testAttempt.answers.length;
    const correctAnswers = testAttempt.answers.filter(answer => answer.isCorrect).length;
    const incorrectAnswers = answeredQuestions - correctAnswers;
    const skippedQuestions = totalQuestions - answeredQuestions;
    const timePerQuestion = totalQuestions > 0
      ? (timeSpentInMinutes / totalQuestions).toFixed(1)
      : 0;

    // Format the result data for frontend
    const formattedResult = {
      id: testAttempt.id,
      testId: testAttempt.testId,
      testTitle: testAttempt.test.title,
      subject: testAttempt.test.subject,
      date: format(startTime, "dd-MM-yyyy"),
      startTime: format(startTime, "HH:mm"),
      endTime: format(endTime, "HH:mm"),
      duration: `${durationInMinutes} menit`,
      timeSpent: `${timeSpentInMinutes} menit`,
      score: testAttempt.score || 0,
      totalScore: 100, // Assuming total score is normalized to 100
      status: testAttempt.status === TestStatus.PASSED ? "Lulus" : "Gagal",
      passingScore: testAttempt.test.passingScore,
      user: {
        id: testAttempt.user.id,
        name: testAttempt.user.name,
        email: testAttempt.user.email,
        role: testAttempt.user.role.toLowerCase(),
      },
      questions: questionsWithAnswers,
      stats: {
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        timePerQuestion: `${timePerQuestion} menit`,
      },
    };

    return NextResponse.json(formattedResult);
  } catch (error) {
    console.error("Get test attempt result error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Only admins can delete test attempts
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if test attempt exists
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { error: "Hasil ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete test attempt (answers will be deleted via cascade)
    await prisma.testAttempt.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Hasil ujian berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete test attempt error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
