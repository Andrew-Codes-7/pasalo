import type {
  Category,
  Conversation,
  KarmaLevel,
  Listing,
  Review,
  User,
  Zone,
} from "./types";
import type { StringKey } from "./i18n";

/**
 * Sample content for the design pass. None of this is real and none of it
 * survives the Supabase wiring — it exists so the screens can be judged with
 * realistic density instead of lorem ipsum.
 */

export const CATEGORIES: Category[] = [
  { id: "free", label: "Free", labelEs: "Gratis", icon: "gift" },
  { id: "furniture", label: "Furniture", labelEs: "Muebles", icon: "sofa" },
  { id: "outdoors", label: "Surf & Outdoors", labelEs: "Playa y aire libre", icon: "wave" },
  { id: "home", label: "Home & Garden", labelEs: "Casa y jardín", icon: "plant" },
  { id: "electronics", label: "Electronics", labelEs: "Electrónica", icon: "device" },
  { id: "tools", label: "Tools", labelEs: "Herramientas", icon: "tool" },
  { id: "vehicles", label: "Vehicles", labelEs: "Vehículos", icon: "car" },
  { id: "kids", label: "Baby & Kids", labelEs: "Bebés y niños", icon: "kid" },
  { id: "clothing", label: "Clothing", labelEs: "Ropa", icon: "shirt" },
  { id: "pets", label: "Pets", labelEs: "Mascotas", icon: "paw" },
];

/**
 * Playas del Coco is the center; everything else is measured as drive time
 * from there. Place names only — the app never stores or shows a street
 * address, which is why there is no map and no coordinates on this type.
 */
export const ZONES: Zone[] = [
  { id: "coco", label: "Playas del Coco", minutesFromCenter: 0 },
  { id: "ocotal", label: "Playa Ocotal", minutesFromCenter: 8 },
  { id: "artola", label: "Artola", minutesFromCenter: 10 },
  { id: "sardinal", label: "Sardinal", minutesFromCenter: 12 },
  { id: "hermosa", label: "Playa Hermosa", minutesFromCenter: 14 },
  { id: "panama", label: "Playa Panamá", minutesFromCenter: 18 },
  { id: "liberia", label: "Liberia", minutesFromCenter: 35 },
];

/**
 * Karma is earned for contributing, not for buying. Giving something away is
 * worth five times listing it, so the free side of the app stays the center
 * of gravity.
 *
 * Every one of these is awarded by the database, never by the app, or people
 * can set their own score.
 */
export const KARMA_ACTIONS: { key: StringKey; points: number }[] = [
  { key: "karmaPostListing", points: 5 },
  { key: "karmaGiveAway", points: 25 },
  { key: "karmaLeaveReview", points: 10 },
  { key: "karmaFiveStar", points: 15 },
  { key: "karmaVerify", points: 20 },
  { key: "karmaWelcome", points: 5 },
];

export const KARMA_LEVELS: KarmaLevel[] = [
  { id: "newcomer", labelKey: "levelNewcomer", minPoints: 0 },
  { id: "neighbor", labelKey: "levelNeighbor", minPoints: 50 },
  { id: "contributor", labelKey: "levelContributor", minPoints: 200 },
  { id: "pillar", labelKey: "levelPillar", minPoints: 500 },
];

export function karmaLevelFor(points: number): KarmaLevel {
  return (
    [...KARMA_LEVELS].reverse().find((l) => points >= l.minPoints) ??
    KARMA_LEVELS[0]
  );
}

/** Points still needed for the next tier, or null once maxed out. */
export function karmaProgress(points: number) {
  const current = karmaLevelFor(points);
  const next = KARMA_LEVELS.find((l) => l.minPoints > points);
  if (!next) return { current, next: null, pct: 100, remaining: 0 };
  const span = next.minPoints - current.minPoints;
  const done = points - current.minPoints;
  return {
    current,
    next,
    pct: Math.round((done / span) * 100),
    remaining: next.minPoints - points,
  };
}

