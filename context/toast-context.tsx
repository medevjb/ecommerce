"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastInput = {
  title: string;
  description?: string;
  details?: string[];
  variant?: "success" | "error";
};
type ToastMessage = ToastInput & { id: number };
type ToastContextValue = { showToast: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((input: ToastInput) => {
    setToast({ ...input, id: ++nextId.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 9000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto w-full max-w-md sm:inset-x-auto sm:right-6 sm:bottom-6" role={toast.variant === "error" ? "alert" : "status"} aria-live={toast.variant === "error" ? "assertive" : "polite"}>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-950 shadow-xl shadow-black/15">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 shrink-0 ${toast.variant === "error" ? "text-red-700" : "text-emerald-700"}`}>
                {toast.variant === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-5">{toast.title}</p>
                {toast.description && <p className="mt-1 text-sm leading-relaxed text-zinc-700">{toast.description}</p>}
                {toast.details && toast.details.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-zinc-700">
                    {toast.details.map((detail, index) => <li key={`${detail}-${index}`}>{detail}</li>)}
                  </ul>
                )}
              </div>
              <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-violet-700"><X size={17} /></button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider.");
  return context;
}
