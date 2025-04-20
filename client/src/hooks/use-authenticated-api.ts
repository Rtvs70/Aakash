import { useAuth } from "@/hooks/use-auth";

type ApiOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
};

export function useAuthenticatedApi() {
  const { user, isAuthenticated } = useAuth();

  async function authApiRequest(url: string, options: ApiOptions = {}) {
    // Don't attempt if not authenticated
    if (!isAuthenticated || !user) {
      throw new Error("Not authenticated");
    }

    const headers: Record<string, string> = {
      ...(options.headers || {}),
      "X-User-ID": String(user.id),
      "Authorization": `Bearer ${user.id}`,
    };

    if (options.body && typeof options.body !== "string" && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body && typeof options.body !== "string" && !(options.body instanceof FormData) 
        ? JSON.stringify(options.body) 
        : options.body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `API request failed with status ${response.status}`
      );
    }

    return response.json();
  }

  return {
    get: (url: string) => authApiRequest(url, { method: "GET" }),
    post: (url: string, body: any) => authApiRequest(url, { method: "POST", body }),
    put: (url: string, body: any) => authApiRequest(url, { method: "PUT", body }),
    patch: (url: string, body: any) => authApiRequest(url, { method: "PATCH", body }),
    delete: (url: string) => authApiRequest(url, { method: "DELETE" }),
  };
}