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

    const { id } = params;

    // Fetch test request with relations
    const requestData = await prisma.testRequest.findUnique({
      where: {
        id,
        userId: session.id, // Ensure the request belongs to current user
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

    if (!requestData) {
      return NextResponse.json(
        { error: "Permintaan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Format the request for the frontend
    const formattedRequest = {
      id: requestData.id,
      testId: requestData.testId,
      testTitle: requestData.test.title,
      type: requestData.type.toLowerCase(),
      reason: requestData.reason,
      status: requestData.status.toLowerCase(),
      requestDate: requestData.createdAt.toISOString().split('T')[0],
      approvedDate: requestData.reviewedAt ? requestData.reviewedAt.toISOString().split('T')[0] : null,
      approvedBy: requestData.reviewedBy ? requestData.reviewedBy.name : null,
      feedback: requestData.feedback || null,
      previousScore: requestData.previousScore,
      previousAttempts: requestData.previousAttempts || 0,
    };

    return NextResponse.json(formattedRequest);
  } catch (error) {
    console.error("Error fetching test request details:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
