type Query = Pick<URLSearchParams, "get">;

export function customerReturnQuery(query: Query): Record<string, string> {
  const target = query.get("next");
  const slug = query.get("slug");
  if (target === "checkout") {
    const order = query.get("order");
    return order && /^[0-9a-hjkmnp-tv-z]{26}$/i.test(order) ? {next: target, order} : {next: target};
  }
  if (target === "wishlist") return { next: target };
  if (target === "product" && slug && /^[a-z0-9-]+$/i.test(slug)) return { next: target, slug };
  return {};
}

export function customerReturnPath(query: Query) {
  const {next, slug, order} = customerReturnQuery(query);
  if (next === "checkout") return order ? "/checkout?order=" + encodeURIComponent(order) : "/checkout";
  if (next === "wishlist") return "/wishlist";
  if (next === "product" && slug) return "/products/" + encodeURIComponent(slug);
  return "/account";
}
