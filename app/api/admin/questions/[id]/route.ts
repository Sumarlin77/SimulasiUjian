import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    const id = params.id;

    // Get the question
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        questionSet: {
          select: {
            id: true,
            title: true,
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

    // Get tests using this question
    const questionSets = await prisma.test.findMany({
      where: {
        questionSetId: question.questionSetId,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    // Format the question for the frontend
    const formattedQuestion = {
      id: question.id,
      text: question.text,
      type: question.type,
      subject: question.subject,
      difficulty: question.difficulty,
      createdAt: question.createdAt.toLocaleDateString('id-ID'),
      updatedAt: question.updatedAt ? question.updatedAt.toLocaleDateString('id-ID') : null,
      createdBy: "Admin", // In a real app, get this from a user relationship
      options: question.options,
      explanation: question.explanation,
      usedInTests: questionSets.map(test => ({
        id: test.id,
        title: test.title,
        date: test.createdAt.toLocaleDateString('id-ID'),
      })),
      stats: {
        timesAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        correctPercentage: 0,
      },
      // Tags would come from a separate table in a real app
      tags: [],
      // History would come from a separate table in a real app
      history: [
        {
          action: "Dibuat",
          date: question.createdAt.toLocaleDateString('id-ID'),
          user: "Admin",
        },
        ...(question.updatedAt && question.updatedAt > question.createdAt
          ? [{
            action: "Diperbarui",
            date: question.updatedAt.toLocaleDateString('id-ID'),
            user: "Admin",
          }]
          : []),
      ],
    };

    return NextResponse.json(formattedQuestion);
  } catch (error) {
    console.error("Get question error:", error);
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

    // Only admins can delete questions
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const id = params.id;

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Soal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete the question
    // First delete all related answers to avoid foreign key constraint violation
    await prisma.answer.deleteMany({
      where: { questionId: id },
    });

    // Then delete the question
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
