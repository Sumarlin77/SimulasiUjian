import { prisma } from './prisma';
import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import { UserRole } from '@prisma/client';
import * as jose from 'jose';

// Types
export interface UserSession {
  [x: string]: any;
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  universityName?: string;
  major?: string;
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// JWT utilities
export async function createToken(payload: UserSession): Promise<string> {
  try {
    // Convert JWT_SECRET to Uint8Array
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);

    // Create a JWT
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = await new jose.SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secretKey);

    return token;
  } catch (error) {
    throw error;
  }
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);

    const { payload } = await jose.jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const userSession = payload as unknown as UserSession;
    return userSession;
  } catch (error) {
    return null;
  }
}

// Authentication functions
export async function login(
  email: string,
  password: string
): Promise<{ user: UserSession; token: string } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  const userSession: UserSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = await createToken(userSession);
  return { user: userSession, token };
}

export async function register(
  userData: RegisterUserInput
): Promise<{ user: UserSession; token: string } | null> {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) return null;

  const hashedPassword = await hashPassword(userData.password);

  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      universityName: userData.universityName,
      major: userData.major,
      role: UserRole.PARTICIPANT, // Default role for new users
    },
  });

  const userSession: UserSession = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  };

  const token = await createToken(userSession);
  return { user: userSession, token };
}

// Get current user from cookie
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  return verifyToken(token);
}

// Check if user has required role
export function checkRole(user: UserSession | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  return user.role === requiredRole;
} 
