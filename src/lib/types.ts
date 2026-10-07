// Condition and status are re-exported from the database types rather than
// declared again here. They were duplicated before and drifted: the UI copy
// was missing "removed", which the database allows.
export type { ListingCondition, ListingStatus } from "./supabase/types";
import type { ListingCondition, ListingStatus } from "./supabase/types";

/**
 * Shapes for the whole app. Right now these describe the sample data in
 * `data.ts`. When Supabase goes in, these get replaced by types generated
 * straight from the database schema so the app and the database can't drift.
 */


export type Listing = {
  id: string;
  title: string;
  /** null price means it is a giveaway, which is how the app launches. */
  priceUsd: number | null;
  categoryId: string;
  zoneId: string;
  condition: ListingCondition;
  status: ListingStatus;
  description: string;
  /** Paths under /public. These become Supabase Storage URLs later. */
  photos: string[];
  sellerId: string;
  postedAt: string;
  savedCount: number;
  /**
   * Tint used for the gradient scrim on the card. Sampled from the photo by
   * hand for now; later this gets computed on upload and stored on the row.
   */
  accent: string;
};

export type Category = {
  id: string;
  label: string;
  labelEs: string;
  icon: string;
};

export type Zone = {
  id: string;
  label: string;
  /** Rough minutes from town center. Used for sorting, never shown as a map pin. */
  minutesFromCenter: number;
};

export type KarmaLevel = {
  id: string;
  /** Resolved through i18n so levels read in the viewer's language. */
  labelKey: import("./i18n").StringKey;
  minPoints: number;
};

export type User = {
  id: string;
  name: string;
  avatarSeed: string;
  zoneId: string;
  joinedAt: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  /** Granted by hand by an admin. The strongest trust signal in the app. */
  neighborVerified: boolean;
  rating: number;
  reviewCount: number;
  karma: number;
  givenAway: number;
  responseMinutes: number;
  bio: string;
};

export type Review = {
  id: string;
  authorId: string;
  subjectId: string;
  listingId: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  listingId: string;
  withUserId: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  /** Set when an offer is live in this thread. */
  offerUsd?: number;
  offerStatus?: "pending" | "accepted" | "declined";
};
