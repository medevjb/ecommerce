"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, MailCheck, RefreshCw } from "lucide-react";
import { useToast } from "@/context/toast-context";
import { ApiError, backend } from "@/lib/staff-api";

type VerificationStatus = "waiting" | "verifying" | "verified" | "failed";

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const next = params.get("next") === "checkout" ? "checkout" : "";
  const id = params.get("id");
  const hash = params.get("hash");
  const expires = params.get("expires");
  const signature = params.get("signature");
  const [status, setStatus] = useState<VerificationStatus>(id && hash && expires && signature ? "verifying" : "waiting");
  const [resendEmail, setResendEmail] = useState(email);
  const [isResending, setIsResending] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!id || !hash || !expires || !signature) return;
    const query = new URLSearchParams({ id, hash, expires, signature });
    let active = true;
    backend(`/api/auth/email/verify?${query.toString()}`)
      .then(() => { if (active) setStatus("verified"); })
      .catch(() => { if (active) setStatus("failed"); })
      .finally(() => { if (active) setStatus((current) => current === "verifying" ? "failed" : current); });
    return () => { active = false; };
  }, [id, hash, expires, signature]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsResending(true);
    try {
      const { data } = await backend<{ message?: string }>("/api/auth/email/resend-verification", {
        method: "POST",
        body: { email: resendEmail.trim() },
      });
      showToast({ title: "Check your inbox", description: data?.message ?? "If an unverified account exists, a new verification link will be sent." });
    } catch (failure) {
      if (failure instanceof ApiError && Object.keys(failure.fields).length > 0) {
        showToast({ variant: "error", title: "Enter a valid email address", description: Object.values(failure.fields).flat().join(" ") });
      } else {
        showToast({ variant: "error", title: "Could not resend the link", description: failure instanceof Error ? failure.message : "Please try again shortly." });
      }
    } finally {
      setIsResending(false);
    }
  }

  const loginHref = next ? "/login?next=checkout" : "/login";
  const heading = status === "verified" ? "Email verified" : status === "verifying" ? "Verifying your email" : status === "failed" ? "This link could not be verified" : "Check your email";

  return (
    <section className="space-y-6">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eee9f8] text-violet-900"><MailCheck size={21} /></div>
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">{heading}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          {status === "verified" ? "Your email address is confirmed. You can now sign in to your SHOP.CO account." : status === "verifying" ? "Please wait while we confirm your email address." : status === "failed" ? "The link may have expired or already been used. Request a fresh verification email below." : <>We sent a verification link{email ? <> to <strong className="break-all text-zinc-950">{email}</strong></> : " to your email address"}. Open it to activate your account.</>}
        </p>
      </div>

      {status === "verified" ? (
        <Link href={loginHref} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Continue to sign in <ArrowRight size={16} /></Link>
      ) : status !== "verifying" ? (
        <>
          <form onSubmit={resend} className="space-y-3">
            <label className="block space-y-2 text-sm font-medium text-zinc-950">Email address<input className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 outline-none focus:border-violet-700 focus:ring-2 focus:ring-violet-700/15" name="email" type="email" autoComplete="email" value={resendEmail} onChange={(event) => setResendEmail(event.target.value)} required /></label>
            <button disabled={isResending} className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60">{isResending ? "Sending…" : "Resend verification email"}<RefreshCw size={16} /></button>
          </form>
          <p className="border-t border-zinc-200 pt-5 text-center text-sm text-zinc-600">Already verified? <Link href={loginHref} className="font-semibold text-violet-900 underline-offset-4 hover:underline">Sign in</Link></p>
        </>
      ) : null}
    </section>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<p className="text-sm text-zinc-600" role="status">Loading email verification…</p>}><VerifyEmailContent /></Suspense>;
}
