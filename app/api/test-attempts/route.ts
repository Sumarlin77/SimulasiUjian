import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { TestStatus } from "@prisma/client";

// Test attempt validation schema for starting a test
const startTestSchema = z.object({
  testId: z.string().min(1, "ID ujian diperlukan"),
});

// Test attempt validation schema for submitting a test
const submitTestSchema = z.object({
  testAttemptId: z.string().min(1, "ID percobaan ujian diperlukan"),
  answers: z.array(
    z.object({
      questionId: z.string().min(1, "ID soal diperlukan"),
      answer: z.string(),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as TestStatus | null;
    const testId = searchParams.get("testId");

    // Prepare filter
    const filter: any = {};

    // Participants can only see their own attempts
    if (session.role === "PARTICIPANT") {
      filter.userId = session.id;
    } else if (session.role === "ADMIN") {
      // Admins can filter by user
      const userId = searchParams.get("userId");
      if (userId) {
        filter.userId = userId;
      }
    }

    // Add other filters
    if (status) {
      filter.status = status;
    }

    if (testId) {
      filter.testId = testId;
    }

    // Get total count
    const total = await prisma.testAttempt.count({ where: filter });

    // Get test attempts with pagination
    const testAttempts = await prisma.testAttempt.findMany({
      where: filter,
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
            id: true,
            title: true,
            subject: true,
            duration: true,
            passingScore: true,
          },
        },
        _count: {
          select: { answers: true },
        },
      },
      orderBy: { startTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      testAttempts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get test attempts error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

// Start a test
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = startTestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { testId } = validation.data;

    // Check if test exists and is active
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questionSet: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if test is active
    const now = new Date();
    if (
      !test.isActive ||
      new Date(test.startTime) > now ||
      new Date(test.endTime) < now
    ) {
      return NextResponse.json(
        { error: "Ujian tidak aktif atau di luar jadwal" },
        { status: 400 }
      );
    }

    // Check if user already has an in-progress attempt
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: session.id,
        testId,
        status: "IN_PROGRESS",
      },
    });

    if (existingAttempt) {
      return NextResponse.json({
        testAttempt: existingAttempt,
        message: "Anda sudah memulai ujian ini",
      });
    }

    // Check if user already completed the test and if retakes are allowed
    // For now, let's assume retakes are not allowed
    const completedAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: session.id,
        testId,
        status: {
          in: ["COMPLETED", "PASSED", "FAILED"],
        },
      },
    });

    if (completedAttempt) {
      return NextResponse.json(
        { error: "Anda sudah menyelesaikan ujian ini" },
        { status: 400 }
      );
    }

    // Create test attempt
    const testAttempt = await prisma.testAttempt.create({
      data: {
        userId: session.id,
        testId,
        startTime: now,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ testAttempt }, { status: 201 });
  } catch (error) {
    console.error("Start test error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

// Submit answers and complete a test
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = submitTestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { testAttemptId, answers } = validation.data;

    // Check if test attempt exists and belongs to user
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: testAttemptId },
      include: {
        test: {
          include: {
            questionSet: {
              include: {
                questions: true,
              },
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

    if (testAttempt.userId !== session.id) {
      return NextResponse.json(
        { error: "Percobaan ujian tidak valid" },
        { status: 403 }
      );
    }

    if (testAttempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Percobaan ujian sudah selesai" },
        { status: 400 }
      );
    }

    // Calculate score
    const questions = testAttempt.test.questionSet.questions;
    let totalPoints = 0;
    let earnedPoints = 0;

    // Create/update answers
    const answerCreatePromises = answers.map(async (answer) => {
      const question = questions.find((q) => q.id === answer.questionId);

      if (!question) return null;

      totalPoints += question.points;

      // Check if answer is correct (for multiple choice)
      let isCorrect = false;
      let score = 0;

      if (question.type === "MULTIPLE_CHOICE" && question.correctAnswer) {
        isCorrect = answer.answer === question.correctAnswer;
        score = isCorrect ? question.points : 0;
        earnedPoints += score;
      } else if (question.type === "ESSAY") {
        // For essays, scoring will be done manually
        isCorrect = null;
        score = null;
      }

      return prisma.answer.create({
        data: {
          testAttemptId,
          questionId: question.id,
          answer: answer.answer,
          isCorrect,
          score,
        },
      });
    });

    await Promise.all(answerCreatePromises.filter(Boolean));

    // Calculate percentage score
    const percentageScore = totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100)
      : 0;

    // Determine test status
    const status = percentageScore >= testAttempt.test.passingScore
      ? "PASSED"
      : "FAILED";

    // Update test attempt
    const updatedTestAttempt = await prisma.testAttempt.update({
      where: { id: testAttemptId },
      data: {
        endTime: new Date(),
        score: percentageScore,
        status,
      },
      include: {
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

    return NextResponse.json({
      testAttempt: updatedTestAttempt,
      message: `Ujian berhasil diselesaikan dengan nilai ${percentageScore}%`,
    });
  } catch (error) {
    console.error("Submit test error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
