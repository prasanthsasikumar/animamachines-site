import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const commandSchema = z.object({
  session_id: z.string().uuid().optional(),
  command: z.enum([
    "start",
    "stop",
    "reset",
    "mode",
    "answer",
    "custom",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/augmented-humans/commands
 * Tablet sends a command for Unity to pick up.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = commandSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // If no session_id provided, use the latest session for this user
  let sessionId = parsed.data.session_id;
  if (!sessionId) {
    const { data: latest } = await admin
      .from("augmented_human_sessions")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    sessionId = latest?.id;
  }

  const { data: cmd, error: insertError } = await admin
    .from("augmented_human_commands")
    .insert({
      session_id: sessionId ?? null,
      user_id: user.id,
      command: parsed.data.command,
      payload: parsed.data.payload ?? {},
    })
    .select("id, command, payload, created_at")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message ?? "Failed to create command" },
      { status: 500 }
    );
  }

  return NextResponse.json(cmd);
}
