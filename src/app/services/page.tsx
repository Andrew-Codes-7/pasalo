import { SectionHeader } from "@/components/SectionHeader";
import { BottomNav } from "@/components/BottomNav";
import { ServicesView } from "@/components/ServicesView";
import { fetchServices } from "@/lib/fetchCommunity";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await fetchServices(200);

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
      <SectionHeader titleKey="servicesTitle" subKey="servicesSub" />
      <main className="mx-auto max-w-7xl px-4">
        <ServicesView services={services} viewerId={viewerId} />
      </main>
      <BottomNav />
    </div>
  );
}