export const USERS: User[] = [
  {
    id: "u1",
    name: "Marisol Vargas",
    avatarSeed: "marisol",
    zoneId: "coco",
    joinedAt: "2025-03-11",
    emailVerified: true,
    phoneVerified: true,
    neighborVerified: true,
    rating: 4.9,
    reviewCount: 34,
    karma: 610,
    givenAway: 18,
    responseMinutes: 12,
    bio: "Lived in Coco for 11 years. I teach at the primary school and I am always clearing out the classroom cupboard.",
  },
  {
    id: "u2",
    name: "Danny Oberst",
    avatarSeed: "danny",
    zoneId: "hermosa",
    joinedAt: "2025-08-02",
    emailVerified: true,
    phoneVerified: true,
    neighborVerified: true,
    rating: 4.7,
    reviewCount: 21,
    karma: 245,
    givenAway: 6,
    responseMinutes: 40,
    bio: "Surf instructor. Boards, fins, and wetsuits pass through my garage constantly.",
  },
  {
    id: "u3",
    name: "Kata Jiménez",
    avatarSeed: "kata",
    zoneId: "sardinal",
    joinedAt: "2026-01-19",
    emailVerified: true,
    phoneVerified: false,
    neighborVerified: true,
    rating: 5.0,
    reviewCount: 9,
    karma: 130,
    givenAway: 5,
    responseMinutes: 25,
    bio: "Moved here from Cartago. Slowly furnishing a house and passing on whatever we outgrow.",
  },
  {
    id: "u4",
    name: "Tobias Reed",
    avatarSeed: "tobias",
    zoneId: "ocotal",
    joinedAt: "2026-07-28",
    emailVerified: true,
    phoneVerified: false,
    neighborVerified: false,
    rating: 0,
    reviewCount: 0,
    karma: 25,
    givenAway: 0,
    responseMinutes: 0,
    bio: "New in town.",
  },
  {
    id: "u5",
    name: "Rocío Delgado",
    avatarSeed: "rocio",
    zoneId: "artola",
    joinedAt: "2024-11-05",
    emailVerified: true,
    phoneVerified: true,
    neighborVerified: true,
    rating: 4.8,
    reviewCount: 52,
    karma: 780,
    givenAway: 31,
    responseMinutes: 8,
    bio: "Run the vivero on the main road. Cuttings and seedlings are always free to neighbors.",
  },
  {
    id: "u6",
    name: "Priya Raman",
    avatarSeed: "priya",
    zoneId: "hermosa",
    joinedAt: "2025-06-14",
    emailVerified: true,
    phoneVerified: true,
    neighborVerified: true,
    rating: 4.9,
    reviewCount: 27,
    karma: 415,
    givenAway: 12,
    responseMinutes: 18,
    bio: "Here on a two-year contract, so most of what we bought is going back out the door.",
  },
];

export const CURRENT_USER_ID = "u3";

export function userById(id: string) {
  return USERS.find((u) => u.id === id) ?? USERS[0];
}

export function zoneById(id: string) {
  return ZONES.find((z) => z.id === id) ?? ZONES[0];
}

export function categoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

/**
 * Listings are written to match the sample photos rather than the other way
 * round. Keyword stock photography is unreliable for specific products, so
 * anything whose photo came back wrong was cut instead of shipped mismatched.
 */
