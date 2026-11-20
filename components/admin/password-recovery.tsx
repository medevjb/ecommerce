"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { ApiError, backend, staffRequest } from "@/lib/staff-api";
import { useToast } from "@/context/toast-context";

const field = "mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-violet-600";
const subscribeToSessionStorage = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};
const getCustomerResetToken = () => sessionStorage.getItem("customer_password_reset_token") ?? "";

export default function PasswordRecovery({ reset = false }: {reset?:boolean}) {
  const params = useSearchParams();
  const [done,setDone] = useState(false);
  const [busy,setBusy] = useState(false);
  const { showToast } = useToast();
  const [audience,setAudience] = useState(params.get("audience") === "staff" ? "staff" : "customer");
  const storedResetToken = useSyncExternalStore(subscribeToSessionStorage, getCustomerResetToken, () => "");
  const resetToken = audience === "customer" && reset ? storedResetToken : params.get("token") ?? "";

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const selectedAudience = data.audience === "staff" ? "staff" : "customer";
    delete data.audience;
    try {
      if (!reset && selectedAudience === "customer") {
        const { data: result } = await backend<{ email: string; verification_token: string }>("/api/auth/forgot-password", { method: "POST", body: data });
        if (!result?.verification_token || !result.email) {
          throw new Error("The verification session could not be started. Please try again.");
        }
        sessionStorage.setItem("email_verification_token", result.verification_token);
        window.location.assign(new URL(`/verify-email?${new URLSearchParams({ flow: "password_reset", email: result.email }).toString()}`, window.location.origin));
        return;
      }

      if (reset && selectedAudience === "customer") {
        await backend<void>("/api/auth/reset-password", {
          method: "POST",
          body: { ...data, token: resetToken },
        });
        sessionStorage.removeItem("customer_password_reset_token");
      } else {
        await staffRequest(`/${selectedAudience}/${reset ? "reset-password" : "forgot-password"}`, {
          method: "POST",
          body: reset && selectedAudience === "staff" ? { ...data, token: params.get("token") ?? "" } : data,
        });
      }
      setDone(true);
    } catch (failure) {
      if (failure instanceof ApiError && Object.keys(failure.fields).length > 0) {
        showToast({ variant: "error", title: "Check the details", description: Object.values(failure.fields).flat().join(" ") });
      } else {
        showToast({ variant: "error", title: "Could not complete this request", description: failure instanceof Error ? failure.message : "Please try again." });
      }
    } finally {
      setBusy(false);
    }
  }

  return <section className="space-y-6">
    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700"><ArrowLeft size={15} /> Back to sign-in</Link>
    <h1 className="text-3xl font-semibold tracking-tight">{reset ? "Choose a new password" : "Reset your password"}</h1>
    {done ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{reset ? "Password updated. You can now sign in." : "If the account exists, a recovery link will be sent to your email."}</p> :
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">Account type<select name="audience" value={audience} onChange={(event) => setAudience(event.target.value === "staff" ? "staff" : "customer")} className={field}><option value="customer">Customer</option><option value="staff">Staff</option></select></label>
        <label className="block text-sm font-medium">Email<input className={field} type="email" name="email" defaultValue={params.get("email") ?? ""} required /></label>
        {reset && <><input type="hidden" name="token" value={resetToken} /><label className="block text-sm font-medium">New password<input className={field} type="password" name="password" autoComplete="new-password" required /></label><label className="block text-sm font-medium">Confirm password<input className={field} type="password" name="password_confirmation" autoComplete="new-password" required /></label></>}
        {reset && !resetToken && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{audience === "customer" ? <>Your password reset session has expired. <Link href="/forgot-password" className="font-semibold underline">Request a new code</Link>.</> : "Open the password reset link from your staff email to continue."}</p>}
        <button disabled={busy || (reset && !resetToken)} className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{busy ? "Please wait…" : reset ? "Save password" : "Send recovery code"}</button>
      </form>}
  </section>;
}
