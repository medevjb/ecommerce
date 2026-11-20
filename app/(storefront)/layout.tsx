import type { Metadata } from "next";
import { Suspense } from "react";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { fetchStoreSettings, StoreHeader, StoreFooter, StoreMedia } from "@/components/storefront/store-shell";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchStoreSettings();
  return {
    title: settings.seo_title || settings.name || "SHOP.CO",
    description: settings.seo_description || "Browse the SHOP.CO storefront.",
  };
}

export default function StorefrontLayout({children}:{children:React.ReactNode}) {
  return <div className="flex min-h-screen flex-col bg-white text-black">
    <Suspense fallback={<StorefrontHeader />}><StoreHeader /></Suspense>
    <main className="flex-1"><Suspense fallback={<p className="p-6" role="status">Loading storefront…</p>}><StoreMedia>{children}</StoreMedia></Suspense></main>
    <Suspense fallback={<StorefrontFooter />}><StoreFooter /></Suspense>
  </div>;
}
