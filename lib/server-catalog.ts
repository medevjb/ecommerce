import { headers } from "next/headers";
import { catalogEnvelope } from "./catalog";
import { upstreamHeaders } from "./upstream-headers";

export async function serverCatalogEnvelope<T>(path: string) {
  const forwarded = process.env.TRUSTED_CLIENT_IP_HEADER ? upstreamHeaders(await headers()) : undefined;
  return catalogEnvelope<T>(path, undefined, forwarded);
}

export async function serverCatalog<T>(path: string) {
  return (await serverCatalogEnvelope<T>(path)).data;
}
