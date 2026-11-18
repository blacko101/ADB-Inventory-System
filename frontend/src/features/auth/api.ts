import { apiRequest } from "../../lib/api";
import type { User } from "../../types/inventory";

export const authApi = {
  getSession: () => apiRequest<User>("/api/session"),
  login: (email: string, password: string) =>
    apiRequest<User>("/api/session/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => apiRequest<void>("/api/session/logout", { method: "POST" }),
};
