import { ShoppingBag } from "lucide-react";

export function Preloader({ label = "Loading", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div role="status" className={`flex items-center justify-center text-zinc-800 ${compact ? "gap-3 py-4" : "min-h-64 flex-col gap-4 py-10"}`}>
      <span aria-hidden="true" className={`relative grid shrink-0 place-items-center rounded-full bg-zinc-100 ${compact ? "size-9" : "size-16"}`}>
        <span className="absolute inset-0 rounded-full border border-zinc-300 border-t-zinc-950 motion-safe:animate-spin" />
        <ShoppingBag className={compact ? "size-4" : "size-6"} strokeWidth={1.5} />
      </span>
      <span className="text-sm font-medium">{label}…</span>
    </div>
  );
}
