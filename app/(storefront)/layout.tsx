import { Suspense } from "react";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StoreHeader, StoreFooter } from "@/components/storefront/store-shell";

export default function StorefrontLayout({children}:{children:React.ReactNode}) {
  return <div className="flex min-h-screen flex-col bg-white text-black">
    <Suspense fallback={<StorefrontHeader />}><StoreHeader /></Suspense>
    <main className="flex-1">{children}</main>
    <Suspense fallback={<StorefrontFooter />}><StoreFooter /></Suspense>
  </div>;
}
