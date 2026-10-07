import { SectionHeader } from "@/components/SectionHeader";
import { BottomNav } from "@/components/BottomNav";
import { MeetupsView } from "@/components/MeetupsView";
import { fetchUpcomingEvents } from "@/lib/fetchCommunity";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function MeetupsPage() {
  const events = await fetchUpcomingEvents(100);

  let viewerId: string | undefined;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerId = user?.id;
  }

  return (
    <div className="pb-28 lg:pb-12">
      <SectionHeader titleKey="meetupsTitle" subKey="meetupsSub" />
      <main className="mx-auto max-w-7xl px-4">
        <MeetupsView events={events} viewerId={viewerId} />
      </main>
      <BottomNav />
    </div>
  );
}
