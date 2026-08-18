const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

// Secure In-Memory Token Storage (RAM ONLY - Protected against XSS Attacks)
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const currentToken = getAccessToken();
  if (currentToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${currentToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Ensures HttpOnly refresh cookies are sent automatically by browser
  };

  let response = await fetch(url, config);

  // Auto-refresh token flow on 401 Unauthorized via HttpOnly cookie
  if (
    response.status === 401 &&
    !endpoint.includes("/users/login/") &&
    !endpoint.includes("/users/token/refresh/")
  ) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/users/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newAccessToken = refreshData.access;
        setAccessToken(newAccessToken);

        // Retry original request with new in-memory access token
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        response = await fetch(url, { ...config, headers });
      } else {
        setAccessToken(null);
      }
    } catch {
      setAccessToken(null);
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.detail || "An unexpected error occurred.";
    throw new Error(errorMessage);
  }

  return data as T;
}
