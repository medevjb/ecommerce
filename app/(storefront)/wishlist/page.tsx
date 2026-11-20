import { Heart } from "lucide-react";
import { EmptyState } from "@/components/shared";

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
        My Wishlist
      </h1>
      <EmptyState
        icon={<Heart className="h-8 w-8 text-rose-500" />}
        title="Your wishlist is empty"
        description="Save your favorite products to your wishlist so you can revisit them later."
        actionText="Browse Catalog"
        actionHref="/products"
      />
    </div>
  );
}
