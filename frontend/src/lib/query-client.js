import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient;
export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a fresh QueryClient
    return makeQueryClient();
  }
  // Browser: create a singleton QueryClient
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
