"use client";
import React from "react";
import { Bookmark } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";

export default function SaveButton({ opportunity }) {
  const { savedOpportunityIds, toggleSaveOpportunity } = useFilterStore();
  const isSaved = opportunity ? savedOpportunityIds.includes(opportunity.id) : false;

  const handleSaveClick = async (e) => {
    e.preventDefault();
    if (!opportunity) return;
    
    toggleSaveOpportunity(opportunity.id);
    
    if (typeof window !== "undefined") {
      const { db } = await import("@/lib/db");
      if (db) {
        try {
          if (isSaved) {
            await db.bookmarks.delete(opportunity.id);
          } else {
            await db.bookmarks.put(opportunity);
          }
        } catch (err) {
          console.error("Failed to update IndexedDB bookmark:", err);
        }
      }
    }
  };

  return (
    <button
      onClick={handleSaveClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-6 py-4 text-sm font-semibold transition-all duration-300 ${
        isSaved
          ? "border-signal bg-signal/10 text-signal hover:bg-signal/20"
          : "border-border-custom bg-slate-surface text-white hover:border-signal/30 hover:bg-slate-raised"
      }`}
      title={isSaved ? "Remove from Boarding Passes" : "Save this journey"}
    >
      <Bookmark className={`h-4 w-4 ${isSaved ? "fill-signal text-signal" : ""}`} />
      <span>{isSaved ? "Saved Opportunity" : "Save Opportunity"}</span>
    </button>
  );
}
