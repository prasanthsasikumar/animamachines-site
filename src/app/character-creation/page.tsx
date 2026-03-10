import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CharacterCreationForm } from "./CharacterCreationForm";

export default async function CharacterCreationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/character-creation");

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">
          Create Character
        </h1>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-brand-cyan hover:text-white"
        >
          Back to Account
        </Link>
      </div>

      <p className="mb-8 text-gray-400">
        Create a 3D character from a text prompt, add textures, and rig it for
        animation using Meshy AI.
      </p>

      <CharacterCreationForm />
    </div>
  );
}
