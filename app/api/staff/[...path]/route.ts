import { NextRequest, NextResponse } from "next/server";

const cookie = "ecommerce_staff";
const base = () => (process.env.LARAVEL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
const cookieOptions = { httpOnly: true, sameSite: "strict", path: "/api/staff", secure: process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_STAFF_COOKIE !== "true" } as const;
const responseHeaders = { "Cache-Control": "no-store" };

type Context = { params: Promise<{ path: string[] }> };
type SessionPayload = {
  data?: { dashboard?: string; access_token?: string; expires_at?: string };
};

function failure(status: number, message: string) {
  return NextResponse.json({ message }, { status, headers: responseHeaders });
}

async function forward(request: NextRequest, context: Context) {
  const { path } = await context.params;
  if (!path.every((segment) => /^[A-Za-z0-9_-]+$/.test(segment))) return failure(404, "This staff endpoint does not exist.");
  const route = "/" + path.join("/");
  const mutating = request.method !== "GET";
  if (mutating && (request.headers.get("x-staff-request") !== "1" || request.headers.get("sec-fetch-site") === "cross-site")) {
    return failure(403, "This action requires a same-origin request.");
  }

  const signIn = route === "/login" || route === "/challenge";
  const signOut = route === "/auth/logout";
  const recovery = /^\/(staff|customer)\/(forgot-password|reset-password)$/.exec(route);
  if ((signIn || recovery || signOut) && request.method !== "POST") return failure(405, "Use POST to sign in.");
  const token = request.cookies.get(cookie)?.value;
  if (!signIn && !recovery && !token && !signOut) return failure(401, "Your staff session has expired.");

  const endpoint = route === "/catalog-options" && request.method === "GET" ? "/attributes" : recovery
    ? (recovery[1] === "staff" ? "/admin/auth/" : "/auth/") + recovery[2]
    : route === "/login" ? "/auth/login" : route === "/challenge" ? "/admin/auth/2fa/challenge" : "/admin" + route;
  const headers = new Headers({ Accept: "application/json" });
  for (const name of ["content-type", "idempotency-key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!signIn && !recovery && token) headers.set("Authorization", "Bearer " + token);
  try {
    const maxBody = 12 * 1024 * 1024;
    if (Number(request.headers.get("content-length")) > maxBody) return failure(413, "This request is too large.");
    const body = mutating && request.body ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > maxBody) return failure(413, "This request is too large.");
    const upstream = await fetch(base() + endpoint + request.nextUrl.search, {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
      body,
    });
    const result = upstream.status === 204 ? null : await upstream.json();
    const data = (result as SessionPayload | null)?.data;
    const staffSignIn = signIn && upstream.ok && data?.dashboard === "staff" && data.access_token;
    const accessToken = staffSignIn ? data.access_token : undefined;
    if (staffSignIn) delete data.access_token;
    const response = result === null
      ? new NextResponse(null, { status: upstream.status, headers: responseHeaders })
      : NextResponse.json(result, { status: upstream.status, headers: responseHeaders });
    if (accessToken) {
      const expires = Date.parse(data?.expires_at ?? "");
      response.cookies.set(cookie, accessToken, { ...cookieOptions, expires: Number.isFinite(expires) ? new Date(expires) : undefined });
    } else if (signOut || (!signIn && upstream.status === 401) || (signIn && upstream.ok && data?.dashboard === "customer")) {
      response.cookies.set(cookie, "", { ...cookieOptions, maxAge: 0 });
    }
    return response;
  } catch {
    const response = failure(502, "The commerce API is unavailable. Try again shortly.");
    if (signOut) response.cookies.set(cookie, "", { ...cookieOptions, maxAge: 0 });
    return response;
  }
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
