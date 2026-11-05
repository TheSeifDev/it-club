import { NextResponse, type NextRequest } from "next/server";

const AVAILABLE_PATHS = new Set([
  "/",
  "/tracks",
  "/community",
  "/alumni",
  "/sponsors",
  "/events",
]);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (AVAILABLE_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\..*).*)"],
};
