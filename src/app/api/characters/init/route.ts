import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const initSchema = z.object({
  name: z.string().max(100).optional().default("Character"),
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

  const { data, error } = await admin
    .from("avatars")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      config: {},
      storage_path: null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return NextResponse.json({ error: error?.message ?? "Failed to init" }, { status: 500 });
  }

  return NextResponse.json({ avatar_id: data.id });
}

