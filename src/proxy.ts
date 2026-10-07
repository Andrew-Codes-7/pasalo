import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Keeps the signed-in session alive.
 *
 * Named proxy.ts rather than middleware.ts: Next 16 renamed this convention
 * and warns on the old name.
 *
 * Supabase access tokens are short-lived. Without this running on each
 * request, people get silently signed out mid-browse. It also guards the
 * screens that only make sense when signed in.
 */

const PUBLIC_PATHS = ["/signup", "/login", "/auth"];

export async function proxy(request: NextRequest) {
  // Before the keys are configured the app still runs on sample data, so
  // don't blow up here.
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() re-validates with Supabase. getSession() only reads the cookie,
  // which a user could edit, so it must not be trusted for access decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    // Send signed-out visitors to sign IN, not sign UP. Most people reaching a
    // gated page already have an account, and signup needs an invite code they
    // may not have. The login screen links onward to signup for newcomers.
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|samples|logo-|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
