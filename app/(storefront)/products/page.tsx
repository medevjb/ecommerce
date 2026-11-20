import { Preloader } from "@/components/shared/preloader";
import { Suspense } from "react";
import { ShopPageView } from "@/components/storefront/shop-page-view";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<Preloader label="Loading products" />}
    >
      <ShopPageView />
    </Suspense>
  );
}
