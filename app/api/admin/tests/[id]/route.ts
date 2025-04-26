import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// Test validation schema for update
const updateTestSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").optional(),
  description: z.string().optional(),
  subject: z.string().min(2, "Subjek minimal 2 karakter").optional(),
  duration: z.number().int().positive("Durasi harus lebih dari 0 menit").optional(),
  startTime: z.string().datetime({ offset: true }).optional(),
  endTime: z.string().datetime({ offset: true }).optional(),
  isActive: z.boolean().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  randomizeQuestions: z.boolean().optional(),
  instructions: z.string().optional(),
  settings: z.object({
    allowRetake: z.boolean().optional(),
    showResults: z.boolean().optional(),
    randomizeQuestions: z.boolean().optional(),
    showExplanation: z.boolean().optional(),
  }).optional(),
});

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

    // Only admins can access test details
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get the test with question set and questions
    const test = await prisma.test.findUnique({
      where: { id },
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

    // Format dates for easy use in the frontend
    const startTime = new Date(test.startTime);
    const endTime = new Date(test.endTime);

    // Format the test data for frontend
    const formattedTest = {
      id: test.id,
      title: test.title,
      subject: test.subject,
      description: test.description || "",
      instructions: test.description || "", // Using description as instructions if not available
      duration: test.duration,
      startDate: startTime.toISOString().split('T')[0],
      startTime: startTime.toTimeString().slice(0, 5),
      endDate: endTime.toISOString().split('T')[0],
      endTime: endTime.toTimeString().slice(0, 5),
      status: test.isActive ? "active" : "draft",
      passingScore: test.passingScore,
      accessType: "all", // Default access type
      settings: {
        allowRetake: false, // Default settings
        showResults: true,
        randomizeQuestions: test.randomizeQuestions,
        showExplanation: true,
      },
      selectedQuestions: test.questionSet.questions.map(q => q.id),
    };

    return NextResponse.json(formattedTest);
  } catch (error) {
    console.error("Get test error:", error);
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

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Only admins can update tests
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate input
    const validation = updateTestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prepare the update data
    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.subject) updateData.subject = data.subject;
    if (data.duration) updateData.duration = data.duration;
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.passingScore !== undefined) updateData.passingScore = data.passingScore;
    if (data.randomizeQuestions !== undefined) updateData.randomizeQuestions = data.randomizeQuestions;

    // Update the test
    const updatedTest = await prisma.test.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Ujian berhasil diperbarui",
      test: updatedTest
    });
  } catch (error) {
    console.error("Update test error:", error);
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

    // Only admins can delete tests
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete test
    await prisma.test.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Ujian berhasil dihapus"
    });
  } catch (error) {
    console.error("Delete test error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
