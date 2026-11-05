import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the confirmation link in the signup email lands.
 *
 * Supabase sends one of two shapes depending on the project's email template,
 * and handling only one of them is why confirming produced a logged-out tab:
 *
 *   ?code=...                      PKCE flow — exchange it for a session
 *   ?token_hash=...&type=signup    OTP flow — verify it for a session
 *
 * Both are handled here. Anything unrecognised sends the person to the login
 * screen with a readable reason rather than silently dumping them on a
 * signed-out home page.
 */
/**
 * Only ever send people somewhere on this site after they confirm.
 *
 * `next` comes from the link, so anyone can write one. Values like
 * "@evil.com", "//evil.com" or "/\\evil.com" turn `${origin}${next}` into an
 * address on another site — a ready-made phishing page that appears right
 * after a genuine confirmation. Resolve it against our own origin and
 * refuse anything that lands elsewhere.
 */
function safeNext(raw: string | null, origin: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/";
  }
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNext(searchParams.get("next"), origin);

  const supabase = await createClient();
  let failed: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) failed = "link_expired";
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as "signup" | "email" | "recovery" | "magiclink") ?? "email",
    });
    if (error) failed = "link_expired";
  } else {
    failed = "missing_code";
  }

  if (failed) {
    return NextResponse.redirect(`${origin}/login?error=${failed}`);
  }

  // Record that the address is confirmed. profiles.email_verified is frozen by
  // the guard trigger, so this goes through the database function instead of a
  // direct write.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.rpc("mark_email_verified");
  }

  return NextResponse.redirect(`${origin}${next}`);
}
