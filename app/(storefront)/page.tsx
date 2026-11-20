import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { NewArrivalsSection } from "@/components/storefront/new-arrivals";
import { TopSellingSection } from "@/components/storefront/top-selling";
import { adaptProduct, catalog, type CatalogProduct } from "@/lib/catalog";

type Marketing = { id:string; data:{ title?:string; body?:string; image_url?:string; image_alt?:string; link_url?:string; link_label?:string; author?:string; quote?:string; stats?:{label:string;value:string}[] } };
type Section = { id:string; data:{ title:string; strategy:string }; entries: unknown[] };
type Home = { hero_slides:Marketing[]; promotions:Marketing[]; announcements:Marketing[]; sections:Section[]; testimonials:Marketing[] };
type Tile = { title:string; image_url?:string; image_alt?:string; link_url?:string };

async function HomeContent() {
  const home=await catalog<Home>("/storefront/home");
  return <div className="flex flex-col">
    {home.hero_slides.map(({id,data})=><section key={id} className="bg-[#f2f0f1]">
      <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 pt-12 sm:px-10 md:grid-cols-2">
        <div className="pb-8 md:py-16"><h1 className="text-4xl font-black uppercase leading-none tracking-tight lg:text-6xl">{data.title}</h1>
          {data.body&&<p className="mt-5 max-w-xl text-zinc-600">{data.body}</p>}
          {data.link_url&&data.link_label&&<Link className="mt-6 inline-block rounded-full bg-black px-8 py-3 font-medium text-white" href={data.link_url}>{data.link_label}</Link>}
          {data.stats?.length ? <dl className="mt-8 flex flex-wrap gap-5">{data.stats.map(({label,value})=><div key={label}><dt className="text-xs text-zinc-600">{label}</dt><dd className="text-xl font-bold">{value}</dd></div>)}</dl> : null}
        </div>
        {data.image_url&&<div className="relative min-h-72 self-stretch md:min-h-96"><Image unoptimized src={data.image_url} alt={data.image_alt??""} fill className="object-contain object-bottom" sizes="(min-width: 768px) 50vw, 100vw" /></div>}
      </div>
    </section>)}
    {home.sections.map(({id,data,entries})=>{
      if(data.strategy==="new_arrivals"||data.strategy==="top_selling"||data.strategy==="curated"){
        const items=(entries as CatalogProduct[]).map((product)=>adaptProduct(product));
        const Component=data.strategy==="top_selling"?TopSellingSection:NewArrivalsSection;
        return <Component key={id} title={data.title} products={items.slice(0,4)}/>;
      }
      if (!entries.length) return null;
      if(data.strategy==="tiles")return <section key={id} className="mx-auto my-10 w-full max-w-[1360px] rounded-[30px] bg-zinc-100 p-5 sm:p-10">
        <h2 className="mb-6 text-center text-3xl font-black uppercase">{data.title}</h2>
        <div className="grid gap-4 sm:grid-cols-2">{(entries as Tile[]).map((tile,index)=><Link key={index} href={tile.link_url??"/products"} className="relative min-h-44 overflow-hidden rounded-2xl bg-white"><span className="absolute left-5 top-5 z-10 rounded-lg bg-white/85 px-2 text-xl font-bold">{tile.title}</span>{tile.image_url&&<Image src={tile.image_url} alt={tile.image_alt??""} fill unoptimized className="object-cover object-right" sizes="50vw"/>}</Link>)}</div>
      </section>;
      return <section key={id} className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-10"><h2 className="mb-4 text-2xl font-bold">{data.title}</h2><div className="flex flex-wrap gap-3">{(entries as {id:string;name:string;slug:string}[]).map((entry)=><Link className="rounded-full border border-zinc-300 px-4 py-2" key={entry.id} href={"/products?"+(data.strategy==="brands"?"brand":"category")+"="+encodeURIComponent(entry.slug)}>{entry.name}</Link>)}</div></section>;
    })}
    {home.promotions.map(({id,data})=><section key={id} className="mx-5 my-5 rounded-2xl bg-black p-6 text-white sm:mx-10"><h2 className="text-2xl font-bold">{data.title}</h2>{data.body&&<p>{data.body}</p>}{data.link_url&&<Link className="underline" href={data.link_url}>{data.link_label??"Learn more"}</Link>}</section>)}
    {home.testimonials.length>0&&<section className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-10"><h2 className="mb-6 text-3xl font-bold">Customer testimonials</h2><div className="grid gap-4 md:grid-cols-3">{home.testimonials.map(({id,data})=><figure className="rounded-2xl border p-5" key={id}><blockquote>{data.quote}</blockquote><figcaption className="mt-3 text-sm font-semibold">{data.author}</figcaption></figure>)}</div></section>}
  </div>;
}
export default function HomePage() { return <Suspense fallback={<p className="p-12" role="status">Loading storefront…</p>}><HomeContent /></Suspense>; }
