import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedDestination = searchParams.get("next");
  const destination =
    requestedDestination === "/update-password"
      ? requestedDestination
      : "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  if (destination === "/update-password") {
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid-link`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
