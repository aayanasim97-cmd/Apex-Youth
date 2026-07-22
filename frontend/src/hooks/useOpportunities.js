"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getOpportunities } from "@/lib/opportunities";

export function useOpportunities(filters) {
  return useInfiniteQuery({
    queryKey: ["opportunities", filters],
    queryFn: ({ pageParam }) => getOpportunities({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null,
  });
}
