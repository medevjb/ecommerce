import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

const brand = process.env.ADMIN_BRAND_NAME?.trim() || "SHOP.CO";

export const metadata: Metadata = {
  title: `${brand} Admin`,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f7f7fb] text-sm" role="status">Opening your workspace…</main>}><AdminShell brand={brand}>{children}</AdminShell></Suspense>;
}
