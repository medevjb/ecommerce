export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  isDefault?: boolean;
  salePrice?: number;
  stock: number;
  attributes: Record<string, string>; // e.g., { color: 'Blue', size: 'M' }
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  images: string[];
  thumbnail: string;
  category: Category;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  featured?: boolean;
  tags?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  variants?: ProductVariant[];
  variantLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  variantId?: string;
  sku?: string;
  conflict?: string;
  selectedAttributes?: Record<string, string>;
  price: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  totalItems: number;
}

export interface ProductFilterParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price-asc" | "price-desc" | "newest" | "rating" | "popular";
  page?: number;
  limit?: number;
  query?: string;
}

export interface CustomerReview {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  comment: string;
  date?: string;
}

export interface DressStyle {
  id: string;
  title: string;
  slug: string;
  image: string;
  className?: string;
}
