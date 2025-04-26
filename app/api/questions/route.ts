import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { QuestionType, Difficulty } from "@prisma/client";

// Question validation schema
const questionSchema = z.object({
  text: z.string().min(3, "Teks soal minimal 3 karakter"),
  type: z.nativeEnum(QuestionType),
  subject: z.string().min(2, "Subjek minimal 2 karakter"),
  difficulty: z.nativeEnum(Difficulty).optional(),
  options: z.any().optional(), // JSON object
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  points: z.number().int().positive().optional(),
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const subject = searchParams.get("subject");
    const type = searchParams.get("type") as QuestionType | null;
    const difficulty = searchParams.get("difficulty") as Difficulty | null;
    const questionSetId = searchParams.get("questionSetId");

    // Prepare filter
    const filter: any = {};

    // For participants, only show questions from question sets in tests they've taken
    if (session.role === "PARTICIPANT") {
      const participantTests = await prisma.testAttempt.findMany({
        where: { userId: session.id },
        select: { test: { select: { questionSetId: true } } },
      });

      const questionSetIds = participantTests.map(
        attempt => attempt.test.questionSetId
      );

      filter.questionSetId = { in: questionSetIds };
    }

    // Add other filters if provided
    if (subject) {
      filter.subject = subject;
    }

    if (type) {
      filter.type = type;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (questionSetId) {
      filter.questionSetId = questionSetId;
    }

    // Get total count
    const total = await prisma.question.count({ where: filter });

    // Get questions with pagination
    const questions = await prisma.question.findMany({
      where: filter,
      include: {
        questionSet: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get questions error:", error);
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

    // Only admins can create questions
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = questionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      text,
      type,
      subject,
      difficulty = Difficulty.MEDIUM,
      options,
      correctAnswer,
      explanation,
      points = 1,
      questionSetId,
    } = validation.data;

    // Check if question set exists and user has access
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: questionSetId },
    });

    if (!questionSet) {
      return NextResponse.json(
        { error: "Set soal tidak ditemukan" },
        { status: 404 }
      );
    }

    if (questionSet.createdById !== session.id) {
      return NextResponse.json(
        { error: "Anda hanya dapat menambahkan soal ke set soal yang Anda buat" },
        { status: 403 }
      );
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        text,
        type,
        subject,
        difficulty,
        options,
        correctAnswer,
        explanation,
        points,
        questionSetId,
      },
      include: {
        questionSet: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
