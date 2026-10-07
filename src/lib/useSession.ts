"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import type { ProfileRow } from "./supabase/types";

export type SessionState = {
  user: User | null;
  profile: ProfileRow | null;
  loading: boolean;
};

/**
 * Who is signed in, for client components.
 *
 * Subscribes to auth changes rather than reading once, so signing in or out in
 * one tab updates every other tab — and so the header stops showing "Log in"
 * the moment a confirmation link lands.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadProfile(user: User | null) {
      if (!user) {
        if (active) setState({ user: null, profile: null, loading: false });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (active) setState({ user, profile: data ?? null, loading: false });
    }

    supabase.auth.getUser().then(({ data }) => loadProfile(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
