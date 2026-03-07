import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * POST /api/newsletter/send
 * Sends a batch email to all subscribed newsletter_subscribers via Resend.
 * Protect with CRON_SECRET or similar when called by Vercel Cron.
 * Body: { subject, html?, text?, secret? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = process.env.CRON_SECRET;
    if (secret && body?.secret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subject = typeof body?.subject === "string" ? body.subject : "Anima Machines — Update";
    const html = typeof body?.html === "string" ? body.html : null;
    const text = typeof body?.text === "string" ? body.text : null;

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY not configured" },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("status", "subscribed");

    if (subError || !subscribers?.length) {
      return NextResponse.json(
        { ok: true, sent: 0, message: "No subscribers or error" },
        { status: 200 }
      );
    }

    const resend = new Resend(resendKey);
    const from = process.env.RESEND_FROM_EMAIL ?? "Anima Machines <onboarding@resend.dev>";

    const to = subscribers.map((s) => s.email);
    const { data: sendData, error: sendError } = await resend.emails.send({
      from,
      to,
      subject,
      html: html ?? undefined,
      text: text ?? undefined,
    });

    if (sendError) {
      console.error("Resend send error:", sendError);
      return NextResponse.json(
        { error: sendError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sent: to.length,
      id: sendData?.id,
    });
  } catch (e) {
    console.error("Newsletter send exception:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
