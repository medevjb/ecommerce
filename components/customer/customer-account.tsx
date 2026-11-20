"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import { backend, human, money } from "@/lib/staff-api";

export const customer = <T,>(path:string, options?: Parameters<typeof backend<T>>[1]) => backend<T>("/api/commerce"+path,{ ...options, token:typeof window === "undefined" ? null : localStorage.getItem("auth_token") });
const box="rounded-2xl border border-zinc-200 bg-white p-5";
const field="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm";
const action="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const message=(error:unknown)=>error instanceof Error ? error.message : "The request failed.";

export function CustomerGuard({children}:{children:ReactNode}) {
  const {user,isLoading}=useAuth();
  const router=useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(pathname === "/checkout" ? "/login?next=checkout" : "/login");
    }
  }, [user, isLoading, pathname, router]);
  return user&&!isLoading ? children : <p role="status" className="p-6">Opening your account…</p>;
}

export function CustomerHome() {
  const {user}=useAuth();
  return <div className="space-y-5"><section className="rounded-2xl bg-black p-6 text-white"><h2 className="text-xl font-semibold">Welcome back, {user?.name}</h2></section>
    <div className="grid gap-4 sm:grid-cols-3">{[["orders","Orders"],["addresses","Saved addresses"],["profile","Profile and security"]].map(([slug,label])=><Link key={slug} href={`/account/${slug}`} className={box+" font-semibold hover:border-zinc-500"}>{label}</Link>)}</div></div>;
}

export function CustomerProfile() {
  const {user,acceptSession,logout}=useAuth();
  const [status,setStatus]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const router=useRouter();
  async function submit(event:FormEvent<HTMLFormElement>, password=false) {
    event.preventDefault(); setBusy(true);setStatus("");setError("");
    try {
      const body=Object.fromEntries(new FormData(event.currentTarget));
      if(password) {
        await customer("/auth/change-password",{method:"POST",body});
        await logout();
        router.replace("/login");
      } else {
        const {data}=await customer<NonNullable<typeof user>>("/me",{method:"PATCH",body});
        acceptSession({...data,role:"customer"});setStatus("Profile saved.");
      }
    } catch(failure){setError(message(failure));} finally{setBusy(false);}
  }
  return <div className="space-y-5"><h2 className="text-2xl font-bold">Profile and security</h2>
    {status&&<p role="status" className="text-emerald-800">{status}</p>}{error&&<p role="alert" className="text-red-800">{error}</p>}
    <form className={box+" max-w-xl space-y-3"} onSubmit={submit}>
      <label className="block text-sm font-medium">Name<input className={field} name="name" defaultValue={user?.name} required /></label>
      <p className="text-sm text-zinc-600">Sign-in email <strong>{user?.email}</strong></p>
      <button disabled={busy} className={action}>Save profile</button>
    </form>
    <form className={box+" max-w-xl space-y-3"} onSubmit={(event)=>submit(event,true)}>
      <h3 className="font-semibold">Change password</h3>
      {[["current_password","Current password"],["password","New password"],["password_confirmation","Confirm password"]].map(([name,label])=><label className="block text-sm" key={name}>{label}<input type="password" required name={name} className={field}/></label>)}
      <button disabled={busy} className={action}>Change password</button>
    </form>
  </div>;
}

export type Address = {id:string;recipient:string;line1:string;line2?:string;city:string;region?:string;postal_code:string;country:string;phone?:string;is_default:boolean};
const addressFields=[["recipient","Recipient",true],["line1","Street address",true],["line2","Apartment or suite",false],["city","City",true],["region","State or region",false],["postal_code","Postal code",true],["country","Country code (two letters)",true],["phone","Phone",false]] as const;

