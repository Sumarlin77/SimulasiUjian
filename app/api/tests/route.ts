import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// Test validation schema
const testSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  subject: z.string().min(2, "Subjek minimal 2 karakter"),
  duration: z.number().int().positive("Durasi harus lebih dari 0 menit"),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  isActive: z.boolean().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  randomizeQuestions: z.boolean().optional(),
  questionSetId: z.string().min(1, "ID set soal diperlukan"),
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
    const subject = searchParams.get("subject");
    const isActive = searchParams.get("isActive") === "true";
    const isUpcoming = searchParams.get("isUpcoming") === "true";
    const isPast = searchParams.get("isPast") === "true";

    // Prepare filter
    const filter: any = {};

    // For participants, only show active and upcoming tests
    if (session.role === "PARTICIPANT") {
      if (isActive) {
        filter.isActive = true;
        filter.startTime = { lte: new Date() };
        filter.endTime = { gte: new Date() };
      } else if (isUpcoming) {
        filter.startTime = { gt: new Date() };
      } else if (isPast) {
        // For past tests, check if the participant has attempted them
        const participantAttempts = await prisma.testAttempt.findMany({
          where: { userId: session.id },
          select: { testId: true },
        });

        const testIds = participantAttempts.map(attempt => attempt.testId);
        filter.id = { in: testIds };
      } else {
        // By default, show active and upcoming tests for participants
        filter.OR = [
          {
            isActive: true,
            startTime: { lte: new Date() },
            endTime: { gte: new Date() },
          },
          {
            startTime: { gt: new Date() },
          },
        ];
      }
    } else if (session.role === "ADMIN") {
      // Admins can filter tests they created
      filter.createdById = searchParams.get("createdById") || session.id;

      if (isActive) {
        filter.isActive = true;
        filter.startTime = { lte: new Date() };
        filter.endTime = { gte: new Date() };
      } else if (isUpcoming) {
        filter.startTime = { gt: new Date() };
      } else if (isPast) {
        filter.endTime = { lt: new Date() };
      }
    }

    // Add subject filter if provided
    if (subject) {
      filter.subject = subject;
    }

    // Get total count
    const total = await prisma.test.count({ where: filter });

    // Get tests with pagination
    const tests = await prisma.test.findMany({
      where: filter,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        questionSet: {
          select: {
            id: true,
            title: true,
            subject: true,
            _count: {
              select: { questions: true },
            },
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: [
        { startTime: "asc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      tests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tests error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Only admins can create tests
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = testSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      subject,
      duration,
      startTime,
      endTime,
      isActive = false,
      passingScore = 60,
      randomizeQuestions = false,
      questionSetId,
    } = validation.data;

    // Check if end time is after start time
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "Waktu selesai harus setelah waktu mulai" },
        { status: 400 }
      );
    }

    // Check if question set exists
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: questionSetId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!questionSet) {
      return NextResponse.json(
        { error: "Set soal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if question set has questions
    if (questionSet._count.questions === 0) {
      return NextResponse.json(
        { error: "Set soal tidak memiliki soal" },
        { status: 400 }
      );
    }

    // Create test
    const test = await prisma.test.create({
      data: {
        title,
        description,
        subject,
        duration,
        startTime: startDate,
        endTime: endDate,
        isActive,
        passingScore,
        randomizeQuestions,
        createdById: session.id,
        questionSetId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        questionSet: {
          select: {
            id: true,
            title: true,
            subject: true,
            _count: {
              select: { questions: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error("Create test error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
