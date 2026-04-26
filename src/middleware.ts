import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths that an unauthenticated user is allowed to hit.
// Anything not in this list will bounce them to /login.
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

export async function middleware(request: NextRequest) {
  // Start with a default "continue" response (let the request through)
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client that can read/write cookies
  // on the request and response objects
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Sync cookies to both the request and response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() refreshes the session if expired
  // Do NOT use getSession() here, it doesn't validate the token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Unauthenticated user trying to hit a protected route -> redirect to /login
  if (user === null && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated user trying to hit /login or /register -> bounce to /
  // Note: /forgot-password and /reset-password are intentionally NOT bounced.
  // A logged-in user who clicks a stale recovery link should still be able
  // to land on /reset-password and complete the flow.
  if (user !== null && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

// Tell Next.js which routes this middleware applies to
// This excludes static files, images, favicon, etc.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};