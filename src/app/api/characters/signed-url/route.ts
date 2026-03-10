import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) {
    return NextResponse.json(
      { error: "path required" },
      { status: 400 }
    );
  }

  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase.storage
    .from("characters")
    .createSignedUrl(path, 3600);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to get URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data?.signedUrl });
}
