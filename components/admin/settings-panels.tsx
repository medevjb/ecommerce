"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { BadgeCheck, Globe2, KeyRound, Mail, Search, ShieldCheck, UserRound } from "lucide-react";
import { ApiError, human, staffRequest, type Staff } from "@/lib/staff-api";
import type { Action } from "@/lib/admin-workspace";

const panel = "rounded-2xl border border-[#ebe8f2] bg-white p-5 shadow-sm shadow-violet-950/5 md:p-6";
const field = "mt-2 block w-full rounded-xl border border-[#ded8ec] bg-white px-3 py-2.5 text-sm text-[#201a34] outline-violet-600 placeholder:text-slate-500";
const primary = "rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-45";
const secondary = "rounded-xl border border-[#ded8ec] px-4 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-45";

function CardHeading({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="mb-5 flex items-start gap-3">
    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">{icon}</div>
    <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div>
  </div>;
}

function message(error: unknown) {
  if (error instanceof ApiError) return Object.values(error.fields).flat()[0] ?? error.message;
  return error instanceof Error ? error.message : "Could not save your changes.";
}

export function AccountSettings({ profile, onSecurityAction, onProfileSaved }: {
  profile: Staff & { email_verified?: boolean; active?: boolean };
  onSecurityAction: (action: Action) => void;
  onProfileSaved: (profile: Staff) => void;
}) {
  const [savedName, setSavedName] = useState(profile.name);
  const [name, setName] = useState(profile.name);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !name.trim() || name.trim() === savedName) return;
    setBusy(true); setStatus(undefined);
    try {
      const { data } = await staffRequest<Staff>("/me", { method: "PATCH", body: { name: name.trim() } });
      setSavedName(data.name); setName(data.name);
      onProfileSaved(data);
      setStatus({ ok: true, text: "Profile updated." });
    } catch (error) {
      setStatus({ ok: false, text: message(error) });
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div className="space-y-5">
      <section className={panel}>
        <div className="mb-6 flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-violet-100 text-xl font-bold text-violet-800">{savedName.slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0"><p className="break-words text-xl font-semibold">{savedName}</p><div className="mt-1 flex flex-wrap gap-1.5">{profile.roles.map((role) => <span key={role} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">{human(role)}</span>)}</div></div>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <label className="block text-sm font-semibold">Display name<input className={field} required maxLength={255} autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setStatus(undefined); }} /></label>
          <div className="rounded-xl bg-[#f8f6fd] p-3"><p className="text-xs font-semibold text-slate-600">Sign-in email</p><p className="mt-1 break-all text-sm">{profile.email}</p>{profile.email_verified && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800"><BadgeCheck size={15} /> Verified email</p>}</div>
          {status && <p role={status.ok ? "status" : "alert"} className={status.ok ? "text-sm text-emerald-800" : "text-sm text-red-800"}>{status.text}</p>}
          <button className={primary} disabled={busy || !name.trim() || name.trim() === savedName}>{busy ? "Saving…" : "Save profile"}</button>
        </form>
      </section>
      <details className={panel}>
        <summary className="cursor-pointer font-semibold">Account permissions <span className="ml-2 rounded-full bg-violet-50 px-2 py-1 text-xs text-violet-800">{profile.permissions.length}</span></summary>
        <ul className="mt-4 flex flex-wrap gap-2">{profile.permissions.map((permission) => <li key={permission} className="rounded-lg bg-[#f8f6fd] px-2.5 py-1 text-xs text-slate-700">{human(permission.replace(".", " · "))}</li>)}</ul>
      </details>
    </div>
    <div className="space-y-5">
      <section className={panel}>
        <CardHeading icon={<KeyRound size={20} />} title="Password" description="Changing your password signs you out of existing sessions." />
        <button className={secondary} onClick={() => onSecurityAction(["changeStaffPassword","Change password"])}>Change password</button>
      </section>
      <section className={panel}>
        <CardHeading icon={<ShieldCheck size={20} />} title="Two-factor authentication" description="Use an authenticator app to protect staff sign-in." />
        <button className={primary} onClick={() => onSecurityAction(["setupStaffTwoFactor","Set up two-factor authentication"])}>Set up authenticator</button>
        <details className="mt-4 border-t border-[#ebe8f2] pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-violet-800">Already using two-factor authentication?</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={secondary} onClick={() => onSecurityAction(["confirmStaffTwoFactor","Confirm authenticator setup"])}>Confirm pending setup</button>
            <button className={secondary} onClick={() => onSecurityAction(["replaceStaffRecoveryCodes","Replace recovery codes"])}>Replace recovery codes</button>
            <button className={secondary} onClick={() => onSecurityAction(["disableStaffTwoFactor","Disable two-factor authentication"])}>Disable two-factor</button>
          </div>
        </details>
      </section>
    </div>
  </div>;
}

