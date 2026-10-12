import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeLocalRedirectPath } from "@/lib/auth/redirect";
import { createAcademyServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
];

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");
  const next = safeLocalRedirectPath(request.nextUrl.searchParams.get("next"));

  try {
    const supabase = await createAcademyServerClient();
    let error;

    if (tokenHash && type && OTP_TYPES.includes(type as EmailOtpType)) {
      ({ error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      }));
    } else if (code) {
      ({ error } = await supabase.auth.exchangeCodeForSession(code));
    } else {
      return NextResponse.redirect(new URL("/login?reason=invalid-link", request.url));
    }

    if (error) {
      return NextResponse.redirect(new URL("/login?reason=invalid-link", request.url));
    }

    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?reason=configuration", request.url));
  }
}

