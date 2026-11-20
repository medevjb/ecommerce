"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export type Announcement = { title?: string; body?: string; link_url?: string; link_label?: string };

export function AnnouncementBar({ announcement }: { announcement?: Announcement }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !announcement) return null;

  return (
    <div className="relative bg-black px-4 py-2 sm:py-2.5 text-center text-[12px] sm:text-sm text-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center pr-6 sm:pr-0">
        <p className="font-normal text-zinc-200 leading-snug">
          {announcement.title}{announcement.body && <> {announcement.body}</>}
          {announcement.link_url && <Link href={announcement.link_url} className="ml-2 font-medium underline underline-offset-4">
            {announcement.link_label ?? "Learn more"}
          </Link>}
        </p>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
}
