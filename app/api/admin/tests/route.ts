import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    // Get all tests with question counts and participant counts
    const tests = await prisma.test.findMany({
      include: {
        questionSet: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format tests for frontend
    const formattedTests = tests.map(test => {
      // Determine status
      let status = "draft";
      const now = new Date();

      if (test.isActive) {
        if (test.startTime <= now && test.endTime >= now) {
          status = "active";
        } else if (test.endTime < now) {
          status = "completed";
        } else {
          status = "scheduled";
        }
      }

      return {
        id: test.id,
        title: test.title,
        subject: test.subject,
        questions: test.questionSet._count.questions,
        duration: `${test.duration} menit`,
        status,
        participants: test._count.attempts,
        createdAt: test.createdAt.toLocaleDateString('id-ID'),
      };
    });

    return NextResponse.json(formattedTests);
  } catch (error) {
    console.error("Get admin tests error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID ujian diperlukan" },
        { status: 400 }
      );
    }

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

    return NextResponse.json(
      { message: "Ujian berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete test error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
