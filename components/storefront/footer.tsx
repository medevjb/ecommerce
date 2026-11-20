import Link from "next/link";
import { StoreLogo } from "./storefront-image";
import { NewsletterCTA } from "./newsletter-cta";

type FooterLink = { id: string; data: { label?: string; url?: string; column?: string } };
type FooterProps = {
  brand?: string;
  logo?: string;
  logoAlt?: string;
  newsletterTitle?: string;
  newsletterCopy?: string;
  copyright?: string;
  supportEmail?: string;
  links?: FooterLink[];
  social?: FooterLink[];
};

export function StorefrontFooter({
  brand = "SHOP.CO", logo, logoAlt, newsletterTitle, newsletterCopy, copyright, supportEmail, links = [], social = [],
}: FooterProps) {
  const groups = new Map<string, FooterLink[]>();
  for (const item of links) {
    if (!item.data.url || !item.data.label) continue;
    const heading = item.data.column || "Explore";
    const group = groups.get(heading) ?? [];
    group.push(item);
    groups.set(heading, group);
  }
  return <footer className="mt-10 bg-[#f0f0f0] px-5 py-10 text-black sm:px-8">
    <NewsletterCTA title={newsletterTitle} description={newsletterCopy} />
    <div className="mx-auto mt-10 flex max-w-[1360px] flex-wrap gap-8">
      <div className="mr-auto space-y-3">
        <Link href="/" className="text-2xl font-black"><StoreLogo brand={brand} logo={logo} alt={logoAlt} /></Link>
        {supportEmail && <p><a className="text-sm underline" href={"mailto:" + supportEmail}>{supportEmail}</a></p>}
        <div className="flex flex-wrap gap-3 text-sm">{social.map(({id,data}) => data.url && data.label &&
          <Link key={id} href={data.url} className="underline">{data.label}</Link>)}</div>
      </div>
      {[...groups].map(([heading, items]) => <nav aria-label={heading} key={heading} className="space-y-3">
        <h2 className="text-sm font-semibold">{heading}</h2>
        <ul className="space-y-2 text-sm text-black/70">{items.map(({id,data}) =>
          <li key={id}><Link href={data.url!} className="hover:underline">{data.label}</Link></li>)}</ul>
      </nav>)}
      <nav aria-label="Storefront" className="space-y-3 text-sm">
        <h2 className="font-semibold">Storefront</h2>
        <ul className="space-y-2 text-black/70">
          <li><Link href="/products" className="hover:underline">Shop</Link></li>
          <li><Link href="/account" className="hover:underline">My account</Link></li>
          <li><Link href="/newsletter/unsubscribe" className="hover:underline">Unsubscribe</Link></li>
        </ul>
      </nav>
    </div>
    {copyright && <p className="mx-auto mt-8 max-w-[1360px] border-t border-black/10 pt-5 text-sm text-black/60">{copyright}</p>}
  </footer>;
}
