export type Staff = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export type PageInfo = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type Envelope<T> = {
  data: T;
  meta: { pagination?: PageInfo } | null;
  message: string;
  errors?: { code?: string; fields?: Record<string, string[]> };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
export async function backend<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null; signal?: AbortSignal; idempotency?: string } = {},
): Promise<{ data: T; meta: Envelope<T>["meta"] }> {
  const { method = "GET", body, token, signal, idempotency } = options;
  const proxied = path.startsWith("/api/staff/");
  const response = await fetch(proxied ? path : apiBase + path, {
    method,
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
      ...(proxied && method !== "GET" ? { "X-Staff-Request": "1" } : {}),
      ...(body !== undefined && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(idempotency ? { "Idempotency-Key": idempotency } : {}),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  if (response.status === 204) return { data: undefined as T, meta: null };
  const result: Envelope<T> | null = await response.json().catch(() => null);
  if (!response.ok || !result) {
    throw new ApiError(result?.message ?? "The API could not complete this request.", response.status, result?.errors?.fields);
  }
  return result;
}

export function staffRequest<T>(path: string, options?: Parameters<typeof backend<T>>[1]) {
  return backend<T>("/api/staff" + path, options);
}

export const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const money = (cents: number) => usd.format(cents / 100);
export const human = (value: string) => value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
