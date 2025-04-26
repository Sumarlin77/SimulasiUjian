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

    // Prepare filter
    const filter: any = {};

    // For participants, only show question sets in tests they've taken
    if (session.role === "PARTICIPANT") {
      const participantTests = await prisma.testAttempt.findMany({
        where: { userId: session.id },
        select: { test: { select: { questionSetId: true } } },
      });

      const questionSetIds = participantTests.map(
        attempt => attempt.test.questionSetId
      );

      filter.id = { in: questionSetIds };
    } else if (session.role === "ADMIN") {
      // Admins can filter by creator
      filter.createdById = searchParams.get("createdById") || undefined;
    }

    // Add subject filter if provided
    if (subject) {
      filter.subject = subject;
    }

    // Get total count
    const total = await prisma.questionSet.count({ where: filter });

    // Get question sets with pagination
    const questionSets = await prisma.questionSet.findMany({
      where: filter,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      questionSets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get question sets error:", error);
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

    // Only admins can create question sets
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

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

    // Create question set
    const questionSet = await prisma.questionSet.create({
      data: {
        title,
        description,
        subject,
        createdById: session.id,
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

    return NextResponse.json({ questionSet }, { status: 201 });
  } catch (error) {
    console.error("Create question set error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
