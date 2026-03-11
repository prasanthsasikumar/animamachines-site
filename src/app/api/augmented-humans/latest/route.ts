import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/augmented-humans/latest
 * Returns a signed GLB URL for the most recent completed
 * augmented-human session. No auth required (demo endpoint).
 */
export async function GET() {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data: session } = await admin
    .from("augmented_human_sessions")
    .select("id, animated_glb_path, model_glb_path, created_at")
    .not("animated_glb_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: "No completed session found" },
      { status: 404 }
    );
  }

  const path = session.animated_glb_path ?? session.model_glb_path;
  if (!path) {
    return NextResponse.json(
      { error: "No model available yet" },
      { status: 404 }
    );
  }

  const { data: signed, error } = await admin.storage
    .from("characters")
    .createSignedUrl(path, 3600);

  if (error || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    session_id: session.id,
    glb_url: signed.signedUrl,
    created_at: session.created_at,
  });
}
