import { notFound } from "next/navigation";
import { LISTINGS, listingById } from "@/lib/data";
import { fetchListing } from "@/lib/fetchListings";
import { ListingView } from "@/components/ListingView";

/**
 * A listing is either a real one from the database or one of the samples the
 * browse grid still shows.
 *
 * Real ids are UUIDs; the samples are "l1".."l31". This page used to know only
 * the samples and pre-render exactly those, so posting something real
 * redirected straight into a 404.
 */
export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: PageProps<"/listing/[id]">) {
  const { id } = await params;

  const real = await fetchListing(id);
  if (real) {
    return (
      <ListingView
        listing={real.listing}
        seller={real.seller}
        alsoFrom={real.alsoFrom}
      />
    );
  }

  const sample = listingById(id);
  if (!sample) notFound();

  const sampleAlsoFrom = LISTINGS.filter(
    (l) => l.sellerId === sample.sellerId && l.id !== sample.id,
  ).slice(0, 4);

  return <ListingView listing={sample} alsoFrom={sampleAlsoFrom} />;
}
