"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useOpportunities } from "@/hooks/useOpportunities";
import { useFilterStore } from "@/store/filterStore";
import { OpportunityCard } from "./OpportunityCard";
import { OpportunityGridSkeleton } from "@/components/ui/OpportunitySkeleton";
import { Compass, Sparkles, RefreshCw } from "lucide-react";

export function OpportunityGrid() {
  const { age, homeCountry, destinationCountry, mode, lastMinute, category, status, searchQuery } = useFilterStore();
  
  // Combine filters to trigger React Query refetching
  const filters = {
    age,
    homeCountry,
    destinationCountry,
    mode,
    lastMinute,
    category,
    status,
    search: searchQuery,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useOpportunities(filters);

  // Setup client-side IntersectionObserver for infinite scrolling
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTrigger = triggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isLoading]);

  if (isLoading) {
    return <OpportunityGridSkeleton count={6} />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-red-500/20 rounded-2xl bg-red-950/5">
        <Compass className="h-10 w-10 text-red-400 animate-spin" />
        <h3 className="text-lg font-bold text-white mt-4">Failed to fetch paths</h3>
        <p className="text-sm text-mist mt-1 max-w-md">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-xs font-mono font-bold text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> RETRY LOAD
        </button>
      </div>
    );
  }

  // Flatten TanStack paginated results
  const opportunities = data?.pages.flatMap((page) => page.results) || [];

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-border-custom bg-slate-surface/30 rounded-2xl">
        <Compass className="h-12 w-12 text-mist/40 mb-4 stroke-[1.5]" />
        <h3 className="font-display text-lg font-bold text-white">No active journeys found</h3>
        <p className="text-sm text-mist mt-1 max-w-sm">
          No opportunities match your current filter settings. Try adjusting your age limits or location settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opp) => (
          <Link
            key={opp.id}
            href={`/opportunity/${opp.id}`}
            scroll={false} // Prevents browser scroll reset, maintaining feed position
            className="focus:outline-none focus:ring-2 focus:ring-signal rounded-2xl"
          >
            <OpportunityCard opportunity={opp} />
          </Link>
        ))}
      </div>

      {/* Loading indicator for infinite scrolling */}
      {isFetchingNextPage && (
        <div className="py-6">
          <OpportunityGridSkeleton count={3} />
        </div>
      )}

      {/* Intersection observer trigger boundary */}
      {hasNextPage && !isFetchingNextPage && (
        <div ref={triggerRef} className="h-10 w-full" />
      )}

      {!hasNextPage && opportunities.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-8 text-xs font-mono text-mist">
          <Sparkles className="h-4 w-4 text-signal" />
          <span>YOU HAVE REACHED THE END OF THIS ROUTE</span>
        </div>
      )}
    </div>
  );
}
