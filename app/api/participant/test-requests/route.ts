import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { RequestStatus } from "@prisma/client";

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

    // Get query params for status filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build where clause
    const whereClause: any = { userId: session.id };
    if (status && status !== "all") {
      whereClause.status = status.toUpperCase() as RequestStatus;
    }

    // Fetch test requests for the current user
    const requests = await prisma.testRequest.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Format the requests for the frontend
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      testId: request.testId,
      testTitle: request.test.title,
      type: request.type.toLowerCase(),
      reason: request.reason,
      status: request.status.toLowerCase(),
      requestDate: request.createdAt.toISOString().split('T')[0],
      approvedDate: request.reviewedAt ? request.reviewedAt.toISOString().split('T')[0] : null,
      approvedBy: request.reviewedBy ? request.reviewedBy.name : null,
      feedback: request.feedback || null,
      previousScore: request.previousScore,
      previousAttempts: request.previousAttempts || 0,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Error fetching test requests:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/participant/test-requests: Starting request");

    const session = await getSession();
    console.log("Session received:", session ? "Session exists" : "No session");

    // Check authentication
    if (!session) {
      console.log("Authentication failed: No session found");
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    console.log("Session user info:", {
      userId: session.id,
      hasUserId: Boolean(session.id),
      sessionKeys: Object.keys(session)
    });

    // Ensure we have a user ID
    if (!session.id) {
      console.log("Authentication failed: No user id in session");
      return NextResponse.json(
        { error: "ID pengguna tidak ditemukan dalam sesi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Request body:", {
      testId: body.testId,
      type: body.type,
      hasReason: Boolean(body.reason)
    });

    // Validate required fields
    if (!body.testId || !body.type || !body.reason) {
      console.log("Validation failed: Missing required fields");
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id: body.testId },
    });

    if (!test) {
      console.log("Test not found:", body.testId);
      return NextResponse.json(
        { error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get previous attempts if this is a retake request
    let previousScore = null;
    let previousAttempts = 0;

    if (body.type.toUpperCase() === "RETAKE") {
      const attempts = await prisma.testAttempt.findMany({
        where: {
          testId: body.testId,
          userId: session.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      previousAttempts = attempts.length;
      if (attempts.length > 0) {
        previousScore = attempts[0].score;
      }
      console.log("Previous attempts:", previousAttempts, "Previous score:", previousScore);
    }

    console.log("Creating test request with user ID:", session.id);

    // Create new test request
    const newRequest = await prisma.testRequest.create({
      data: {
        userId: session.id,
        testId: body.testId,
        type: body.type.toUpperCase(),
        reason: body.reason,
        status: "PENDING",
        previousScore,
        previousAttempts,
      },
    });

    console.log("Test request created successfully:", newRequest.id);

    return NextResponse.json({
      message: "Permintaan berhasil dibuat",
      requestId: newRequest.id,
    });
  } catch (error) {
    console.error("Error creating test request:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
