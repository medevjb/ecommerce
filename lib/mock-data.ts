import { Product, CustomerReview, DressStyle } from "@/types";

export const NEW_ARRIVALS: Product[] = [
  {
    id: "prod-na-1",
    title: "T-shirt with Tape Details",
    slug: "t-shirt-with-tape-details",
    description:
      "Crafted with ultra-soft breathable combed cotton and minimalist contrast tape detailing. An effortless staple for everyday modern streetwear.",
    price: 120,
    thumbnail: "/products/shirt.png",
    images: ["/products/shirt.png"],
    category: { id: "cat-tshirts", name: "T-Shirts", slug: "t-shirts" },
    rating: 4.5,
    reviewsCount: 142,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-na-2",
    title: "Skinny Fit Jeans",
    slug: "skinny-fit-jeans",
    description:
      "Engineered with premium stretch-denim for unmatched comfort and silhouette retention. Classic 5-pocket styling with authentic indigo wash.",
    price: 240,
    originalPrice: 260,
    discountPercent: 20,
    thumbnail: "/products/pent.png",
    images: ["/products/pent.png"],
    category: { id: "cat-jeans", name: "Jeans", slug: "jeans" },
    rating: 3.5,
    reviewsCount: 89,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-na-3",
    title: "Checkered Shirt",
    slug: "checkered-shirt",
    description:
      "Timeless yarn-dyed cotton flannel featuring rich burgundy and navy check pattern. Features a button-down collar and tailored slim-regular cut.",
    price: 180,
    thumbnail: "/products/shirt-full.png",
    images: ["/products/shirt-full.png"],
    category: { id: "cat-shirts", name: "Shirts", slug: "shirts" },
    rating: 4.5,
    reviewsCount: 160,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-na-4",
    title: "Sleeve Striped T-shirt",
    slug: "sleeve-striped-t-shirt",
    description:
      "Athletic raglan-inspired tee crafted from lightweight breathable jersey. Vibrant sunset orange core accented with contrast striped sleeves.",
    price: 130,
    originalPrice: 160,
    discountPercent: 30,
    thumbnail: "/products/jersey.png",
    images: ["/products/jersey.png"],
    category: { id: "cat-tshirts", name: "T-Shirts", slug: "t-shirts" },
    rating: 4.5,
    reviewsCount: 215,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const TOP_SELLING: Product[] = [
  {
    id: "prod-ts-1",
    title: "Vertical Striped Shirt",
    slug: "vertical-striped-shirt",
    description:
      "Lightweight poplin cotton shirt with olive vertical pinstripes. Relaxed resort collar designed for casual warm-weather dressing.",
    price: 212,
    originalPrice: 232,
    discountPercent: 20,
    thumbnail: "/products/shirtfull2.png",
    images: ["/products/shirtfull2.png"],
    category: { id: "cat-shirts", name: "Shirts", slug: "shirts" },
    rating: 5.0,
    reviewsCount: 310,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-ts-2",
    title: "Courage Graphic T-shirt",
    slug: "courage-graphic-t-shirt",
    description:
      "Heavyweight vintage wash graphic t-shirt featuring high-density gradient typography. Drop shoulder relaxed streetwear fit.",
    price: 145,
    thumbnail: "/products/tshirt2.png",
    images: ["/products/tshirt2.png"],
    category: { id: "cat-tshirts", name: "T-Shirts", slug: "t-shirts" },
    rating: 4.0,
    reviewsCount: 94,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-ts-3",
    title: "Loose Fit Bermuda Shorts",
    slug: "loose-fit-bermuda-shorts",
    description:
      "Relaxed vintage blue denim shorts with washed fading and raw hem detail. Built for everyday summer recreation.",
    price: 80,
    thumbnail: "/products/shortpent.png",
    images: ["/products/shortpent.png"],
    category: { id: "cat-shorts", name: "Shorts", slug: "shorts" },
    rating: 3.0,
    reviewsCount: 42,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-ts-4",
    title: "Faded Skinny Jeans",
    slug: "faded-skinny-jeans",
    description:
      "Charcoal-washed premium stretch denim with whiskered thighs and clean finish. Sleek contouring fit with comfort flex waistband.",
    price: 210,
    thumbnail: "/products/pent2.png",
    images: ["/products/pent2.png"],
    category: { id: "cat-jeans", name: "Jeans", slug: "jeans" },
    rating: 4.5,
    reviewsCount: 182,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const ONE_LIFE_PRODUCT: Product = {
  id: "prod-onelife-1",
  title: "ONE LIFE GRAPHIC T-SHIRT",
  slug: "one-life-graphic-t-shirt",
  description:
    "This graphic t-shirt which is perfect for any occasion. Crafted from a soft and breathable fabric, it offers superior comfort and style.",
  price: 260,
  originalPrice: 300,
  discountPercent: 40,
  thumbnail: "/products/onelife-1.jpg",
  images: [
    "/products/onelife-1.jpg",
    "/products/onelife-2.jpg",
    "/products/onelife-3.jpg",
  ],
  category: { id: "cat-tshirts", name: "T-shirts", slug: "t-shirts" },
  rating: 4.5,
  reviewsCount: 451,
  inStock: true,
  colors: [
    { name: "Olive", hex: "#4F4631" },
    { name: "Forest", hex: "#314F4A" },
    { name: "Navy", hex: "#31344F" },
  ],
  sizes: ["Small", "Medium", "Large", "X-Large"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const RELATED_PRODUCTS: Product[] = [
  {
    id: "rel-1",
    title: "Polo with Contrast Trims",
    slug: "polo-with-contrast-trims",
    description: "Classic polo shirt with contrast collar and sleeve trims.",
    price: 212,
    originalPrice: 242,
    discountPercent: 20,
    thumbnail: "/products/polo-contrast.jpg",
    images: ["/products/polo-contrast.jpg"],
    category: { id: "cat-tshirts", name: "T-shirts", slug: "t-shirts" },
    rating: 4.0,
    reviewsCount: 110,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "rel-2",
    title: "Gradient Graphic T-shirt",
    slug: "gradient-graphic-t-shirt",
    description: "Vibrant gradient chest print on soft combed cotton.",
    price: 145,
    originalPrice: 242,
    discountPercent: 20,
    thumbnail: "/products/gradient-tee.png",
    images: ["/products/gradient-tee.png"],
    category: { id: "cat-tshirts", name: "T-shirts", slug: "t-shirts" },
    rating: 3.5,
    reviewsCount: 78,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "rel-3",
    title: "Polo with Tipping Details",
    slug: "polo-with-tipping-details",
    description: "Textured pique knit with micro tipping along the ribbed collar.",
    price: 180,
    originalPrice: 242,
    discountPercent: 20,
    thumbnail: "/products/polo-tipping.png",
    images: ["/products/polo-tipping.png"],
    category: { id: "cat-tshirts", name: "T-shirts", slug: "t-shirts" },
    rating: 4.5,
    reviewsCount: 135,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "rel-4",
    title: "Black Striped T-shirt",
    slug: "black-striped-t-shirt",
    description: "Athletic raglan jersey with vintage vertical pinstripes.",
    price: 120,
    originalPrice: 150,
    discountPercent: 30,
    thumbnail: "/products/striped-tee.png",
    images: ["/products/striped-tee.png"],
    category: { id: "cat-tshirts", name: "T-shirts", slug: "t-shirts" },
    rating: 5.0,
    reviewsCount: 220,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const ALL_PRODUCTS = [
  ...NEW_ARRIVALS,
  ...TOP_SELLING,
  ONE_LIFE_PRODUCT,
  ...RELATED_PRODUCTS,
];

export const CASUAL_SHOP_PRODUCTS: Product[] = [
  RELATED_PRODUCTS[1], // 1. Gradient Graphic T-shirt ($145, 3.5/5)
  RELATED_PRODUCTS[2], // 2. Polo with Tipping Details ($180, 4.5/5)
  RELATED_PRODUCTS[3], // 3. Black Striped T-shirt ($120, $150, -30%, 5.0/5)
  NEW_ARRIVALS[1],     // 4. Skinny Fit Jeans ($240, $260, -20%, 3.5/5)
  NEW_ARRIVALS[2],     // 5. Checkered Shirt ($180, 4.5/5)
  NEW_ARRIVALS[3],     // 6. Sleeve Striped T-shirt ($130, $160, -30%, 4.5/5)
  TOP_SELLING[0],      // 7. Vertical Striped Shirt ($212, $232, -20%, 5.0/5)
  TOP_SELLING[1],      // 8. Courage Graphic T-shirt ($145, 4.0/5)
  TOP_SELLING[2],      // 9. Loose Fit Bermuda Shorts ($80, 3.0/5)
];

export const DRESS_STYLES: DressStyle[] = [
  {
    id: "style-casual",
    title: "Casual",
    slug: "casual",
    image: "/category-images/casual.png",
  },
  {
    id: "style-formal",
    title: "Formal",
    slug: "formal",
    image: "/category-images/formal.png",
  },
  {
    id: "style-party",
    title: "Party",
    slug: "party",
    image: "/category-images/party.png",
  },
  {
    id: "style-gym",
    title: "Gym",
    slug: "gym",
    image: "/category-images/gym.png",
  },
];

export const CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: "rev-1",
    name: "Sarah M.",
    rating: 5,
    verified: true,
    comment:
      '"I\'m blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I\'ve bought has exceeded my expectations."',
  },
  {
    id: "rev-2",
    name: "Alex K.",
    rating: 5,
    verified: true,
    comment:
      '"Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions."',
  },
  {
    id: "rev-3",
    name: "James L.",
    rating: 5,
    verified: true,
    comment:
      '"As someone who\'s always on the lookout for unique fashion pieces, I\'m thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends."',
  },
  {
    id: "rev-4",
    name: "Moo K.",
    rating: 5,
    verified: true,
    comment:
      '"As someone who\'s always on the lookout for unique fashion pieces, I\'m thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends."',
  },
  {
    id: "rev-5",
    name: "Samantha D.",
    rating: 5,
    verified: true,
    comment:
      '"The fit on these garments is unbelievable. It feels custom tailored right out of the box. The packaging was immaculate and customer support answered my sizing questions in minutes."',
  },
  {
    id: "rev-6",
    name: "Michael B.",
    rating: 5,
    verified: true,
    comment:
      '"High quality fabric, durable stitching, and ultra-fast shipping. This has easily become my go-to fashion store for both casual and formal occasions."',
  },
];

export interface ProductDetailReview {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  comment: string;
  date: string;
}

export const PRODUCT_DETAILS_REVIEWS: ProductDetailReview[] = [
  {
    id: "p-rev-1",
    name: "Samantha D.",
    rating: 5,
    verified: true,
    comment:
      '"I absolutely love this t-shirt! The design is unique and the fabric feels so comfortable. As a fellow designer, I appreciate the attention to detail. It\'s become my favorite go-to shirt."',
    date: "August 14, 2023",
  },
  {
    id: "p-rev-2",
    name: "Alex M.",
    rating: 4,
    verified: true,
    comment:
      '"The t-shirt exceeded my expectations! The colors are vibrant and the print quality is top-notch. Being a UI/UX designer myself, I\'m quite picky about aesthetics, and this t-shirt definitely gets a thumbs up from me."',
    date: "August 15, 2023",
  },
  {
    id: "p-rev-3",
    name: "Ethan R.",
    rating: 3.5,
    verified: true,
    comment:
      '"This t-shirt is a must-have for anyone who appreciates good design. The minimalistic yet stylish pattern caught my eye, and the fit is perfect. I can see the designer\'s touch in every aspect of this shirt."',
    date: "August 16, 2023",
  },
  {
    id: "p-rev-4",
    name: "Olivia P.",
    rating: 4,
    verified: true,
    comment:
      '"As a UI/UX enthusiast, I value simplicity and functionality. This t-shirt not only represents those principles but also feels great to wear. It\'s evident that the designer poured their creativity into making this t-shirt stand out."',
    date: "August 17, 2023",
  },
  {
    id: "p-rev-5",
    name: "Liam K.",
    rating: 4,
    verified: true,
    comment:
      '"This t-shirt is a fusion of comfort and creativity. The fabric is soft, and the design speaks volumes about the designer\'s skill. It\'s like wearing a piece of art that reflects my passion for both design and fashion."',
    date: "August 18, 2023",
  },
  {
    id: "p-rev-6",
    name: "Ava H.",
    rating: 4.5,
    verified: true,
    comment:
      '"I\'m not just wearing a t-shirt; I\'m wearing a piece of design philosophy. The intricate details and thoughtful layout of the design make this shirt a conversation starter."',
    date: "August 19, 2023",
  },
];
