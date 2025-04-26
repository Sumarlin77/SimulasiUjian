import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Get a single user
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

    const userId = params.id;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        universityName: true,
        major: true,
        createdAt: true,
        updatedAt: true,
        // Get count of test attempts
        _count: {
          select: {
            testsAttempted: true
          }
        },
        // Get the latest test attempt for "last active" information
        testsAttempted: {
          orderBy: {
            updatedAt: "desc"
          },
          take: 1,
          select: {
            id: true,
            updatedAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Format the data to match the expected structure by the client
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "ADMIN" ? "admin" : "participant",
      status: "active", // Status field not in schema, default to active
      testsTaken: user._count.testsAttempted,
      lastActive: user.testsAttempted[0]?.updatedAt.toLocaleDateString('id-ID') || user.updatedAt.toLocaleDateString('id-ID'),
      universityName: user.universityName || "",
      major: user.major || "",
      joinDate: user.createdAt.toLocaleDateString('id-ID'),
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

// Update a user
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

    // Only admins can access this endpoint
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const userId = params.id;
    const data = await request.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
    if (data.password) updateData.password = data.password; // Should hash in real app
    if (data.universityName !== undefined) updateData.universityName = data.universityName || null;
    if (data.major !== undefined) updateData.major = data.major || null;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        universityName: true,
        major: true,
        updatedAt: true,
        createdAt: true,
        _count: {
          select: {
            testsAttempted: true
          }
        }
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role === "ADMIN" ? "admin" : "participant",
      status: "active", // Status field not in schema
      testsTaken: updatedUser._count.testsAttempted,
      lastActive: updatedUser.updatedAt.toLocaleDateString('id-ID'),
      universityName: updatedUser.universityName || "",
      major: updatedUser.major || "",
      joinDate: updatedUser.createdAt.toLocaleDateString('id-ID'),
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

// Delete a user
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

    // Only admins can access this endpoint
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Tidak memiliki izin" },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
