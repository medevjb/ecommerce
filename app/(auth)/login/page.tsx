"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { ApiError, staffRequest, type Staff } from "@/lib/staff-api";
import { customerReturnPath, customerReturnQuery } from "@/lib/customer-return";
import { useAuth } from "@/context/auth-context";

type LoginResult = {
  dashboard?: "staff" | "customer";
  email_verification_required?: boolean;
  email?: string;
  verification_token?: string;
  access_token?: string;
  challenge_token?: string;
  user?: Staff;
};

const input = "w-full rounded-xl border border-zinc-400 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-600 focus:outline-2 focus:outline-offset-2 focus:outline-violet-700";

export default function LoginPage() {
  return <Suspense fallback={<p role="status">Loading sign-in…</p>}><LoginForm /></Suspense>;
}

function LoginForm() {
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const router = useRouter();
  const query = useSearchParams();
  const returnQuery = customerReturnQuery(query);
  const returnParams = new URLSearchParams(returnQuery);
  const registerHref = returnParams.size ? "/register?" + returnParams.toString() : "/register";
  const { acceptSession } = useAuth();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const { data } = await staffRequest<LoginResult>(challenge ? "/challenge" : "/login", {
        method: "POST",
        body: challenge
          ? { challenge_token: challenge, code: String(form.get("code")).trim() }
          : { email: form.get("email"), password: form.get("password") },
      });
      if (data.email_verification_required && data.email && data.verification_token) {
        sessionStorage.setItem("email_verification_token", data.verification_token);
        const params = new URLSearchParams({ ...returnQuery, email: data.email });
        params.set("flow", "account");
        window.location.assign(new URL(`/verify-email?${params.toString()}`, window.location.origin));
        return;
      }
      if (data.challenge_token) {
        setChallenge(data.challenge_token);
        return;
      }
      if (!data.user || !data.dashboard) throw new Error("The server did not return a valid session.");
      if (data.dashboard === "staff") {
        router.replace("/admin");
      } else {
        if (!data.access_token) throw new Error("The customer session could not be started.");
        localStorage.setItem("auth_token", data.access_token);
        acceptSession({ ...data.user, role: "customer" });
        router.replace(customerReturnPath(query));
      }
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === "EMAIL_NOT_VERIFIED") {
        setVerificationEmail(String(form.get("email") ?? ""));
        setError("Verify your email address before signing in.");
      } else {
        setVerificationEmail("");
        setError(failure instanceof Error ? failure.message : "Sign-in could not be completed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eee9f8] text-violet-900"><LockKeyhole size={20} /></div>
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">{challenge ? "Verify your sign-in" : "Welcome back"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">{challenge ? "Enter your authenticator code or a recovery code." : "Sign in to your account or staff workspace."}</p>
      </div>
      <form key={challenge ? "challenge" : "credentials"} onSubmit={submit} className="space-y-4">
        {challenge ? <label className="block space-y-2 text-sm font-medium">Verification code<input className={input} autoComplete="one-time-code" autoFocus name="code" required /></label> : <>
          <label className="block space-y-2 text-sm font-medium">Email<input className={input} autoComplete="username" name="email" type="email" required /></label>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-950">Password</label>
            <div className="relative">
              <input id="password" className={input+" pr-12"} autoComplete="current-password" name="password" type={showPassword ? "text" : "password"} required />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-1 grid w-11 place-items-center rounded-lg text-zinc-700 hover:text-black focus-visible:outline-2 focus-visible:outline-violet-700" onClick={()=>setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
        </>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {verificationEmail && <Link href={`/verify-email?${new URLSearchParams({ ...returnQuery, email: verificationEmail }).toString()}`} className="inline-block text-sm font-semibold text-violet-900 underline underline-offset-4">Resend verification email</Link>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60">{busy ? "Signing in…" : challenge ? "Verify code" : "Sign in"}<ArrowRight size={16} /></button>
      </form>
      {challenge ? <button className="text-sm text-violet-700 underline" onClick={() => { setChallenge(""); setError(""); }}>Use another account</button> : <div className="flex flex-wrap justify-between gap-3 text-sm font-semibold text-violet-900"><Link href="/forgot-password" className="underline underline-offset-4">Forgot password?</Link><Link href={registerHref} className="underline underline-offset-4">Create an account</Link></div>}
    </section>
  );
}
