import { CartPageView } from "@/components/storefront/cart-page-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart | SHOP.CO",
  description: "Review items in your shopping cart, apply promo codes, and proceed to checkout.",
};

export default function CartPage() {
  return <CartPageView />;
}
