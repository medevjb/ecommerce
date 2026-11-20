type Query = Pick<URLSearchParams, "get">;

export function customerReturnQuery(query: Query): Record<string, string> {
  const target = query.get("next");
  const slug = query.get("slug");
  if (target === "checkout" || target === "wishlist") return { next: target };
  if (target === "product" && slug && /^[a-z0-9-]+$/i.test(slug)) return { next: target, slug };
  return {};
}

export function customerReturnPath(query: Query) {
  const {next, slug} = customerReturnQuery(query);
  if (next === "checkout") return "/checkout";
  if (next === "wishlist") return "/wishlist";
  if (next === "product" && slug) return "/products/" + encodeURIComponent(slug);
  return "/account";
}
