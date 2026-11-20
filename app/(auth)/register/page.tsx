"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, UserRound } from "lucide-react";
import { ApiError, backend } from "@/lib/staff-api";
import { customerReturnQuery } from "@/lib/customer-return";
import { useToast } from "@/context/toast-context";

const input = "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-500 outline-none transition focus:border-violet-700 focus:ring-2 focus:ring-violet-700/15";

export default function RegisterPage() {
  return <Suspense fallback={<p role="status">Loading registration…</p>}><RegisterForm /></Suspense>;
}

function RegisterForm() {
  const returnQuery = customerReturnQuery(useSearchParams());
  const returnParams = new URLSearchParams(returnQuery);
  const loginHref = returnParams.size ? "/login?" + returnParams.toString() : "/login";
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("password_confirmation") ?? "");
    if (password !== confirmation) {
      showToast({ variant: "error", title: "Passwords do not match", description: "Enter the same password in both fields, then try again." });
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await backend<{ verification_token: string }>("/api/auth/register", { method: "POST", body: {
        name: [form.get("first_name"), form.get("last_name")].join(" ").trim(),
        email: form.get("email"), password, password_confirmation: confirmation,
      } });
      if (!data?.verification_token) {
        throw new Error("Your account was created, but the verification session was missing. Please sign in to request a new code.");
      }
      sessionStorage.setItem("email_verification_token", data.verification_token);
      const verificationParams = new URLSearchParams({ ...returnQuery, email: String(form.get("email") ?? "") });
      verificationParams.set("flow", "account");
      window.location.assign(new URL(`/verify-email?${verificationParams.toString()}`, window.location.origin));
    } catch (failure) {
      if (failure instanceof ApiError && Object.keys(failure.fields).length > 0) {
        const details = Object.entries(failure.fields).flatMap(([field, messages]) => messages.map((message) => {
          const readableMessage = message.replace(/^The \w+ field /i, "");
          return `${field === "password_confirmation" ? "Confirm password" : field.charAt(0).toUpperCase() + field.slice(1)}: ${readableMessage.charAt(0).toUpperCase()}${readableMessage.slice(1)}`;
        }));
        showToast({ variant: "error", title: "Please check your details", description: "Update the following and try creating your account again.", details });
      } else {
        showToast({ variant: "error", title: "Could not create your account", description: failure instanceof Error ? failure.message : "Please try again shortly." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eee9f8] text-violet-900"><UserRound size={20} /></div>
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">A smoother checkout and order updates are just a few details away.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium text-zinc-950">First name<input className={input} name="first_name" autoComplete="given-name" placeholder="Jane" required /></label>
          <label className="block space-y-2 text-sm font-medium text-zinc-950">Last name<input className={input} name="last_name" autoComplete="family-name" placeholder="Doe" required /></label>
        </div>
        <label className="block space-y-2 text-sm font-medium text-zinc-950">Email address<input className={input} name="email" type="email" autoComplete="email" placeholder="jane@example.com" required /></label>
        <div className="space-y-2">
          <label htmlFor="register-password" className="block text-sm font-medium text-zinc-950">Password</label>
          <div className="relative"><input id="register-password" className={input+" pr-12"} name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-1 grid w-11 place-items-center rounded-lg text-zinc-700 hover:text-black focus-visible:outline-2 focus-visible:outline-violet-700" onClick={()=>setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          <p className="text-xs leading-relaxed text-zinc-600">Choose a password you do not use for another account.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="register-password-confirmation" className="block text-sm font-medium text-zinc-950">Confirm password</label>
          <div className="relative"><input id="register-password-confirmation" className={input+" pr-12"} name="password_confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" placeholder="Enter your password again" required /><button type="button" aria-label={showConfirmation ? "Hide confirmation" : "Show confirmation"} className="absolute inset-y-0 right-1 grid w-11 place-items-center rounded-lg text-zinc-700 hover:text-black focus-visible:outline-2 focus-visible:outline-violet-700" onClick={()=>setShowConfirmation(!showConfirmation)}>{showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        </div>
        <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? "Creating your account…" : "Create account"}<ArrowRight size={16} /></button>
      </form>
      <p className="border-t border-zinc-200 pt-5 text-center text-sm text-zinc-600">Already have an account? <Link href={loginHref} className="font-semibold text-violet-900 underline-offset-4 hover:underline">Sign in</Link></p>
    </section>
  );
}
