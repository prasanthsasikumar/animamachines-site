import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const initSchema = z.object({
  capture_data_uri: z.string().min(1),
  sleep_score: z.number().int().min(1).max(10),
  arousal: z.number().int().min(1).max(9),
  valence: z.number().int().min(1).max(9),
  gender: z.enum(["male", "female", "non-binary", "prefer-not-to-say"]),
  age_bracket: z.enum(["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"]),
  client_timestamp: z.string().datetime().optional(),
  client_timezone: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = initSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const {
    capture_data_uri,
    sleep_score,
    arousal,
    valence,
    gender,
    age_bracket,
    client_timestamp,
    client_timezone,
  } = parsed.data;

  const res = await fetch(capture_data_uri);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to read capture image" }, { status: 400 });
  }
  const blob = await res.blob();

  const sessionId = crypto.randomUUID();
  const storagePath = `${user.id}/augmented/${sessionId}/capture.png`;

  const { error: uploadError } = await admin.storage
    .from("characters")
    .upload(storagePath, blob, {
      contentType: blob.type || "image/png",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message ?? "Failed to upload capture" },
      { status: 500 }
    );
  }

  const userAgent = request.headers.get("user-agent") ?? undefined;
  const now = new Date().toISOString();

  const { error: insertError } = await admin
    .from("augmented_human_sessions")
    .insert({
      id: sessionId,
      user_id: user.id,
      capture_photo_path: storagePath,
      sleep_score,
      arousal,
      valence,
      gender,
      age_bracket,
      client_timestamp: client_timestamp ?? now,
      client_timezone,
      user_agent: userAgent,
      created_at: now,
      updated_at: now,
      config: {
        time_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        created_at_iso: now,
      },
    });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message ?? "Failed to create session" },
      { status: 500 }
    );
  }

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    session_id: sessionId,
    glb_api_url: `${origin}/api/augmented-humans/${sessionId}/glb`,
  });
}
