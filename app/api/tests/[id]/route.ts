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

    // Get the test
    const test = await prisma.test.findUnique({
      where: { id },
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
            questions: {
              select: {
                id: true,
                text: true,
                type: true,
                options: true,
                // Only include correct answers and explanations for admins
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
        attempts: session.role === "ADMIN" ? {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            answers: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        } : {
          where: {
            userId: session.id,
          },
          orderBy: {
            createdAt: "desc",
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

    // For participants, check if they can access this test
    if (session.role === "PARTICIPANT") {
      // Check if test is active or if participant has attempted it
      const isActive = test.isActive &&
        new Date(test.startTime) <= new Date() &&
        new Date(test.endTime) >= new Date();

      const hasAttempted = test.attempts.length > 0;

      if (!isActive && !hasAttempted) {
        return NextResponse.json(
          { error: "Ujian tidak tersedia" },
          { status: 403 }
        );
      }

      // For active tests, don't include previous attempts
      if (isActive && !hasAttempted) {
        const { attempts, ...testData } = test;
        return NextResponse.json({ test: testData });
      }
    }

    return NextResponse.json({ test });
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
    const validation = testSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get the test
    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: {
        attempts: true,
      },
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user is the creator of the test
    if (existingTest.createdById !== session.id) {
      return NextResponse.json(
        { error: "Anda hanya dapat mengubah ujian yang Anda buat" },
        { status: 403 }
      );
    }

    // If test has attempts, restrict what can be updated
    if (existingTest.attempts.length > 0) {
      // Only allow updating title, description, and isActive
      const { title, description, isActive } = validation.data;

      const updatedTest = await prisma.test.update({
        where: { id },
        data: {
          title,
          description,
          isActive,
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
            },
          },
        },
      });

      return NextResponse.json({
        test: updatedTest,
        message: "Ujian telah diikuti, hanya sebagian data yang diperbarui",
      });
    }

    // If no attempts, allow full update
    const {
      title,
      description,
      subject,
      duration,
      startTime,
      endTime,
      isActive,
      passingScore,
      randomizeQuestions,
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

    // Update test
    const updatedTest = await prisma.test.update({
      where: { id },
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
          },
        },
      },
    });

    return NextResponse.json({ test: updatedTest });
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

    // Get the test
    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: {
        attempts: true,
      },
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user is the creator of the test
    if (existingTest.createdById !== session.id) {
      return NextResponse.json(
        { error: "Anda hanya dapat menghapus ujian yang Anda buat" },
        { status: 403 }
      );
    }

    // Check if test has attempts
    if (existingTest.attempts.length > 0) {
      return NextResponse.json(
        { error: "Ujian tidak dapat dihapus karena sudah diikuti" },
        { status: 400 }
      );
    }

    // Delete test
    await prisma.test.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete test error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
