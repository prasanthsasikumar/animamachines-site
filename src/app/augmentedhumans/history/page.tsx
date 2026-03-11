import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppTopNav } from "@/components/AppTopNav";

export default async function AugmentedHumansHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/augmentedhumans/history");

  const { data: sessions } = await supabase
    .from("augmented_human_sessions")
    .select(
      "id, sleep_score, arousal, valence, gender, age_bracket, client_timestamp, capture_photo_path, animated_glb_path, created_at, config"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // Build signed URLs for capture thumbnails
  const sessionsWithUrls = await Promise.all(
    (sessions ?? []).map(async (s) => {
      let captureUrl: string | null = null;
      if (s.capture_photo_path) {
        const { data } = await supabase.storage
          .from("characters")
          .createSignedUrl(s.capture_photo_path, 3600);
        captureUrl = data?.signedUrl ?? null;
      }
      return { ...s, captureUrl };
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
          All your Augmented Humans captures and generation results.
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
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessionsWithUrls.map((s) => (
              <div
                key={s.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-brand-dark-card/80 transition hover:border-white/20"
              >
                {s.captureUrl ? (
                  <img
                    src={s.captureUrl}
                    alt="Capture"
                    className="h-40 w-full object-cover bg-black/30"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-black/30 text-gray-600 text-sm">
                    No capture
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <p className="text-xs text-gray-500">
                    {new Date(s.client_timestamp ?? s.created_at).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span>
                      Sleep: <span className="text-white">{s.sleep_score}</span>
                    </span>
                    <span>
                      Arousal: <span className="text-white">{s.arousal}</span>
                    </span>
                    <span>
                      Valence: <span className="text-white">{s.valence}</span>
                    </span>
                    {s.gender && (
                      <span>
                        Gender: <span className="text-white capitalize">{s.gender}</span>
                      </span>
                    )}
                    {s.age_bracket && (
                      <span>
                        Age: <span className="text-white">{s.age_bracket}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.animated_glb_path ? (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                        Completed
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                        In progress
                      </span>
                    )}
                  </div>
                  {s.animated_glb_path && (
                    <p className="break-all rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-brand-cyan">
                      /api/augmented-humans/{s.id}/glb
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
