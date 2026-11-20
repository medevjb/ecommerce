"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { catalog, catalogImage, type CatalogProduct } from "@/lib/catalog";
import { ApiError } from "@/lib/staff-api";
import type { CartItem, Product } from "@/types";

type Quote = {
  items: { id:string; variant_id:string; sku:string; product_id:string|null; name:string|null; slug?:string|null; image_url?:string|null; quantity:number; unit_amount:number|null; line_amount:number|null }[];
  subtotal_amount:number; discount_amount:number; total_amount:number; coupon?:{ code:string; status:string } | null;
  conflicts:{code:string;item_id?:string}[];
};

const base="/api/commerce";
const key="storefront_guest_cart_token";
const empty:Quote={items:[],subtotal_amount:0,discount_amount:0,total_amount:0,conflicts:[]};
const errorMessage=(failure:unknown)=>failure instanceof Error?failure.message:"The cart could not be updated.";

async function request<T>(path:string, method="GET", body?:unknown, signal?:AbortSignal):Promise<T> {
  const token=localStorage.getItem("auth_token");
  const guest=localStorage.getItem(key);
  const response=await fetch(base+path,{
    method, signal, cache:"no-store",
    headers:{Accept:"application/json","X-Commerce-Request":"1",...(body ? {"Content-Type":"application/json"}:{}),...(token?{Authorization:"Bearer "+token}:{}),...(guest?{"X-Cart-Token":guest}:{})},
    body:body?JSON.stringify(body):undefined,
  });
  const guestToken=response.headers.get("X-Cart-Token");
  if(guestToken) localStorage.setItem(key,guestToken);
  if(response.status===204)return undefined as T;
  const data=await response.json().catch(()=>null);
  if (!response.ok || !data) {
    const validation = Object.values(data?.errors?.fields ?? {}).flat()[0] as string | undefined;
    throw new ApiError(validation ?? data?.message ?? "The cart request failed.", response.status, data?.errors?.fields, data?.errors?.code);
  }
  return data.data;
}

type Context = {
  items:CartItem[]; subtotal:number; discountPercent:number; discountAmount:number; deliveryFee:number; total:number; totalItems:number;
  promoCode:string; error:string; loading:boolean; blocked:boolean; quote:Quote;
  addItem:(product:Product,quantity?:number,variantId?:string,selectedAttributes?:Record<string,string>)=>Promise<boolean>;
  removeItem:(id:string)=>Promise<void>; updateQuantity:(id:string,quantity:number)=>Promise<void>; clearCart:()=>Promise<void>;
  applyPromoCode:(code:string)=>Promise<{success:boolean;message:string}>; removePromoCode:()=>Promise<void>; refresh:()=>Promise<void>;
};

