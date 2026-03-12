import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicModelViewer from "./PublicModelViewer";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Augmented Human – Anima Machines`,
    description: `View this Augmented Human 3D model created on Anima Machines.`,
    openGraph: {
      title: "Augmented Human – Anima Machines",
      description: "View this Augmented Human 3D model.",
      url: `/augmentedhumans/view/${id}`,
    },
  };
}

export default async function PublicViewPage({ params }: Props) {
  const { id } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    notFound();
  }

  const { data: session } = await admin
    .from("augmented_human_sessions")
    .select(
      "id, user_id, sleep_score, arousal, valence, gender, age_bracket, animated_glb_path, model_glb_path, client_timestamp, created_at"
    )
    .eq("id", id)
    .single();

  if (!session) notFound();

  const glbPath = session.animated_glb_path ?? session.model_glb_path;
  if (!glbPath) notFound();

  // Fetch creator name
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, email")
    .eq("id", session.user_id)
    .single();

  const creatorName =
    profile?.display_name || profile?.email || "Anonymous";

  // Generate a signed URL for the GLB (1 hour)
  const { data: signed } = await admin.storage
    .from("characters")
    .createSignedUrl(glbPath, 3600);

  if (!signed?.signedUrl) notFound();

  return (
    <PublicModelViewer
      glbUrl={signed.signedUrl}
      creatorName={creatorName}
      timestamp={session.client_timestamp ?? session.created_at}
      sleepScore={session.sleep_score}
      arousal={session.arousal}
      valence={session.valence}
      gender={session.gender}
      ageBracket={session.age_bracket}
      sessionId={session.id}
    />
  );
}
