import { createClient } from "@/lib/supabase/server";
import { createImageToImage, getImageToImageStatus, type MeshyApiError } from "@/meshy-ai/client";
import { imageToImageSchema } from "@/meshy-ai/schemas";
import { NextResponse } from "next/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Meshy API not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const parsed = imageToImageSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const taskId = await createImageToImage(apiKey, {
      ai_model: parsed.data.ai_model,
      prompt: parsed.data.prompt,
      reference_image_urls: [parsed.data.reference_image_url],
      generate_multi_view: false,
    });

    const task = await getImageToImageStatus(apiKey, taskId);
    return NextResponse.json({
      task_id: taskId,
      status: task.status,
      progress: task.progress,
    });
  } catch (e) {
    const err = e as MeshyApiError;
    const status = err?.status ?? 500;
    const message = err?.message ?? "Failed to create image";
    return NextResponse.json(
      { error: message },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}

