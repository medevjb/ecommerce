import { isIP } from "node:net";

export function upstreamHeaders(incoming: Pick<Headers, "get">, initial?: HeadersInit) {
  const headers = new Headers(initial);
  headers.set("Accept", "application/json");

  // Only use a dedicated header written by the deployment's trusted ingress.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER?.trim();
  const address = header && incoming.get(header)?.trim();
  if (address && isIP(address)) headers.set("X-Forwarded-For", address);
  return headers;
}
