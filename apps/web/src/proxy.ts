import { NextResponse, type NextRequest } from "next/server";

const secret = process.env.API_PROXY_SECRET;

/**
 * Forwards the caller's IP to the API for rate limiting. Only on Vercel, whose
 * edge overwrites x-real-ip with the real address; the shared secret lets the
 * API tell this hop apart from a client sending the same header directly.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete("x-nucleo-client-ip");
  headers.delete("x-nucleo-proxy-secret");
  const ip = request.headers.get("x-real-ip")?.trim();
  if (secret && process.env.VERCEL && ip) {
    headers.set("x-nucleo-client-ip", ip);
    headers.set("x-nucleo-proxy-secret", secret);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: "/api/:path*" };
