"use client";

import { Suspense, useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, MailCheck, RefreshCw } from "lucide-react";
import { customerReturnPath } from "@/lib/customer-return";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { ApiError, backend } from "@/lib/staff-api";

type VerifyResult = {
  access_token?: string;
  user?: { id: string; email: string; name: string; roles: string[] };
};
type ResetCodeResult = { email: string; reset_token: string };
const subscribeToSessionStorage = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};
const getVerificationToken = () => sessionStorage.getItem("email_verification_token") ?? "";

function VerifyEmailContent() {
  const params = useSearchParams();
  const emailFromQuery = params.get("email") ?? "";
  const flow = params.get("flow") === "password_reset" ? "password_reset" : "account";
  const legacyId = params.get("id");
  const legacyHash = params.get("hash");
  const legacyExpires = params.get("expires");
  const legacySignature = params.get("signature");
  const [checkingLink, setCheckingLink] = useState(Boolean(legacyId && legacyHash && legacyExpires && legacySignature));
  const verificationToken = useSyncExternalStore(subscribeToSessionStorage, getVerificationToken, () => "");
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();
  const { acceptSession } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!legacyId || !legacyHash || !legacyExpires || !legacySignature) return;
    const controller = new AbortController();
    const signedQuery = new URLSearchParams({ id: legacyId, hash: legacyHash, expires: legacyExpires, signature: legacySignature });
    backend("/api/auth/email/verify?" + signedQuery.toString(), { signal: controller.signal })
      .then(() => { if (!controller.signal.aborted) setIsVerified(true); })
      .catch(() => { if (!controller.signal.aborted) showToast({ variant: "error", title: "This verification link could not be used", description: "Request a new code below." }); })
      .finally(() => { if (!controller.signal.aborted) setCheckingLink(false); });
    return () => controller.abort();
  }, [legacyId, legacyHash, legacyExpires, legacySignature, showToast]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verificationToken) {
      showToast({ variant: "error", title: "Verification session expired", description: "Start again from sign in or password recovery to get a new code." });
      return;
    }

    setIsVerifying(true);
    try {
      if (flow === "password_reset") {
        const { data } = await backend<ResetCodeResult>("/api/auth/forgot-password/verify-code", {
          method: "POST",
          body: { verification_token: verificationToken, code },
        });
        sessionStorage.removeItem("email_verification_token");
        sessionStorage.setItem("customer_password_reset_token", data.reset_token);
        const resetParams = new URLSearchParams({ audience: "customer", email: data.email });
        router.replace(`/reset-password?${resetParams.toString()}`);
        return;
      }

      const { data } = await backend<VerifyResult>("/api/auth/email/verify-code", {
        method: "POST",
        body: { verification_token: verificationToken, code },
      });
      if (!data.access_token || !data.user) throw new Error("Your account was verified, but the sign-in session could not be started.");
      sessionStorage.removeItem("email_verification_token");
      localStorage.setItem("auth_token", data.access_token);
      acceptSession({ ...data.user, role: "customer" });
      showToast({ title: "Email verified", description: "You are signed in and your account is ready." });
      router.replace(customerReturnPath(params));
    } catch (failure) {
      if (failure instanceof ApiError && Object.keys(failure.fields).length > 0) {
        showToast({ variant: "error", title: "We could not verify that code", description: Object.values(failure.fields).flat().join(" ") });
      } else {
        showToast({ variant: "error", title: "We could not verify that code", description: failure instanceof Error ? failure.message : "Check the code and try again." });
      }
    } finally {
      setIsVerifying(false);
    }
  }

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verificationToken) {
      showToast({ variant: "error", title: "Verification session expired", description: "Start again to request a new code." });
      return;
    }
    setIsResending(true);
    try {
      const { data } = await backend<{ message?: string }>("/api/auth/email/resend-verification", {
        method: "POST",
        body: { verification_token: verificationToken },
      });
      setCode("");
      showToast({ title: "Check your inbox", description: data?.message ?? "If this request is still active, a new code will be sent." });
    } catch (failure) {
      showToast({ variant: "error", title: "Could not resend the code", description: failure instanceof Error ? failure.message : "Please try again shortly." });
    } finally {
      setIsResending(false);
    }
  }

  const recoveryHref = "/forgot-password";

  if (checkingLink) return <p role="status">Verifying your email address…</p>;

  return (
    <section className="space-y-6">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eee9f8] text-violet-900"><MailCheck size={21} /></div>
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">{flow === "password_reset" ? "Verify your password reset" : isVerified ? "Email verified" : "Enter your verification code"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          {flow === "password_reset" ? <>We sent a six-digit password reset code{email ? <> to <strong className="break-all text-zinc-950">{email}</strong></> : " to your email address"}. It expires in 10 minutes.</> : isVerified ? "Your email address is confirmed. You can now sign in." : <>We sent a six-digit code{email ? <> to <strong className="break-all text-zinc-950">{email}</strong></> : " to your email address"}. Enter it below to verify your account and sign in.</>}
        </p>
      </div>

      {isVerified ? (
        <Link href="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Continue to sign in <ArrowRight size={16} /></Link>
      ) : (
        <>
          <form onSubmit={verify} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium text-zinc-950">Email address<input className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 outline-none focus:border-violet-700 focus:ring-2 focus:ring-violet-700/15" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label className="block space-y-2 text-sm font-medium text-zinc-950">Six-digit code<input className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-center font-mono text-xl tracking-[0.45em] text-zinc-950 outline-none focus:border-violet-700 focus:ring-2 focus:ring-violet-700/15" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
            <button type="submit" disabled={isVerifying || code.length !== 6 || !verificationToken} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60">{isVerifying ? "Verifying…" : flow === "password_reset" ? "Continue to reset password" : "Verify and sign in"}<ArrowRight size={16} /></button>
          </form>
          <form onSubmit={resend} className="space-y-3 border-t border-zinc-200 pt-5">
            <p className="text-sm text-zinc-600">Didn&apos;t receive a code? Check your spam folder or request a new one.</p>
            <button disabled={isResending || !verificationToken} className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60">{isResending ? "Sending…" : "Resend code"}<RefreshCw size={16} /></button>
          </form>
          {!verificationToken && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This verification session expired. <Link className="font-semibold underline" href={flow === "password_reset" ? recoveryHref : "/login"}>Start again</Link> to request a new code.</p>}
        </>
      )}
    </section>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<p className="text-sm text-zinc-600" role="status">Loading verification form…</p>}><VerifyEmailContent /></Suspense>;
}
