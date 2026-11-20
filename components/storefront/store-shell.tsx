import { cache } from "react";
import { StorefrontHeader } from "@/components/storefront/header";
import { AnnouncementBar, type Announcement } from "@/components/storefront/announcement-bar";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontMediaProvider } from "./storefront-image";
import { serverCatalog } from "@/lib/server-catalog";

type Entry = { id:string; data:{ title?:string; label?:string; url?:string; column?:string; link_url?:string; link_label?:string } };
type Settings = { name?:string; logo_url?:string; logo_alt?:string; image_fallback_url?:string; newsletter_title?:string; newsletter_copy?:string; support_email?:string; copyright?:string; seo_title?:string; seo_description?:string };
export const fetchStoreSettings=cache(()=>serverCatalog<Settings>("/storefront/settings").catch(()=>({} as Settings)));
const fetchLinks=cache(()=>serverCatalog<{header:Entry[];footer:Entry[];social:Entry[]}>("/storefront/navigation").catch(()=>({header:[],footer:[],social:[]})));

export async function StoreHeader(){
  const [settings,links,home]=await Promise.all([
    fetchStoreSettings(),fetchLinks(),
    serverCatalog<{announcements:{id:string;data:Announcement}[]}>("/storefront/home").catch(() => null),
  ]);
  const announcement = home?.announcements[0];
  return <>
    <AnnouncementBar key={announcement?.id} announcement={announcement?.data} />
    <StorefrontHeader brand={settings.name||"SHOP.CO"} logo={settings.logo_url} logoAlt={settings.logo_alt} links={links.header}/>
  </>;
}

export async function StoreFooter() {
  const [settings, links] = await Promise.all([fetchStoreSettings(), fetchLinks()]);
  return <StorefrontFooter brand={settings.name} logo={settings.logo_url} logoAlt={settings.logo_alt} newsletterTitle={settings.newsletter_title}
    newsletterCopy={settings.newsletter_copy} copyright={settings.copyright} supportEmail={settings.support_email}
    links={links.footer} social={links.social} />;
}

export async function StoreMedia({children}: {children: React.ReactNode}) {
  const settings = await fetchStoreSettings();
  return <StorefrontMediaProvider fallback={settings.image_fallback_url}>{children}</StorefrontMediaProvider>;
}