export const LISTINGS: Listing[] = [
  {
    id: "l1",
    title: "7'2\" funboard, minor dings",
    priceUsd: 180,
    categoryId: "outdoors",
    zoneId: "hermosa",
    condition: "fair",
    status: "available",
    description:
      "Great learner board. Two pressure dings on the deck, sealed and watertight. Comes with the fins but no bag.",
    photos: ["/samples/surfboard-2.jpg", "/samples/surfboard-1.jpg"],
    sellerId: "u2",
    postedAt: "2026-08-13T09:05:00Z",
    savedCount: 28,
    accent: "#2b5a6b",
  },
  {
    id: "l2",
    title: "Inflatable paddleboard with pump",
    priceUsd: 240,
    categoryId: "outdoors",
    zoneId: "hermosa",
    condition: "like-new",
    status: "available",
    description:
      "Second season, no leaks. Pump, leash and three-piece paddle included. Rolls into the bag it comes with.",
    photos: ["/samples/paddleboard-2.jpg", "/samples/paddleboard-1.jpg"],
    sellerId: "u6",
    postedAt: "2026-08-14T10:05:00Z",
    savedCount: 46,
    accent: "#1f6d84",
  },
  {
    id: "l3",
    title: "Sit-on-top kayak, single",
    priceUsd: 300,
    categoryId: "outdoors",
    zoneId: "panama",
    condition: "good",
    status: "available",
    description:
      "Stable enough for beginners. Scratches on the hull from launching off rocks. Paddle and seat included.",
    photos: ["/samples/kayak-1.jpg"],
    sellerId: "u6",
    postedAt: "2026-08-13T11:25:00Z",
    savedCount: 38,
    accent: "#1a6a6b",
  },
  {
    id: "l4",
    title: "Snorkel set, adult size",
    priceUsd: 25,
    categoryId: "outdoors",
    zoneId: "ocotal",
    condition: "like-new",
    status: "available",
    description:
      "Mask, snorkel and fins. Used maybe four times. Silicone skirt is still soft, no fogging issues.",
    photos: ["/samples/snorkel-2.jpg"],
    sellerId: "u2",
    postedAt: "2026-08-11T15:45:00Z",
    savedCount: 19,
    accent: "#1c5f7d",
  },
  {
    id: "l5",
    title: "Four-person tent, all poles",
    priceUsd: 65,
    categoryId: "outdoors",
    zoneId: "artola",
    condition: "good",
    status: "available",
    description:
      "Rainfly, footprint and stakes all there. Dry and clean, stored indoors. One zipper pull replaced.",
    photos: ["/samples/tent-2.jpg"],
    sellerId: "u5",
    postedAt: "2026-08-12T07:45:00Z",
    savedCount: 18,
    accent: "#3f5e3a",
  },
  {
    id: "l6",
    title: "Two-burner camp stove",
    priceUsd: 40,
    categoryId: "outdoors",
    zoneId: "sardinal",
    condition: "good",
    status: "available",
    description:
      "Propane, both burners light first try. No hose or tank included. Good for power cuts.",
    photos: ["/samples/camp-stove-1.jpg"],
    sellerId: "u4",
    postedAt: "2026-08-12T09:00:00Z",
    savedCount: 8,
    accent: "#4a5560",
  },
  {
    id: "l7",
    title: "Picnic basket and blanket",
    priceUsd: 30,
    categoryId: "outdoors",
    zoneId: "coco",
    condition: "good",
    status: "available",
    description:
      "Wicker basket with the plates and glasses still in it. Blanket washes up fine. One strap is fraying.",
    photos: ["/samples/cooler-1.jpg"],
    sellerId: "u1",
    postedAt: "2026-08-10T12:30:00Z",
    savedCount: 12,
    accent: "#6b7a4a",
  },
  {
    id: "l8",
    title: "Rattan porch chairs, pair",
    priceUsd: 120,
    categoryId: "furniture",
    zoneId: "liberia",
    condition: "good",
    status: "available",
    description:
      "Weathered but sturdy. Cushions not included. Would look good with a sand and a coat of oil.",
    photos: ["/samples/rattan-chairs-2.jpg"],
    sellerId: "u3",
    postedAt: "2026-08-09T10:00:00Z",
    savedCount: 17,
    accent: "#7a6a3f",
  },
  {
    id: "l9",
    title: "Pine bookshelf, five shelves",
    priceUsd: 60,
    categoryId: "furniture",
    zoneId: "coco",
    condition: "good",
    status: "available",
    description:
      "Solid, not particle board. One shelf has a water ring. Comes apart with a screwdriver for transport.",
    photos: ["/samples/bookshelf-2.jpg"],
    sellerId: "u1",
    postedAt: "2026-08-13T16:40:00Z",
    savedCount: 24,
    accent: "#7a6242",
  },
  {
    id: "l10",
    title: "Painted wooden chairs, set of three",
    priceUsd: 90,
    categoryId: "furniture",
    zoneId: "hermosa",
    condition: "good",
    status: "pending",
    description:
      "All three solid, no wobble. Painted white a few years back, a couple of chips in the finish.",
    photos: ["/samples/dining-chairs-1.jpg"],
    sellerId: "u6",
    postedAt: "2026-08-13T13:00:00Z",
    savedCount: 15,
    accent: "#8a8272",
  },
  {
    id: "l11",
    title: "Monstera cuttings, rooted",
    priceUsd: null,
    categoryId: "home",
    zoneId: "artola",
    condition: "new",
    status: "available",
    description:
      "Six rooted cuttings from the big plant at the vivero. Free, but bring your own pot. Porch pickup any afternoon.",
    photos: ["/samples/monstera-1.jpg"],
    sellerId: "u5",
    postedAt: "2026-08-12T16:45:00Z",
    savedCount: 41,
    accent: "#2f5c33",
  },
  {
    id: "l12",
    title: "Potted plants, three of them",
    priceUsd: null,
    categoryId: "home",
    zoneId: "artola",
    condition: "good",
    status: "available",
    description:
      "Moving out and cannot take them. All healthy, pots included. Two need repotting soon.",
    photos: ["/samples/monstera-2.jpg"],
    sellerId: "u5",
    postedAt: "2026-08-14T09:20:00Z",
    savedCount: 26,
    accent: "#3d6b3a",
  },
  {
    id: "l13",
    title: "Patio umbrella with base",
    priceUsd: 50,
    categoryId: "home",
    zoneId: "coco",
    condition: "fair",
    status: "available",
    description:
      "Fabric is sun-faded on one side. Crank works, tilt does not. Concrete base is the heavy part.",
    photos: ["/samples/patio-umbrella-1.jpg"],
    sellerId: "u1",
    postedAt: "2026-08-09T17:30:00Z",
    savedCount: 7,
    accent: "#8a4a3a",
  },
  {
    id: "l14",
    title: "Sewing machine, mechanical",
    priceUsd: 70,
    categoryId: "home",
    zoneId: "sardinal",
    condition: "good",
    status: "available",
    description:
      "Straight and zigzag stitch, foot pedal works. Serviced last year. No manual but easy to figure out.",
    photos: ["/samples/sewing-machine-1.jpg"],
    sellerId: "u3",
    postedAt: "2026-08-07T09:30:00Z",
    savedCount: 16,
    accent: "#5a4a52",
  },
  {
    id: "l15",
    title: "Pedestal fan, three speeds",
    priceUsd: null,
    categoryId: "free",
    zoneId: "artola",
    condition: "fair",
    status: "available",
    description:
      "Loud on the highest setting but moves plenty of air. Height adjustment sticks. Free to a good home.",
    photos: ["/samples/pedestal-fan-1.jpg"],
    sellerId: "u5",
    postedAt: "2026-08-14T06:50:00Z",
    savedCount: 30,
    accent: "#55606b",
  },
  {
    id: "l16",
    title: "Porcelain teapot, no chips",
    priceUsd: 15,
    categoryId: "home",
    zoneId: "coco",
    condition: "like-new",
    status: "available",
    description:
      "Hand-painted, holds about a litre. Lid sits properly. Never used it — it was a gift.",
    photos: ["/samples/teapot-1.jpg"],
    sellerId: "u1",
    postedAt: "2026-08-11T14:00:00Z",
    savedCount: 9,
    accent: "#6b6259",
  },
  {
    id: "l17",
    title: "Laptop, fine for browsing",
    priceUsd: 220,
    categoryId: "electronics",
    zoneId: "coco",
    condition: "fair",
    status: "available",
    description:
      "Battery lasts about two hours now. Screen and keyboard are perfect. Wiped and reinstalled already.",
    photos: ["/samples/laptop-1.jpg"],
    sellerId: "u2",
    postedAt: "2026-08-13T18:10:00Z",
    savedCount: 44,
    accent: "#4a5259",
  },
  {
    id: "l18",
    title: "Vintage box camera, display piece",
    priceUsd: 65,
    categoryId: "electronics",
    zoneId: "sardinal",
    condition: "fair",
    status: "available",
    description:
      "Shutter still fires. I never tried film in it. Leather is worn at the corners. Looks great on a shelf.",
    photos: ["/samples/camera-1.jpg"],
    sellerId: "u3",
    postedAt: "2026-08-10T11:15:00Z",
    savedCount: 31,
    accent: "#6b5a42",
  },
  {
    id: "l19",
    title: "Turntable and bookshelf speakers",
    priceUsd: 190,
    categoryId: "electronics",
    zoneId: "hermosa",
    condition: "good",
    status: "available",
    description:
      "Belt was replaced last year. Needs a new stylus soon. Speakers have a small dent in one grille.",
    photos: ["/samples/speaker-1.jpg"],
    sellerId: "u6",
    postedAt: "2026-08-12T20:00:00Z",
    savedCount: 37,
    accent: "#3f4650",
  },
  {
    id: "l20",
    title: "Typewriter, ribbon needs replacing",
    priceUsd: 80,
    categoryId: "electronics",
    zoneId: "liberia",
    condition: "fair",
    status: "available",
    description:
      "Every key strikes cleanly. Carriage return works. Ribbon is dry — they are easy enough to find online.",
    photos: ["/samples/typewriter-1.jpg"],
    sellerId: "u4",
    postedAt: "2026-08-08T13:45:00Z",
    savedCount: 22,
    accent: "#5a4f42",
  },
  {
    id: "l21",
    title: "Mountain bike, 21 speed",
    priceUsd: 150,
    categoryId: "vehicles",
    zoneId: "sardinal",
    condition: "fair",
    status: "available",
    description:
      "Gears index cleanly after a tune last month. Rear tire is worn and should be replaced soon.",
    photos: ["/samples/mountain-bike-1.jpg"],
    sellerId: "u4",
    postedAt: "2026-08-10T08:20:00Z",
    savedCount: 29,
    accent: "#4a5a34",
  },
  {
    id: "l22",
    title: "Road bike, recently tuned",
    priceUsd: 210,
    categoryId: "vehicles",
    zoneId: "coco",
    condition: "good",
    status: "available",
    description:
      "Rides beautifully. New bar tape and cables. Small scratch on the top tube from a fall.",
    photos: ["/samples/mountain-bike-2.jpg"],
    sellerId: "u2",
    postedAt: "2026-08-14T07:00:00Z",
    savedCount: 35,
    accent: "#3a5a6b",
  },
  {
    id: "l23",
    title: "Kid's bike, 20 inch",
    priceUsd: 85,
    categoryId: "vehicles",
    zoneId: "coco",
    condition: "fair",
    status: "available",
    description:
      "Outgrown but plenty of life left. Brakes adjusted last month, tires hold air. Helmet included.",
    photos: ["/samples/toddler-bike-2.jpg"],
    sellerId: "u2",
    postedAt: "2026-08-13T07:10:00Z",
    savedCount: 33,
    accent: "#2a6f7a",
  },
  {
    id: "l24",
    title: "Baby stroller, folds one-handed",
    priceUsd: 55,
    categoryId: "kids",
    zoneId: "ocotal",
    condition: "good",
    status: "available",
    description:
      "Washed the fabric, wheels roll straight. Sun canopy has a small tear. Cup holder included.",
    photos: ["/samples/stroller-1.jpg"],
    sellerId: "u4",
    postedAt: "2026-08-11T12:00:00Z",
    savedCount: 21,
    accent: "#4a5a6b",
  },
  {
    id: "l25",
    title: "Baby clothes, 0–12 months",
    priceUsd: null,
    categoryId: "kids",
    zoneId: "ocotal",
    condition: "good",
    status: "available",
    description:
      "Two full bags, washed and folded. Mostly onesies and sleepers. Free — just come get them.",
    photos: ["/samples/baby-clothes-1.jpg"],
    sellerId: "u3",
    postedAt: "2026-08-14T07:15:00Z",
    savedCount: 34,
    accent: "#7a6a5a",
  },
  {
    id: "l26",
    title: "Large dog crate, folding",
    priceUsd: 45,
    categoryId: "pets",
    zoneId: "liberia",
    condition: "good",
    status: "available",
    description:
      "Fits a lab comfortably. Folds flat for transport. Tray included, one latch needs a firm push.",
    photos: ["/samples/dog-crate-1.jpg"],
    sellerId: "u4",
    postedAt: "2026-08-08T11:00:00Z",
    savedCount: 11,
    accent: "#4f5359",
  },
  {
    id: "l27",
    title: "Cat carrier, bed and bowls",
    priceUsd: 20,
    categoryId: "pets",
    zoneId: "artola",
    condition: "good",
    status: "available",
    description:
      "Our cat outgrew the carrier. Bed was washed and is in good shape. Both clean, no smell.",
    photos: ["/samples/cat-tree-1.jpg"],
    sellerId: "u5",
    postedAt: "2026-08-08T16:20:00Z",
    savedCount: 10,
    accent: "#6b5f4a",
  },
  {
    id: "l28",
    title: "Cordless drill and bit set",
    priceUsd: 55,
    categoryId: "tools",
    zoneId: "ocotal",
    condition: "good",
    status: "available",
    description:
      "Two batteries, both hold a charge. Case is cracked but everything inside is fine.",
    photos: ["/samples/drill-1.jpg"],
    sellerId: "u2",
    postedAt: "2026-08-11T08:15:00Z",
    savedCount: 14,
    accent: "#a3452c",
  },
  {
    id: "l29",
    title: "Stack of paperbacks, mixed",
    priceUsd: null,
    categoryId: "free",
    zoneId: "panama",
    condition: "fair",
    status: "available",
    description:
      "About thirty books, mostly English, some Spanish. Take the whole box or just what you want.",
    photos: ["/samples/paperbacks-1.jpg"],
    sellerId: "u5",
    postedAt: "2026-08-10T13:40:00Z",
    savedCount: 22,
    accent: "#5a4a3a",
  },
  {
    id: "l30",
    title: "Camping tarp, 3x3m",
    priceUsd: null,
    categoryId: "free",
    zoneId: "hermosa",
    condition: "good",
    status: "available",
    description:
      "Rigged it between trees for years with no leaks. Guy lines and pegs included. One corner grommet is bent.",
    photos: ["/samples/hammock-2.jpg"],
    sellerId: "u6",
    postedAt: "2026-08-14T08:30:00Z",
    savedCount: 51,
    accent: "#5a6b3a",
  },
  {
    id: "l31",
    title: "Bass guitar with gig bag",
    priceUsd: 160,
    categoryId: "free",
    zoneId: "coco",
    condition: "good",
    status: "available",
    description:
      "Four string, plays clean all the way up the neck. Bag has a broken zipper. Strap included.",
    photos: ["/samples/guitar-2.jpg", "/samples/guitar-1.jpg"],
    sellerId: "u6",
    postedAt: "2026-08-10T19:20:00Z",
    savedCount: 27,
    accent: "#4a3f4a",
  },
];

