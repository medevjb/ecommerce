import { upstreamHeaders } from "@/lib/upstream-headers";
const publicCatalogPath = /^\/(?:products|categories|attributes|brands|collections\/(?:new-arrivals|top-selling))(?:\/[a-z0-9-]+(?:\/(?:related|reviews))?)?$/i;

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const endpoint = "/" + path.join("/");
  if (!publicCatalogPath.test(endpoint)) return Response.json({ message: "Catalog page not found." }, { status: 404 });
  const base = (process.env.LARAVEL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
  try {
    const upstream = await fetch(base + endpoint + new URL(request.url).search, {
      headers: upstreamHeaders(request.headers), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ message: "The store catalog is temporarily unavailable." }, { status: 502 });
    }
    return new Response(upstream.body, { status: upstream.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "The store catalog is temporarily unavailable." }, { status: 502 });
  }
}
