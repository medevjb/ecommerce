"use client";

import { Bell, Search, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      {/* Search Input for Admin */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search orders, products, sku..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-xs text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600" />
        </button>

        <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.name || "Store Administrator"}
            </p>
            <p className="text-[10px] text-zinc-500 capitalize">
              {user?.role || "Super Admin"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
