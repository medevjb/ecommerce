import { NextRequest, NextResponse } from "next/server";

const apiBase = () => (process.env.LARAVEL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id") ?? "";
  const hash = searchParams.get("hash") ?? "";
  const expires = searchParams.get("expires") ?? "";
  const signature = searchParams.get("signature") ?? "";

  if (!/^[0-9a-hjkmnp-tv-z]{26}$/i.test(id) || !/^[a-f0-9]{40}$/i.test(hash) || !/^\d+$/.test(expires) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return NextResponse.json({ message: "This verification link is incomplete or invalid." }, { status: 400 });
  }

  const query = new URLSearchParams({ expires, signature });
  try {
    const upstream = await fetch(`${apiBase()}/auth/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}?${query}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

    if (upstream.status === 204) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

    const result: unknown = upstream.headers.get("content-type")?.includes("application/json")
      ? await upstream.json()
      : { message: "We could not verify this email address." };
    return NextResponse.json(result, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "We could not reach the verification service. Please try again." }, { status: 502 });
  }
}
