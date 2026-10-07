"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Supabase client for code running in the browser.
 *
 * This ships the anon key to every visitor, which is by design — it grants
 * nothing on its own. What a request may actually read or write is decided by
 * the Row Level Security policies in supabase/schema.sql, enforced by
 * Postgres. Never put the service_role key anywhere near this file.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL(), SUPABASE_ANON_KEY());
}
