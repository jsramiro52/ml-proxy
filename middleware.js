import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/_next", "/favicon"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Admin-only paths
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const res = NextResponse.next();
    res.headers.set("x-user", JSON.stringify({ username: payload.sub, name: payload.name, role: payload.role }));
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
