"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { staffRequest } from "@/lib/staff-api";

const field = "mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-violet-600";
export default function PasswordRecovery({ reset = false }: {reset?:boolean}) {
  const params = useSearchParams();
  const [done,setDone] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const audience = data.audience === "staff" ? "staff" : "customer";
    delete data.audience;
    try {
      await staffRequest(`/${audience}/${reset ? "reset-password" : "forgot-password"}`, { method:"POST", body:data });
      setDone(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not complete this request.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="space-y-6">
    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700"><ArrowLeft size={15} /> Back to sign-in</Link>
    <h1 className="text-3xl font-semibold tracking-tight">{reset ? "Choose a new password" : "Reset your password"}</h1>
    {done ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{reset ? "Password updated. You can now sign in." : "If the account exists, a recovery link will be sent to your email."}</p> :
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">Account type<select name="audience" defaultValue={params.get("audience") ?? "customer"} className={field}><option value="customer">Customer</option><option value="staff">Staff</option></select></label>
        <label className="block text-sm font-medium">Email<input className={field} type="email" name="email" defaultValue={params.get("email") ?? ""} required /></label>
        {reset && <><input type="hidden" name="token" value={params.get("token") ?? ""} /><label className="block text-sm font-medium">New password<input className={field} type="password" name="password" autoComplete="new-password" required /></label><label className="block text-sm font-medium">Confirm password<input className={field} type="password" name="password_confirmation" autoComplete="new-password" required /></label></>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{busy ? "Please wait…" : reset ? "Save password" : "Send recovery link"}</button>
      </form>}
  </section>;
}