const settingsGroups = [
  { title: "Brand and imagery", description: "Set the storefront name and fallback artwork.", icon: Globe2, fields: [
    ["name","Store name"], ["logo_url","Logo URL"], ["logo_alt","Logo alt text"], ["image_fallback_url","Fallback image URL"], ["copyright","Footer copyright"],
  ] },
  { title: "Support and newsletter", description: "Set the contact details and subscription copy customers see.", icon: Mail, fields: [
    ["support_email","Support email"], ["support_url","Support link"], ["newsletter_title","Newsletter title"], ["newsletter_copy","Newsletter description"],
  ] },
  { title: "Search appearance", description: "Set the default title and description for storefront pages.", icon: Search, fields: [
    ["seo_title","Default page title"], ["seo_description","Default meta description"],
  ] },
];

type SiteValues = Record<string, string | null | undefined>;

export function SiteSettings({ settings, editable }: { settings: SiteValues; editable: boolean }) {
  const [saved, setSaved] = useState(settings);
  const [values, setValues] = useState<SiteValues>(settings);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const fields = settingsGroups.flatMap((group) => group.fields.map(([key]) => key));
  const changed = fields.some((key) => (saved[key] ?? "") !== (values[key] ?? ""));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || busy || !changed) return;
    setBusy(true); setStatus(undefined); setErrors({});
    try {
      const data = Object.fromEntries(fields.map((key) => [key, values[key]?.trim() || null]));
      const result = await staffRequest<{ data: SiteValues }>("/site-settings", { method: "PATCH", body: { data } });
      setSaved(result.data.data); setValues(result.data.data);
      setStatus({ ok: true, text: "Site settings saved." });
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields);
      setStatus({ ok: false, text: message(error) });
    } finally {
      setBusy(false);
    }
  }

  const urlHint = "Use a full HTTP(S) URL or a storefront path starting with /.";
  return <form onSubmit={save} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
    <div className="space-y-5">
      {!editable && <p className="rounded-xl bg-violet-50 p-4 text-sm text-violet-800">Your role can view these settings.</p>}
      {settingsGroups.map(({ title, description, icon: Icon, fields }) => <section className={panel} key={title}>
        <CardHeading icon={<Icon size={20} />} title={title} description={description} />
        <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key,label]) => {
          const multiline = key.endsWith("_copy") || key.endsWith("_description");
          const attributes = {
            name: key, value: values[key] ?? "", readOnly: !editable, className: field,
            "aria-invalid": Boolean(errors["data."+key]),
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setValues((current) => ({ ...current, [key]: event.target.value }));
              setStatus(undefined);
              if (errors["data."+key]) setErrors((current) => ({ ...current, ["data."+key]: [] }));
            },
          };
          return <label key={key} className={`block text-sm font-semibold ${multiline ? "sm:col-span-2" : ""}`}>
            {label}
            {multiline ? <textarea {...attributes} rows={3} maxLength={2000} /> : <input {...attributes} type={key === "support_email" ? "email" : "text"} maxLength={key.endsWith("_url") ? 2048 : key === "support_email" ? 255 : 200} />}
            {key.endsWith("_url") && <span className="mt-1 block text-xs font-normal text-slate-600">{urlHint}</span>}
            {errors["data."+key]?.map((error) => <span key={error} className="mt-1 block text-xs text-red-800">{error}</span>)}
          </label>;
        })}</div>
      </section>)}
      {editable && <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ebe8f2] bg-white p-4 shadow-sm">
        <div className="text-sm">{status ? <p role={status.ok ? "status" : "alert"} className={status.ok ? "text-emerald-800" : "text-red-800"}>{status.text}</p> : <p className="text-slate-600">{changed ? "You have unsaved changes." : "All changes saved."}</p>}</div>
        <div className="flex gap-2"><button type="button" className={secondary} disabled={!changed || busy} onClick={() => { setValues(saved); setStatus(undefined); setErrors({}); }}>Discard</button><button className={primary} disabled={!changed || busy}>{busy ? "Saving…" : "Save settings"}</button></div>
      </div>}
    </div>
    <aside className={`${panel} xl:sticky xl:top-28`}><CardHeading icon={<UserRound size={20} />} title="Storefront preview" description="Preview your store name and search copy." />
      <div className="rounded-xl bg-[#f8f6fd] p-4"><p className="break-words text-xs text-slate-600">{values.name || "Your store"}</p><p className="mt-2 break-words font-semibold text-violet-800">{values.seo_title || values.name || "Page title"}</p><p className="mt-1 break-words text-sm text-slate-700">{values.seo_description || "The default page description appears here."}</p></div>
    </aside>
  </form>;
}
