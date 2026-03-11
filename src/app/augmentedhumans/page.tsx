import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppTopNav } from "@/components/AppTopNav";
import { AugmentedHumansView } from "./AugmentedHumansView";

export default async function AugmentedHumansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/augmentedhumans");

  return (
    <div className="min-h-screen bg-brand-dark">
      <AppTopNav
        right={
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            ← Back
          </Link>
        }
      />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold text-white">
          Augmented Humans
        </h1>
        <p className="mt-2 text-gray-400">
          emodrink — working on the future of optimal drink prediction and
          presentation of that info.
        </p>
        <AugmentedHumansView />
      </div>
    </div>
  );
}
