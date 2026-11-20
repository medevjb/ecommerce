import { Suspense, cache } from "react";
import { StorefrontHeader } from "@/components/storefront/header";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { StorefrontFooter } from "@/components/storefront/footer";
import { catalog } from "@/lib/catalog";

type Entry = { id:string; data:{ title?:string; label?:string; url?:string; column?:string; link_url?:string; link_label?:string } };
type Settings = { name?:string; newsletter_title?:string; newsletter_copy?:string; support_email?:string; copyright?:string; seo_title?:string; seo_description?:string };
const fetchSettings=cache(()=>catalog<Settings>("/storefront/settings").catch(()=>({} as Settings)));
const fetchLinks=cache(()=>catalog<{header:Entry[];footer:Entry[];social:Entry[]}>("/storefront/navigation").catch(()=>({header:[],footer:[],social:[]})));

async function Header(){
  const [settings,links]=await Promise.all([fetchSettings(),fetchLinks()]);
  return <>
    <AnnouncementBar />
    <StorefrontHeader brand={settings.name||"SHOP.CO"} links={links.header}/>
  </>;
}

export default function StorefrontLayout({children}:{children:React.ReactNode}) {
  return <div className="flex min-h-screen flex-col bg-white text-black">
    <Suspense fallback={<StorefrontHeader />}><Header /></Suspense>
    <main className="flex-1">{children}</main>
    <StorefrontFooter />
  </div>;
}
