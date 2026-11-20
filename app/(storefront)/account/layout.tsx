import React from "react";
import { CustomerGuard } from "@/components/customer/customer-account";
import { AccountSidebar } from "@/components/customer";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerGuard><div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="font-black text-3xl sm:text-4xl tracking-tighter text-black uppercase font-sans">
          Customer Account
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your personal details, order history, and saved addresses
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <AccountSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div></CustomerGuard>
  );
}
