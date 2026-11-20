"use client";

import { Preloader } from "@/components/shared/preloader";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerGuard, customer } from "@/components/customer/customer-account";
import { useAuth } from "@/context/auth-context";
import { adaptProduct, type CatalogProduct } from "@/lib/catalog";
import type { PageInfo } from "@/lib/staff-api";
import type { Product } from "@/types";
import { ProductCard } from "./product-card";

const action = "inline-flex items-center gap-2 rounded-full border border-black/20 px-4 py-2 text-sm font-semibold disabled:opacity-50";

export function WishlistButton({product}: {product: Product}) {
  const {user, isLoading} = useAuth();
  const customerId = user?.id;
  const path = "/me/wishlist/" + encodeURIComponent(product.id);
  const [selection, setSelection] = useState<{customerId:string;saved:boolean}>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saved = selection?.customerId === customerId ? selection?.saved : undefined;

  useEffect(() => {
    if (!customerId) return;
    const controller = new AbortController();
    customer<{saved:boolean}>(path, {signal:controller.signal})
      .then(({data}) => { if (!controller.signal.aborted) setSelection({customerId, saved:data.saved}); })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(message(failure)); });
    return () => controller.abort();
  }, [customerId, path]);

  async function toggle() {
    if (!customerId || busy) return;
    setBusy(true);
    setError("");
    try {
      await customer(path, {method:saved ? "DELETE" : "PUT"});
      setSelection({customerId, saved:!saved});
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }

  if (isLoading) return null;
  return <div className="mt-3 space-y-2">
    {customerId ? <button type="button" className={action} aria-pressed={saved === true} disabled={busy || (saved === undefined && !error)} onClick={toggle}>
      <Heart size={16} fill={saved ? "currentColor" : "none"} />{saved ? "Remove from wishlist" : "Save to wishlist"}
    </button> : <Link className={action} href={"/login?next=product&slug=" + encodeURIComponent(product.slug)}><Heart size={16} /> Sign in to save</Link>}
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </div>;
}

export function WishlistView() {
  return <CustomerGuard><WishlistContents /></CustomerGuard>;
}

function WishlistContents() {
  const [items, setItems] = useState<CatalogProduct[]>();
  const [meta, setMeta] = useState<PageInfo>();
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [removing, setRemoving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    customer<CatalogProduct[]>("/me/wishlist?page=" + page, {signal:controller.signal})
      .then(({data, meta}) => {
        if (controller.signal.aborted) return;
        if (meta?.pagination && page > meta.pagination.last_page) setPage(meta.pagination.last_page);
        else { setItems(data); setMeta(meta?.pagination); }
      })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(message(failure)); });
    return () => controller.abort();
  }, [page, reload]);

  async function remove(id: string) {
    setRemoving(id);
    setError("");
    try {
      await customer("/me/wishlist/" + encodeURIComponent(id), {method:"DELETE"});
      setItems((current) => current?.filter((item) => item.id !== id));
      setReload((value) => value + 1);
    } catch (failure) { setError(message(failure)); }
    finally { setRemoving(""); }
  }

  function changePage(next: number) {
    setError("");
    setItems(undefined);
    setPage(next);
  }

  return <section className="mx-auto max-w-6xl space-y-5 px-5 py-12">
    <h1 className="text-3xl font-bold">My wishlist</h1>
    {!items && !error && <Preloader label="Loading wishlist" compact />}
    {error && <p role="alert" className="text-red-800">{error} <button className="underline" onClick={() => {setError(""); setReload((value) => value + 1);}}>Retry</button></p>}
    {items?.length === 0 && <p>No saved products. <Link className="underline" href="/products">Browse the catalog</Link></p>}
    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
      {items?.map((item) => <div className="space-y-3" key={item.id}>
        <ProductCard product={adaptProduct(item)} />
        <button className={action} disabled={Boolean(removing)} onClick={() => remove(item.id)}>{removing === item.id ? "Removing…" : "Remove"}</button>
      </div>)}
    </div>
    {meta && meta.last_page > 1 && <nav aria-label="Wishlist pages" className="flex items-center gap-3">
      <button className={action} disabled={page === 1} onClick={() => changePage(page - 1)}>Previous</button>
      <span>Page {page} of {meta.last_page}</span>
      <button className={action} disabled={page === meta.last_page} onClick={() => changePage(page + 1)}>Next</button>
    </nav>}
  </section>;
}

function message(failure: unknown) {
  return failure instanceof Error ? failure.message : "The wishlist request failed.";
}
