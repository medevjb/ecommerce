"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { staffRequest, type Staff } from "@/lib/staff-api";
import { useAuth } from "@/context/auth-context";

type LoginResult = {
  dashboard?: "staff" | "customer";
  access_token?: string;
  challenge_token?: string;
  user?: Staff;
};

const input = "w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-2 focus:outline-violet-600";

export default function LoginPage() {
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
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
        router.replace("/account");
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><LockKeyhole size={20} /></div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{challenge ? "Verify your sign-in" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-zinc-500">{challenge ? "Enter your authenticator code or a recovery code." : "Sign in to your account or staff workspace."}</p>
      </div>
      <form key={challenge ? "challenge" : "credentials"} onSubmit={submit} className="space-y-4">
        {challenge ? <label className="block space-y-2 text-sm font-medium">Verification code<input className={input} autoComplete="one-time-code" autoFocus name="code" required /></label> : <>
          <label className="block space-y-2 text-sm font-medium">Email<input className={input} autoComplete="username" name="email" type="email" required /></label>
          <label className="block space-y-2 text-sm font-medium">Password<input className={input} autoComplete="current-password" name="password" type="password" required /></label>
        </>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{busy ? "Signing in…" : challenge ? "Verify code" : "Sign in"}<ArrowRight size={16} /></button>
      </form>
      {challenge ? <button className="text-sm text-violet-700 underline" onClick={() => { setChallenge(""); setError(""); }}>Use another account</button> : <div className="flex justify-between text-sm text-violet-700"><Link href="/forgot-password">Forgot password?</Link><Link href="/register">Create an account</Link></div>}
    </section>
  );
}
