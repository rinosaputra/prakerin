import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

const ROLE_PATTERNS: Record<string, RegExp> = {
  ADMIN_TU: /^\/dashboard\/tu(?:\/.*)?$/,
  WAKA_HUBIN: /^\/dashboard\/hubin(?:\/.*)?$/,
  KAPROGLI: /^\/dashboard\/kaprogli(?:\/.*)?$/,
  GURU_PEMBIMBING: /^\/dashboard\/guru(?:\/.*)?$/,
  SISWA: /^\/dashboard\/siswa(?:\/.*)?$/,
  INSTRUKTUR_DUDIKA: /^\/dudika(?:\/.*)?$/,
};

const PUBLIC_PATHS = ['/', '/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Get session
  const session = await getSession();

  if (!session) {
    // Redirect to login if no session
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.payload.role;
  const pattern = ROLE_PATTERNS[role];

  if (pattern && !pattern.test(pathname)) {
    // Role doesn't have access to this path
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}
