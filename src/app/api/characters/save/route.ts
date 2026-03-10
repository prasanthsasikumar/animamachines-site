import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const saveCharacterSchema = z.object({
  model_url: z.string().min(1, "model_url required"),
  name: z.string().min(1, "name required").max(100).optional().default("Character"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = saveCharacterSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { model_url, name } = parsed.data;

    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const fullUrl = model_url.startsWith("http")
      ? model_url
      : `${base}${model_url.startsWith("/") ? "" : "/"}${model_url}`;

    const res = await fetch(fullUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch model" },
        { status: 400 }
      );
    }
    const blob = await res.blob();

    const avatarRes = await supabase
      .from("avatars")
      .insert({
        user_id: user.id,
        name,
        storage_path: null,
      })
      .select("id")
      .single();

    if (avatarRes.error) {
      return NextResponse.json(
        { error: avatarRes.error.message ?? "Failed to create avatar" },
        { status: 500 }
      );
    }

    const avatarId = avatarRes.data.id as string;
    const storagePath = `${user.id}/${avatarId}.glb`;

    const { error: uploadError } = await supabase.storage
      .from("characters")
      .upload(storagePath, blob, {
        contentType: "model/gltf-binary",
        upsert: true,
      });

    if (uploadError) {
      await supabase.from("avatars").delete().eq("id", avatarId);
      return NextResponse.json(
        { error: uploadError.message ?? "Failed to upload" },
        { status: 500 }
      );
    }

    await supabase
      .from("avatars")
      .update({ storage_path: storagePath, updated_at: new Date().toISOString() })
      .eq("id", avatarId);

    const { data: signed } = await supabase.storage
      .from("characters")
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      id: avatarId,
      name,
      storage_path: storagePath,
      glb_url: signed?.signedUrl,
    });
  } catch (e) {
    console.error("Save character error:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
