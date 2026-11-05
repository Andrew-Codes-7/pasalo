/**
 * The profile columns the app is allowed to read.
 *
 * Every signed-in member can look up any profile, so the phone number is not
 * on this list: the database refuses to hand it out
 * (supabase/007_security_fixes.sql). Selecting "*" would ask for it and fail,
 * so every profile query uses this list instead.
 */
// One string literal (not joined pieces) so the typed Supabase client can
// still work out the row shape from it.
export const PROFILE_COLUMNS =
  "id, name, zone_id, bio, avatar_path, phone_verified, email_verified, neighbor_verified, is_moderator, karma, rating, review_count, given_away, created_at" as const;
