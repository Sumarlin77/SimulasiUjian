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

    // Fetch available tests (active tests within time range)
    const now = new Date();
    const tests = await prisma.test.findMany({
      where: {
        isActive: true,
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      select: {
        id: true,
        title: true,
        subject: true,
        passingScore: true,
      },
    });

    // For each test, check if user has already attempted it and get details
    const testDetails = await Promise.all(
      tests.map(async (test) => {
        // Find user's attempts for this test
        const attempts = await prisma.testAttempt.findMany({
          where: {
            testId: test.id,
            userId: session.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            score: true,
            status: true,
            createdAt: true,
          },
        });

        const hasAttempts = attempts.length > 0;
        const lastAttempt = hasAttempts ? attempts[0] : null;

        return {
          id: test.id,
          title: test.title,
          subject: test.subject,
          lastAttempt: lastAttempt
            ? lastAttempt.createdAt.toISOString().split("T")[0]
            : undefined,
          score: lastAttempt?.score,
          status: lastAttempt?.status,
          attempts: attempts.length,
          passingScore: test.passingScore,
        };
      })
    );

    return NextResponse.json({
      tests: testDetails,
    });
  } catch (error) {
    console.error("Error fetching available tests:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
