import { backend } from "@/lib/staff-api";
import { apiClient } from "@/lib/api-client";
import { LoginCredentials, RegisterCredentials, User } from "@/types";

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (typeof window !== "undefined" && res.token) {
      localStorage.setItem("auth_token", res.token);
    }
    return res;
  },

  async adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (typeof window !== "undefined" && res.token) {
      localStorage.setItem("admin_token", res.token);
    }
    return res;
  },

  async register(data: RegisterCredentials): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) await backend("/auth/logout",{method:"POST",token}).catch(() => undefined);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("admin_token");
    }
  },

  async getSession(): Promise<User | null> {
    if (typeof window !== "undefined" && !localStorage.getItem("auth_token")) {
      return null;
    }
    return backend<User>("/me", { token: localStorage.getItem("auth_token") })
      .then(({ data }) => ({ ...data, role: "customer" as const })).catch(() => null);
  },
};
