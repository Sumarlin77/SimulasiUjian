import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

// GET handler for fetching test requests
export async function GET(request: Request) {
  try {
    // Get search parameters from URL
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("searchTerm") || ""
    const statusFilter = searchParams.get("statusFilter") || "all"
    const typeFilter = searchParams.get("typeFilter") || "all"

    // Build the where condition based on filters
    let whereCondition: any = {}

    if (statusFilter !== "all") {
      whereCondition.status = statusFilter.toUpperCase()
    }

    if (typeFilter !== "all") {
      whereCondition.type = typeFilter.toUpperCase()
    }

    // Fetch test requests with related user and test data
    const testRequests = await prisma.testRequest.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        test: {
          select: {
            id: true,
            title: true,
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Apply search term filter in memory (since it spans multiple related fields)
    const filteredRequests = searchTerm
      ? testRequests.filter(request =>
        request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.test.title.toLowerCase().includes(searchTerm.toLowerCase()))
      : testRequests

    // Transform the data to match the expected format in the frontend
    const formattedRequests = filteredRequests.map(request => ({
      id: request.id,
      userId: request.userId,
      userName: request.user.name,
      userEmail: request.user.email,
      testId: request.testId,
      testTitle: request.test.title,
      type: request.type.toLowerCase(),
      reason: request.reason,
      status: request.status.toLowerCase(),
      requestDate: request.createdAt.toISOString().slice(0, 10),
      approvedDate: request.reviewedAt?.toISOString().slice(0, 10),
      approvedBy: request.reviewedBy?.name,
      deniedDate: request.reviewedAt?.toISOString().slice(0, 10),
      deniedBy: request.reviewedBy?.name,
      feedback: request.feedback,
      previousScore: request.previousScore,
      previousAttempts: request.previousAttempts,
    }))

    return NextResponse.json({ data: formattedRequests })
  } catch (error) {
    console.error("Error fetching test requests:", error)
    return NextResponse.json({ error: "Failed to fetch test requests" }, { status: 500 })
  }
}

// Schema for request actions
const actionSchema = z.object({
  requestId: z.string(),
  action: z.enum(["approve", "deny"]),
  feedback: z.string().optional(),
  adminId: z.string().optional(),
})

// PUT handler for updating test request status
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validation = actionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { requestId, action, feedback, adminId } = validation.data

    // Update the request in the database
    const updatedRequest = await prisma.testRequest.update({
      where: {
        id: requestId
      },
      data: {
        status: action === "approve" ? "APPROVED" : "DENIED",
        feedback: feedback || (action === "approve" ? "Permintaan disetujui" : "Permintaan ditolak"),
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        test: {
          select: {
            id: true,
            title: true,
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Format the response
    const formattedRequest = {
      id: updatedRequest.id,
      userId: updatedRequest.userId,
      userName: updatedRequest.user.name,
      userEmail: updatedRequest.user.email,
      testId: updatedRequest.testId,
      testTitle: updatedRequest.test.title,
      type: updatedRequest.type.toLowerCase(),
      reason: updatedRequest.reason,
      status: updatedRequest.status.toLowerCase(),
      requestDate: updatedRequest.createdAt.toISOString().slice(0, 10),
      approvedDate: updatedRequest.reviewedAt?.toISOString().slice(0, 10),
      approvedBy: updatedRequest.reviewedBy?.name,
      deniedDate: updatedRequest.reviewedAt?.toISOString().slice(0, 10),
      deniedBy: updatedRequest.reviewedBy?.name,
      feedback: updatedRequest.feedback,
      previousScore: updatedRequest.previousScore,
      previousAttempts: updatedRequest.previousAttempts,
    }

    return NextResponse.json({ data: formattedRequest })
  } catch (error) {
    console.error("Error updating test request:", error)
    return NextResponse.json({ error: "Failed to update test request" }, { status: 500 })
  }
} 
