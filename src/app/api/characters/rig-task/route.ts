import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const rigTaskSchema = z.object({
  avatar_id: z.string().min(1),
  rig_task_id: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = rigTaskSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { avatar_id, rig_task_id } = parsed.data;

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

  const nextConfig = {
    ...(avatar.config ?? {}),
    rig_task_id,
  };

  const { error: updateError } = await admin
    .from("avatars")
    .update({
      config: nextConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", avatar_id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to save rig task id" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

