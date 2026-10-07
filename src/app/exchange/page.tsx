import { LISTINGS } from "@/lib/data";
import { fetchListings } from "@/lib/fetchListings";
import { BrowseView } from "@/components/BrowseView";

/**
 * The home screen.
 *
 * A server component so the database read happens before the page is sent,
 * rather than the browser fetching after it loads. Real listings and the
 * built-in samples are passed separately so the view can keep them visually
 * apart — otherwise there is no way to tell whether something you posted
 * actually saved.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const real = await fetchListings();
  return <BrowseView real={real} samples={LISTINGS} />;
}
