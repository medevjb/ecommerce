import { StorefrontImage as Image } from "@/components/storefront/storefront-image";
import Link from "next/link";
import { Suspense } from "react";
import { CustomerReviewsSection } from "@/components/storefront/customer-reviews";
import { NewArrivalsSection } from "@/components/storefront/new-arrivals";
import { BrandsBanner, type StorefrontBrand } from "@/components/storefront/brands-banner";
import { TopSellingSection } from "@/components/storefront/top-selling";
import { adaptProduct, type CatalogProduct } from "@/lib/catalog";
import { serverCatalog } from "@/lib/server-catalog";

type Marketing = { id:string; key:string; data:{ title?:string; body?:string; image_url?:string; image_alt?:string; link_url?:string; link_label?:string; author?:string; quote?:string; rating?:number | string | null; stats?:{label:string;value:string}[] } };
type Section = { id:string; key:string; data:{ title:string; strategy:string }; entries: unknown[] };
type Home = { hero_slides:Marketing[]; promotions:Marketing[]; announcements:Marketing[]; sections:Section[]; testimonials:Marketing[] };
type Tile = { title:string; image_url?:string; image_alt?:string; link_url?:string };

async function HomeContent() {
  const home=await serverCatalog<Home>("/storefront/home");
  return <div className="flex flex-col">
    {home.hero_slides.map(({id,data})=><section key={id} className="bg-[#f2f0f1]">
      <div className="mx-auto grid w-full max-w-[1440px] items-center px-4 sm:px-8 lg:px-12 pt-10 md:pt-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 sm:gap-6 lg:gap-8">
        <div className="pb-8 md:py-14 lg:py-20"><h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black uppercase leading-[1.05] tracking-tight">{data.title}</h1>
          {data.body&&<p className="mt-5 max-w-xl text-sm sm:text-base text-zinc-600 leading-relaxed">{data.body}</p>}
          {data.link_url&&data.link_label&&<Link className="mt-6 sm:mt-8 inline-block rounded-full bg-black px-10 py-3.5 text-sm sm:text-base font-medium text-white hover:bg-black/85 transition-colors" href={data.link_url}>{data.link_label}</Link>}
          {data.stats?.length ? <dl className="mt-8 lg:mt-12 grid max-w-xl grid-cols-2 gap-y-3 sm:grid-cols-3 sm:gap-0">
            {data.stats.map(({label,value}, index)=><div
              key={label}
              className={`flex flex-col-reverse ${
                index === 0
                  ? "pr-3 sm:pr-6"
                  : index === 1
                  ? "border-l border-black/15 pl-4 sm:px-6 sm:border-r"
                  : "col-span-2 pt-2 items-center text-center sm:col-span-1 sm:pt-0 sm:items-start sm:text-left sm:pl-6"
              }`}
            >
              <dt className="mt-0.5 text-xs text-black/60 sm:text-sm">{label}</dt>
              <dd className="text-2xl font-bold tracking-tight text-black sm:text-3xl lg:text-4xl">{value}</dd>
            </div>)}
          </dl> : null}
        </div>
        {data.image_url&&<div className="relative aspect-[778/670] w-full self-end md:min-h-[460px] lg:min-h-[560px]"><Image unoptimized src={data.image_url} alt={data.image_alt??""} fill className="object-contain object-bottom" sizes="(min-width: 768px) 50vw, 100vw" priority /></div>}
      </div>
    </section>)}
    {home.sections.filter(({data})=>data.strategy==="brands").map(({id,data,entries})=><BrandsBanner key={id} title={data.title} brands={entries as StorefrontBrand[]} />)}
    {home.sections.filter(({key,data})=>key!=="featured-categories" && data.strategy!=="brands").map(({id,data,entries})=>{
      if(data.strategy==="new_arrivals"||data.strategy==="top_selling"||data.strategy==="curated"){
        const items=(entries as CatalogProduct[]).map((product)=>adaptProduct(product));
        const Component=data.strategy==="top_selling"?TopSellingSection:NewArrivalsSection;
        return <Component key={id} title={data.title} products={items.slice(0,4)}/>;
      }
      if (!entries.length) return null;
      if(data.strategy==="tiles")return <section id="dress-styles" key={id} className="mx-auto my-10 w-full max-w-[1360px] rounded-[30px] bg-zinc-100 p-5 sm:p-10">
        <h2 className="mb-6 text-center text-3xl font-black uppercase">{data.title}</h2>
        <div className="grid gap-4 sm:grid-cols-2">{(entries as Tile[]).map((tile,index)=><Link key={index} href={tile.link_url??"/products"} className="relative min-h-44 overflow-hidden rounded-2xl bg-white"><span className="absolute left-5 top-5 z-10 rounded-lg bg-white/85 px-2 text-xl font-bold">{tile.title}</span>{tile.image_url&&<Image src={tile.image_url} alt={tile.image_alt??""} fill unoptimized className="object-cover object-right" sizes="50vw"/>}</Link>)}</div>
      </section>;
      return <section key={id} className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-10"><h2 className="mb-4 text-2xl font-bold">{data.title}</h2><div className="flex flex-wrap gap-3">{(entries as {id:string;name:string;slug:string}[]).map((entry)=><Link className="rounded-full border border-zinc-300 px-4 py-2" key={entry.id} href={"/products?category="+encodeURIComponent(entry.slug)}>{entry.name}</Link>)}</div></section>;
    })}
    {home.promotions.filter(({key}) => key !== "everyday-edit-promotion").map(({id,data})=><section key={id} className="mx-5 my-5 rounded-2xl bg-black p-6 text-white sm:mx-10"><h2 className="text-2xl font-bold">{data.title}</h2>{data.body&&<p>{data.body}</p>}{data.link_url&&<Link className="underline" href={data.link_url}>{data.link_label??"Learn more"}</Link>}</section>)}
    <CustomerReviewsSection testimonials={home.testimonials} />
  </div>;
}
export default function HomePage() { return <Suspense fallback={<p className="p-12" role="status">Loading storefront…</p>}><HomeContent /></Suspense>; }
