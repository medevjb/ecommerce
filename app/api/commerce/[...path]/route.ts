const allowed: Record<string, RegExp> = {
  GET: /^\/(?:cart|me(?:\/addresses|\/wishlist(?:\/[a-z0-9]+)?|\/product-reviews\/[a-z0-9-]+)?|orders(?:\/[a-z0-9]+)?)$/i,
  POST: /^\/(?:cart\/(?:items|coupon|merge)|checkout(?:\/preview)?|me\/addresses|orders\/[a-z0-9]+\/cancel|products\/[a-z0-9-]+\/reviews|newsletter\/(?:subscribe|unsubscribe)|auth\/(?:logout|change-password))$/i,
  PATCH: /^\/(?:cart\/items\/[a-z0-9]+|me(?:\/(?:addresses|reviews)\/[a-z0-9]+)?)$/i,
  PUT: /^\/me\/wishlist\/[a-z0-9]+$/i,
  DELETE: /^\/(?:cart\/(?:items(?:\/[a-z0-9]+)?|coupon)|me\/(?:addresses|reviews|wishlist)\/[a-z0-9]+)$/i,
};

async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const endpoint = "/" + (await params).path.join("/");
  const noStore = { "Cache-Control": "no-store" };
  if (!allowed[request.method]?.test(endpoint)) {
    return Response.json({ message: "Commerce endpoint not found." }, { status: 404, headers: noStore });
  }
  if (request.method !== "GET" && (request.headers.get("X-Commerce-Request") !== "1" || request.headers.get("Sec-Fetch-Site") === "cross-site")) {
    return Response.json({ message: "This action requires a storefront request." }, { status: 403, headers: noStore });
  }
  const base = (process.env.LARAVEL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
  const headers = new Headers({ Accept: "application/json" });
  for (const name of ["Authorization", "Content-Type", "X-Cart-Token", "Idempotency-Key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const maxBodyBytes = 16_384;
    if (Number(request.headers.get("Content-Length")) > maxBodyBytes) {
      return Response.json({ message: "Commerce request is too large." }, { status: 413, headers: noStore });
    }
    const body = request.body ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > maxBodyBytes) {
      return Response.json({ message: "Commerce request is too large." }, { status: 413, headers: noStore });
    }
    const upstream = await fetch(base + endpoint + new URL(request.url).search, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
    const responseHeaders = new Headers(noStore);
    for (const name of ["Content-Type", "X-Cart-Token", "Retry-After"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ message: "The commerce API is temporarily unavailable." }, { status: 502, headers: noStore });
  }
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
