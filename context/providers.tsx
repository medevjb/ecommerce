"use client";

import React from "react";
import { CartProvider } from "./cart-context";
import { AuthProvider } from "./auth-context";
import { ToastProvider } from "./toast-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
