"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, BarChart3, Box, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Menu, Package, Settings, X } from "lucide-react";
import { apiOperations, navigation, sections } from "@/lib/admin-workspace";
import { ApiError, human, staffRequest, type Staff } from "@/lib/staff-api";

const StaffContext = createContext<Staff | null>(null);
export const useStaff = () => useContext(StaffContext);
const StaffProfileUpdate = createContext<(profile: Staff) => void>(() => {});
export const useStaffProfileUpdate = () => useContext(StaffProfileUpdate);
export const permitted = (staff: Staff | null, operation: string) => {
  const declaration = apiOperations[operation];
  return Boolean(staff && declaration && (!declaration.permission || staff.permissions.includes(declaration.permission)));
};

const navIcons = { orders: ClipboardList, products: Package, inventory: Box, sales: BarChart3, settings: Settings };

export function AdminShell({ brand, children }: { brand: string; children: React.ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    staffRequest<Staff>("/me", { signal: controller.signal }).then(({ data }) => setStaff(data)).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) router.replace("/login");
      else setError(failure instanceof Error ? failure.message : "The staff profile could not be loaded.");
    });
    return () => controller.abort();
  }, [request, router]);

  if (!staff) return <main className="grid min-h-screen place-items-center bg-[#f7f7fb] p-6 text-slate-900">
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" role={error ? "alert" : "status"}>{error || "Opening your workspace…"}{error && <button className="ml-3 font-semibold text-violet-700" onClick={() => { setError(""); setRequest((value) => value + 1); }}>Retry</button>}</div>
  </main>;

  async function signOut() {
    try { await staffRequest("/auth/logout", { method: "POST" }); }
    finally { router.replace("/login"); }
  }

  return (
    <StaffContext.Provider value={staff}><StaffProfileUpdate.Provider value={setStaff}>
      <div className="min-h-screen bg-[#f7f7fb] text-[#201a34]">
        {open && <button onClick={() => setOpen(false)} aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#ebe8f2] bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-[76px] items-center gap-3 border-b border-[#f0edf5] px-5">
            <Link href="/admin" onClick={() => setOpen(false)} className="flex flex-1 items-center gap-3">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#201a34] text-xl font-bold text-white shadow-sm">{brand.charAt(0)}</span>
              <span className="min-w-0"><span className="block truncate text-lg font-bold leading-tight tracking-tight">{brand}</span><span className="block text-xs text-slate-600">Admin panel</span></span>
            </Link>
            <button aria-label="Close navigation" className="lg:hidden" onClick={() => setOpen(false)}><X size={20} /></button>
          </div>
          <nav aria-label="Staff navigation" className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
            <Nav href="/admin" title="Overview" current={pathname === "/admin"} Icon={LayoutDashboard} close={() => setOpen(false)} />
            {navigation.map((group) => {
              const visible = group.items.filter(([key]) => permitted(staff, sections[key].list));
              if (!visible.length) return null;
              return <div key={group.title}>
                <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-[.13em] text-[#777087]">{group.title}</p>
                <div className="space-y-0.5">{visible.map(([key,title]) => <Nav key={key} href={`/admin/${key}`} title={title} current={pathname === `/admin/${key}` || pathname.startsWith(`/admin/${key}/`)} Icon={navIcons[key as keyof typeof navIcons]} close={() => setOpen(false)} />)}</div>
              </div>;
            })}
          </nav>
          <Link href="/" className="flex items-center justify-between border-t border-[#f0edf5] px-6 py-4 text-sm font-medium text-violet-700"><span className="flex items-center gap-2"><ArrowLeft size={15}/> Storefront</span><ArrowUpRight size={15}/></Link>
        </aside>
        <div className="min-w-0 lg:pl-64">
          <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-4 border-b border-[#ebe8f2] bg-white/95 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button aria-label="Open navigation" className="rounded-lg p-2 hover:bg-violet-50 lg:hidden" onClick={() => setOpen(true)}><Menu size={22} /></button>
              <p className="text-sm font-semibold text-[#574b72]">{pathname === "/admin" ? "Overview" : sections[pathname.split("/")[2]]?.title || "Staff workspace"}</p>
            </div>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-violet-50">
                <span className="grid size-9 place-items-center rounded-full bg-[#eae1ff] text-sm font-bold text-[#5e3bc4]">{staff.name.slice(0,2).toUpperCase()}</span>
                <span className="hidden text-left sm:block"><span className="block text-sm font-semibold">{staff.name}</span><span className="block text-xs text-slate-600">{staff.roles.map(human).join(" · ")}</span></span>
                <ChevronDown size={15} />
              </summary>
              <div className="absolute right-0 mt-2 min-w-42 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <Link href="/admin/settings" className="block rounded-lg px-3 py-2 text-sm hover:bg-violet-50">My account</Link>
                <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"><LogOut size={15}/> Sign out</button>
              </div>
            </details>
          </header>
          <main className="mx-auto min-w-0 max-w-[1680px] px-4 py-7 md:px-8 md:py-9">{children}</main>
        </div>
      </div>
    </StaffProfileUpdate.Provider></StaffContext.Provider>
  );
}

function Nav({ href, title, current, Icon, close }: {href:string;title:string;current:boolean;Icon?:typeof Menu;close:()=>void}) {
  return <Link href={href} aria-current={current ? "page" : undefined} onClick={close}
    className={`flex min-h-9 items-center gap-2.5 rounded-lg px-3 text-sm ${current ? "bg-[#eee8ff] font-semibold text-[#5733b8]" : "font-medium text-[#625971] hover:bg-[#f6f2ff]"}`}>
    {Icon ? <Icon size={16} /> : <span aria-hidden className="mx-1.5 size-1.5 rounded-full bg-current opacity-50" />}{title}
  </Link>;
}
