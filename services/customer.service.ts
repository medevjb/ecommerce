import { apiClient } from "@/lib/api-client";
import { CustomerProfile, Order, Address, WishlistItem } from "@/types";

export const customerService = {
  async getProfile(): Promise<CustomerProfile> {
    return apiClient<CustomerProfile>("/customer/profile");
  },

  async updateProfile(data: Partial<CustomerProfile>): Promise<CustomerProfile> {
    return apiClient<CustomerProfile>("/customer/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    return apiClient<Order[]>("/customer/orders");
  },

  async getOrderById(orderId: string): Promise<Order> {
    return apiClient<Order>(`/customer/orders/${orderId}`);
  },

  // Addresses
  async getAddresses(): Promise<Address[]> {
    return apiClient<Address[]>("/customer/addresses");
  },

  async addAddress(address: Omit<Address, "id">): Promise<Address> {
    return apiClient<Address>("/customer/addresses", {
      method: "POST",
      body: JSON.stringify(address),
    });
  },

  async deleteAddress(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/customer/addresses/${id}`, {
      method: "DELETE",
    });
  },

  // Wishlist
  async getWishlist(): Promise<WishlistItem[]> {
    return apiClient<WishlistItem[]>("/customer/wishlist");
  },

  async addToWishlist(productId: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>("/customer/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  },

  async removeFromWishlist(productId: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/customer/wishlist/${productId}`, {
      method: "DELETE",
    });
  },
};
