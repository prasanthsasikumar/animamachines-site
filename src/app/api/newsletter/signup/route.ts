import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("newsletter_subscribers").upsert(
      {
        email,
        status: "subscribed",
        consent_at: new Date().toISOString(),
        consent_source: "landing",
        unsubscribed_at: null,
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Newsletter signup error:", error);
      return NextResponse.json(
        { error: "Could not save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Newsletter signup exception:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
