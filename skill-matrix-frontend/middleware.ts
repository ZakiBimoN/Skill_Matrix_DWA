import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/karyawan", "/kompetensi", "/reports"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Nama cookie session Laravel mengikuti slug APP_NAME (mis. "Skill Matrix"
  // -> "skill_matrix_session"), jadi kita cek pola "_session" di akhir nama
  // cookie apa pun, bukan hardcode "laravel_session".
  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.toLowerCase().includes("session"));

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/karyawan/:path*", "/kompetensi/:path*", "/reports/:path*"],
};
