"use client";

import { useState } from "react";
import { backend } from "@/lib/staff-api";
import { Mail, Check } from "lucide-react";

export function NewsletterCTA({title,description}:{title?:string;description?:string} = {}) {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const handleSubmit = async (event:React.FormEvent) => {
    event.preventDefault();
    if(busy||!email.trim())return;
    setBusy(true);setError("");
    try{await backend("/api/commerce/newsletter/subscribe",{method:"POST",body:{email,consent:true,source:"footer"}});setIsSubscribed(true);setEmail("");}
    catch(failure){setError(failure instanceof Error?failure.message:"Could not subscribe.");}
    finally{setBusy(false);}
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
      <div className="relative z-10 rounded-[20px] bg-black px-6 py-8 sm:px-12 sm:py-10 lg:px-16 lg:py-11 shadow-xl">
        <div className="flex flex-col items-start justify-between gap-7 sm:gap-8 lg:flex-row lg:items-center">
          {/* Left Headline */}
          <h2 className="max-w-lg font-black text-[32px] sm:text-3xl lg:text-[40px] leading-[35px] sm:leading-tight tracking-tighter text-white uppercase font-sans">
            {title || "Stay up to date with our latest offers"}
          </h2>

          {/* Right Newsletter Input & Button */}
          <div className="w-full max-w-md">
            {description&&<p className="mb-3 text-sm text-zinc-200">{description}</p>}
            {error&&<p role="alert" className="mb-2 text-sm text-red-200">{error}</p>}
            {isSubscribed ? (
              <div className="flex items-center gap-2 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-5 py-3.5 text-xs sm:text-sm font-semibold text-emerald-300">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Subscription request received.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-3.5">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full rounded-full bg-white py-3.5 pl-12 pr-4 text-sm text-black placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>

                <button
                  disabled={busy} type="submit"
                  className="w-full rounded-full bg-white py-3.5 text-center text-sm font-medium text-black transition-colors hover:bg-zinc-100 cursor-pointer"
                >
                  Subscribe to Newsletter
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
