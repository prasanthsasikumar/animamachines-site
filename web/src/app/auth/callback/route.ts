import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();
  let error: Error | null = null;

  if (code) {
    const res = await supabase.auth.exchangeCodeForSession(code);
    error = res.error;
  } else if (token_hash && type) {
    const res = await supabase.auth.verifyOtp({ token_hash, type });
    error = res.error;
  } else {
    error = new Error("Missing code or token_hash");
  }

  if (!error) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  console.error("Auth callback error:", error);
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
