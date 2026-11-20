import Link from "next/link";
import { Folder } from "lucide-react";

import { Suspense } from "react";
import { catalog, flattenCategories, type CatalogCategory } from "@/lib/catalog";

export default function CategoriesPage() {
  return <Suspense fallback={<p className="p-8" role="status">Loading categories…</p>}><CategoryList /></Suspense>;
}

async function CategoryList() {
  const categories = flattenCategories(await catalog<CatalogCategory[]>("/categories"));
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Categories
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Browse items by curated collections and departments
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-400 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-white dark:group-hover:text-zinc-900">
              <Folder className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-semibold text-zinc-900 group-hover:underline dark:text-white">
              {cat.name}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
