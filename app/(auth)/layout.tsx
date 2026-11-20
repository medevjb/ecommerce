import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { catalog } from "@/lib/catalog";

type NavigationEntry = { id: string; data: { label?: string; url?: string } };
type StorefrontSettings = { name?: string };

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [settings, navigation] = await Promise.all([
    catalog<StorefrontSettings>("/storefront/settings").catch(() => ({} as StorefrontSettings)),
    catalog<{ header: NavigationEntry[] }>("/storefront/navigation").catch(() => ({ header: [] })),
  ]);

  return <div className="flex min-h-screen flex-col bg-white text-zinc-950">
    <AnnouncementBar />
    <StorefrontHeader brand={settings.name || "SHOP.CO"} links={navigation.header} />
    <main className="flex flex-1 flex-col bg-[#f7f6f8] px-5 sm:px-8">
      <div className="mx-auto flex w-full max-w-md flex-1 items-center py-8 sm:py-12">
        <div className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-9">{children}</div>
      </div>
    </main>
    <StorefrontFooter />
  </div>;
}
