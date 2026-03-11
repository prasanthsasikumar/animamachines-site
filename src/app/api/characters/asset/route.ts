import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const BASE_ASSET_KINDS = [
  "input_photo",
  "fullbody_photo",
  "preview_glb",
  "textured_glb",
  "rigged_glb",
] as const;

const assetSchema = z.object({
  avatar_id: z.string().min(1),
  kind: z
    .string()
    .refine(
      (k) =>
        BASE_ASSET_KINDS.includes(k as (typeof BASE_ASSET_KINDS)[number]) ||
        /^animated_\w+_glb$/.test(k),
      { message: "Invalid asset kind" }
    ),
  source_url: z.string().min(1), // http(s) or data URI
});

function extForKind(kind: string): { ext: string; contentType: string } {
  if (kind.endsWith("_glb")) return { ext: "glb", contentType: "model/gltf-binary" };
  return { ext: "png", contentType: "image/png" };
}

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({}));
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { avatar_id, kind, source_url } = parsed.data;

  // Ensure avatar belongs to user
  const { data: avatar, error: avatarErr } = await admin
    .from("avatars")
    .select("id, user_id, config")
    .eq("id", avatar_id)
    .single();

  if (avatarErr || !avatar) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
  }
  if (avatar.user_id !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { ext, contentType } = extForKind(kind);
  const storagePath = `${user.id}/${avatar_id}/${kind}.${ext}`;

  const res = await fetch(source_url);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 400 });
  }
  const blob = await res.blob();

  const { error: uploadError } = await admin.storage
    .from("characters")
    .upload(storagePath, blob, {
      contentType: blob.type || contentType,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message ?? "Upload failed" }, { status: 500 });
  }

  const nextConfig = { ...(avatar.config ?? {}), [kind]: storagePath };
  if (kind.startsWith("animated_")) {
    (nextConfig as Record<string, unknown>).preview_model = kind;
  }

  const update: Record<string, unknown> = {
    config: nextConfig,
    updated_at: new Date().toISOString(),
  };
  if (kind === "rigged_glb") {
    update.storage_path = storagePath;
  }

  const { error: updateError } = await admin
    .from("avatars")
    .update(update)
    .eq("id", avatar_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message ?? "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, storage_path: storagePath });
}

