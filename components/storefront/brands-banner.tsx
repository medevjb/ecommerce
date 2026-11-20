import { StorefrontImage as Image } from "@/components/storefront/storefront-image";
import Link from "next/link";

export type StorefrontBrand = { id: string; name: string; slug: string; logo_url?: string | null };

export function BrandsBanner({ title, brands }: { title: string; brands: StorefrontBrand[] }) {
  if (!brands.length) return null;

  return <section id="shop-by-brand" aria-label={title} className="bg-black px-5 py-6 text-white sm:px-10 lg:py-8">
    <div className="mx-auto max-w-[1440px]">
      <ul className="flex flex-wrap items-center justify-evenly gap-x-7 gap-y-3 text-center lg:flex-nowrap">
        {brands.map((brand) => <li key={brand.id}>
          <Link href={`/products?brand=${encodeURIComponent(brand.slug)}`} className="inline-flex min-h-10 items-center rounded-sm text-xl font-serif font-semibold tracking-wide hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-4 sm:text-2xl lg:text-3xl">
            {brand.logo_url ? <Image unoptimized src={brand.logo_url} alt={brand.name} width={128} height={40} className="h-10 w-auto max-w-32 object-contain" /> : brand.name}
          </Link>
        </li>)}
      </ul>
    </div>
  </section>;
}