export function CustomerAddresses() {
  const [addresses,setAddresses]=useState<Address[]>();
  const [edit,setEdit]=useState<Address | "new">();
  const [error,setError]=useState("");
  const [pending,setPending]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    customer<Address[]>("/me/addresses",{signal:controller.signal}).then(({data})=>setAddresses(data)).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return ()=>controller.abort();
  },[]);
  async function modify(method:"POST"|"PATCH"|"DELETE",id?:string, event?:FormEvent<HTMLFormElement>) {
    event?.preventDefault();setPending(true);setError("");
    try {
      const form=event?new FormData(event.currentTarget):null;
      const body=form?{...Object.fromEntries(addressFields.map(([key])=>[key,String(form.get(key)??"").trim()||null])),country:String(form.get("country")).toUpperCase(),is_default:form.has("is_default")}:undefined;
      await customer("/me/addresses"+(id?"/"+id:""),{method,body});
      setAddresses((await customer<Address[]>("/me/addresses")).data);setEdit(undefined);
    } catch(failure){setError(message(failure));} finally{setPending(false);}
  }
  return <div className="space-y-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-bold">Saved addresses</h2><button className={action} onClick={()=>setEdit("new")}>Add address</button></div>
    {error&&<p role="alert" className="text-red-800">{error}</p>}
    {edit&&<form key={edit==="new"?"new":edit.id} className={box+" grid gap-3 sm:grid-cols-2"} onSubmit={(event)=>modify(edit==="new"?"POST":"PATCH",edit==="new"?undefined:edit.id,event)}>
      {addressFields.map(([key,label,required])=><label key={key} className="block text-sm">{label}<input className={field} name={key} required={required} maxLength={key==="country"?2:undefined} defaultValue={edit==="new"?key==="country"?"US":"":edit[key]??""}/></label>)}
      <label className="text-sm"><input type="checkbox" name="is_default" defaultChecked={edit!=="new"&&edit.is_default}/> Default address</label>
      <div className="flex gap-3"><button className={action} disabled={pending}>Save address</button><button type="button" onClick={()=>setEdit(undefined)}>Cancel</button></div>
    </form>}
    {!addresses&&!error&&<p role="status">Loading addresses…</p>}
    {addresses?.length===0&&<p>No saved addresses yet.</p>}
    {addresses?.map((address)=><article key={address.id} className={box}><h3 className="font-semibold">{address.recipient} {address.is_default&&<span className="text-xs text-zinc-600">Default</span>}</h3><p className="mt-2 text-sm">{[address.line1,address.line2,address.city,address.region,address.postal_code,address.country].filter(Boolean).join(", ")}</p><div className="mt-3 flex gap-4 text-sm"><button onClick={()=>setEdit(address)} className="underline">Edit</button><button disabled={pending} className="text-red-800 underline" onClick={()=>{if(confirm("Remove this saved address?"))void modify("DELETE",address.id);}}>Remove</button></div></article>)}
  </div>;
}

type Order={id:string;number:string;status:string;payment_status:string;total_amount:number;created_at:string;tracking_number?:string;shipping_carrier?:string;items?:{sku:string;product_name:string;quantity:number;line_amount:number}[]};
export function CustomerOrders(){
  const [orders,setOrders]=useState<Order[]>();
  const [detail,setDetail]=useState<Order>();
  const [error,setError]=useState("");
  useEffect(()=>{const controller=new AbortController();customer<Order[]>("/orders",{signal:controller.signal}).then(({data})=>setOrders(data)).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});return()=>controller.abort();},[]);
  async function load(id:string){try{setError("");setDetail((await customer<Order>("/orders/"+id)).data);}catch(failure){setError(message(failure));}}
  return <div className="space-y-4"><h2 className="text-2xl font-bold">Orders and tracking</h2>{error&&<p role="alert" className="text-red-800">{error}</p>}
  {!orders&&!error&&<p role="status">Loading orders…</p>}{orders?.length===0&&<p>You have no orders yet.</p>}
  {orders?.map(order=><article className={box} key={order.id}><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{order.number}</p><p className="text-sm text-zinc-600">{human(order.status)} · {money(order.total_amount)}</p></div><button className="text-sm underline" onClick={()=>detail?.id===order.id?setDetail(undefined):void load(order.id)}>{detail?.id===order.id?"Hide details":"View order"}</button></div>
    {detail?.id===order.id&&<div className="mt-4 border-t pt-3 text-sm"><p>Payment {human(detail.payment_status)}</p>{detail.tracking_number&&<p>{detail.shipping_carrier} {detail.tracking_number}</p>}<ul className="mt-2 space-y-1">{detail.items?.map(item=><li key={item.sku}>{item.product_name} × {item.quantity} · {money(item.line_amount)}</li>)}</ul></div>}
  </article>)}</div>;
}
