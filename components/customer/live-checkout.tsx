"use client";

import { Preloader } from "@/components/shared/preloader";

import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { CustomerGuard, customer, readShippingAddress, ShippingAddressFields, type Address, type ShippingAddress } from "@/components/customer/customer-account";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { ApiError, human, money } from "@/lib/staff-api";

type Card = { mount(target:HTMLElement):void; destroy():void; on(event:"ready", callback:()=>void):void };
type Stripe = { elements():{create(type:"card",options:{hidePostalCode:boolean}):Card}; confirmCardPayment(secret:string,options:{payment_method:{card:Card}}):Promise<{ error?:{message?:string};paymentIntent?:{status:string} }> };
type StripeWindow=Window & { Stripe?:(key:string)=>Stripe };
type Quote={subtotal_amount:number;discount_amount:number;shipping_amount:number;tax_amount:number;total_amount:number|null;can_checkout:boolean;conflicts:{code:string}[]};
type CheckoutAttempt = {address:string;key:string;amount:number;orderId?:string};
type PaymentOrder={id:string;number:string;status:string;payment_status:string;total_amount:number};
type ResumeOrder = PaymentOrder & {
  subtotal_amount:number; discount_amount:number; shipping_amount:number; tax_amount:number;
  address?: Pick<Address, "recipient" | "line1" | "line2" | "city" | "region" | "postal_code" | "country">;
};
type PreparedPayment = {client_secret:string;order_id:string;payment_status:string;total_amount:number};
const bin="rounded-2xl border border-zinc-200 p-5";
const pay="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-45";
const key=process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function LiveCheckout(){
  return <CustomerGuard><Suspense fallback={<Preloader label="Loading checkout" compact />}><CheckoutRoute /></Suspense></CustomerGuard>;
}

function CheckoutRoute() {
  const order = useSearchParams().get("order") ?? undefined;
  return <Checkout key={order ?? "new"} resumeOrderId={order} />;
}

