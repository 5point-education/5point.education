import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  const path = request.nextUrl.pathname;

  // Protect dashboard routes
  if (path.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const role = token.role as string;

    // Role-based route protection
    if (path.startsWith('/dashboard/student') && role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (path.startsWith('/dashboard/teacher') && role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (path.startsWith('/dashboard/reception') && role !== 'RECEPTIONIST') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (path.startsWith('/dashboard/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect from base /dashboard to role-specific dashboard
    if (path === '/dashboard') {
      switch (role) {
        case 'ADMIN':
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        case 'RECEPTIONIST':
          return NextResponse.redirect(new URL('/dashboard/reception', request.url));
        case 'TEACHER':
          return NextResponse.redirect(new URL('/dashboard/teacher', request.url));
        case 'STUDENT':
          return NextResponse.redirect(new URL('/dashboard/student', request.url));
        default:
          return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
  }

  // Redirect authenticated users away from login page
  if (path.startsWith('/auth/login') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
