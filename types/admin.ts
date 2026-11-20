import { Order } from "./customer";
import { Product } from "./storefront";

export interface AdminDashboardMetrics {
  totalRevenue: number;
  revenueChangePercentage: number;
  totalOrders: number;
  ordersChangePercentage: number;
  totalCustomers: number;
  customersChangePercentage: number;
  conversionRate: number;
  recentOrders: Order[];
  topProducts: Product[];
}

export interface AdminProductFormValues {
  title: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId: string;
  stock: number;
  sku: string;
  images: string[];
  inStock: boolean;
  featured: boolean;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  status: "active" | "inactive" | "blocked";
  joinedDate: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSpend?: number;
  usageLimit?: number;
  timesUsed: number;
  startDate: string;
  endDate: string;
  active: boolean;
}