function Checkout({resumeOrderId}: {resumeOrderId?: string}){
  const router=useRouter();
  const {quote: cart, loading: cartLoading}=useCart();
  const {user}=useAuth();
  const attemptStorage = "checkout_attempt:" + user?.id;
  const [attempt,setAttempt]=useState<CheckoutAttempt | undefined>(()=>{
    try { return JSON.parse(sessionStorage.getItem(attemptStorage) ?? "null") ?? undefined; }
    catch { return undefined; }
  });
  const originalAddress=useRef(attempt?.address);
  const [resumeOrder,setResumeOrder]=useState<ResumeOrder>();
  const [resumeUnavailable,setResumeUnavailable]=useState(false);
  const [addresses,setAddresses]=useState<Address[]>();
  const [selection,setSelection]=useState("");
  const [oneTimeAddress, setOneTimeAddress] = useState<ShippingAddress>();
  const [addingAddress, setAddingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const showAddressForm = addingAddress || (addresses?.length === 0 && !oneTimeAddress);
  const addressKey = showAddressForm ? "" : oneTimeAddress ? "one-time" : selection;
  const [preview,setPreview]=useState<{address:string;cart:typeof cart;quote:Quote}>();
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [cardReady,setCardReady]=useState(false);
  const submitting=useRef(false);
  const [error,setError]=useState("");
  const cardNode=useRef<HTMLDivElement>(null);
  const payment=useRef<{client:Stripe;card:Card}>(null);


  useEffect(()=>{
    if (resumeOrderId) return;
    const controller=new AbortController();
    customer<Address[]>("/me/addresses",{signal:controller.signal}).then(({data})=>{
      setAddresses(data);
      setSelection(data.find((item)=>item.id===originalAddress.current)?.id ?? data.find((item)=>item.is_default)?.id ?? data[0]?.id ?? "");
    }).catch((failure)=>{if(!controller.signal.aborted)setError(failure.message);});
    return()=>controller.abort();
  },[resumeOrderId]);
  useEffect(()=>{
    if (!resumeOrderId) return;
    const controller = new AbortController();
    customer<ResumeOrder>("/orders/" + encodeURIComponent(resumeOrderId), {signal:controller.signal})
      .then(({data}) => { if (!controller.signal.aborted) setResumeOrder(data); })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load the order."); });
    return () => controller.abort();
  },[resumeOrderId]);
  useEffect(()=>{
    if(resumeOrderId || !addressKey || cartLoading)return;
    const controller=new AbortController();
    customer<Quote>("/checkout/preview",{method:"POST",body:oneTimeAddress ? {address:oneTimeAddress} : {address_id:selection},signal:controller.signal})
      .then(({data})=>{if (!controller.signal.aborted) setPreview({address:addressKey,cart,quote:data});})
      .catch(failure=>{if(!controller.signal.aborted)setError(failure.message);});
    return()=>controller.abort();
  },[addressKey,selection,oneTimeAddress,cart,cartLoading,resumeOrderId]);
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
  const quote=preview?.address===addressKey && preview.cart===cart && !cartLoading ? preview.quote : undefined;
  const resumable=attempt?.address===addressKey ? attempt : undefined;
  const canPay=resumeOrderId
    ? !resumeUnavailable && resumeOrder?.status === "pending" && resumeOrder.payment_status === "pending"
    : Boolean(resumable || quote?.can_checkout);
  const amount=resumeOrderId ? resumeOrder?.total_amount : resumable?.amount ?? quote?.total_amount;
  const summary=resumeOrder ?? quote;
  const paymentLoading=!resumeOrderId && cartLoading;

  function clearAttempt() {
    sessionStorage.removeItem(attemptStorage);
    setAttempt(undefined);
  }

  async function acceptAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const address = readShippingAddress(form);
    setSavingAddress(true);
    setError("");
    try {
      if (form.has("save_address")) {
        const {data} = await customer<Address>("/me/addresses", {method:"POST", body:address});
        setAddresses((previous) => [...(previous ?? []), data]);
        setSelection(data.id);
        setOneTimeAddress(undefined);
      } else {
        setSelection("");
        setOneTimeAddress(address);
      }
      setPreview(undefined);
      setAddingAddress(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save the shipping address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function submit(){
    const stripe = payment.current;
    if(submitting.current || !stripe || (!resumeOrderId && !addressKey) || !canPay || amount == null || paymentLoading)return;
    submitting.current=true;
    setBusy(true);
    setError("");
    try {
      let data: PreparedPayment;
      if (resumeOrderId) {
        ({data}=await customer<PreparedPayment>("/orders/" + encodeURIComponent(resumeOrderId) + "/resume-checkout", {method:"POST"}));
      } else {
        const current = resumable ?? {address:addressKey,key:crypto.randomUUID(),amount};
        if (!oneTimeAddress) sessionStorage.setItem(attemptStorage,JSON.stringify(current));
        setAttempt(current);
        ({data}=await customer<PreparedPayment>("/checkout",{method:"POST",idempotency:current.key,body:oneTimeAddress ? {address:oneTimeAddress} : {address_id:selection}}));
        const prepared={...current,orderId:data.order_id,amount:data.total_amount};
        if (!oneTimeAddress) sessionStorage.setItem(attemptStorage,JSON.stringify(prepared));
        setAttempt(prepared);
      }
      if(data.payment_status==="succeeded"){
        router.replace("/checkout/success?order="+encodeURIComponent(data.order_id));
        return;
      }
      if(data.total_amount!==amount){
        setError("The order total changed. Review the updated amount before paying.");
        return;
      }
      const result=await stripe.client.confirmCardPayment(data.client_secret,{payment_method:{card:stripe.card}});
      if(result.error)throw new Error(result.error.message??"Your card payment could not be confirmed.");
      if(!["succeeded","processing"].includes(result.paymentIntent?.status ?? ""))throw new Error("Payment was not completed. Try again to resume this order.");
      router.replace("/checkout/success?order="+encodeURIComponent(data.order_id));
    } catch(failure){
      if (failure instanceof ApiError && failure.code === "CHECKOUT_ALREADY_PENDING") {
        clearAttempt();
        setError("This cart already has a pending order. Open order history to resume or cancel it.");
        return;
      }
      if (resumeOrderId && failure instanceof ApiError && ["CHECKOUT_EXPIRED", "CHECKOUT_CANCELLED", "CHECKOUT_NOT_PENDING"].includes(failure.code ?? "")) {
        setResumeUnavailable(true);
      }
      if(!resumeOrderId && failure instanceof ApiError && (["CHECKOUT_EXPIRED","CHECKOUT_CANCELLED"].includes(failure.code ?? "") || failure.status===422 || failure.status===404 || (failure.status===409 && failure.code!=="CHECKOUT_ALREADY_PENDING"))) clearAttempt();
      setError(failure instanceof Error?failure.message:"Checkout could not be completed.");
    }
    finally{
      submitting.current=false;
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-8">
    <h1 className="text-4xl font-black tracking-tight">{resumeOrderId ? "Resume payment" : "Checkout"}</h1>
    {key&&<Script src="https://js.stripe.com/v3/" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>setError("Could not load Stripe. Refresh and try again.")}/>}
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    <div className="grid items-start gap-5 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        {resumeOrderId ? <section className={bin}>
          {resumeOrder ? <h2 className="font-semibold">Order {resumeOrder.number}</h2>
            : !error && <Preloader label="Loading your order" compact />}
          {resumeOrder?.address && <p className="mt-2 text-sm">{[resumeOrder.address.recipient, resumeOrder.address.line1, resumeOrder.address.line2, resumeOrder.address.city, resumeOrder.address.region, resumeOrder.address.postal_code, resumeOrder.address.country].filter(Boolean).join(", ")}</p>}
          {resumeOrder && !canPay && <Link className="mt-2 inline-block text-sm underline" href={"/checkout/success?order=" + encodeURIComponent(resumeOrderId)}>View order status</Link>}
        </section> : <section className={bin}>
          <h2 className="font-semibold">Shipping address</h2>
          {!addresses && !error && <Preloader label="Loading saved addresses" compact />}
          {showAddressForm ? (
            <form className="mt-4" onSubmit={acceptAddress}>
              <fieldset disabled={savingAddress} className="grid gap-4 sm:grid-cols-2">
                <ShippingAddressFields address={oneTimeAddress ?? { recipient: user?.name }} />
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" name="save_address" /> Save to my address book
                </label>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                  <button className={pay}>{savingAddress ? "Applying address…" : "Use this address"}</button>
                  {(Boolean(addresses?.length) || oneTimeAddress) && <button type="button" className="text-sm underline" onClick={() => {setAddingAddress(false);setError("");}}>Cancel</button>}
                </div>
              </fieldset>
            </form>
          ) : (
            <fieldset disabled={busy || Boolean(resumable)} aria-label="Choose a shipping address">
              {oneTimeAddress && (
                <div className="mt-3 rounded-xl border p-3 text-sm">
                  <strong>{oneTimeAddress.recipient}</strong>
                  <p>{[oneTimeAddress.line1, oneTimeAddress.line2, oneTimeAddress.city, oneTimeAddress.region, oneTimeAddress.postal_code, oneTimeAddress.country].filter(Boolean).join(", ")}</p>
                  <p className="mt-1 text-zinc-600">Use for this order only</p>
                </div>
              )}
              {addresses?.map((address) => (
                <label className="my-2 flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm" key={address.id}>
                  <input type="radio" name="address" value={address.id} checked={selection === address.id} onChange={() => {setSelection(address.id);setOneTimeAddress(undefined);setError("");}} />
                  <span><strong>{address.recipient}</strong><br />{[address.line1,address.city,address.postal_code,address.country].join(", ")}</span>
                </label>
              ))}
              {addresses && <button type="button" className="mt-3 text-sm font-semibold underline" onClick={() => {setAddingAddress(true);setError("");}}>{oneTimeAddress ? "Edit one-time address" : "Use a new address"}</button>}
            </fieldset>
          )}
        </section>}
        <section className={bin}><h2 className="font-semibold">Card payment</h2>
          {!key&&<p className="mt-2 text-sm text-zinc-600">Card payment is unavailable until Stripe is configured.</p>}
          {key && !cardReady && !error && <Preloader label="Loading card payment" compact />}
          {key&&<div ref={cardNode} className="mt-3 rounded-xl border p-3" />}
        </section>
      </div>
      <section className={bin}>
        <h2 className="text-lg font-bold">Order summary</h2>
        {!summary&&!resumeOrderId&&(addressKey ? !error && <Preloader label="Calculating your order total" compact /> : <p className="my-3 text-sm">Enter or select a shipping address to continue.</p>)}
        {summary&&<dl className="my-4 space-y-2 text-sm">
          {[["Subtotal",summary.subtotal_amount],["Discount",-summary.discount_amount],["Shipping",summary.shipping_amount],["Tax",summary.tax_amount],["Total",amount ?? summary.total_amount]].map(([label,value])=><div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd>{value===null?"—":money(Number(value))}</dd></div>)}
        </dl>}
        {!resumable && quote?.conflicts.length ? <p role="alert" className="my-3 text-sm text-red-800">{quote.conflicts.map(({code})=>human(code)).join(", ")}. <Link href="/cart" className="underline">Open cart</Link></p> : null}
        <button type="button" onClick={() => void submit()} className={pay} disabled={busy||!cardReady||paymentLoading||!canPay||amount==null}>{busy?"Confirming payment…":amount!=null?`Pay ${money(amount)}`:"Pay by card"}</button>
        <Link href="/account/orders" className="mt-3 block text-sm underline">Open order history</Link>
      </section>
    </div>
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
    {!id&&<p>No order was selected.</p>}{id&&!order&&!error&&<Preloader label="Checking your order" compact />}
    {order&&<div className={bin}><p className="font-semibold">{order.number}</p><p>{money(order.total_amount)} · {human(order.payment_status)}</p>{order.payment_status==="pending"&&<p className="mt-2 text-sm">Waiting for confirmation. You can check again in your order history.</p>}</div>}
    <Link href="/account/orders" className="font-semibold underline">Go to order history</Link>
  </section>;
}
