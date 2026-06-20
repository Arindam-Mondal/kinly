import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for the password-reset email link. Exchanges the one-time code for a
// session, then forwards to the page named in `next` (the reset-password form).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
