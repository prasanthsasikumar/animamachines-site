import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnimation, type MeshyApiError } from "@/meshy-ai/client";

const animateSchema = z.object({
  avatar_id: z.string().min(1),
  action_id: z.number().int(),
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

  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Meshy API not configured" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = animateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { avatar_id, action_id } = parsed.data;

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

  const rigTaskId = (avatar.config as any)?.rig_task_id as string | undefined;
  if (!rigTaskId) {
    return NextResponse.json(
      { error: "No rig_task_id stored for this avatar" },
      { status: 400 },
    );
  }

  try {
    const animationTaskId = await createAnimation(apiKey, {
      rig_task_id: rigTaskId,
      action_id,
    });

    return NextResponse.json({
      task_id: animationTaskId,
      status: "PENDING",
    });
  } catch (e) {
    const err = e as MeshyApiError;
    const status = err?.status ?? 500;
    const message = err?.message ?? "Failed to create animation";
    return NextResponse.json(
      { error: message },
      { status: typeof status === "number" ? status : 500 },
    );
  }
}

