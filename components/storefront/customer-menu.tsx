"use client";

import { ChevronDown, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";

const links = [
  ["/account", "Account overview"], ["/account/orders", "Orders"], ["/account/addresses", "Saved addresses"],
  ["/account/profile", "Profile and security"], ["/wishlist", "Wishlist"],
];

export function CustomerMenu() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const menu = disclosure.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  async function signOut() {
    setPending(true);
    setError("");
    try {
      await logout();
      router.replace("/");
    } catch {
      setError("Could not sign out. Try again.");
    } finally {
      setPending(false);
    }
  }

  const trigger = "flex min-h-10 min-w-10 cursor-pointer items-center justify-center gap-1 rounded-full hover:bg-zinc-100";
  if (isLoading) return <span className="size-10" aria-hidden="true" />;
  if (!user) return <Link href="/login" aria-label="Sign in" className={trigger}><UserRound className="size-6" /></Link>;

  return (
    <details key={pathname} ref={disclosure} className="relative" onKeyDown={(event) => {
      if (event.key === "Escape" && event.currentTarget.open) {
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }
    }}>
      <summary aria-label="Customer profile" className={trigger + " list-none px-2 [&::-webkit-details-marker]:hidden"}>
        <UserRound aria-hidden="true" className="size-6" />
        <ChevronDown aria-hidden="true" className="size-3.5" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
        <div className="border-b border-zinc-100 px-3 py-2">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-xs text-zinc-600">{user.email}</p>
        </div>
        <nav aria-label="Profile shortcuts" className="py-1">
          {links.map(([href, label]) => <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => { if (disclosure.current) disclosure.current.open = false; }}>{label}</Link>)}
        </nav>
        <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-zinc-100 disabled:opacity-50" disabled={pending} onClick={signOut}>Sign out</button>
        {error && <p role="alert" className="px-3 text-sm text-red-800">{error}</p>}
      </div>
    </details>
  );
}
