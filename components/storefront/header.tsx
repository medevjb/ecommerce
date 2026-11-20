"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Search,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import { StoreLogo } from "./storefront-image";
import { useCart } from "@/context/cart-context";
import { CustomerMenu } from "@/components/storefront/customer-menu";

export function StorefrontHeader({brand="SHOP.CO",logo,logoAlt,links=[]}:{brand?:string;logo?:string;logoAlt?:string;links?:{id:string;data:{label?:string;url?:string}}[]}) {
  const navigation=links.length ? links : [{id:"shop",data:{url:"/products",label:"Shop"}},{id:"categories",data:{url:"/categories",label:"Categories"}}];
  const router = useRouter();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-100">
      <div className="mx-auto flex h-16 sm:h-20 max-w-[1440px] items-center justify-between gap-3 sm:gap-6 px-4 sm:px-8 lg:px-12">
        {/* Left: Mobile hamburger + Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-black lg:hidden cursor-pointer"
            aria-label="Open mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          <Link href="/" className="flex items-center shrink-0">
            <span className="font-black text-2xl sm:text-3xl lg:text-[32px] tracking-tighter text-black font-sans uppercase">
              <StoreLogo brand={brand} logo={logo} alt={logoAlt} />
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden items-center gap-7 text-sm lg:text-base font-normal text-black lg:flex">
          {navigation.map(({id,data})=>data.url&&<Link key={id} href={data.url} className="whitespace-nowrap hover:underline">{data.label}</Link>)}
        </nav>

        {/* Search Bar (Pill shape) */}
        <div className="hidden flex-1 max-w-xl md:block">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full rounded-full bg-[#F0F0F0] py-3 pl-12 pr-4 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </form>
        </div>

        {/* Right Icons: Cart & Account */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* Mobile search trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1 text-black md:hidden"
            aria-label="Search"
          >
            <Search className="h-6 w-6" />
          </button>

          {/* Cart Icon */}
          <Link href="/wishlist" aria-label="Wishlist" className="shrink-0 text-black"><Heart className="size-5" /></Link>
          <Link
            href="/cart"
            className="relative p-1 text-black hover:text-zinc-600 transition-colors"
            aria-label="View Shopping Cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <CustomerMenu />
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="border-t border-zinc-100 bg-white px-4 py-6 lg:hidden shadow-lg">
          <form onSubmit={handleSearch} className="relative mb-6 w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full rounded-full bg-[#F0F0F0] py-3 pl-12 pr-4 text-sm text-black placeholder:text-zinc-500 focus:outline-none"
            />
          </form>

          <nav className="flex flex-col space-y-4 text-base font-medium">
            {navigation.map(({id,data})=>data.url&&<Link key={id} href={data.url} onClick={()=>setIsMobileMenuOpen(false)}>{data.label}</Link>)}
          </nav>
        </div>
      )}
    </header>
  );
}
