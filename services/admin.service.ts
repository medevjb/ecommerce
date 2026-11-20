import { apiClient } from "@/lib/api-client";
import {
  AdminDashboardMetrics,
  AdminCustomer,
  AdminProductFormValues,
  Order,
  OrderStatus,
  Product,
  PaginatedResponse,
} from "@/types";

export const adminService = {
  // Metrics
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    return apiClient<AdminDashboardMetrics>("/admin/analytics/overview");
  },

  // Products
  async getProducts(params?: { page?: number; limit?: number; query?: string }): Promise<PaginatedResponse<Product>> {
    return apiClient<PaginatedResponse<Product>>("/admin/products", { params });
  },

  async createProduct(data: AdminProductFormValues): Promise<Product> {
    return apiClient<Product>("/admin/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: Partial<AdminProductFormValues>): Promise<Product> {
    return apiClient<Product>(`/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/admin/products/${id}`, {
      method: "DELETE",
    });
  },

  // Orders
  async getOrders(params?: { status?: OrderStatus; page?: number }): Promise<PaginatedResponse<Order>> {
    return apiClient<PaginatedResponse<Order>>("/admin/orders", { params });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return apiClient<Order>(`/admin/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Customers
  async getCustomers(): Promise<AdminCustomer[]> {
    return apiClient<AdminCustomer[]>("/admin/customers");
  },
};
