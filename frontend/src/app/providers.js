"use client";
import { useEffect } from "react";
import { QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { AuthProvider } from "@/hooks/useAuth";
import { useFilterStore } from "@/store/filterStore";
import { db } from "@/lib/db";

export default function Providers({ children, dehydratedState }) {
  const queryClient = getQueryClient();
  const { setSavedOpportunityIds } = useFilterStore();

  useEffect(() => {
    async function initBookmarks() {
      if (typeof window !== "undefined" && db) {
        try {
          const bookmarks = await db.bookmarks.toArray();
          const ids = bookmarks.map((b) => b.id);
          setSavedOpportunityIds(ids);
        } catch (err) {
          console.error("Failed to load bookmarks from IndexedDB:", err);
        }
      }
    }
    initBookmarks();
  }, [setSavedOpportunityIds]);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
