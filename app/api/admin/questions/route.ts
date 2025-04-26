import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { QuestionType, Difficulty } from "@prisma/client";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get("subject");
    const type = searchParams.get("type") as QuestionType | null;
    const difficulty = searchParams.get("difficulty") as Difficulty | null;

    // Prepare filter
    const filter: any = {};

    // Add filters if provided
    if (subject) {
      filter.subject = subject;
    }

    if (type) {
      filter.type = type;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // Get questions
    const questions = await prisma.question.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      // Format for the frontend
      select: {
        id: true,
        text: true,
        type: true,
        subject: true,
        difficulty: true,
        createdAt: true,
        options: true,
      },
    });

    // Format dates for frontend
    const formattedQuestions = questions.map(question => ({
      ...question,
      createdAt: question.createdAt.toLocaleDateString('id-ID'),
    }));

    return NextResponse.json(formattedQuestions);
  } catch (error) {
    console.error("Get admin questions error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Check authentication
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
    const { questions } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Format soal tidak valid" },
        { status: 400 }
      );
    }

    // Find or create a default question set for the admin
    let defaultQuestionSet = await prisma.questionSet.findFirst({
      where: {
        title: "Set Soal Default",
        createdById: session.id
      }
    });

    if (!defaultQuestionSet) {
      defaultQuestionSet = await prisma.questionSet.create({
        data: {
          title: "Set Soal Default",
          subject: "umum",
          description: "Set soal yang dibuat otomatis",
          createdById: session.id
        }
      });
    }

    // Process each question
    const createdQuestions = [];
    for (const question of questions) {
      const {
        text,
        type,
        subject,
        customSubject,
        difficulty,
        options,
        explanation,
        nama_gambar
      } = question;

      // Determine the final subject (handle custom subject)
      const finalSubject = subject === "custom" ? customSubject : subject;

      // For multiple-choice, find the correct answer
      let correctAnswer: string | null = null;
      let formattedOptions: Record<string, string> | null = null;

      if (type === "multiple-choice" && options) {
        // Convert options array to object format for database
        formattedOptions = {};
        for (const option of options) {
          formattedOptions[option.id] = option.text;
          if (option.isCorrect) {
            correctAnswer = option.id;
          }
        }
      }

      // Map Indonesian difficulty to English enum values
      let difficultyValue: Difficulty;
      switch (difficulty.toLowerCase()) {
        case 'mudah':
          difficultyValue = Difficulty.EASY;
          break;
        case 'sedang':
          difficultyValue = Difficulty.MEDIUM;
          break;
        case 'sulit':
          difficultyValue = Difficulty.HARD;
          break;
        default:
          difficultyValue = Difficulty.MEDIUM; // Default to medium
      }

      // Create the question
      const createdQuestion = await prisma.question.create({
        data: {
          text,
          type: type === "multiple-choice" ? QuestionType.MULTIPLE_CHOICE : QuestionType.ESSAY,
          subject: finalSubject,
          difficulty: difficultyValue,
          options: formattedOptions ? formattedOptions : undefined,
          correctAnswer,
          explanation,
          nama_gambar,
          questionSetId: defaultQuestionSet.id,
        }
      });

      createdQuestions.push(createdQuestion);
    }

    return NextResponse.json({
      success: true,
      count: createdQuestions.length,
      questions: createdQuestions
    }, { status: 201 });

  } catch (error) {
    console.error("Create questions error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
