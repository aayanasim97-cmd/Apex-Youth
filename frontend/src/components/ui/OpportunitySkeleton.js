import React from "react";

export default function OpportunitySkeleton() {
  return (
    <div className="flex flex-col justify-between h-[360px] rounded-2xl border border-border-custom bg-slate-surface/40 p-6 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-raised" />
          <div className="h-8 w-8 rounded-full bg-slate-raised" />
        </div>
        
        <div className="flex items-center justify-between py-2 border-b border-border-custom/30">
          <div className="h-6 w-8 rounded bg-slate-raised" />
          <div className="flex-1 px-4">
            <div className="h-2 w-full rounded bg-slate-raised" />
          </div>
          <div className="h-6 w-8 rounded bg-slate-raised" />
        </div>

        <div className="h-6 w-3/4 rounded bg-slate-raised mt-2" />
        <div className="space-y-2 mt-2">
          <div className="h-4 w-full rounded bg-slate-raised" />
          <div className="h-4 w-full rounded bg-slate-raised" />
          <div className="h-4 w-2/3 rounded bg-slate-raised" />
        </div>
      </div>

      <div className="flex items-end justify-between mt-auto pt-4 border-t border-border-custom/30">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-slate-raised" />
          <div className="h-3 w-20 rounded bg-slate-raised" />
        </div>
        <div className="h-8 w-16 rounded bg-slate-raised" />
      </div>
    </div>
  );
}

export function OpportunityGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <OpportunitySkeleton key={i} />
      ))}
    </div>
  );
}
