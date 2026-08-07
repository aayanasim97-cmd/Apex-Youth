export async function apiFetch(path, options = {}) {
  const isServer = typeof window === "undefined";
  
  // Natively target full-stack Next.js API Routes directly
  const baseUrl = isServer 
    ? (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") 
    : "";
    
  const url = `${baseUrl}${path}`;
  
  const mergedOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // Browser fetches must include credentials to send/receive HttpOnly cookies
  if (!isServer) {
    mergedOptions.credentials = "include";
  }

  let res = await fetch(url, mergedOptions);

  // Auto-refresh access token on 401 client-side
  if (res.status === 401 && !isServer && !path.includes("/api/auth/refresh")) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (refreshRes.ok) {
        // Retry the original request once
        res = await fetch(url, mergedOptions);
      }
    } catch (err) {
      console.error("Silent refresh failed:", err);
    }
  }

  // If we are on the client side and still have a 401 response status,
  // clear the logged-in user profile inside the Zustand authStore
  if (res.status === 401 && !isServer) {
    try {
      const { useAuthStore } = require("@/store/authStore");
      useAuthStore.getState().setUser(null);
    } catch (err) {
      console.error("Failed to reset auth store:", err);
    }
  }

  return res;
}
