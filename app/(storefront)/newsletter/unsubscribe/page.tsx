"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { backend } from "@/lib/staff-api";

export default function UnsubscribePage() {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("token") ?? "").trim();
    const token = code || window.location.hash.slice(1);
    if (!/^[A-Za-z0-9]{64}$/.test(token)) {
      setError("Enter the unsubscribe code from your subscription email.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await backend("/api/commerce/newsletter/unsubscribe", { method: "POST", body: { token } });
      window.history.replaceState(null, "", window.location.pathname);
      setSuccess(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not process your request.");
    } finally {
      setPending(false);
    }
  }

  return <section className="mx-auto max-w-xl space-y-5 px-5 py-12">
    <h1 className="text-3xl font-bold">Unsubscribe from the newsletter</h1>
    {success ? <p role="status">Your unsubscribe request has been received.</p> :
      <form className="space-y-4" onSubmit={submit}>
        <p>Confirm below if you opened this page from your email. You can also paste your unsubscribe code.</p>
        <label className="block text-sm font-medium">Unsubscribe code
          <input name="token" autoComplete="off" maxLength={64} className="mt-2 block w-full rounded-xl border border-black/20 p-3" />
        </label>
        {error && <p role="alert" className="text-red-800">{error}</p>}
        <button disabled={pending} className="rounded-full bg-black px-5 py-3 text-white disabled:opacity-50">{pending ? "Submitting…" : "Unsubscribe"}</button>
      </form>}
    <Link href="/" className="text-sm underline">Back to the store</Link>
  </section>;
}
