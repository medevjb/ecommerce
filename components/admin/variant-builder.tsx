"use client";

import { Preloader } from "@/components/shared/preloader";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Layers, Plus, X } from "lucide-react";
import { ApiError, staffRequest } from "@/lib/staff-api";

type Option = { id: string; name: string; slug: string };
type Attribute = Option & { values: Option[] };
type Variant = { id: string; sku: string; options: Option[] };
type Draft = { key: string; options: Option[]; sku: string; price: string; saved?: boolean; error?: string };

const input = "w-full rounded-xl border border-[#ded8ec] px-3 py-2 text-sm outline-violet-600";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50";
const limit = 24;

export default function VariantBuilder({ productId, productName, baseSku, skipLabel, onFinish, onSaved }: {
  productId: string;
  productName?: string;
  baseSku?: string;
  skipLabel: string;
  onFinish: () => void;
  onSaved: () => void;
}) {
  const [attributes, setAttributes] = useState<Attribute[]>();
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const groups = (attributes ?? []).map((attribute) => attribute.values.filter((value) => selection[attribute.id]?.includes(value.id))).filter((values) => values.length);
  const count = groups.length ? groups.reduce((total, values) => total * values.length, 1) : 0;
  const pending = drafts.filter((draft) => !draft.saved);
  const path = `/products/${encodeURIComponent(productId)}/variants`;

  useEffect(() => {
    const controller = new AbortController();
    staffRequest<Attribute[]>("/catalog-options", { signal: controller.signal })
      .then(({ data }) => setAttributes(data.filter((attribute) => attribute.values.length > 0)))
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Variant options could not be loaded.");
      });
    return () => controller.abort();
  }, [attempt]);

  function generate() {
    if (!count || count > limit) return;
    const combinations = groups.reduce<Option[][]>((result, values) => result.flatMap((options) => values.map((value) => [...options, value])), [[]]);
    setDrafts((current) => {
      const existing = new Set(current.map((draft) => draft.key));
      const additions = combinations.flatMap((options) => {
        const key = combination(options);
        if (existing.has(key)) return [];
        const prefix = (baseSku || "VAR-" + productId.slice(-6)).toUpperCase();
        const suffix = options.map((option) => option.slug.toUpperCase()).join("-");
        const sku = `${prefix}-${suffix}`.replace(/[^A-Z0-9._-]/g, "-").slice(0, 100);
        return [{ key, options, sku, price: "" }];
      });
      return [...current, ...additions.slice(0, Math.max(0, limit - current.filter((draft) => !draft.saved).length))];
    });
    setNotice("");
  }

  function update(key: string, values: Partial<Draft>) {
    setDrafts((rows) => rows.map((row) => row.key === key ? { ...row, ...values } : row));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !pending.length) return;
    setBusy(true);
    setNotice("");
    let saved = 0;
    try {
      for (const draft of pending) {
        try {
          await staffRequest(path, {
            method: "POST",
            body: {
              sku: draft.sku.trim(),
              option_ids: draft.options.map((option) => option.id),
              ...(draft.price !== "" ? { price_override_amount: Math.round(Number(draft.price) * 100) } : {}),
            },
          });
          update(draft.key, { saved: true, error: undefined });
          saved++;
        } catch (failure) {
          // A previous request may have saved this SKU before its response was lost.
          if (failure instanceof ApiError && (failure.status === 409 || failure.status === 422)) {
            const query = await staffRequest<Variant[]>(path + "?per_page=100").catch(() => null);
            if (query?.data.some((row) => row.sku.toLowerCase() === draft.sku.trim().toLowerCase() && combination(row.options ?? []) === draft.key)) {
              update(draft.key, { saved: true, error: undefined });
              saved++;
              continue;
            }
          }
          const messages = failure instanceof ApiError ? Object.values(failure.fields).flat().join(" ") : "";
          update(draft.key, { error: messages || (failure instanceof Error ? failure.message : "This variant could not be saved.") });
        }
      }
    } finally {
      setBusy(false);
      if (saved) {
        setNotice(`${saved} ${saved === 1 ? "variant" : "variants"} saved. New variants started with zero stock.`);
        onSaved();
      }
    }
  }

  return <div className="space-y-5">
    <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
      <Layers size={20} className="mt-0.5 shrink-0 text-violet-700" />
      <div><p className="font-semibold">{productName ? `${productName} is saved as a draft` : "Choose the options you sell"}</p><p className="mt-1 text-sm text-slate-700">Variants are optional. Your product already has a default SKU. Select more than one color or size to build combinations, then remove any you don’t sell.</p></div>
    </div>
    {loadError ? <div role="alert" className="text-sm text-red-800">{loadError} <button className="font-semibold underline" onClick={() => { setLoadError(""); setAttempt((value) => value + 1); }}>Retry</button></div> :
      !attributes ? <Preloader label="Loading catalog options" compact /> :
      attributes.length === 0 ? <p className="text-sm text-slate-700">No active options are available. Add or activate values in <Link className="font-semibold text-violet-700 underline" href="/admin/attributes">Attributes</Link> to create variants.</p> :
      <div className="space-y-4">
        {attributes.map((attribute) => <fieldset key={attribute.id} disabled={busy}>
          <legend className="mb-2 text-sm font-semibold">{attribute.name}</legend>
          <div className="flex flex-wrap gap-2">{attribute.values.map((value) => {
            const checked = Boolean(selection[attribute.id]?.includes(value.id));
            return <button key={value.id} type="button" aria-pressed={checked} onClick={() => setSelection((current) => {
              const selected = current[attribute.id] ?? [];
              return { ...current, [attribute.id]: checked ? selected.filter((id) => id !== value.id) : [...selected, value.id] };
            })} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm ${checked ? "border-violet-400 bg-violet-100 font-semibold text-violet-900" : "border-slate-200 text-slate-700 hover:border-violet-300"}`}>{checked && <Check size={14} />}{value.name}</button>;
          })}</div>
        </fieldset>)}
        <button type="button" onClick={generate} disabled={busy || !count || count > limit || pending.length >= limit} className={button}><Plus size={16} /> {count ? `Preview ${count} ${count === 1 ? "combination" : "combinations"}` : "Preview combinations"}</button>
        {count > limit && <p className="text-sm text-amber-900">Select up to {limit} combinations per batch.</p>}
      </div>}
    <form onSubmit={save} className="space-y-4">
      {drafts.map((draft) => <div key={draft.key} className="rounded-xl border border-[#ebe8f2] p-3">
        <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{draft.options.map((option) => option.name).join(" / ")}</p>{draft.saved ? <span className="text-xs font-semibold text-emerald-700">Saved</span> : <button type="button" aria-label={`Remove ${draft.options.map((option) => option.name).join(" / ")}`} disabled={busy} onClick={() => setDrafts((rows) => rows.filter((row) => row.key !== draft.key))}><X size={16}/></button>}</div>
        {!draft.saved && <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold">Variant SKU<input className={input} disabled={busy} maxLength={100} required value={draft.sku} onChange={(event) => update(draft.key, { sku: event.target.value, error: undefined })} /></label>
          <label className="space-y-1 text-xs font-semibold">Price override (USD)<input className={input} disabled={busy} type="number" min="0" step="0.01" placeholder="Use product price" value={draft.price} onChange={(event) => update(draft.key, { price: event.target.value, error: undefined })} /></label>
        </div>}
        {draft.error && <p role="alert" className="mt-2 text-sm text-red-800">{draft.error}</p>}
      </div>)}
      {notice && <p role="status" className="text-sm font-medium text-emerald-800">{notice}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onFinish} disabled={busy} className="rounded-xl border border-[#ded8ec] px-4 py-2.5 text-sm font-semibold text-violet-800">{drafts.some((draft) => draft.saved) ? "Done" : skipLabel}</button>
        {pending.length > 0 && <button type="submit" disabled={busy} className={button}>{busy ? "Saving variants…" : `Save ${pending.length} ${pending.length === 1 ? "variant" : "variants"}`}</button>}
      </div>
    </form>
  </div>;
}

function combination(options: Option[]) {
  return options.map((option) => option.id).sort().join(":");
}
