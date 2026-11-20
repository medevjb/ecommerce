"use client";

import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { staffRequest } from "@/lib/staff-api";

export type ImageScope = "category-create" | "category-update" | "brand-create" | "brand-update" | "content";
export const imageFields = new Set(["image_url", "logo_url", "data.image_url", "data.logo_url", "data.image_fallback_url"]);
const formats = "image/jpeg,image/png,image/webp";

export function ImageUploadField({ name, label, url, readOnly, onChange, error }: {
  name: string; label: string; url?: unknown; readOnly?: boolean; onChange?: () => void; error?: string;
}) {
  const src = typeof url === "string" && /^(https?:\/\/|\/(?!\/))/.test(url) ? url : "";
  return <fieldset className="min-w-0 space-y-2 rounded-xl border border-[#ded8ec] p-3">
    <legend className="px-1 text-sm font-semibold text-[#574b72]">{label.replace(/\s+url$/i, "")}</legend>
    <div className="flex items-center gap-3">
      <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-violet-50 text-violet-700">
        {src ? <Image src={src} alt="" fill unoptimized sizes="64px" className="object-cover" /> : <ImagePlus size={23} />}
      </span>
      {readOnly ? <span className="text-sm text-zinc-600">{src ? "Image saved" : "No image"}</span> : <label className="min-w-0 flex-1 text-xs text-zinc-600">
        {src ? "Replace image" : "Choose an image"}
        <input name={name} type="file" accept={formats} onChange={onChange} className="mt-1 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-violet-100 file:px-2 file:py-1.5 file:font-semibold file:text-violet-900" />
        <span className="mt-1 block">JPEG, PNG or WebP, up to 6 MB.</span>
      </label>}
    </div>
    {src && !readOnly && <label className="flex items-center gap-2 text-xs text-zinc-700"><input type="checkbox" name={name+".__remove"} onChange={onChange} /> Remove existing image</label>}
    {error && <p className="text-xs text-red-800">{error}</p>}
  </fieldset>;
}

export async function uploadImage(scope: ImageScope, file: File) {
  const body = new FormData();
  body.set("image", file);
  const {data} = await staffRequest<{url:string}>("/media/"+scope, {method:"POST",body});
  return data.url;
}

export function imageSelection(form: FormData, name: string) {
  const selected = form.get(name);
  if (selected instanceof File && selected.size) return selected;
  return form.has(name+".__remove") ? null : undefined;
}
