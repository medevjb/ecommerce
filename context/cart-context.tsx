"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { catalog, type CatalogProduct } from "@/lib/catalog";
import type { CartItem, Product } from "@/types";

type Quote = {
  items: { id:string; variant_id:string; sku:string; product_id:string|null; name:string|null; slug?:string|null; image_url?:string|null; quantity:number; unit_amount:number|null }[];
  subtotal_amount:number; discount_amount:number; total_amount:number; coupon?:{ code:string; status:string } | null;
  conflicts:{code:string;item_id?:string}[];
};

const base=(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/,"");
const key="storefront_guest_cart_token";
const empty:Quote={items:[],subtotal_amount:0,discount_amount:0,total_amount:0,conflicts:[]};
const errorMessage=(failure:unknown)=>failure instanceof Error?failure.message:"The cart could not be updated.";

async function request<T>(path:string, method="GET", body?:unknown, signal?:AbortSignal):Promise<T> {
  const token=localStorage.getItem("auth_token");
  const guest=localStorage.getItem(key);
  const response=await fetch(base+path,{
    method, signal, cache:"no-store",
    headers:{Accept:"application/json",...(body ? {"Content-Type":"application/json"}:{}),...(token?{Authorization:"Bearer "+token}:{}),...(guest?{"X-Cart-Token":guest}:{})},
    body:body?JSON.stringify(body):undefined,
  });
  const guestToken=response.headers.get("X-Cart-Token");
  if(guestToken) localStorage.setItem(key,guestToken);
  if(response.status===204)return undefined as T;
  const data=await response.json();
  if(!response.ok)throw new Error(data.message || "The cart request failed.");
  return data.data;
}

type Context = {
  items:CartItem[]; subtotal:number; discountPercent:number; discountAmount:number; deliveryFee:number; total:number; totalItems:number;
  promoCode:string; error:string; loading:boolean;
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
  const [loading,setLoading]=useState(true);
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
            if(!current)return;
            localStorage.removeItem(key);
            setQuote(merged.cart);
            setError(merged.merge_conflicts.length ? "Some guest cart items were unavailable." : "");
            return;
          } catch {
            if(!current)return;
          }
        }
        const result=await request<Quote>("/cart");
        if(current){setQuote(result);setError("");}
      } catch(failure){
        if(current && !errorMessage(failure).includes("Failed to fetch")) {
          setError(errorMessage(failure));
        }
      }
      finally{if(current)setLoading(false);}
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
        const defaultVariant=record.variants?.find((option)=>option.is_default&&option.in_stock);
        if(!defaultVariant) {router.push("/products/"+encodeURIComponent(product.slug));return false;}
        variantId=defaultVariant.id;
      } catch(failure){setError(errorMessage(failure));return false;}
    }
    return change("/cart/items","POST",{variant_id:variantId,quantity});
  }
  const items:CartItem[]=quote.items.map((line)=>{
    const thumbnail=line.image_url || "/file.svg";
    const product:Product={id:line.product_id??"",slug:line.slug??"",title:line.name??line.sku,description:"",price:(line.unit_amount??0)/100,images:[thumbnail],thumbnail,category:{id:"",name:"",slug:""},rating:0,reviewsCount:0,inStock:line.unit_amount!==null,createdAt:"",updatedAt:""};
    return {id:line.id,productId:product.id,product,quantity:line.quantity,variantId:line.variant_id,price:product.price};
  });
  return <CartContext.Provider value={{
    items,subtotal:quote.subtotal_amount/100,discountAmount:quote.discount_amount/100,
    total:quote.total_amount/100,discountPercent:quote.subtotal_amount ? Math.round(100*quote.discount_amount/quote.subtotal_amount):0,
    deliveryFee:0,totalItems:items.reduce((sum,item)=>sum+item.quantity,0),promoCode:quote.coupon?.code??"",
    error:error || (quote.conflicts.length ? "Review unavailable items or quantities before checking out." : ""),loading,
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
