import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * PATCH /api/augmented-humans/commands/[id]
 * Unity acknowledges that it has consumed a command.
 * No auth required (demo endpoint).
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const { id } = await params;
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await admin
    .from("augmented_human_commands")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to acknowledge" },
      { status: 500 }
    );
  }

  return NextResponse.json({ acknowledged: true });
}
