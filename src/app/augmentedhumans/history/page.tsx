import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppTopNav } from "@/components/AppTopNav";
import { SessionGrid } from "./SessionGrid";

export default async function AugmentedHumansHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/augmentedhumans/history");

  // Use admin client to fetch ALL sessions (not just the current user's)
  const admin = createAdminClient();

  const { data: sessions } = await admin
    .from("augmented_human_sessions")
    .select(
      "id, user_id, sleep_score, arousal, valence, gender, age_bracket, client_timestamp, capture_photo_path, animated_glb_path, created_at, config"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // Collect unique user IDs and fetch display names
  const userIds = [...new Set((sessions ?? []).map((s) => s.user_id))];
  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("id, display_name, email")
        .in("id", userIds)
    : { data: [] };
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name || p.email || "Anonymous"])
  );

  // Build signed URLs for capture thumbnails (admin client bypasses storage RLS)
  const sessionsWithUrls = await Promise.all(
    (sessions ?? []).map(async (s) => {
      let captureUrl: string | null = null;
      if (s.capture_photo_path) {
        const { data } = await admin.storage
          .from("characters")
          .createSignedUrl(s.capture_photo_path, 3600);
        captureUrl = data?.signedUrl ?? null;
      }
      const creatorName = profileMap.get(s.user_id) ?? "Anonymous";
      return { ...s, captureUrl, creatorName };
    })
  );

  return (
    <div className="min-h-screen bg-brand-dark">
      <AppTopNav
        right={
          <>
            <Link
              href="/augmentedhumans"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              ← Back
            </Link>
          </>
        }
      />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold text-white">
          Session History
        </h1>
        <p className="mt-2 text-gray-400">
          All Augmented Humans captures and generation results.
        </p>

        {sessionsWithUrls.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-brand-dark-card/80 p-8 text-center">
            <p className="text-gray-500">No sessions yet.</p>
            <Link
              href="/augmentedhumans"
              className="mt-4 inline-block rounded-xl bg-brand-cyan px-6 py-3 text-sm font-semibold text-black transition hover:bg-brand-cyan/90"
            >
              Create your first
            </Link>
          </div>
        ) : (
          <SessionGrid sessions={sessionsWithUrls} />
        )}
      </div>
    </div>
  );
}
