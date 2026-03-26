import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // If no user AND the path is not /login or /register,
  //   redirect to /login
  if(user === null) {
    if(request.nextUrl.pathname !== "/login" && request.nextUrl.pathname !== "/register") {
        return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If user exists AND the path is /login or /register,
  //   redirect to /
  if(user !== null) {
    if(request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") {
        return NextResponse.redirect(new URL("/", request.url));
    }
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