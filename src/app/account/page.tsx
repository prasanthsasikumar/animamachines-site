import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppTopNav } from "@/components/AppTopNav";
import { LogoutButton } from "./LogoutButton";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account");

  return (
    <div className="min-h-screen bg-brand-dark">
      <AppTopNav
        right={
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
          >
            Back Home
          </Link>
        }
      />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-white">Account</h1>
        <p className="mt-1 text-gray-400">Signed in as {user.email}</p>

        <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-brand-dark-card/80 p-6">
          <h2 className="font-display text-lg font-semibold text-white">Plan</h2>
          <p className="mt-1 text-sm text-gray-400">Free — 1 character slot, 500 credits/month</p>
        </div>

        <Link
          href="/characters"
          className="group block rounded-2xl border border-white/10 bg-brand-dark-card/80 p-6 transition-all hover:-translate-y-0.5 hover:border-brand-cyan/30 hover:bg-brand-dark-card/95 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
        >
          <h2 className="font-display text-lg font-semibold text-white">
            My Characters
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            View and manage your saved characters
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan transition-colors group-hover:text-white">
            Open library →
          </p>
        </Link>

        <div className="mt-8 pt-6 border-t border-white/10">
          <LogoutButton />
        </div>
        </div>
      </div>
    </div>
  );
}
