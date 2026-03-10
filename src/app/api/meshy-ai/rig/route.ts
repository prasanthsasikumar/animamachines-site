import { createClient } from "@/lib/supabase/server";
import { createRig, type MeshyApiError } from "@/meshy-ai/client";
import { rigCharacterSchema } from "@/meshy-ai/schemas";
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
    const parsed = rigCharacterSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { model_url, input_task_id, height_meters } = parsed.data;

    const taskId = await createRig(apiKey, {
      model_url: model_url as string | undefined,
      input_task_id: input_task_id as string | undefined,
      height_meters,
    });

    return NextResponse.json({
      task_id: taskId,
      status: "PENDING",
    });
  } catch (e) {
    const err = e as MeshyApiError;
    const status = err?.status ?? 500;
    const message = err?.message ?? "Failed to rig character";
    return NextResponse.json(
      { error: message },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}
