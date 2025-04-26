import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// Question set validation schema
const questionSetSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  subject: z.string().min(2, "Subjek minimal 2 karakter"),
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

    // Check permissions for participants
    if (session.role === "PARTICIPANT") {
      // Participants can only view question sets of tests they've taken
      const hasAccess = await prisma.testAttempt.findFirst({
        where: {
          userId: session.id,
          test: {
            questionSetId: id,
          },
        },
      });

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Tidak memiliki izin" },
          { status: 403 }
        );
      }
    }

    const questionSet = await prisma.questionSet.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        questions: {
          orderBy: { createdAt: "asc" },
        },
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

    return NextResponse.json({ questionSet });
  } catch (error) {
    console.error("Get question set error:", error);
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

    // Only admins can update question sets
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate input
    const validation = questionSetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, description, subject } = validation.data;

    // Check if question set exists
    const existingQuestionSet = await prisma.questionSet.findUnique({
      where: { id },
    });

    if (!existingQuestionSet) {
      return NextResponse.json(
        { error: "Set soal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user is the creator of the question set
    if (existingQuestionSet.createdById !== session.id) {
      return NextResponse.json(
        { error: "Anda hanya dapat mengubah set soal yang Anda buat" },
        { status: 403 }
      );
    }

    // Update question set
    const updatedQuestionSet = await prisma.questionSet.update({
      where: { id },
      data: {
        title,
        description,
        subject,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ questionSet: updatedQuestionSet });
  } catch (error) {
    console.error("Update question set error:", error);
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

    // Only admins can delete question sets
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if question set exists
    const existingQuestionSet = await prisma.questionSet.findUnique({
      where: { id },
      include: {
        tests: true,
      },
    });

    if (!existingQuestionSet) {
      return NextResponse.json(
        { error: "Set soal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user is the creator of the question set
    if (existingQuestionSet.createdById !== session.id) {
      return NextResponse.json(
        { error: "Anda hanya dapat menghapus set soal yang Anda buat" },
        { status: 403 }
      );
    }

    // Check if question set is used in any tests
    if (existingQuestionSet.tests.length > 0) {
      return NextResponse.json(
        { error: "Set soal tidak dapat dihapus karena digunakan dalam ujian" },
        { status: 400 }
      );
    }

    // Delete question set and all its questions
    await prisma.questionSet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question set error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
