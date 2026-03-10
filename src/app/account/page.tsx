import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-white">Account</h1>
      <p className="mt-1 text-gray-400">Signed in as {user.email}</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-brand-dark-card/80 p-6">
          <h2 className="font-display text-lg font-semibold text-white">Plan</h2>
          <p className="mt-1 text-sm text-gray-400">Free — 1 character slot, 500 credits/month</p>
        </div>

        <Link
          href="/characters"
          className="block rounded-2xl border border-white/10 bg-brand-dark-card/80 p-6 text-brand-cyan hover:text-white"
        >
          <h2 className="font-display text-lg font-semibold">My Characters</h2>
          <p className="mt-1 text-sm text-gray-400">View and manage your saved characters</p>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-cyan hover:text-white"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
