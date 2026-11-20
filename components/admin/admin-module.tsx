"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, CircleAlert, ClipboardList, Filter, ImageOff, Plus, RefreshCw, X } from "lucide-react";
import { apiOperations, sections, type Action, type Field, type Operation, type Section } from "@/lib/admin-workspace";
import { ApiError, human, money, staffRequest, type PageInfo, type Staff } from "@/lib/staff-api";
import { permitted, useStaff, useStaffProfileUpdate } from "./admin-shell";
import { AccountSettings, SiteSettings } from "./settings-panels";
import { ImageUploadField, imageFields, imageSelection, uploadImage, type ImageScope } from "./image-upload-field";
import VariantBuilder from "./variant-builder";

type Row = Record<string, unknown>;
type Task = { action: Action; target?: Row; path?: string; inspect?: boolean };
const inputClass = "h-10 w-full rounded-xl border border-[#ded8ec] bg-white px-3 text-sm outline-violet-500 placeholder:text-slate-500";
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#6942d5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5834b9] disabled:opacity-50";
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#ded8ec] bg-white px-3 py-2 text-sm font-semibold text-[#574b72] hover:bg-[#f6f2ff] disabled:opacity-50";

const record = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const get = (value: unknown, path: string): unknown => path.split(".").reduce<unknown>((source, key) => record(source)[key], value);
const rowId = (row: Row, section: string) => String((section === "roles" ? row.slug : row.id ?? row.variant_id ?? row.slug) ?? "");
const fieldName = (name: string) => name === "thumbnail" ? "Image" : human(name.split(".").at(-1) || name);
const amountKeys = /(?:amount|price)$/;

function permissionRecord(value: unknown): Row {
  return typeof value === "string" ? { slug: value, name: human(value.replace(".", " · ")) } : record(value);
}


function imageSource(row: Row): string | undefined {
  const images = Array.isArray(row.images) ? row.images.map(record) : [];
  const src = (images.find((image) => image.is_primary) ?? images[0])?.url ?? row.image_url ?? row.logo_url ?? row.url ?? get(row, "data.image_url");
  if (typeof src !== "string") return;
  if (/^https?:\/\//i.test(src)) return src;
  if (!src.startsWith("/") || src.startsWith("//")) return;
  if (!src.startsWith("/storage/")) return src;
  return new URL(src, process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").href;
}

function RecordThumbnail({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="relative grid size-12 place-items-center overflow-hidden rounded-lg border border-[#ebe8f2] bg-[#f8f6fd] text-slate-400">
    {src && !failed ? <Image unoptimized src={src} alt="" fill sizes="48px" className="object-cover" onError={() => setFailed(true)} /> : <ImageOff size={17} aria-label="No image" />}
  </span>;
}

function renderValue(value: unknown, key: string): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return amountKeys.test(key) ? money(value) : String(value);
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" ? String(record(item).name ?? record(item).slug ?? record(item).id ?? "") : String(item)).filter(Boolean).join(", ") || "—";
  if (typeof value === "object") return String(record(value).name ?? record(value).label ?? record(value).code ?? "—");
  if (/_at$/.test(key) && typeof value === "string" && !Number.isNaN(Date.parse(value))) return new Date(value).toLocaleString();
  return String(value);
}

function bind(path: string, parent: string, id = "") {
  const placeholders = [...path.matchAll(/\{([^}]+)\}/g)];
  return path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    if (parent && (placeholders.length > 1 && placeholders[0][1] === key || !id)) return encodeURIComponent(parent);
    return encodeURIComponent(id);
  });
}

const catalogBulkPermissions: Record<string, string> = {
  bulkProducts: "products", bulkCategory: "categories", bulkBrand: "brands",
  bulkAttribute: "attributes", bulkAttributeValue: "attributes",
};

function permittedBulkOptions(staff: Staff | null, operation: string) {
  const prefix = catalogBulkPermissions[operation];
  return apiOperations[operation]?.fields?.find(({name}) => name === "action")?.options?.filter((option) => {
    if (!prefix) return true;
    const action = option === "delete" || option === "restore" ? "delete" : "update";
    return staff?.permissions.includes(prefix + "." + action);
  });
}

