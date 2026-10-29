import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAcademySupabaseConfig } from "@/lib/supabase/config";
import { isAcademyKioskAutoLoginEnabled } from "@/lib/auth/kiosk";

type CookieUpdate = { name: string; value: string; options: CookieOptions };

function jsonResponse(status: number, ok: boolean, cookies: CookieUpdate[]) {
  const response = NextResponse.json(
    { ok },
    { status, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
  const latestCookies = new Map(cookies.map((cookie) => [cookie.name, cookie]));
  latestCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

export async function POST(request: NextRequest) {
  if (
    !isAcademyKioskAutoLoginEnabled() ||
    request.headers.get("origin") !== request.nextUrl.origin
  ) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const email = process.env.ACADEMY_KIOSK_EMAIL;
  const password = process.env.ACADEMY_KIOSK_PASSWORD;
  let config;
  try {
    config = getAcademySupabaseConfig();
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (!config || !email || !password) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const cookies: CookieUpdate[] = [];
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookieOptions: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => {
          request.cookies.set(cookie.name, cookie.value);
          cookies.push(cookie);
        });
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return jsonResponse(401, false, cookies);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "employee") {
      await supabase.auth.signOut();
      return jsonResponse(403, false, cookies);
    }

    return jsonResponse(200, true, cookies);
  } catch {
    try {
      await supabase.auth.signOut();
    } catch {
      // Preserve the generic response if cleanup itself fails.
    }
    return jsonResponse(500, false, cookies);
  }
}
