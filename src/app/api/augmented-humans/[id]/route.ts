import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  fullbody_photo_url: z.string().url().optional(),
  model_glb_url: z.string().url().optional(),
  rig_task_id: z.string().optional(),
  animated_glb_url: z.string().url().optional(),
});

async function fetchAndUpload(
  admin: ReturnType<typeof createAdminClient>,
  sourceUrl: string,
  storagePath: string,
  contentType: string
): Promise<{ error?: string }> {
  const res = await fetch(sourceUrl);
  if (!res.ok) return { error: "Failed to fetch asset" };
  const blob = await res.blob();
  const { error } = await admin.storage
    .from("characters")
    .upload(storagePath, blob, {
      contentType: blob.type || contentType,
      upsert: true,
    });
  return error ? { error: error.message } : {};
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { data: session, error: fetchErr } = await admin
    .from("augmented_human_sessions")
    .select("id, user_id, config")
    .eq("id", id)
    .single();

  if (fetchErr || !session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const basePath = `${user.id}/augmented/${id}`;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  const config = { ...(session.config as Record<string, unknown>) };

  if (parsed.data.fullbody_photo_url) {
    const path = `${basePath}/fullbody.png`;
    const err = await fetchAndUpload(admin, parsed.data.fullbody_photo_url, path, "image/png");
    if (err.error) return NextResponse.json({ error: err.error }, { status: 500 });
    updates.fullbody_photo_path = path;
  }
  if (parsed.data.model_glb_url) {
    const path = `${basePath}/model.glb`;
    const err = await fetchAndUpload(admin, parsed.data.model_glb_url, path, "model/gltf-binary");
    if (err.error) return NextResponse.json({ error: err.error }, { status: 500 });
    updates.model_glb_path = path;
  }
  if (parsed.data.rig_task_id) {
    config.rig_task_id = parsed.data.rig_task_id;
    updates.config = config;
  }
  if (parsed.data.animated_glb_url) {
    const path = `${basePath}/animated.glb`;
    const err = await fetchAndUpload(admin, parsed.data.animated_glb_url, path, "model/gltf-binary");
    if (err.error) return NextResponse.json({ error: err.error }, { status: 500 });
    updates.animated_glb_path = path;
  }

  const { error: updateErr } = await admin
    .from("augmented_human_sessions")
    .update(updates)
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message ?? "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
