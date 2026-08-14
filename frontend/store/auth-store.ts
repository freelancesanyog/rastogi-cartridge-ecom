import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setAccessToken, getAccessToken, fetchApi } from "@/lib/api-client";

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_staff: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  clearAuth: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        setAccessToken(token);
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        setAccessToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },
      checkSession: async () => {
        try {
          let currentToken = getAccessToken() || get().token;

          // Attempt to refresh in-memory access token via HttpOnly refresh cookie if needed
          if (!currentToken) {
            const refreshRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}/users/token/refresh/`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
              }
            );
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              currentToken = refreshData.access;
            }
          }

          if (!currentToken) {
            get().clearAuth();
            return;
          }

          setAccessToken(currentToken);
          const profile = await fetchApi<UserProfile>("/users/me/");
          set({ user: profile, token: currentToken, isAuthenticated: true });
        } catch {
          get().clearAuth();
        }
      },
    }),
    {
      name: "rastogi_auth_session",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAccessToken(state.token);
        }
      },
    }
  )
);
