import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/SectionHeader";
import { BottomNav } from "@/components/BottomNav";
import { ModerationQueue } from "@/components/ModerationQueue";
import { fetchPending } from "@/lib/fetchPending";

/**
 * The review queue, for moderators.
 *
 * Hidden from everyone else — but the hiding is cosmetic. Row Level Security
 * is what actually stops a non-moderator seeing or approving anything, so
 * finding this URL gains you nothing.
 */
export const dynamic = "force-dynamic";

export default async function ModeratePage() {
  const queue = await fetchPending();
  if (!queue.isModerator) notFound();

  return (
    <div className="pb-28 lg:pb-12">
      <SectionHeader titleKey="reviewQueue" subKey="reviewQueueSub" />
      <main className="mx-auto max-w-3xl px-4">
        <ModerationQueue queue={queue} />
      </main>
      <BottomNav />
    </div>
  );
}
