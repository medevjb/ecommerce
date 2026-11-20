"use client";

import Image, { type ImageProps } from "next/image";
import { createContext, useContext, useState, type ReactNode } from "react";

const placeholder = "/file.svg";
const FallbackContext = createContext(placeholder);

export function StorefrontMediaProvider({fallback, children}: {fallback?: string | null; children: ReactNode}) {
  return <FallbackContext.Provider value={fallback || placeholder}>{children}</FallbackContext.Provider>;
}

export function StorefrontImage({src, alt, ...props}: ImageProps) {
  const fallback = useContext(FallbackContext);
  const [failed, setFailed] = useState<string[]>([]);
  const source = typeof src === "string" && (!src || src === placeholder || failed.includes(src))
    ? (failed.includes(fallback) ? placeholder : fallback)
    : src;
  return <Image {...props} alt={alt} src={source} unoptimized onError={(event) => {
    if (typeof source === "string" && source !== placeholder) {
      setFailed((previous) => previous.includes(source) ? previous : [...previous, source]);
    }
    props.onError?.(event);
  }} />;
}

export function StoreLogo({brand, logo, alt}: {brand: string; logo?: string | null; alt?: string | null}) {
  const [failed, setFailed] = useState<string | null>(null);
  return logo && failed !== logo
    ? <Image unoptimized src={logo} alt={alt || brand} width={144} height={40} className="h-8 w-auto max-w-36 object-contain" onError={() => setFailed(logo)} />
    : brand;
}
