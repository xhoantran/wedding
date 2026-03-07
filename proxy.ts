import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "vi"];

function detectLocale(request: NextRequest): string {
  // 1. Vercel geolocation header — Vietnam → vi
  const country = request.headers.get("x-vercel-ip-country");
  if (country === "VN") return "vi";
  if (country) return "en"; // known country, not Vietnam

  // 2. Accept-Language header fallback
  const acceptLang = request.headers.get("accept-language") || "";
  if (acceptLang.match(/\bvi\b/)) return "vi";

  return "en";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) return;

  // Skip static files and api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.includes(".")
  ) {
    return;
  }

  // Detect locale from region/browser and redirect
  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|images|music|api|favicon.ico).*)"],
};
