import { createClient } from "@/lib/supabase/server";
import {
  getTextTo3DStatus,
  getImageTo3DStatus,
  getRigStatus,
  type MeshyApiError,
} from "@/meshy-ai/client";
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

type TaskType = "text-to-3d" | "image-to-3d" | "rig";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type") as TaskType | null;
  const type: TaskType =
    typeParam === "rig"
      ? "rig"
      : typeParam === "image-to-3d"
        ? "image-to-3d"
        : "text-to-3d";
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

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Task ID required" }, { status: 400 });
  }

  try {
    if (type === "rig") {
      const task = await getRigStatus(apiKey, id);
      return NextResponse.json({
        id: task.id,
        status: task.status,
        progress: task.progress,
        glb_url: task.result?.rigged_character_glb_url,
        task_error: task.task_error,
      });
    }
    if (type === "image-to-3d") {
      const task = await getImageTo3DStatus(apiKey, id);
      return NextResponse.json({
        id: task.id,
        status: task.status,
        progress: task.progress,
        glb_url: task.model_urls?.glb,
        task_error: task.task_error,
      });
    }
    const task = await getTextTo3DStatus(apiKey, id);
    return NextResponse.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
      glb_url: task.model_urls?.glb,
      task_error: task.task_error,
    });
  } catch (e) {
    const err = e as MeshyApiError;
    const status = err?.status ?? 500;
    const message = err?.message ?? "Failed to fetch task status";
    return NextResponse.json(
      { error: message },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}
