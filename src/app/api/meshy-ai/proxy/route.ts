import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MESHY_ASSETS_HOST = "assets.meshy.ai";

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.hostname === MESHY_ASSETS_HOST ||
        u.hostname.endsWith(`.${MESHY_ASSETS_HOST}`)) &&
      (u.protocol === "https:" || u.protocol === "http:")
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const user = await (async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  })();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const url = decodeURIComponent(rawUrl);
  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AnimaMachines/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch model" },
        { status: res.status }
      );
    }

    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Meshy proxy fetch error:", e);
    return NextResponse.json(
      { error: "Failed to proxy model" },
      { status: 502 }
    );
  }
}
