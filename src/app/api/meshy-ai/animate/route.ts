import { createClient } from "@/lib/supabase/server";
import { createAnimation, type MeshyApiError } from "@/meshy-ai/client";
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
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const rig_task_id = body?.rig_task_id as string | undefined;
    const action_id = body?.action_id as number | undefined;

    if (!rig_task_id || typeof rig_task_id !== "string") {
      return NextResponse.json({ error: "rig_task_id is required" }, { status: 400 });
    }
    if (typeof action_id !== "number") {
      return NextResponse.json({ error: "action_id must be a number" }, { status: 400 });
    }

    const taskId = await createAnimation(apiKey, { rig_task_id, action_id });

    return NextResponse.json({
      task_id: taskId,
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

