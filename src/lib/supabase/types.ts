/**
 * Types describing the database, hand-written to match supabase/schema.sql.
 *
 * These are what make TypeScript useful here: rename a column in the schema
 * and forget to update this file, and every query touching it stops compiling
 * rather than failing silently for a neighbour at 9pm.
 *
 * Keep in step with schema.sql. (Supabase can generate this file via its CLI
 * once that's set up, which removes the drift risk entirely.)
 */

export type ListingStatus = "available" | "pending" | "completed" | "removed";
export type ListingCondition =
  | "new"
  | "like-new"
  | "good"
  | "fair"
  | "for-parts";
export type OfferStatus = "pending" | "accepted" | "declined" | "withdrawn";

export type ProfileRow = {
  id: string;
  name: string;
  zone_id: string;
  bio: string | null;
  avatar_path: string | null;
  phone: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  neighbor_verified: boolean;
  is_moderator: boolean;
  // Computed by the database. Writes from the client are silently discarded
  // by the guard_profile_columns trigger.
  karma: number;
  rating: number;
  review_count: number;
  given_away: number;
  created_at: string;
};

export type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  /** null means a giveaway. */
  price_usd: number | null;
  category_id: string;
  zone_id: string;
  condition: ListingCondition;
  status: ListingStatus;
  accent: string;
  saved_count: number;
  created_at: string;
  updated_at: string;
};

export type ListingPhotoRow = {
  id: string;
  listing_id: string;
  storage_path: string;
  position: number;
};

export type ConversationRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type OfferRow = {
  id: string;
  conversation_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount_usd: number;
  status: OfferStatus;
  created_at: string;
  responded_at: string | null;
};

export type ExchangeRow = {
  id: string;
  listing_id: string;
  offer_id: string | null;
  buyer_id: string;
  seller_id: string;
  confirmed_by_buyer: boolean;
  confirmed_by_seller: boolean;
  completed_at: string | null;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  exchange_id: string;
  author_id: string;
  subject_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};

export type KarmaEventRow = {
  id: string;
  user_id: string;
  kind: string;
  points: number;
  ref_id: string | null;
  created_at: string;
};


export type BulletinRow = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  kind: "alert" | "news" | "notice" | "lost_found" | "recommendation";
  zone_id: string | null;
  pinned: boolean;
  expires_at: string | null;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_note: string | null;
};

export type ServiceRow = {
  id: string;
  provider_id: string | null;
  created_by: string;
  name: string;
  category_id: string;
  description: string | null;
  rate_note: string | null;
  phone: string | null;
  whatsapp: string | null;
  zones: string[];
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_note: string | null;
};

export type ServiceReviewRow = {
  id: string;
  service_id: string;
  author_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  kind: "social" | "swap" | "sport" | "volunteer" | "class" | "market";
  starts_at: string;
  ends_at: string | null;
  zone_id: string;
  location_note: string | null;
  capacity: number | null;
  cover_path: string | null;
  cancelled: boolean;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_note: string | null;
};

export type EventRsvpRow = {
  event_id: string;
  user_id: string;
  status: "going" | "maybe";
  guest_count: number;
  item_count: number;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        Pick<ProfileRow, "id" | "name" | "zone_id"> & Partial<ProfileRow>
      >;
      listings: Table<
        ListingRow,
        Pick<ListingRow, "seller_id" | "title" | "category_id" | "zone_id"> &
          Partial<ListingRow>
      >;
      listing_photos: Table<
        ListingPhotoRow,
        Pick<ListingPhotoRow, "listing_id" | "storage_path"> &
          Partial<ListingPhotoRow>
      >;
      saved_listings: Table<{
        user_id: string;
        listing_id: string;
        created_at: string;
      }>;
      conversations: Table<
        ConversationRow,
        Pick<ConversationRow, "listing_id" | "buyer_id" | "seller_id">
      >;
      messages: Table<
        MessageRow,
        Pick<MessageRow, "conversation_id" | "sender_id" | "body">
      >;
      offers: Table<
        OfferRow,
        Pick<
          OfferRow,
          "conversation_id" | "listing_id" | "buyer_id" | "seller_id" | "amount_usd"
        >
      >;
      exchanges: Table<
        ExchangeRow,
        Pick<ExchangeRow, "listing_id" | "buyer_id" | "seller_id"> &
          Partial<ExchangeRow>
      >;
      reviews: Table<
        ReviewRow,
        Pick<ReviewRow, "exchange_id" | "author_id" | "subject_id" | "rating"> &
          Partial<ReviewRow>
      >;
      karma_events: Table<KarmaEventRow, never, never>;
      bulletin_posts: Table<
        BulletinRow,
        Pick<BulletinRow, "author_id" | "title" | "body"> & Partial<BulletinRow>
      >;
      services: Table<
        ServiceRow,
        Pick<ServiceRow, "created_by" | "name" | "category_id"> &
          Partial<ServiceRow>
      >;
      service_photos: Table<{
        id: string;
        service_id: string;
        storage_path: string;
        position: number;
      }>;
      service_reviews: Table<
        ServiceReviewRow,
        Pick<ServiceReviewRow, "service_id" | "author_id" | "rating"> &
          Partial<ServiceReviewRow>
      >;
      events: Table<
        EventRow,
        Pick<EventRow, "host_id" | "title" | "starts_at" | "zone_id"> &
          Partial<EventRow>
      >;
      event_rsvps: Table<
        EventRsvpRow,
        Pick<EventRsvpRow, "event_id" | "user_id"> & Partial<EventRsvpRow>
      >;
      invites: Table<{
        code: string;
        created_by: string | null;
        used_by: string | null;
        used_at: string | null;
        expires_at: string | null;
        created_at: string;
      }>;
      reports: Table<
        {
          id: string;
          reporter_id: string;
          target_type: "listing" | "profile" | "message";
          target_id: string;
          reason: string;
          notes: string | null;
          status: string;
          created_at: string;
        },
        {
          reporter_id: string;
          target_type: "listing" | "profile" | "message";
          target_id: string;
          reason: string;
          notes?: string | null;
        }
      >;
    };
    Views: Record<never, never>;
    /** Database functions callable with supabase.rpc(). See 002_auth_helpers.sql. */
    Functions: {
      check_invite: {
        Args: { p_code: string };
        Returns: boolean;
      };
      mark_email_verified: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      can_host_events: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
