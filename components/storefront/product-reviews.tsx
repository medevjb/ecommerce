"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { customer } from "@/components/customer/customer-account";
import { useAuth } from "@/context/auth-context";
import { catalogEnvelope, type CatalogReview } from "@/lib/catalog";
import { ApiError, human, type PageInfo } from "@/lib/staff-api";
import { StarRating } from "./star-rating";

type OwnReview = CatalogReview & { status: string };
const button = "rounded-full border border-black/20 px-4 py-2 text-sm font-semibold disabled:opacity-50";
const input = "mt-1 block w-full rounded-lg border border-black/20 p-2";

export function ProductReviews({slug, initialReviews, pagination}: {
  slug: string; initialReviews: CatalogReview[] | null; pagination?: PageInfo;
}) {
  const {user, isLoading} = useAuth();
  const path = "/products/" + encodeURIComponent(slug) + "/reviews";
  const [reviews, setReviews] = useState(initialReviews);
  const [currentPage, setCurrentPage] = useState(pagination?.current_page ?? 1);
  const [lastPage, setLastPage] = useState(pagination?.last_page ?? 1);
  const [total, setTotal] = useState(pagination?.total ?? initialReviews?.length ?? 0);
  const [ownership, setOwnership] = useState<{customerId:string;review:OwnReview|null}>();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const customerId = user?.id;
  const myReview = ownership && ownership.customerId === customerId ? ownership.review : undefined;

  useEffect(() => {
    if (!customerId) return;
    const controller = new AbortController();
    customer<OwnReview | null>("/me/product-reviews/" + encodeURIComponent(slug), {signal:controller.signal})
      .then(({data}) => { if (!controller.signal.aborted) setOwnership({customerId, review:data}); })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(failureMessage(failure)); });
    return () => controller.abort();
  }, [customerId, slug]);

  async function fetchPage(page: number, append = false) {
    const {data, meta} = await catalogEnvelope<CatalogReview[]>(path + "?page=" + page);
    setReviews((previous) => append ? [...(previous ?? []), ...data.filter(({id}) => !previous?.some((review) => review.id === id))] : data);
    setCurrentPage(page);
    setLastPage(meta?.pagination?.last_page ?? page);
    setTotal(meta?.pagination?.total ?? data.length);
  }

  async function loadMore(page = currentPage + 1) {
    setBusy(true);
    setError("");
    try { await fetchPage(page, page !== 1); }
    catch (failure) { setError(failureMessage(failure)); }
    finally { setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerId || busy) return;
    const form = new FormData(event.currentTarget);
    const body = {rating:Number(form.get("rating")), title:String(form.get("title")).trim() || null, body:String(form.get("body")).trim() || null};
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const endpoint = myReview ? "/me/reviews/" + encodeURIComponent(myReview.id) : path;
      const {data} = await customer<OwnReview>(endpoint, {method:myReview ? "PATCH" : "POST", body});
      setOwnership({customerId, review:data});
      setEditing(false);
      setNotice(data.status === "pending" ? "Your review was submitted for moderation." : "Review saved.");
      await fetchPage(1);
    } catch (failure) { setError(failureMessage(failure)); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!customerId || !myReview || busy || !window.confirm("Delete your review?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await customer("/me/reviews/" + encodeURIComponent(myReview.id), {method:"DELETE"});
      setOwnership({customerId, review:null});
      setEditing(false);
      setNotice("Review deleted.");
      await fetchPage(1);
    } catch (failure) { setError(failureMessage(failure)); }
    finally { setBusy(false); }
  }

  return <section className="mt-8 space-y-5">
    <h2 className="text-xl font-bold">Customer reviews ({total})</h2>
    {!isLoading && !customerId && <Link href={"/login?next=product&slug=" + encodeURIComponent(slug)} className="text-sm underline">Sign in to write a review</Link>}
    {customerId && myReview !== undefined && <div className="space-y-3 rounded-2xl border border-black/10 p-4">
      {myReview && <p className="text-sm">Your review · {human(myReview.status)}</p>}
      {!editing && <div className="flex flex-wrap gap-2">
        <button className={button} onClick={() => setEditing(true)} disabled={busy}>{myReview ? "Edit your review" : "Write a review"}</button>
        {myReview && <button className={button} onClick={remove} disabled={busy}>Delete your review</button>}
      </div>}
      {editing && <form className="space-y-3" onSubmit={save}>
        <label className="block text-sm font-medium">Rating
          <select name="rating" defaultValue={myReview?.rating ?? ""} className={input} required>
            <option value="">Choose a rating</option>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} of 5</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Title<input name="title" maxLength={120} defaultValue={myReview?.title ?? ""} className={input} /></label>
        <label className="block text-sm font-medium">Review<textarea name="body" maxLength={2000} rows={4} defaultValue={myReview?.body ?? ""} className={input} /></label>
        <div className="flex gap-3">
          <button className={button + " bg-black text-white"} disabled={busy}>Save review</button>
          <button type="button" className={button} disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>}
    </div>}
    {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    {reviews === null && <p className="text-sm">Reviews could not be loaded. <button className="underline" disabled={busy} onClick={() => loadMore(1)}>Try again</button></p>}
    {reviews?.length === 0 && <p className="text-sm text-black/60">No approved reviews yet.</p>}
    <div className="grid gap-4 md:grid-cols-2">
      {reviews?.map((review) => <article key={review.id} className="space-y-2 rounded-2xl border border-black/10 p-5">
        <StarRating rating={review.rating} />
        <h3 className="font-bold">{review.title || "Customer review"}</h3>
        {review.verified_purchase && <p className="text-xs text-green-800">Verified purchase</p>}
        {review.body && <p className="whitespace-pre-line text-sm text-black/70">{review.body}</p>}
        <time dateTime={review.created_at} className="text-xs text-black/60">{new Date(review.created_at).toLocaleDateString()}</time>
      </article>)}
    </div>
    {currentPage < lastPage && <button className={button} disabled={busy} onClick={() => loadMore()}>Load more reviews</button>}
  </section>;
}

function failureMessage(failure: unknown) {
  if (failure instanceof ApiError) return Object.values(failure.fields).flat()[0] ?? failure.message;
  return failure instanceof Error ? failure.message : "The review request could not be completed.";
}
