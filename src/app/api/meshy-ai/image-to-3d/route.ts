import { createClient } from "@/lib/supabase/server";
import {
  createImageTo3D,
  getImageTo3DStatus,
  type MeshyApiError,
} from "@/meshy-ai/client";
import { imageTo3DSchema } from "@/meshy-ai/schemas";
import { NextResponse } from "next/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  return user;
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Meshy API not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const parsed = imageTo3DSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { image_url, texture_prompt } = parsed.data;

    const taskId = await createImageTo3D(apiKey, image_url, {
      // Important: If both texture_prompt and texture_image_url are provided, Meshy will
      // default to text prompting for texture. We prefer the photo to preserve colors.
      texture_prompt,
      texture_image_url: image_url,
      pose_mode: "t-pose",
      should_texture: true,
    });

    const task = await getImageTo3DStatus(apiKey, taskId);
    return NextResponse.json({
      task_id: taskId,
      status: task.status,
      progress: task.progress,
    });
  } catch (e) {
    const err = e as MeshyApiError;
    const status = err?.status ?? 500;
    const message = err?.message ?? "Failed to create character from image";
    return NextResponse.json(
      { error: message },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}
