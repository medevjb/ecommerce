export const SITE_CONFIG = {
  name: "Modern Commerce",
  description: "Next-generation high performance ecommerce storefront and management platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  currency: "USD",
  currencySymbol: "$",
  supportEmail: "support@example.com",
};

export const ROUTES = {
  // Storefront
  home: "/",
  products: "/products",
  productDetail: (slug: string) => `/products/${slug}`,
  categories: "/categories",
  categoryDetail: (slug: string) => `/categories/${slug}`,
  cart: "/cart",
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",
  search: "/search",
  wishlist: "/wishlist",

  // Customer Account
  account: {
    dashboard: "/account",
    orders: "/account/orders",
    orderDetail: (id: string) => `/account/orders/${id}`,
    addresses: "/account/addresses",
    profile: "/account/profile",
  },

  // Auth
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    adminLogin: "/admin-login",
  },

  // Admin Portal
  admin: {
    dashboard: "/admin",
    products: "/admin/products",
    newProduct: "/admin/products/new",
    editProduct: (id: string) => `/admin/products/${id}`,
    categories: "/admin/categories",
    orders: "/admin/orders",
    orderDetail: (id: string) => `/admin/orders/${id}`,
    customers: "/admin/customers",
    customerDetail: (id: string) => `/admin/customers/${id}`,
    coupons: "/admin/coupons",
    settings: "/admin/settings",
  },
} as const;

export const ORDER_STATUSES = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
} as const;
