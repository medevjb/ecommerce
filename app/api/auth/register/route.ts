import { NextRequest, NextResponse } from "next/server";

const apiBase = () => (process.env.LARAVEL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ message: "This request must come from the store." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ message: "The registration details are too large." }, { status: 413 });
  }

  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 16_384) {
      return NextResponse.json({ message: "The registration details are too large." }, { status: 413 });
    }

    const upstream = await fetch(`${apiBase()}/auth/register`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ message: "Account creation is temporarily unavailable." }, { status: 502 });
    }

    const result: unknown = await upstream.json();
    return NextResponse.json(result, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "We could not reach the commerce service. Please try again shortly." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
