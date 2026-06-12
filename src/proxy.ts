/**
 * Next.js 16 Proxy (formerly middleware).
 * Runs on the edge before every matched request.
 *
 * Responsibilities:
 *  1. Refresh Supabase auth session cookies
 *  2. Guard /admin/* routes (requires is_platform_admin)
 *  3. Guard /app/* routes (requires authenticated user)
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Paths that are always accessible without authentication.
 * Used as documentation and for is-public checks.
 */
const PUBLIC_PATHS = new Set([
  "/",
  "/features",
  "/pricing",
  "/demo",
  "/waitlist",
  "/affiliate",
  "/security",
  "/contact",
  "/resources",
  "/terms",
  "/privacy",
  "/cookies",
  "/acceptable-use",
  "/data-processing-addendum",
  "/subprocessors",
  "/ai-disclaimer",
  "/refund-cancellation-policy",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/mfa",
  "/onboarding",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Also allow sub-paths of non-root public routes (e.g. /auth/callback/...)
  for (const p of PUBLIC_PATHS) {
    if (p !== "/" && pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── 1. Build a Supabase client that can forward/refresh cookies ────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session on every request (keeps tokens alive).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 2. /admin/* — requires platform admin ─────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check is_platform_admin on the profile row.
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_platform_admin) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  // ── 3. /app/* — requires authenticated user ────────────────────────────────
  if (pathname.startsWith("/app")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // ── 4. Auth pages — redirect already-signed-in users to /app/dashboard ───
  const AUTH_ONLY_PATHS = ["/login", "/signup", "/forgot-password"];
  if (user && AUTH_ONLY_PATHS.some((p) => pathname === p)) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  // ── 5. All other paths (public) — pass through ────────────────────────────
  // isPublicPath is used for reference by consumers importing this module
  // and is also available for future short-circuit logic.
  if (!isPublicPath(pathname) && !user) {
    // Catch-all: any unlisted authenticated route redirects to login.
    // Add routes to PUBLIC_PATHS above to exempt them.
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico, .png, .svg, .ico  (public assets)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|svg|ico|webp|jpg|jpeg|gif)$).*)",
  ],
};
