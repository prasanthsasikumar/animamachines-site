import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AppTopNav } from "@/components/AppTopNav";
import Link from "next/link";
import { CharacterDetailView } from "./CharacterDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CharacterDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/characters/${id}`);
  }

  const { data: avatar, error: avatarError } = await supabase
    .from("avatars")
    .select("id, name, storage_path, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (avatarError) {
    console.error("Avatar fetch error", avatarError);
  }

  if (!avatar || !avatar.storage_path) {
    notFound();
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("characters")
    .createSignedUrl(avatar.storage_path as string, 3600);

  if (signedError || !signed?.signedUrl) {
    console.error("Signed URL error", signedError);
    notFound();
  }

  const modelUrl = signed.signedUrl;
  const createdAt = avatar.created_at
    ? new Date(avatar.created_at as string).toLocaleDateString()
    : "";

  return (
    <div className="min-h-screen bg-brand-dark">
      <AppTopNav
        right={
          <>
            <Link
              href="/characters"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
            >
              ← Back to list
            </Link>
          </>
        }
      />

      <CharacterDetailView
        modelUrl={modelUrl}
        name={avatar.name ?? "Character"}
        createdAt={createdAt}
      />
    </div>
  );
}

