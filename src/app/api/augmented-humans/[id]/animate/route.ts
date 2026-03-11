import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { createAnimation, type MeshyApiError } from "@/meshy-ai/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: session_id } = await params;
  if (!session_id) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const action_id = typeof body.action_id === "number" ? body.action_id : 308;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Meshy API not configured" }, { status: 500 });
  }

  const { data: session, error: sessionErr } = await admin
    .from("augmented_human_sessions")
    .select("config, user_id")
    .eq("id", session_id)
    .single();

  if (sessionErr || !session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const rigTaskId = (session.config as Record<string, unknown>)?.rig_task_id as string | undefined;
  if (!rigTaskId) {
    return NextResponse.json(
      { error: "No rig_task_id stored for this session" },
      { status: 400 }
    );
  }

  try {
    const taskId = await createAnimation(apiKey, { rig_task_id: rigTaskId, action_id });
    return NextResponse.json({ task_id: taskId, status: "PENDING" });
  } catch (e) {
    const err = e as MeshyApiError;
    const status = err?.status ?? 500;
    const message = err?.message ?? "Failed to create animation";
    return NextResponse.json(
      { error: message },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}
