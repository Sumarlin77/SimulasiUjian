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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get("search");
    const role = searchParams.get("role");

    // Prepare filter
    const filter: any = {};

    // Add role filter if provided
    if (role && role !== "all") {
      filter.role = role.toUpperCase();
    }

    // Add search filter if provided
    if (searchTerm) {
      filter.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Get users from database
    const users = await prisma.user.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
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
          take: 1
        }
      }
    });

    // Format the data to match the expected structure by the client
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "ADMIN" ? "admin" : "participant",
      status: "active", // Status field not in schema, default to active
      testsTaken: user._count.testsAttempted,
      lastActive: user.testsAttempted[0]?.updatedAt.toLocaleDateString('id-ID') || user.updatedAt.toLocaleDateString('id-ID'),
      universityName: user.universityName || "",
      major: user.major || "",
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

// Create user endpoint
export async function POST(request: NextRequest) {
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

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json(
        { error: "Nama, email, dan password diperlukan" },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah digunakan" },
        { status: 400 }
      );
    }

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, // In a real app, should hash the password
        role: data.role?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER",
        universityName: data.universityName || null,
        major: data.major || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        universityName: true,
        major: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role === "ADMIN" ? "admin" : "participant",
      status: "active",
      testsTaken: 0,
      lastActive: newUser.createdAt.toLocaleDateString('id-ID'),
      universityName: newUser.universityName || "",
      major: newUser.major || "",
    }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
} 
