/**
 * Reads the two Supabase settings and fails loudly if they're missing.
 *
 * IMPORTANT — why these are written out in full rather than looked up by name:
 *
 * Next.js makes NEXT_PUBLIC_* values available in the browser by *textually
 * replacing* `process.env.NEXT_PUBLIC_FOO` with the literal value when it
 * compiles. That replacement only happens for the exact written-out form.
 * A dynamic lookup like `process.env[name]` is invisible to it, so in the
 * browser it silently evaluates to undefined — even though the value is set
 * correctly and works fine on the server.
 *
 * That is exactly the trap this file fell into: server-side calls worked,
 * browser-side ones reported the key as missing.
 */

// Written out in full so the compiler can substitute them. Do not refactor
// these into a loop or a lookup by variable name.
const URL_VALUE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY_VALUE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isPlaceholder(value: string | undefined): boolean {
  return (
    !value ||
    value.startsWith("paste-") ||
    value.includes("YOUR-PROJECT")
  );
}

function required(value: string | undefined, name: string): string {
  if (isPlaceholder(value)) {
    throw new Error(
      `${name} is not set.\n\n` +
        `Open ~/Desktop/pasalo/.env.local and paste your values from\n` +
        `Supabase -> Project Settings -> API and Data API.\n\n` +
        `Then STOP the dev server (Ctrl+C) and start it again — that file is\n` +
        `only read when the server boots.`,
    );
  }
  return value as string;
}

export const SUPABASE_URL = () =>
  required(URL_VALUE, "NEXT_PUBLIC_SUPABASE_URL");

export const SUPABASE_ANON_KEY = () =>
  required(ANON_KEY_VALUE, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

/** True when both settings look present — used to fall back to sample data. */
export function isSupabaseConfigured(): boolean {
  return !isPlaceholder(URL_VALUE) && !isPlaceholder(ANON_KEY_VALUE);
}
