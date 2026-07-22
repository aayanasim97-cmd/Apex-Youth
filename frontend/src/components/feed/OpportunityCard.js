"use client";
import React from "react";
import { Calendar, Globe, Monitor, MapPin, Bookmark, Compass, Award } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";

export const OpportunityCard = React.memo(function OpportunityCard({ 
  opportunity
}) {
  const { savedOpportunityIds, toggleSaveOpportunity } = useFilterStore();
  const isSaved = savedOpportunityIds.includes(opportunity.id);

  const {
    id,
    title,
    description,
    category,
    min_age,
    max_age,
    is_worldwide,
    destination_country,
    is_online,
    is_onsite,
    deadline,
    days_until_deadline,
  } = opportunity;

  // Formatting category display names
  const categoryLabel = {
    learning: "Scholarship",
    volunteering: "Volunteering",
    working: "Internship",
    making_change: "Fellowship",
    competing: "Competition",
  }[category] || category;

  // Professional semi-transparent badge colors with subtle borders
  const categoryStyles = {
    learning: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
    volunteering: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
    working: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
    making_change: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    competing: "text-rose-400 bg-rose-500/10 border border-rose-500/20",
  }[category] || "text-gray-400 bg-gray-500/10 border border-gray-500/20";

  // Determine if it is a last minute opportunity (expiring in 3-5 days)
  const isLastMinute = days_until_deadline >= 3 && days_until_deadline <= 5;

  const formatDeadline = () => {
    if (days_until_deadline === null || days_until_deadline === undefined) {
      if (!deadline) return "No Deadline";
      try {
        const d = new Date(deadline);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      } catch {
        return deadline;
      }
    }
    if (days_until_deadline < 0) {
      return "Closed";
    }
    if (days_until_deadline === 0) {
      return "Closes Today";
    }
    if (days_until_deadline === 1) {
      return "1 day left";
    }
    if (days_until_deadline <= 14) {
      return `${days_until_deadline} days left`;
    }
    try {
      const d = new Date(deadline);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return `${days_until_deadline} days left`;
    }
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    toggleSaveOpportunity(id);
    
    if (typeof window !== "undefined") {
      const { db } = await import("@/lib/db");
      if (db) {
        try {
          if (isSaved) {
            await db.bookmarks.delete(id);
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
    <article className="opportunity-card relative flex flex-col justify-between h-[350px] rounded-xl border border-border-custom bg-slate-surface p-6 shadow-sm hover:shadow-md hover:border-signal/30 hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden">
      
      {/* Card Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${categoryStyles}`}>
            {categoryLabel}
          </span>
          <button
            onClick={handleSaveClick}
            className="rounded-full p-2 text-mist hover:bg-slate-raised hover:text-signal transition-colors duration-200"
            title={isSaved ? "Saved" : "Save Opportunity"}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-signal text-signal" : ""}`} />
          </button>
        </div>

        {/* Journey Route Line */}
        <div className="flex items-center justify-between py-2 border-b border-border-custom/30">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-mist uppercase">FROM</span>
            <span className="font-display font-bold text-sm text-white">
              {is_worldwide ? "GLOBAL" : "REGIONAL"}
            </span>
          </div>

          <div className="flex-1 px-4 relative flex items-center justify-center">
            {is_online ? (
              <div className="w-full border-t border-dashed border-border-custom/80 h-0 group-hover:border-signal/40 transition-colors" />
            ) : (
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path
                  d="M 5 15 Q 50 0 95 15"
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="1.5"
                />
                <path
                  className="route-line-svg"
                  d="M 5 15 Q 50 0 95 15"
                  fill="none"
                  stroke="var(--color-signal)"
                  strokeWidth="2"
                  strokeDasharray="200"
                  strokeDashoffset="200"
                />
                <circle cx="5" cy="15" r="3" fill="var(--color-signal)" />
                <circle cx="95" cy="15" r="3" fill="var(--color-signal)" />
              </svg>
            )}
          </div>

          <div className="flex flex-col text-right">
            <span className="font-mono text-[10px] text-mist uppercase">TO</span>
            <span className="font-display font-bold text-sm text-white">
              {is_online ? "ONLINE" : (destination_country || "GLOBAL")}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="font-display font-bold text-base text-white line-clamp-2 leading-snug group-hover:text-signal transition-colors duration-200 mt-2">
          {title}
        </h3>
        <p className="text-xs text-mist line-clamp-3 leading-relaxed mt-1">
          {description}
        </p>
      </div>

      {/* Card Footer */}
      <div className="flex items-end justify-between mt-auto pt-4 border-t border-border-custom/30">
        <div className="flex flex-col gap-1.5 text-xs text-mist font-mono">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-signal/70" />
            <span>
              {is_worldwide ? "Worldwide" : "Specific Countries"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-signal/70" />
            <span>
              Age: {min_age ?? "Any"}–{max_age ?? "Any"}
            </span>
          </div>
        </div>

        {isLastMinute ? (
          <div className="relative flex h-12 w-12 items-center justify-center border-2 border-dashed border-red-500/80 rounded-full text-red-500 text-[9px] font-mono font-bold uppercase rotate-12 select-none">
            <span className="text-center leading-none">
              LAST<br />MIN
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-end font-mono">
            <span className="text-[9px] text-mist">DEADLINE</span>
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-signal" />
              {formatDeadline()}
            </span>
          </div>
        )}
      </div>
    </article>
  );
});