const CartContext=createContext<Context | undefined>(undefined);
export function CartProvider({children}:{children:ReactNode}) {
  const {user,isLoading}=useAuth();
  const router=useRouter();
  const customerId=user?.id;
  const [quote,setQuote]=useState<Quote>(empty);
  const [error,setError]=useState("");
  const [loadedOwner,setLoadedOwner]=useState<string | null>(null);
  const owner=customerId ?? "guest";
  const loading=isLoading || owner!==loadedOwner;
  const tasks=useRef<Promise<unknown>>(Promise.resolve());
  function enqueue<T>(task:()=>Promise<T>):Promise<T> {
    const promise=tasks.current.then(task,task);
    tasks.current=promise.catch(()=>undefined);
    return promise;
  }
  useEffect(()=>{
    if(isLoading)return;
    let current=true;
    const task=async()=>{
      try {
        if (!current) return;
        if(customerId && localStorage.getItem(key)) {
          try {
            const merged=await request<{cart:Quote;merge_conflicts:unknown[]}>("/cart/merge","POST");
            localStorage.removeItem(key);
            if(!current)return;
            setQuote(merged.cart);
            setError(merged.merge_conflicts.length ? "Some guest cart items were unavailable." : "");
            return;
          } catch (failure) {
            if(failure instanceof ApiError && failure.code==="CART_NOT_FOUND")localStorage.removeItem(key);
            if(!current)return;
            const cart=await request<Quote>("/cart");
            if(current){setQuote(cart);setError(errorMessage(failure));}
            return;
          }
        }
        const result=await request<Quote>("/cart").catch((failure: unknown)=>{
          if(customerId || !(failure instanceof ApiError) || failure.code!=="CART_NOT_FOUND")throw failure;
          localStorage.removeItem(key);
          return request<Quote>("/cart");
        });
        if(current){setQuote(result);setError("");}
      } catch(failure){
        if(current) {
          setQuote(empty);
          setError(errorMessage(failure));
        }
      }
      finally{if(current)setLoadedOwner(customerId ?? "guest");}
    };
    const pending=tasks.current.then(task,task);
    tasks.current=pending.catch(()=>undefined);
    return()=>{current=false;};
  },[customerId,isLoading]);

  async function change(path:string,method:string,body?:unknown,silent=false) {
    return enqueue(async()=>{
      try {
        const result=await request<Quote | undefined>(path,method,body);
        setQuote(result ?? await request<Quote>("/cart"));setError("");return true;
      } catch(failure){if(!silent)setError(errorMessage(failure));return false;}
    });
  }
  async function addItem(product:Product,quantity=1,variantId?:string) {
    if(!variantId) {
      try {
        const record=await catalog<CatalogProduct>("/products/"+encodeURIComponent(product.slug));
        const defaultVariant=record.variants?.length===1 && record.variants[0].in_stock ? record.variants[0] : undefined;
        if(!defaultVariant) {router.push("/products/"+encodeURIComponent(product.slug));return false;}
        variantId=defaultVariant.id;
      } catch(failure){setError(errorMessage(failure));return false;}
    }
    return change("/cart/items","POST",{variant_id:variantId,quantity});
  }
  const activeQuote=loading ? empty : quote;
  const items:CartItem[]=activeQuote.items.map((line)=>{
    const thumbnail=line.image_url ? catalogImage(line.image_url) : "/file.svg";
    const product:Product={id:line.product_id??"",slug:line.slug??"",title:line.name??line.sku,description:"",price:(line.unit_amount??0)/100,images:[thumbnail],thumbnail,category:{id:"",name:"",slug:""},rating:0,reviewsCount:0,inStock:line.unit_amount!==null,createdAt:"",updatedAt:""};
    return {id:line.id,productId:product.id,product,quantity:line.quantity,variantId:line.variant_id,sku:line.sku,conflict:quote.conflicts.find((entry)=>entry.item_id===line.id)?.code,price:product.price};
  });
  return <CartContext.Provider value={{
    items,quote:activeQuote,blocked:activeQuote.conflicts.length>0 || activeQuote.coupon?.status==="invalid",subtotal:activeQuote.subtotal_amount/100,discountAmount:activeQuote.discount_amount/100,
    total:activeQuote.total_amount/100,discountPercent:activeQuote.subtotal_amount ? Math.round(100*activeQuote.discount_amount/activeQuote.subtotal_amount):0,
    deliveryFee:0,totalItems:items.reduce((sum,item)=>sum+item.quantity,0),promoCode:activeQuote.coupon?.code??"",
    error:error || (activeQuote.coupon?.status==="invalid" ? "Remove the invalid promo code before checking out." : activeQuote.conflicts.length ? "Review unavailable items or quantities before checking out." : ""),loading,
    addItem,
    removeItem:async(id)=>{await change("/cart/items/"+id,"DELETE");},
    updateQuantity:async(id,quantity)=>{await (quantity < 1 ? change("/cart/items/"+id,"DELETE") : change("/cart/items/"+id,"PATCH",{quantity}));},
    clearCart:async()=>{await change("/cart/items","DELETE");},
    refresh:async()=>{await change("/cart","GET");},
    applyPromoCode:async(code)=>enqueue(async()=>{try{setQuote(await request<Quote>("/cart/coupon","POST",{code}));setError("");return {success:true,message:"Coupon applied."};}catch(failure){return {success:false,message:errorMessage(failure)};}}),
    removePromoCode:async()=>{await change("/cart/coupon","DELETE");},
  }}>{children}</CartContext.Provider>;
}
export function useCart(){
  const context=useContext(CartContext);
  if(!context)throw new Error("useCart must be used within CartProvider");
  return context;
}
