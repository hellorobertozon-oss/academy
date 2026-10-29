import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAcademySupabaseConfig } from "@/lib/supabase/config";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/games",
  "/learning",
  "/quiz",
  "/rewards",
  "/faq",
  "/change-password",
  "/admin",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const protectedPath = isProtectedPath(request.nextUrl.pathname);
  let config;

  try {
    config = getAcademySupabaseConfig();
  } catch {
    if (!protectedPath) return NextResponse.next();
    const loginUrl = new URL("/login?reason=configuration", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!config) {
    if (!protectedPath) return NextResponse.next();
    const loginUrl = new URL("/login?reason=configuration", request.url);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
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
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  if (protectedPath && (error || !data?.claims)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/games/:path*",
    "/learning/:path*",
    "/quiz/:path*",
    "/rewards/:path*",
    "/faq/:path*",
    "/change-password/:path*",
    "/admin/:path*",
  ],
};

