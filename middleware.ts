import { NextResponse, type NextRequest } from "next/server";

// Keep the request pipeline independent from Supabase while the Edge
// middleware failure is isolated. Authentication is still enforced by the
// app's server-side data/RLS checks; this middleware only handled refresh.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
