import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CharactersList } from "./CharactersList";
import { AppTopNav } from "@/components/AppTopNav";

export default async function CharactersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/characters");

  const { data: avatars } = await supabase
    .from("avatars")
    .select("id, name, storage_path, created_at")
    .eq("user_id", user.id)
    .not("storage_path", "is", null)
    .order("created_at", { ascending: false });

  const characters = (avatars ?? []).map((a) => ({
    id: a.id,
    name: a.name ?? "Character",
    storage_path: a.storage_path as string,
    created_at: a.created_at,
  }));

  return (
    <div className="min-h-screen bg-brand-dark">
      <AppTopNav
        right={
          <>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
            >
              Back to Account
            </Link>
          </>
        }
      />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            My Characters
          </h1>
          <p className="mt-1 text-gray-400">
            Your saved models and creations.
          </p>
        </div>

      {characters.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-brand-dark-card/80 p-12 text-center">
          <p className="text-gray-400">No saved characters yet.</p>
          <Link
            href="/character-creation"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-purple/25 transition-all hover:scale-[1.02] hover:shadow-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          >
            Create your first character
          </Link>
        </div>
      ) : (
        <CharactersList characters={characters} />
      )}
      </div>
    </div>
  );
}
