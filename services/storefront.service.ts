import { apiClient } from "@/lib/api-client";
import { Product, Category, ProductFilterParams, PaginatedResponse } from "@/types";

export const storefrontService = {
  // Products
  async getProducts(params?: ProductFilterParams): Promise<PaginatedResponse<Product>> {
    return apiClient<PaginatedResponse<Product>>("/products", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  async getFeaturedProducts(): Promise<Product[]> {
    return apiClient<Product[]>("/products/featured");
  },

  async getProductBySlug(slug: string): Promise<Product> {
    return apiClient<Product>(`/products/${slug}`);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return apiClient<Category[]>("/categories");
  },

  async getCategoryBySlug(slug: string): Promise<Category> {
    return apiClient<Category>(`/categories/${slug}`);
  },

  // Search
  async searchProducts(query: string): Promise<Product[]> {
    return apiClient<Product[]>("/products/search", { params: { q: query } });
  },
};