function actionVisible(staff: Staff | null, key: string, row: Row) {
  if (key.startsWith("restore")) return Boolean(row.deleted_at);
  if (row.deleted_at) return false;
  if (key === "transitionOrder") return ["paid", "processing", "shipped"].includes(String(row.status)) && row.payment_status !== "refunded";
  if (key === "cancelAdminOrder") {
    return ["pending", "paid", "processing"].includes(String(row.status))
      && (Number(row.captured_amount) === 0 || permitted(staff, "requestOrderRefund"));
  }
  if (key === "requestOrderRefund") return ["succeeded", "partially_refunded", "payment_exception"].includes(String(row.payment_status));
  if (key === "deleteRole" || key === "updateRole" || key === "replaceRolePermissions") return row.slug !== "super-admin";
  return true;
}

export default function AdminModule({ initialSection }: { initialSection?: string }) {
  const pathname = usePathname();
  const [, , root, parent, child] = pathname.split("/");
  const sectionKey = child || initialSection || root;
  const section = sections[sectionKey];
  if (!section || (child && !sections[root]?.children?.includes(child))) return <div className="rounded-2xl bg-white p-8"><h1 className="text-2xl font-semibold">Workspace page unavailable</h1><Link href="/admin" className="mt-4 inline-block text-violet-700">Return to overview</Link></div>;
  return <Module key={pathname} section={section} sectionKey={sectionKey} parent={child ? parent : ""} root={root} openCreate={root === "products" && parent === "new"} />;
}

