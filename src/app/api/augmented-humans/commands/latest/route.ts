import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/augmented-humans/commands/latest
 * Unity polls this to get the latest unacknowledged command.
 * No auth required (demo/kiosk endpoint).
 *
 * Query params:
 *   session_id – optional, scope to a specific session
 */
export async function GET(request: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  let query = admin
    .from("augmented_human_commands")
    .select("id, session_id, command, payload, created_at")
    .is("acknowledged_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data: cmd } = await query.single();

  if (!cmd) {
    return NextResponse.json({ command: null }, { status: 200 });
  }

  return NextResponse.json(cmd, {
    headers: { "Cache-Control": "no-store" },
  });
}
