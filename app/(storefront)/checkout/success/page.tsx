import { Suspense } from "react";
import { CheckoutResult } from "@/components/customer/live-checkout";

export default function SuccessPage() {
  return <Suspense fallback={<p role="status" className="p-8">Loading order…</p>}><CheckoutResult /></Suspense>;
}