function Module({ section, sectionKey, parent, root, openCreate }: {section:Section;sectionKey:string;parent:string;root:string;openCreate:boolean}) {
  const staff = useStaff();
  const setStaffProfile = useStaffProfileUpdate();
  const router = useRouter();
  const allowed = permitted(staff, section.list);
  const operation = apiOperations[section.list];
  const [result, setResult] = useState<unknown>();
  const [meta, setMeta] = useState<PageInfo>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState("");
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [task, setTask] = useState<Task | null>(openCreate ? { action:["createProduct","Add product"] } : null);
  useEffect(() => {
    if (!allowed || !operation) return;
    const controller = new AbortController();
    const query = new URLSearchParams(filters);
    if (!section.single || sectionKey === "sales") query.set("page", String(page));
    staffRequest<unknown>(bind(operation.path, parent) + (query.size ? "?" + query.toString() : ""), { signal: controller.signal })
      .then(({ data, meta }) => { setResult(data); setMeta(meta?.pagination); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load records."); });
    return () => controller.abort();
  }, [allowed, operation, page, section.single, sectionKey, parent, filters, reload]);

  function refresh() { setError(""); setReload((value) => value + 1); }
  if (!allowed) return <div className="rounded-2xl border border-[#ebe8f2] bg-white p-8"><CircleAlert className="mb-3 text-violet-700" /><h1 className="text-2xl font-semibold">Access restricted</h1><p className="mt-2 text-sm text-slate-600">Your staff role does not have access to this area.</p></div>;

  const dedicatedSettings = sectionKey === "settings" || sectionKey === "site-settings";
  const rows = (Array.isArray(result) ? result : record(result).items ?? record(result).daily ?? record(result).rows ?? []) as unknown[];
  const columns = sectionKey === "sales" && Array.isArray(record(result).items) ? ["name","units","gross_merchandise_amount"] : section.columns ?? [];
  const canOpen = ([key]: Action) => permitted(staff, key)
    && (!catalogBulkPermissions[key] || Boolean(permittedBulkOptions(staff, key)?.length));
  const collectable = (section.actions ?? []).some((item) => canOpen(item) && apiOperations[item[0]].fields?.some((field) => field.name === "ids"));
  const filtersAvailable = operation.filters ?? [];

  return <div className="space-y-6">
    {parent && <Link href={`/admin/${root}`} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700"><ArrowLeft size={16} /> Back to {sections[root]?.title || "records"}</Link>}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{section.title}</h1>{section.description && <p className="mt-2 text-sm text-slate-600">{section.description}</p>}</div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondary} title="Refresh records" aria-label="Refresh records" onClick={refresh}><RefreshCw size={16} /></button>
        {!dedicatedSettings && section.actions?.filter(canOpen).map((action, index) => <button type="button" key={action[0]} className={index === 0 ? primary : secondary} onClick={() => setTask({ action, target:{...record(result), ids: selected} })}>{index === 0 && <Plus size={16} />}{action[1]}</button>)}
      </div>
    </div>
    {filtersAvailable.length > 0 && <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#ebe8f2] bg-white p-4" onSubmit={(event) => {
      event.preventDefault();
      const next = new URLSearchParams();
      for (const [key,value] of new FormData(event.currentTarget)) if (typeof value === "string" && value !== "") next.set(key, value);
      setPage(1); setSelected([]); setFilters(next.toString()); refresh();
    }}>
      {filtersAvailable.map((field) => <label key={field.name} className="min-w-28 flex-1 space-y-1.5 text-xs font-semibold text-[#574b72]">{field.label}
        {field.options || field.kind === "boolean" ? <select name={field.name} className={inputClass}><option value="">Any</option>{(field.options ?? ["1","0"]).map((option) => <option value={String(option)} key={String(option)}>{field.kind === "boolean" ? String(option) === "1" ? "Yes" : "No" : human(String(option))}</option>)}</select> :
        <input className={inputClass} type={field.kind === "date" || field.kind === "number" ? field.kind : "text"} name={field.name} />}
      </label>)}
      <button className={secondary}><Filter size={15} /> Apply filters</button>
      <button type="reset" className={secondary} onClick={() => { setPage(1); setSelected([]); setFilters(""); refresh(); }}>Clear</button>
    </form>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    {!error && result === undefined && <p role="status" className="rounded-2xl border border-[#ebe8f2] bg-white p-6 text-sm text-slate-600">Loading {section.title.toLowerCase()}…</p>}
    {result !== undefined && sectionKey === "settings" && <AccountSettings profile={result as Staff}
      onSecurityAction={(action) => setTask({action})} onProfileSaved={setStaffProfile} />}
    {result !== undefined && sectionKey === "site-settings" && <SiteSettings settings={record(record(result).data) as Record<string,string | null>} editable={permitted(staff,"updateSiteSettings")} />}
    {result !== undefined && !dedicatedSettings && !columns.length && <div className="rounded-2xl border border-[#ebe8f2] bg-white p-6"><Details data={result} /></div>}
    {result !== undefined && sectionKey === "sales" && Object.keys(record(record(result).totals)).length > 0 && <div className="rounded-2xl border border-[#ebe8f2] bg-white p-6"><Details data={record(result).totals} /></div>}
    {result !== undefined && columns.length > 0 && <div className="overflow-hidden rounded-2xl border border-[#ebe8f2] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebe8f2] px-5 py-4"><p className="text-sm font-semibold">{meta?.total ?? rows.length} records</p>{selected.length > 0 && <button onClick={() => setSelected([])} className="text-sm font-semibold text-violet-700">Clear {selected.length} selected</button>}</div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-[#faf8ff] text-[#625971]"><tr>{collectable && <th className="w-12 p-3 text-center">Pick</th>}{columns.map((key) => <th key={key} className="whitespace-nowrap px-5 py-3 font-semibold">{fieldName(key)}</th>)}<th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead>
        <tbody>{rows.map((item,index) => {
          const row = sectionKey === "permissions" ? permissionRecord(item) : record(item);
          const id = rowId(row, sectionKey);
          const actions = (section.row ?? []).filter(([key]) => canOpen([key,""]) && actionVisible(staff,key,row));
          const children = section.children?.filter((key) => permitted(staff,sections[key].list));
          return <tr key={id || String(row.date ?? index)} className="border-t border-[#f0edf5] hover:bg-[#fcfaff]">
            {collectable && <td className="p-3 text-center"><input type="checkbox" aria-label={`Select ${row.name ?? row.code ?? row.title ?? "record " + (index + 1)}`} checked={selected.includes(id)} onChange={(event) => setSelected((items) => event.target.checked ? [...items,id] : items.filter((value) => value !== id))} className="size-4 accent-violet-700" /></td>}
            {columns.map((key,i) => <td key={key} className={`max-w-60 truncate px-5 py-3.5 ${i ? "text-[#4c435e]" : "font-semibold"}`} title={key === "thumbnail" ? undefined : renderValue(get(row,key),key)}>
              {key === "thumbnail" ? <RecordThumbnail key={imageSource(row)} src={imageSource(row)} /> : /status|published|active|low_stock/.test(key) && get(row,key) != null ? <span className="inline-flex rounded-full bg-[#f0e9ff] px-2.5 py-1 text-xs font-semibold text-[#5733b8]">{human(renderValue(get(row,key),key))}</span> : renderValue(get(row,key),key)}
            </td>)}
            <td className="whitespace-nowrap px-5 py-3 text-right"><div className="flex justify-end gap-2">
              <button className={secondary} onClick={() => setTask({action:[section.detail ?? "", "Record details"],target:row,inspect:true})}>View</button>
              {(actions.length > 0 || Boolean(children?.length)) && <select aria-label="Record action" value="" className="max-w-36 rounded-xl border border-[#ded8ec] bg-white px-2 text-sm" onChange={(event) => {
                const key = event.target.value;
                if (key.startsWith("child:")) return router.push(`/admin/${sectionKey}/${encodeURIComponent(id)}/${key.slice(6)}`);
                const action = actions.find(([code]) => code === key);
                if (action) setTask({action,target:row});
              }}><option value="">Manage</option>{actions.map(([key,label]) => <option key={key} value={key}>{label}</option>)}{children?.map((key) => <option key={key} value={`child:${key}`}>{sections[key].title}</option>)}</select>}
            </div></td>
          </tr>;
        })}</tbody>
      </table></div> : <div className="grid justify-items-center gap-2 px-5 py-14 text-center"><ClipboardList className="text-[#8c70c8]" size={30}/><p className="font-semibold">No records found</p><p className="text-sm text-slate-600">Try changing your filters or refreshing this page.</p></div>}
      {meta && meta.last_page > 1 && <div className="flex items-center justify-between gap-2 px-5 py-4 text-sm"><button type="button" disabled={page <= 1} className={secondary} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /> Previous</button><span>Page {meta.current_page} of {meta.last_page}</span><button type="button" disabled={page >= meta.last_page} className={secondary} onClick={() => setPage(page + 1)}>Next <ChevronRight size={16} /></button></div>}
    </div>}
    {task && (task.inspect || canOpen(task.action)) && <ActionDialog key={task.action[0] + rowId(task.target ?? {},sectionKey)} task={task} detail={section.detail} parent={parent} sectionKey={sectionKey} onClose={() => setTask(null)} onSaved={(message) => { setNotice(message); setSelected([]); refresh(); }} />}
  </div>;
}

function Details({data}: {data:unknown}) {
  if (Array.isArray(data)) return <ul className="space-y-3">{data.map((item,index) => <li key={index} className="rounded-xl border border-[#ebe8f2] p-3">{typeof item === "object" && item !== null ? <Details data={item} /> : String(item)}</li>)}</ul>;
  return <dl className="grid gap-4 sm:grid-cols-2">{Object.entries(record(data)).map(([key,value]) => <div key={key} className={typeof value === "object" && value !== null ? "sm:col-span-2" : ""}>
    <dt className="mb-1 text-xs font-semibold text-[#625971]">{fieldName(key)}</dt>
    <dd className="break-all text-sm">{typeof value === "object" && value !== null ? <div className="rounded-xl bg-[#f8f6fd] p-3"><Details data={value} /></div> : renderValue(value,key)}</dd>
  </div>)}</dl>;
}

function ActionDialog({task, detail, parent, sectionKey, onClose, onSaved}: {task:Task;detail?:string;parent:string;sectionKey:string;onClose:()=>void;onSaved:(message:string)=>void}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const staff = useStaff();
  const [operationKey,label] = task.action;
  const operation = apiOperations[operationKey];
  const id = rowId(task.target ?? {}, sectionKey);
  const needsRecord = Boolean(id && detail && (task.inspect || operation?.method === "PATCH") && !operationKey.endsWith("Status"));
  const [base, setBase] = useState<unknown>(task.target);
  const [loading, setLoading] = useState(needsRecord);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string,string[]>>({});
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<unknown>();
  const [baseSku, setBaseSku] = useState("");
  const [queuedProductImages, setQueuedProductImages] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [optionGroups, setOptionGroups] = useState<Record<string, Choice[]>>({});
  const idempotency = useRef<string | undefined>(undefined);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    if (!needsRecord || !detail) return;
    const controller = new AbortController();
    staffRequest(bind(apiOperations[detail].path,parent,id), {signal:controller.signal}).then(({data}) => setBase(data)).catch((failure) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load details.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [needsRecord, detail, parent, id]);
  useEffect(() => {
    if (task.inspect || !operation?.fields) return;
    const controller = new AbortController();
    const endpoints = [...new Set(operation.fields.map(({name}) => optionSources[name]).filter(Boolean))];
    Promise.allSettled(endpoints.map(async (endpoint) => {
      const query = endpoint === "/permissions" ? "" : "?per_page=100";
      const { data } = await staffRequest<unknown[]>(endpoint + query, {signal:controller.signal});
      return [endpoint, (Array.isArray(data) ? data : []).map((item) => {
        const itemRecord = endpoint === "/permissions" ? permissionRecord(item) : record(item);
        const key = String(endpoint === "/roles" || endpoint === "/permissions" ? itemRecord.slug : itemRecord.id);
        return { key, label:String(itemRecord.name ?? itemRecord.title ?? itemRecord.slug ?? key) };
      }).filter((choice) => choice.key && choice.key !== "undefined")] as const;
    })).then((options) => {
      if (!controller.signal.aborted) setOptionGroups(Object.fromEntries(options.flatMap((entry) => entry.status === "fulfilled" ? [entry.value] : [])));
    });
    return () => controller.abort();
  }, [operation, task.inspect]);
  const fields = (operation?.fields ?? []).map((field) => catalogBulkPermissions[operationKey] && field.name === "action"
    ? {...field, options: permittedBulkOptions(staff, operationKey)} : field);
  const destructive = operation?.method === "DELETE" || operationKey === "cancelAdminOrder" || operationKey === "requestOrderRefund";
  const targetName = renderValue(record(base).number ?? record(base).name ?? record(base).key ?? record(base).title ?? record(base).sku ?? record(base).code, "name");
  const createdProductId = operationKey === "createProduct" && submitted && permitted(staff, "createProductVariant") ? String(record(response).id ?? "") : "";
  const variantProductId = operationKey === "createProductVariant" ? parent : createdProductId;
  const bulkFinished = Array.isArray(record(response).failed);
  const showResponse = submitted && (operationKey.includes("TwoFactor") || operationKey === "replaceStaffRecoveryCodes");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || loading || !operation || bulkFinished) return;
    setError(""); setFieldErrors({}); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const body = await buildBody(operation,form,base,imageScope(sectionKey,operation.method));
      if (catalogBulkPermissions[operationKey] && !permittedBulkOptions(staff, operationKey)?.includes(String(record(body).action))) {
        setError("Your role cannot perform the selected action.");
        return;
      }
      if (operationKey === "createProduct") setQueuedProductImages(0);
      if (operation.idempotent) idempotency.current ??= crypto.randomUUID();
      const { data } = await staffRequest(bind(operation.path,parent,id), {method:operation.method,body,idempotency:idempotency.current});
      setResponse(data);
      const failures = record(data).failed;
      if (Array.isArray(failures) && failures.length) {
        const succeeded = Number(record(record(data).counts).succeeded ?? 0);
        onSaved(succeeded > 0 ? succeeded + " records updated." : "");
        setError(failures.length + " records could not be updated. "
          + failures.map((failure) => String(record(failure).id) + " · " + human(String(record(failure).code))).join("; "));
        setSubmitted(true);
        return;
      }
      if (operationKey !== "createProduct") setSubmitted(true);
      onSaved(`${label} completed.`);
      if (operationKey === "createProduct" && permitted(staff, "createProductVariant") && record(data).id) {
        setBaseSku(String(record(body).sku ?? ""));
        const images = form.getAll("draft_images").filter((file): file is File => file instanceof File && file.size > 0);
        const productId = String(record(data).id);
        let failed = 0;
        for (const image of images) {
          const upload = new FormData();
          upload.set("image", image);
          try {
            await staffRequest(`/products/${encodeURIComponent(productId)}/images`, {method:"POST",body:upload});
          } catch {
            failed++;
          }
        }
        setQueuedProductImages(failed);
        setSubmitted(true);
        if (images.length && failed < images.length) onSaved("Product draft and images saved.");
        return;
      }
      if (!operationKey.includes("TwoFactor") && operationKey !== "replaceStaffRecoveryCodes") {
        onClose();
        if (operationKey === "changeStaffPassword") router.replace("/login");
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save changes.");
      if (failure instanceof ApiError) setFieldErrors(failure.fields);
    } finally { setBusy(false); }
  }

  return <dialog ref={ref} onClose={onClose} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(44rem,calc(100%-2rem))] overflow-y-auto rounded-3xl border border-[#ebe8f2] bg-white p-0 text-[#201a34] shadow-2xl backdrop:bg-slate-950/50">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#ebe8f2] bg-white p-5"><div><h2 className="text-xl font-semibold">{createdProductId ? "Add variants (optional)" : label}</h2>{targetName !== "—" && <p className="mt-1 text-sm text-slate-600">{targetName}</p>}</div><button type="button" className={secondary} onClick={() => ref.current?.close()} aria-label="Close dialog"><X size={17} /></button></div>
    <div className="space-y-4 p-5">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {createdProductId && queuedProductImages > 0 && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{queuedProductImages} images could not be saved. The draft is safe. <Link className="underline" href={`/admin/products/${encodeURIComponent(createdProductId)}/images`}>Open product images</Link> to retry.</p>}
      {variantProductId ? <VariantBuilder
        productId={variantProductId}
        productName={createdProductId ? String(record(response).name ?? "Product") : undefined}
        baseSku={createdProductId ? baseSku : undefined}
        skipLabel={createdProductId ? "Skip variants" : "Close"}
        onFinish={onClose}
        onSaved={() => onSaved("Variant options saved.")}
      /> : loading ? <p role="status">Loading record…</p> : task.inspect ? <Details data={base} /> : showResponse ? <><p className="rounded-xl bg-violet-50 p-3 text-sm text-violet-800">Save any recovery codes securely before closing.</p><Details data={response} />{operationKey === "confirmStaffTwoFactor" && <Link className={primary} href="/login">Sign in again</Link>}</> :
      <form onSubmit={submit} className="space-y-4">
        {destructive && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Review this action before confirming. It will update the live staff workspace.</p>}
        <div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => field.name === "data.items" ? <SectionItems key={field.name} value={get(base,field.name)} /> :
          imageFields.has(field.name) ? <ImageUploadField key={field.name} name={field.name} label={field.label} url={get(base,field.name)} error={fieldErrors[field.name]?.[0]} /> :
          <FormField key={field.name} field={field} value={initialValue(field,base,operationKey)} errors={fieldErrors[field.name]} choices={optionGroups[optionSources[field.name]]} />)}</div>
        {operationKey === "createProduct" && permitted(staff,"uploadProductImage") && <label className="block space-y-1.5 rounded-xl border border-[#ded8ec] p-3 text-sm font-semibold">
          Product photos <span className="font-normal text-zinc-500">(optional)</span>
          <input type="file" multiple name="draft_images" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-violet-100 file:px-2 file:py-1.5 file:text-violet-900" />
        </label>}
        <div className="flex justify-end gap-2"><button type="button" className={secondary} onClick={() => ref.current?.close()}>Cancel</button><button type="submit" disabled={busy || bulkFinished} className={primary}>{busy ? "Saving…" : destructive ? "Confirm action" : operationKey === "createProduct" ? "Save draft" : "Save changes"}</button></div>
      </form>}
    </div>
  </dialog>;
}

