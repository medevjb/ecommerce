"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CustomerGuard, customer, type Address } from "@/components/customer/customer-account";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { ApiError, human, money } from "@/lib/staff-api";

type Card = { mount(target:HTMLElement):void; destroy():void; on(event:"ready", callback:()=>void):void };
type Stripe = { elements():{create(type:"card",options:{hidePostalCode:boolean}):Card}; confirmCardPayment(secret:string,options:{payment_method:{card:Card}}):Promise<{ error?:{message?:string};paymentIntent?:{status:string} }> };
type StripeWindow=Window & { Stripe?:(key:string)=>Stripe };
type Quote={subtotal_amount:number;discount_amount:number;shipping_amount:number;tax_amount:number;total_amount:number|null;can_checkout:boolean;conflicts:{code:string}[]};
type CheckoutAttempt = {address:string;key:string;amount:number;orderId?:string};
type PaymentOrder={id:string;number:string;status:string;payment_status:string;total_amount:number};
const bin="rounded-2xl border border-zinc-200 p-5";
const pay="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-45";
const key=process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function LiveCheckout(){return <CustomerGuard><Checkout /></CustomerGuard>;}
function Checkout(){
  const router=useRouter();
  const {quote: cart, loading: cartLoading}=useCart();
  const {user}=useAuth();
  const attemptStorage = "checkout_attempt:" + user?.id;
  const [attempt,setAttempt]=useState<CheckoutAttempt | undefined>(()=>{
    try { return JSON.parse(sessionStorage.getItem(attemptStorage) ?? "null") ?? undefined; }
    catch { return undefined; }
  });
  const originalAddress=useRef(attempt?.address);
  const [addresses,setAddresses]=useState<Address[]>();
  const [selection,setSelection]=useState("");
  const [preview,setPreview]=useState<{address:string;cart:typeof cart;quote:Quote}>();
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [cardReady,setCardReady]=useState(false);
  const submitting=useRef(false);
  const [error,setError]=useState("");
  const cardNode=useRef<HTMLDivElement>(null);
  const payment=useRef<{client:Stripe;card:Card}>(null);


  useEffect(()=>{
    const controller=new AbortController();
    customer<Address[]>("/me/addresses",{signal:controller.signal}).then(({data})=>{
      setAddresses(data);
      setSelection(data.find((item)=>item.id===originalAddress.current)?.id ?? data.find((item)=>item.is_default)?.id ?? data[0]?.id ?? "");
    }).catch((failure)=>{if(!controller.signal.aborted)setError(failure.message);});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!selection || cartLoading)return;
    const controller=new AbortController();
    customer<Quote>("/checkout/preview",{method:"POST",body:{address_id:selection},signal:controller.signal})
      .then(({data})=>setPreview({address:selection,cart,quote:data}))
      .catch(failure=>{if(!controller.signal.aborted)setError(failure.message);});
    return()=>controller.abort();
  },[selection,cart,cartLoading]);
  useEffect(()=>{
    const initialize=(window as StripeWindow).Stripe;
    if(!ready||!key||!initialize||!cardNode.current)return;
    const client=initialize(key);
    const card=client.elements().create("card",{hidePostalCode:true});
    card.on("ready",()=>setCardReady(true));
    card.mount(cardNode.current);
    payment.current={client,card};
    return()=>{card.destroy();payment.current=null;};
  },[ready]);
  const quote=preview?.address===selection && preview.cart===cart && !cartLoading ? preview.quote : undefined;
  const resumable=attempt?.address===selection ? attempt : undefined;
  const canPay=Boolean(resumable || quote?.can_checkout);
  const amount=resumable?.amount ?? quote?.total_amount;

  function clearAttempt() {
    sessionStorage.removeItem(attemptStorage);
    setAttempt(undefined);
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const stripe = payment.current;
    if(submitting.current || !stripe || !selection || !canPay || amount == null || cartLoading)return;
    submitting.current=true;
    setBusy(true);
    setError("");
    try {
      const current = resumable ?? {address:selection,key:crypto.randomUUID(),amount};
      sessionStorage.setItem(attemptStorage,JSON.stringify(current));
      setAttempt(current);
      const {data}=await customer<{client_secret:string;order_id:string;payment_status:string;total_amount:number}>("/checkout",{method:"POST",idempotency:current.key,body:{address_id:selection}});
      const prepared={...current,orderId:data.order_id,amount:data.total_amount};
      sessionStorage.setItem(attemptStorage,JSON.stringify(prepared));
      setAttempt(prepared);
      if(data.payment_status==="succeeded"){
        router.replace("/checkout/success?order="+encodeURIComponent(data.order_id));
        return;
      }
      if(data.total_amount!==current.amount){
        setError("The order total changed. Review the updated amount before paying.");
        return;
      }
      const result=await stripe.client.confirmCardPayment(data.client_secret,{payment_method:{card:stripe.card}});
      if(result.error)throw new Error(result.error.message??"Your card payment could not be confirmed.");
      if(!["succeeded","processing"].includes(result.paymentIntent?.status ?? ""))throw new Error("Payment was not completed. Try again to resume this order.");
      router.replace("/checkout/success?order="+encodeURIComponent(data.order_id));
    } catch(failure){
      if(failure instanceof ApiError && (["CHECKOUT_EXPIRED","CHECKOUT_CANCELLED"].includes(failure.code ?? "") || failure.status===422 || failure.status===404 || (failure.status===409 && failure.code!=="CHECKOUT_ALREADY_PENDING"))) clearAttempt();
      setError(failure instanceof Error?failure.message:"Checkout could not be completed.");
    }
    finally{
      submitting.current=false;
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-8">
    <h1 className="text-4xl font-black tracking-tight">Checkout</h1>
    {key&&<Script src="https://js.stripe.com/v3/" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>setError("Could not load Stripe. Refresh and try again.")}/>}
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    <form onSubmit={submit} className="grid items-start gap-5 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <fieldset className={bin} disabled={busy || Boolean(resumable)}><legend className="font-semibold">Shipping address</legend>
          {!addresses&&<p role="status">Loading saved addresses…</p>}
          {addresses?.length===0&&<p>Save a shipping address to continue.</p>}
          {addresses?.map((address)=><label className="my-2 flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm" key={address.id}><input type="radio" name="address" value={address.id} checked={selection===address.id} onChange={()=>{setSelection(address.id);setError("");}}/><span><strong>{address.recipient}</strong><br/>{[address.line1,address.city,address.postal_code,address.country].join(", ")}</span></label>)}
          <Link href="/account/addresses" className="text-sm font-semibold underline">Manage addresses</Link>
        </fieldset>
        <section className={bin}><h2 className="font-semibold">Card payment</h2>
          {!key&&<p className="mt-2 text-sm text-zinc-600">Card payment is unavailable until Stripe is configured.</p>}
          {key&&<div ref={cardNode} className="mt-3 rounded-xl border p-3" />}
        </section>
      </div>
      <section className={bin}>
        <h2 className="text-lg font-bold">Order summary</h2>
        {!quote&&<p className="my-3 text-sm">{selection ? "Calculating your order total…" : "Select an address to calculate the total."}</p>}
        {quote&&<dl className="my-4 space-y-2 text-sm">
          {[["Subtotal",quote.subtotal_amount],["Discount",-quote.discount_amount],["Shipping",quote.shipping_amount],["Tax",quote.tax_amount],["Total",amount ?? quote.total_amount]].map(([label,value])=><div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd>{value===null?"—":money(Number(value))}</dd></div>)}
        </dl>}
        {!resumable && quote?.conflicts.length ? <p role="alert" className="my-3 text-sm text-red-800">{quote.conflicts.map(({code})=>human(code)).join(", ")}. <Link href="/cart" className="underline">Open cart</Link></p> : null}
        <button className={pay} disabled={busy||!cardReady||cartLoading||!canPay}>{busy?"Confirming payment…":amount!=null?`Pay ${money(amount)}`:"Pay by card"}</button>
      </section>
    </form>
  </section>;
}

