"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { backend } from "@/lib/staff-api";
import { Input, Button } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [error,setError] = useState("");
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsLoading(true); setError("");
    try {
      await backend("/auth/register", {method:"POST",body:{
        name:[form.get("first_name"),form.get("last_name")].join(" ").trim(),
        email:form.get("email"),password:form.get("password"),password_confirmation:form.get("password_confirmation"),
      }});
      router.replace("/login");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not register.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Create Account
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Join for fast checkout and exclusive promotions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input name="first_name" label="First Name" placeholder="Jane" required />
          <Input name="last_name" label="Last Name" placeholder="Doe" required />
        </div>
        <Input name="email" label="Email Address" type="email" placeholder="jane@example.com" required />
        <Input name="password" label="Password" type="password" placeholder="••••••••" required />

        <Input label="Confirm password" name="password_confirmation" type="password" required />
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <Button type="submit" isLoading={isLoading} className="w-full py-3">
          Register
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-zinc-900 dark:text-white hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
