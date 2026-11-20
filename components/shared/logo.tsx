import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  subtitle?: string;
}

export function Logo({ className, href = "/", subtitle }: LogoProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 group", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white transition-transform group-hover:scale-105 dark:bg-white dark:text-zinc-900">
        <ShoppingBag className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
          AURA<span className="text-indigo-600">.</span>
        </span>
        {subtitle && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
}
