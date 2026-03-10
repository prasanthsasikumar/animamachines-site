import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CharactersList } from "./CharactersList";

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
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">
          My Characters
        </h1>
        <div className="flex gap-3">
          <Link
            href="/character-creation"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create Character
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-brand-cyan hover:text-white"
          >
            Back to Account
          </Link>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-brand-dark-card/80 p-12 text-center">
          <p className="text-gray-400">No saved characters yet.</p>
          <Link
            href="/character-creation"
            className="mt-4 inline-block text-brand-cyan hover:text-white"
          >
            Create your first character
          </Link>
        </div>
      ) : (
        <CharactersList characters={characters} />
      )}
    </div>
  );
}
