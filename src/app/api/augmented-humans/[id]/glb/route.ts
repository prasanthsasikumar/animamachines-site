import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Public endpoint for Unity (or any client) to fetch the animated GLB.
 * No auth required; session ID is unguessable UUID.
 * Returns a signed URL valid for 1 hour.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data: session } = await admin
    .from("augmented_human_sessions")
    .select("animated_glb_path, model_glb_path")
    .eq("id", id)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

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
    return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
  }

  return NextResponse.json({ glb_url: signed.signedUrl });
}
