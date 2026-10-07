"use client";

import { createClient } from "./supabase/client";

/**
 * Signup, login and logout.
 *
 * The invite code is checked twice on purpose. Once here, so the form can say
 * "that code isn't valid" before someone fills in five more fields — and again
 * inside the database trigger, which is the check that actually counts. A
 * client-side check is a courtesy, never a security boundary: anyone can skip
 * it by calling the API directly, and the trigger will still refuse them.
 */

export type SignupInput = {
  inviteCode: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  zoneId: string;
};

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function checkInviteCode(code: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("check_invite", {
    p_code: code.trim(),
  });
  if (error) return false;
  return data === true;
}

export async function signUp(input: SignupInput): Promise<AuthResult> {
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      // The handle_new_user trigger reads these to build the profile row and
      // burn the invite code.
      data: {
        invite_code: input.inviteCode.trim().toUpperCase(),
        name: input.name.trim(),
        zone_id: input.zoneId,
        phone: input.phone.trim(),
      },
    },
  });

  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * Supabase surfaces a trigger failure as a generic "Database error saving new
 * user", which tells a neighbour nothing. Map the cases we cause ourselves
 * onto something a person can act on.
 */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid_invite_code") || m.includes("database error")) {
    return "That invite code isn't valid. Check it with whoever invited you.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "There's already an account with that email. Try signing in instead.";
  }
  if (m.includes("invalid login credentials")) {
    return "That email and password don't match.";
  }
  if (m.includes("email not confirmed")) {
    return "Check your email and tap the confirmation link first.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Wait a few minutes and try again.";
  }
  if (m.includes("password")) {
    return "That password is too weak — use at least 10 characters.";
  }
  return message;
}
