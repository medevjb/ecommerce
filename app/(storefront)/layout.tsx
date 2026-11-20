import { Suspense, cache } from "react";
import Link from "next/link";
import { StorefrontHeader } from "@/components/storefront/header";
import { NewsletterCTA } from "@/components/storefront/newsletter-cta";
import { catalog } from "@/lib/catalog";

type Entry = { id:string; data:{ title?:string; label?:string; url?:string; column?:string; link_url?:string; link_label?:string } };
type Settings = { name?:string; newsletter_title?:string; newsletter_copy?:string; support_email?:string; copyright?:string; seo_title?:string; seo_description?:string };
const fetchSettings=cache(()=>catalog<Settings>("/storefront/settings").catch(()=>({} as Settings)));
const fetchLinks=cache(()=>catalog<{header:Entry[];footer:Entry[];social:Entry[]}>("/storefront/navigation").catch(()=>({header:[],footer:[],social:[]})));

async function Header(){
  const [settings,links,home]=await Promise.all([fetchSettings(),fetchLinks(),catalog<{announcements:Entry[]}>("/storefront/home").catch(()=>({announcements:[]}))]);
  return <>{home.announcements.map(({id,data})=><div key={id} className="bg-black px-3 py-2 text-center text-xs text-white">{data.title} {data.link_url&&<Link className="underline" href={data.link_url}>{data.link_label??"Learn more"}</Link>}</div>)}<StorefrontHeader brand={settings.name||"SHOP.CO"} links={links.header}/></>;
}

async function Footer(){
  const [settings,links]=await Promise.all([fetchSettings(),fetchLinks()]);
  return <footer className="mt-14">
    <NewsletterCTA title={settings.newsletter_title} description={settings.newsletter_copy}/>
    <div className="mt-8 bg-zinc-100 px-5 py-10 sm:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-5">
        <div><Link href="/" className="text-2xl font-black">{settings.name||"SHOP.CO"}</Link>{settings.support_email&&<p className="mt-2 text-sm"><a href={"mailto:"+settings.support_email}>{settings.support_email}</a></p>}</div>
        {(links.footer.length||links.social.length)?<nav aria-label="Footer" className="flex flex-wrap gap-4 text-sm">{[...links.footer,...links.social].map(({id,data})=>data.url&&<Link key={id} href={data.url} className="hover:underline">{data.label}</Link>)}</nav>:<nav aria-label="Footer" className="flex gap-4 text-sm"><Link href="/products">Shop</Link><Link href="/account">My account</Link></nav>}
      </div>
      {settings.copyright&&<p className="mx-auto mt-5 max-w-[1440px] text-sm text-zinc-600">{settings.copyright}</p>}
    </div>
  </footer>;
}
export default function StorefrontLayout({children}:{children:React.ReactNode}) {
  return <div className="flex min-h-screen flex-col bg-white text-black">
    <Suspense fallback={<StorefrontHeader />}><Header /></Suspense>
    <main className="flex-1">{children}</main>
    <Suspense fallback={null}><Footer /></Suspense>
  </div>;
}
