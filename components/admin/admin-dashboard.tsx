"use client";

import { Preloader } from "@/components/shared/preloader";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, CircleDollarSign, ClipboardList, PackageOpen, Users } from "lucide-react";
import { money, human, staffRequest } from "@/lib/staff-api";
import { navigation, sections } from "@/lib/admin-workspace";
import { permitted, useStaff } from "./admin-shell";

type SalesDay = { date: string; orders: number; net_revenue_amount: number };
type RecentOrder = { id: string; number: string; status: string; total_amount: number; created_at: string };
type Dashboard = { today: SalesDay; customer_count: number; low_stock_count: number; sales_series: SalesDay[]; recent_orders: RecentOrder[]; timezone: string };

export default function AdminDashboard() {
  const staff = useStaff();
  const allowed = permitted(staff, "getDashboard");
  const [stats, setStats] = useState<Dashboard>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    staffRequest<Dashboard>("/dashboard", { signal: controller.signal }).then(({data}) => setStats(data)).catch((failure) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load dashboard.");
    });
    return () => controller.abort();
  }, [allowed, attempt]);

  const high = Math.max(1, ...(stats?.sales_series ?? []).map((day) => Math.abs(day.net_revenue_amount)));
  return <div className="space-y-7">
    <section className="relative overflow-hidden rounded-[26px] bg-[#282044] px-6 py-8 text-white shadow-lg shadow-violet-950/10 md:px-9 md:py-10">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-40 size-96 rounded-full border-[58px] border-[#7450dc]/30" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-20 size-72 rounded-full border-[42px] border-[#a889ff]/20" />
      <div className="relative flex flex-wrap items-end justify-between gap-4"><div>
        <p className="mb-2 text-sm font-medium text-[#d3c4ff]">Store overview</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Welcome back, {staff?.name.split(" ")[0]}</h1>
      </div>{stats && <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-sm"><CalendarDays size={15} /> {stats.today.date} · {stats.timezone}</span>}</div>
    </section>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error} <button className="ml-2 underline" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Retry</button></div>}
    {allowed && !stats && !error && <Preloader label="Loading store metrics" compact />}
    {stats && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Net revenue today", money(stats.today.net_revenue_amount), CircleDollarSign, "bg-violet-100 text-violet-700"],
          ["Orders today", stats.today.orders, ClipboardList, "bg-sky-100 text-sky-700"],
          ["Customer accounts", stats.customer_count, Users, "bg-emerald-100 text-emerald-700"],
          ["Low-stock variants", stats.low_stock_count, PackageOpen, "bg-amber-100 text-amber-800"],
        ].map(([label, value, Icon, color]) => {
          const Metric = Icon as typeof CircleDollarSign;
          return <article key={String(label)} className="rounded-2xl border border-[#ebe8f2] bg-white p-5 shadow-sm shadow-violet-950/5">
            <div className={`grid size-10 place-items-center rounded-xl ${color}`}><Metric size={19} /></div>
            <p className="mt-4 text-sm font-medium text-[#625971]">{String(label)}</p><p className="mt-1 text-2xl font-bold tabular-nums">{String(value)}</p>
          </article>;
        })}
      </div>
      <section className="rounded-2xl border border-[#ebe8f2] bg-white p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Net revenue</h2><p className="text-sm text-slate-600">Last 30 days · captures minus refunds</p></div><Link href="/admin/sales" className="flex items-center gap-1.5 text-sm font-semibold text-violet-700">Sales reports <ArrowUpRight size={15} /></Link></div>
        <div className="mt-5 flex h-40 items-center gap-[3px] border-b border-slate-100 md:gap-2" aria-label="Daily net revenue">
          {stats.sales_series.map(({date,net_revenue_amount: amount}) => <div key={date} tabIndex={0} aria-label={`${date}: ${money(amount)}`} title={`${date}: ${money(amount)}`} className="relative h-full flex-1 outline-violet-600 hover:bg-violet-50 focus:bg-violet-50">
            <span className={`absolute inset-x-0 rounded-sm ${amount < 0 ? "top-1/2 bg-rose-400" : "bottom-1/2 bg-[#9c78f1]"}`} style={{height:`max(2px, ${Math.abs(amount)/high*48}%)`}} />
          </div>)}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-600"><span>{stats.sales_series[0]?.date}</span><span>{stats.today.date}</span></div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#ebe8f2] bg-white">
        <div className="flex justify-between p-5 md:px-7"><h2 className="text-lg font-semibold">Recent orders</h2>{permitted(staff,"listAdminOrders") && <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm font-semibold text-violet-700">All orders <ArrowUpRight size={15} /></Link>}</div>
        {stats.recent_orders.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#f8f6fd] text-slate-600"><tr>{["Order","Status","Placed","Total"].map((label) => <th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{stats.recent_orders.map((order) => <tr key={order.id} className="border-t border-[#f0edf5]"><td className="whitespace-nowrap px-5 py-3 font-semibold">{order.number}</td><td className="px-5 py-3"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-800">{human(order.status)}</span></td><td className="whitespace-nowrap px-5 py-3 text-slate-600">{order.created_at.slice(0,10)}</td><td className="px-5 py-3 tabular-nums">{money(order.total_amount)}</td></tr>)}</tbody></table></div> : <p className="px-5 pb-5 text-sm text-slate-600">No orders yet.</p>}
      </section>
    </>}
    {!allowed && <section className="space-y-4"><h2 className="text-xl font-semibold">Your workspace</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{navigation.flatMap(({items}) => items).filter(([key]) => permitted(staff, sections[key].list)).map(([key,title]) => <Link key={key} href={`/admin/${key}`} className="flex min-h-20 items-center justify-between rounded-2xl border border-[#ebe8f2] bg-white p-5 font-semibold hover:border-violet-400">{title}<ArrowUpRight size={17} className="text-violet-700" /></Link>)}</div></section>}
  </div>;
}
