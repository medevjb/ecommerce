import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { Suspense } from "react";
import { catalog, flattenCategories, type CatalogCategory } from "@/lib/catalog";

export default function CategoriesPage() {
  return <main className="mx-auto max-w-[1440px] space-y-8 px-5 py-10 sm:px-10">
    <header className="rounded-3xl bg-[#f1efec] px-6 py-8 sm:px-10 sm:py-12">
      <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Shop by category</h1>
    </header>
    <Suspense fallback={<p role="status" className="text-zinc-600">Loading categories…</p>}><CategoryList /></Suspense>
  </main>;
}

async function CategoryList() {
  const categories = flattenCategories(await catalog<CatalogCategory[]>("/categories"));
  if (!categories.length) return <p className="text-zinc-600">No categories are available yet.</p>;
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    {categories.map((category) => {
      const image = category.image_url || category.children?.find((child) => child.image_url)?.image_url;
      return <Link key={category.id} href={`/products?category=${encodeURIComponent(category.slug)}`} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 hover:shadow-md">
        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[#f3f1ef]">
          {image ? <Image src={image} alt="" fill unoptimized sizes="(min-width: 1024px) 25vw, 50vw" className="object-contain p-3 transition-transform group-hover:scale-105" /> : <span className="grid size-14 place-items-center rounded-2xl bg-white text-zinc-700"><Layers3 size={26} aria-hidden /></span>}
        </div>
        <div className="flex items-center justify-between gap-2 p-4 sm:p-5"><h2 className="font-semibold">{category.name}</h2><ArrowUpRight aria-hidden size={17} className="shrink-0 text-zinc-500" /></div>
      </Link>;
    })}
  </div>;
}
