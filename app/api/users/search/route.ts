import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { searchUsers } from '@/lib/users';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const role = searchParams.get('role') as UserRole | undefined;
    const university = searchParams.get('university') || undefined;
    const major = searchParams.get('major') || undefined;
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');

    const results = await searchUsers({
      query,
      role,
      university,
      major,
      page,
      pageSize,
    });

    // Convert Date objects to ISO strings for JSON serialization
    const serializedResults = {
      ...results,
      users: results.users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString()
      }))
    };

    return NextResponse.json(serializedResults);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
} 