export function listingById(id: string) {
  return LISTINGS.find((l) => l.id === id);
}

export const REVIEWS: Review[] = [
  {
    id: "r1",
    authorId: "u1",
    subjectId: "u3",
    listingId: "l18",
    rating: 5,
    body: "Kata held the camera for me for two days while I sorted out a ride over. Exactly as described, and she threw in a case for it.",
    createdAt: "2026-07-30T00:00:00Z",
  },
  {
    id: "r2",
    authorId: "u5",
    subjectId: "u3",
    listingId: "l8",
    rating: 5,
    body: "Easy handoff, clear directions to the house, chairs were in better shape than the photos suggested.",
    createdAt: "2026-07-14T00:00:00Z",
  },
  {
    id: "r3",
    authorId: "u2",
    subjectId: "u3",
    listingId: "l14",
    rating: 5,
    body: "Straightforward and quick to reply. Would trade with again.",
    createdAt: "2026-06-22T00:00:00Z",
  },
];

export function reviewsFor(userId: string) {
  return REVIEWS.filter((r) => r.subjectId === userId);
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    listingId: "l1",
    withUserId: "u2",
    lastMessage: "I can do 150 if you can pick it up before Sunday.",
    lastAt: "2026-08-14T09:12:00Z",
    unread: 2,
    offerUsd: 150,
    offerStatus: "pending",
  },
  {
    id: "c2",
    listingId: "l9",
    withUserId: "u1",
    lastMessage: "Perfect — my brother has a truck, we'll come by Saturday morning.",
    lastAt: "2026-08-13T19:40:00Z",
    unread: 0,
  },
  {
    id: "c3",
    listingId: "l11",
    withUserId: "u5",
    lastMessage: "Cuttings are on the porch whenever you want to swing by 🌿",
    lastAt: "2026-08-13T08:02:00Z",
    unread: 0,
  },
  {
    id: "c4",
    listingId: "l28",
    withUserId: "u2",
    lastMessage: "Does it come with the charger?",
    lastAt: "2026-08-11T15:20:00Z",
    unread: 0,
  },
];

/** "3h ago" / "2d ago" — short and scannable in a dense list. */
export function timeAgo(iso: string, now = new Date("2026-08-14T12:00:00Z")) {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.round(days / 7)}w`;
}

export function priceLabel(priceUsd: number | null, freeWord = "Free") {
  return priceUsd === null ? freeWord : `$${priceUsd.toLocaleString()}`;
}
