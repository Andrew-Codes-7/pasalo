import { SectionHeader } from "@/components/SectionHeader";
import { BottomNav } from "@/components/BottomNav";
import { HomeDigest } from "@/components/HomeDigest";
import { fetchListings } from "@/lib/fetchListings";
import {
  fetchBulletin,
  fetchServices,
  fetchUpcomingEvents,
} from "@/lib/fetchCommunity";

/**
 * Home — a digest of the whole town.
 *
 * Every section gets a preview row here and a link through to its own tab.
 * Fetched in parallel: four sequential round trips would make the landing
 * screen the slowest in the app.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bulletin, events, listings, services] = await Promise.all([
    fetchBulletin(3),
    fetchUpcomingEvents(3),
    fetchListings(),
    fetchServices(3),
  ]);

  return (
    <div className="pb-28 lg:pb-12">
      <SectionHeader titleKey="bulletinTitle" subKey="bulletinSub" />
      <main className="mx-auto max-w-7xl px-4">
        <HomeDigest
          bulletin={bulletin}
          events={events}
          listings={listings.slice(0, 5)}
          services={services}
        />
      </main>
      <BottomNav />
    </div>
  );
}
