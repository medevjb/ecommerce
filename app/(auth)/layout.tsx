import { Suspense } from "react";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StoreHeader, StoreFooter } from "@/components/storefront/store-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-white text-zinc-950">
    <Suspense fallback={<StorefrontHeader />}><StoreHeader /></Suspense>
    <main className="flex flex-1 flex-col bg-[#f7f6f8] px-5 sm:px-8">
      <div className="mx-auto flex w-full max-w-md flex-1 items-center py-8 sm:py-12">
        <div className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-9">{children}</div>
      </div>
    </main>
    <Suspense fallback={<StorefrontFooter />}><StoreFooter /></Suspense>
  </div>;
}
