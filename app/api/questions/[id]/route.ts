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
});

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

    // Get the question
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        questionSet: {
          select: {
            id: true,
            title: true,
            subject: true,
            createdById: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Soal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check permissions for participants
    if (session.role === "PARTICIPANT") {
      // Participants can only view questions from tests they've taken
      const hasAccess = await prisma.testAttempt.findFirst({
        where: {
          userId: session.id,
          test: {
            questionSetId: question.questionSetId,
          },
        },
      });

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Tidak memiliki izin" },
          { status: 403 }
        );
      }

      // For participants, hide correct answer and explanation if in active test
      const activeTest = await prisma.testAttempt.findFirst({
        where: {
          userId: session.id,
          test: {
            questionSetId: question.questionSetId,
          },
          status: "IN_PROGRESS",
        },
      });

      if (activeTest) {
        const { correctAnswer, explanation, ...questionWithoutAnswers } = question;
        return NextResponse.json({ question: questionWithoutAnswers });
      }
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Get question error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Only admins can update questions
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate input
    const validation = questionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get the question
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: {
        questionSet: true,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Soal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user is the creator of the question set
    if (existingQuestion.questionSet.createdById !== session.id) {
      return NextResponse.json(
        { error: "Anda hanya dapat mengubah soal dalam set soal yang Anda buat" },
        { status: 403 }
      );
    }

    // Update question
    const {
      text,
      type,
      subject,
      difficulty,
      options,
      correctAnswer,
      explanation,
      points,
    } = validation.data;

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        text,
        type,
        subject,
        difficulty,
        options,
        correctAnswer,
        explanation,
        points,
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

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    console.error("Update question error:", error);
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

    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Only admins can delete questions
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get the question
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: {
        questionSet: true,
        answers: true,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Soal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user is the creator of the question set
    if (existingQuestion.questionSet.createdById !== session.id) {
      return NextResponse.json(
        { error: "Anda hanya dapat menghapus soal dalam set soal yang Anda buat" },
        { status: 403 }
      );
    }

    // Check if question has been answered in any test
    if (existingQuestion.answers.length > 0) {
      return NextResponse.json(
        { error: "Soal tidak dapat dihapus karena sudah dijawab dalam ujian" },
        { status: 400 }
      );
    }

    // Delete question
    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
