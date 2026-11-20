import { Preloader } from "@/components/shared/preloader";
import { Suspense } from "react";
import { CheckoutResult } from "@/components/customer/live-checkout";

export default function SuccessPage() {
  return <Suspense fallback={<Preloader label="Loading order" compact />}><CheckoutResult /></Suspense>;
}