function initialValue(field: Field, target: unknown, operation: string) {
  if ((operation === "moderateReview" || operation === "bulkModerateReviews" || operation === "transitionOrder") && field.name === "status") return undefined;
  if (operation.startsWith("create") && field.name !== "ids") return undefined;
  const found = get(target,field.name);
  if (found !== undefined) return found;
  if (field.name === "category_ids") return Array.isArray(record(target).categories) ? (record(target).categories as Row[]).map((row) => row.id) : undefined;
  if (field.name === "brand_id" || field.name === "parent_id") return get(target,field.name.replace("_id",".id"));
  return undefined;
}

type Choice = {key:string;label:string};
const optionSources: Record<string,string> = {
  category_ids:"/categories", parent_id:"/categories", brand_id:"/brands", roles:"/roles", permissions:"/permissions", product_ids:"/products",
};

function FormField({field,value,errors,choices}: {field:Field;value:unknown;errors?:string[];choices?:Choice[]}) {
  const {name, label, kind, required, options, hint, min, max, integer} = field;
  const monetary = kind === "number" && amountKeys.test(name);
  const linkedValues = Array.isArray(value) ? value.map((item) => String(typeof item === "object" ? record(item).slug ?? record(item).id : item)) : typeof value === "string" ? [value] : [];
  const linkedOptions = [...(choices ?? []), ...linkedValues.filter((key) => !choices?.some((item) => item.key === key)).map((key) => ({key,label:key}))];
  const text = value === undefined || value === null ? "" : String(value);
  const isTextArea = kind === "json" || kind === "list" || /description|copy|quote|reason|(^|\.)body$/.test(name);
  if (choices?.length && kind === "list") return <fieldset className="space-y-2 sm:col-span-2">
    <legend className="text-sm font-semibold text-[#574b72]">{label}</legend>
    <div className="grid max-h-52 gap-1 overflow-y-auto rounded-xl border border-[#ded8ec] p-3 sm:grid-cols-2">
      {linkedOptions.map(({key,label}) => <label key={key} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-violet-50"><input type="checkbox" name={name} value={key} defaultChecked={linkedValues.includes(key)} className="accent-violet-700" />{label}</label>)}
    </div><input type="hidden" name={name + ".__picker"} value="1" />
    {errors?.map((message) => <p key={message} className="text-xs text-red-700">{message}</p>)}
  </fieldset>;
  return <label className={`block space-y-1.5 text-sm font-semibold text-[#574b72] ${isTextArea ? "sm:col-span-2" : ""}`}>
    <span>{monetary ? label.replace("USD cents","USD") : label}{required && <span className="text-violet-700"> *</span>}</span>
    {choices?.length ? <select name={name} className={inputClass} required={required} defaultValue={text}><option value="">Choose…</option>{linkedOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select> : options || kind === "boolean" ? <select name={name} className={inputClass} required={required} defaultValue={text}><option value="">Choose…</option>{(options ?? ["true","false"]).map((choice) => <option key={String(choice)} value={String(choice)}>{choice === "true" ? "Yes" : choice === "false" ? "No" : human(String(choice))}</option>)}</select> :
    isTextArea ? <textarea name={name} className={inputClass + " !h-auto min-h-20 py-2"} required={required} defaultValue={kind === "json" && value != null ? JSON.stringify(value,null,2) : kind === "list" && Array.isArray(value) ? value.map((item) => typeof item === "object" ? record(item).slug ?? record(item).id : item).join("\n") : text} placeholder={kind === "list" ? "One value per line" : kind === "json" ? "Enter structured JSON" : undefined} /> :
    <input name={name} className={inputClass} required={required} type={kind === "datetime" ? "datetime-local" : kind === "text" && name.endsWith("email") ? "email" : kind} min={monetary && min !== undefined ? min / 100 : min} max={monetary && max !== undefined ? max / 100 : max} step={kind === "number" ? monetary ? 0.01 : integer ? 1 : "any" : undefined} defaultValue={kind === "file" ? undefined : monetary && text !== "" ? (Number(text) / 100).toFixed(2) : kind === "datetime" && text && !Number.isNaN(Date.parse(text)) ? new Date(text).toISOString().slice(0,16) : text} accept={kind === "file" ? "image/*" : undefined} />}
    {hint && !monetary && <span className="block text-xs font-normal text-slate-600">{hint}</span>}
    {kind === "datetime" && <span className="block text-xs font-normal text-slate-600">UTC</span>}
    {errors?.map((message) => <span key={message} className="block text-xs text-red-700">{message}</span>)}
  </label>;
}

function imageScope(section: string, method: string): ImageScope {
  if (section === "categories") return method === "POST" ? "category-create" : "category-update";
  if (section === "brands") return method === "POST" ? "brand-create" : "brand-update";
  return "content";
}

async function buildBody(operation: Operation, data: FormData, base: unknown, scope: ImageScope) {
  if (!operation.fields?.length) return undefined;
  const payload: Row = {};
  const files = new FormData();
  for (const field of operation.fields) {
    if (field.kind === "list" && data.has(field.name + ".__picker")) {
      payload[field.name] = data.getAll(field.name);
      continue;
    }
    if (imageFields.has(field.name)) {
      const selected = imageSelection(data,field.name);
      const previous = get(base,field.name);
      const image = selected instanceof File ? await uploadImage(scope,selected) : selected === null ? null : previous;
      if (image !== undefined) {
        const [parent,key] = field.name.split(".");
        if (key) payload[parent] = {...record(payload[parent]),[key]:image};
        else payload[parent] = image;
      }
      continue;
    }
    if (field.name === "data.items") {
      const keys = data.getAll("section_item_key").map(String);
      const original = get(base,"data.items");
      const originalItems = Array.isArray(original) ? original.map(record) : [];
      if (data.has("section_items_present")) {
        const items = [];
        for (const key of keys) {
          const prefix = "section_item."+key+".";
          const previous = /^old-\d+$/.test(key) ? originalItems[Number(key.slice(4))] : undefined;
          const item: Row = {};
          for (const property of ["title","reference_id","image_alt","link_url"]) {
            const value = String(data.get(prefix+property) ?? "").trim();
            if (value) item[property] = value;
          }
          const image = imageSelection(data,prefix+"image_url");
          if (image instanceof File) item.image_url = await uploadImage(scope,image);
          else if (image !== null && previous?.image_url) item.image_url = previous.image_url;
          items.push(item);
        }
        payload.data = {...record(payload.data),items};
      }
      continue;
    }
    const value = data.get(field.name);
    if (value === null || value === "" || (value instanceof File && !value.size)) {
      if (field.nullable && operation.method === "PATCH") {
        const [parent,key] = field.name.split(".");
        if (key) payload[parent] = {...record(payload[parent]),[key]:null};
        else payload[parent] = null;
      }
      continue;
    }
    if (operation.multipart) {
      files.set(field.name, value === "true" ? "1" : value === "false" ? "0" : value);
      continue;
    }
    if (typeof value !== "string") continue;
    let parsed: unknown = value;
    if (field.kind === "number") parsed = amountKeys.test(field.name) ? Math.round(Number(value) * 100) : Number(value);
    if (field.kind === "boolean") parsed = value === "true";
    if (field.kind === "datetime") parsed = value + (value.length === 16 ? ":00" : "") + "+00:00";
    if (field.kind === "list") parsed = value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
    if (field.kind === "json") {
      try { parsed = JSON.parse(value); } catch { throw new Error(field.label + " must be valid JSON."); }
    }
    const [parent,key] = field.name.split(".");
    if (key) payload[parent] = {...record(payload[parent]), [key]:parsed};
    else payload[parent] = parsed;
  }
  return operation.multipart ? files : payload;
}


function SectionItems({value}:{value:unknown}) {
  const [rows,setRows] = useState(() => Array.isArray(value) ? value.map((item,index) => ({ key:"old-"+index, data:record(item) })) : []);
  return <fieldset className="space-y-3 sm:col-span-2">
    <legend className="mb-2 text-sm font-semibold text-[#574b72]">Section items</legend>
    <input type="hidden" name="section_items_present" value="1" />
    {rows.map(({key,data})=><div key={key} className="grid gap-3 rounded-xl border border-[#ded8ec] p-3 sm:grid-cols-2">
      <input type="hidden" name="section_item_key" value={key} />
      {[["title","Title"],["link_url","Destination link"],["image_alt","Image alt text"],["reference_id","Catalog reference ID"]].map(([name,label])=><label key={name} className="space-y-1 text-xs font-semibold text-[#574b72]">{label}<input className={inputClass} name={`section_item.${key}.${name}`} defaultValue={String(data[name]??"")} /></label>)}
      <ImageUploadField name={`section_item.${key}.image_url`} label="Tile image" url={data.image_url} />
      <button type="button" className={secondary} onClick={()=>setRows((items)=>items.filter((item)=>item.key!==key))}>Remove item</button>
    </div>)}
    <button type="button" disabled={rows.length>=24} className={secondary} onClick={()=>setRows((items)=>[...items,{key:crypto.randomUUID(),data:{}}])}><Plus size={15}/> Add item</button>
  </fieldset>;
}