export function CheckoutResult(){return <CustomerGuard><Result /></CustomerGuard>;}
function Result(){
  const id=useSearchParams().get("order");
  const {user}=useAuth();
  const attemptStorage = "checkout_attempt:" + user?.id;
  const [order,setOrder]=useState<PaymentOrder>();
  const [error,setError]=useState("");
  const {refresh}=useCart();
  const refreshCart=useRef(refresh);
  useEffect(()=>{refreshCart.current=refresh;},[refresh]);
  useEffect(()=>{
    if(!id)return;
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>;
    let retries=0;
    async function load(){
      try {
        const {data}=await customer<PaymentOrder>("/orders/"+encodeURIComponent(id!),{signal:controller.signal});
        if(controller.signal.aborted)return;
        setOrder(data);
        if(data.payment_status==="pending" && data.status!=="cancelled"){
          if(retries++<14)timer=setTimeout(load,2000);
        } else {
          const stored=sessionStorage.getItem(attemptStorage);
          try {
            if (stored && (JSON.parse(stored) as CheckoutAttempt).orderId === id) sessionStorage.removeItem(attemptStorage);
          } catch {
            sessionStorage.removeItem(attemptStorage);
          }
          void refreshCart.current();
        }
      } catch(failure){if(!controller.signal.aborted)setError(failure instanceof Error?failure.message:"Could not check the order.");}
    }
    void load();
    return()=>{controller.abort();clearTimeout(timer);};
  },[id,attemptStorage]);
  return <section className="mx-auto max-w-xl space-y-4 px-4 py-12">
    <h1 className="text-3xl font-black">{order?.payment_status==="succeeded"?"Payment confirmed":"Order status"}</h1>
    {error&&<p role="alert">{error}</p>}
    {!id&&<p>No order was selected.</p>}{id&&!order&&!error&&<p role="status">Checking your order…</p>}
    {order&&<div className={bin}><p className="font-semibold">{order.number}</p><p>{money(order.total_amount)} · {human(order.payment_status)}</p>{order.payment_status==="pending"&&<p className="mt-2 text-sm">Waiting for confirmation. You can check again in your order history.</p>}</div>}
    <Link href="/account/orders" className="font-semibold underline">Go to order history</Link>
  </section>;
}
