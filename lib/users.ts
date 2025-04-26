import { prisma } from './prisma';
import { UserRole, Prisma } from '@prisma/client';

// Types
export interface UserSearchParams {
  query?: string;      // General search term (name, email)
  role?: UserRole;     // Filter by role (ADMIN or PARTICIPANT)
  university?: string; // Filter by university
  major?: string;      // Filter by major
  page?: number;       // Page number for pagination
  pageSize?: number;   // Items per page
}

export interface UserSearchResult {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    universityName?: string | null;
    major?: string | null;
    image?: string | null;
    createdAt: Date;
  }>;
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

/**
 * Search for users based on various criteria
 */
export async function searchUsers(params: UserSearchParams): Promise<UserSearchResult> {
  const {
    query = '',
    role,
    university,
    major,
    page = 1,
    pageSize = 10
  } = params;

  // Build the where clause
  const where: Prisma.UserWhereInput = {};

  // Add search by name or email if query is provided
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } }
    ];
  }

  // Filter by role if provided
  if (role) {
    where.role = role;
  }

  // Filter by university if provided
  if (university) {
    where.universityName = { contains: university, mode: 'insensitive' };
  }

  // Filter by major if provided
  if (major) {
    where.major = { contains: major, mode: 'insensitive' };
  }

  // Get total count for pagination
  const totalCount = await prisma.user.count({ where });
  const pageCount = Math.ceil(totalCount / pageSize);

  // Get users with pagination
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      universityName: true,
      major: true,
      image: true,
      createdAt: true
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { name: 'asc' }
  });

  return {
    users,
    totalCount,
    pageCount,
    currentPage: page
  };
}

// Legacy mock data functions below
// These can be removed when migrating fully to Prisma

// Tipe data untuk pengguna
export interface User {
  id: string
  name: string
  email: string
  password: string // Dalam aplikasi nyata, ini akan berupa hash
  role: "participant" | "admin"
  image?: string
  universityName?: string
  major?: string
}

// Data pengguna palsu
export const users: User[] = [
  // Peserta
  {
    id: "1",
    name: "Budi Santoso",
    email: "budi.santoso@gmail.com",
    password: "Peserta123",
    role: "participant",
  },
  {
    id: "2",
    name: "Siti Rahayu",
    email: "siti.rahayu@gmail.com",
    password: "Ujian2023",
    role: "participant",
  },
  {
    id: "3",
    name: "Ahmad Rizki",
    email: "ahmad.rizki@gmail.com",
    password: "TryOut456",
    role: "participant",
  },
  {
    id: "4",
    name: "Dewi Lestari",
    email: "dewi.lestari@gmail.com",
    password: "Peserta789",
    role: "participant",
  },
  {
    id: "5",
    name: "Rudi Hermawan",
    email: "rudi.hermawan@gmail.com",
    password: "UjianOnline22",
    role: "participant",
  },

  // Admin
  {
    id: "6",
    name: "Agus Widodo",
    email: "admin@ujiansimulator.com",
    password: "Admin2023!",
    role: "admin",
  },
  {
    id: "7",
    name: "Rina Wijaya",
    email: "akademik@ujiansimulator.com",
    password: "AkademikAdmin!",
    role: "admin",
  },
  {
    id: "8",
    name: "Hendra Gunawan",
    email: "teknis@ujiansimulator.com",
    password: "Teknis2023!",
    role: "admin",
  },
]

// Fungsi untuk mencari pengguna berdasarkan email
export function findUserByEmail(email: string): User | undefined {
  return users.find((user) => user.email === email)
}

// Fungsi untuk memverifikasi kredensial pengguna
export function verifyCredentials(email: string, password: string): User | null {
  const user = findUserByEmail(email)
  if (user && user.password === password) {
    // Jangan mengembalikan password dalam respons
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }
  return null
}

// Fungsi untuk mendaftarkan pengguna baru
export function registerUser(userData: Omit<User, "id">): User | null {
  // Periksa apakah email sudah digunakan
  if (findUserByEmail(userData.email)) {
    return null
  }

  // Dalam aplikasi nyata, kita akan menyimpan ke database
  // Di sini kita hanya mensimulasikan dengan menambahkan ke array
  const newUser: User = {
    ...userData,
    id: (users.length + 1).toString(),
  }

  users.push(newUser)

  // Jangan mengembalikan password dalam respons
  const { password, ...userWithoutPassword } = newUser
  return userWithoutPassword as User
}
