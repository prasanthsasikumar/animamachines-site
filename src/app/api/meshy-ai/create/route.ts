import { createClient } from "@/lib/supabase/server";
import {
  createPreview,
  createRefine,
  getTextTo3DStatus,
  type MeshyApiError,
} from "@/meshy-ai/client";
import { createCharacterSchema, refineCharacterSchema } from "@/meshy-ai/schemas";
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

    // Determine action: "preview" or "refine"
    const isRefine = "preview_task_id" in body && body.preview_task_id;
    const schema = isRefine ? refineCharacterSchema : createCharacterSchema;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    let taskId: string;

    if (isRefine) {
      const data = parsed.data as {
        preview_task_id: string;
        texture_prompt?: string;
        enable_pbr?: boolean;
      };
      taskId = await createRefine(apiKey, data.preview_task_id, {
        texture_prompt: data.texture_prompt,
        enable_pbr: data.enable_pbr,
      });
    } else {
      const data = parsed.data as { prompt: string; pose_mode?: string };
      const fullBodyPrompt = `${data.prompt.trim()}. Full-body humanoid with head, torso, arms, hands, legs and feet.`;
      taskId = await createPreview(apiKey, fullBodyPrompt, {
        pose_mode: data.pose_mode || "t-pose",
      });
    }

    const task = await getTextTo3DStatus(apiKey, taskId);
    return NextResponse.json({
      task_id: taskId,
      status: task.status,
      progress: task.progress,
    });
  } catch (e) {
    const err = e as MeshyApiError;
    const status = err?.status ?? 500;
    const message = err?.message ?? "Failed to create character";
    return NextResponse.json(
      { error: message },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}
