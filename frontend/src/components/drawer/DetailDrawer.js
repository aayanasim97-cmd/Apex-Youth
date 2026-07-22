"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Calendar, Globe, Monitor, MapPin, ExternalLink, Bookmark, ShieldAlert, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFilterStore } from "@/store/filterStore";

export default function DetailDrawer({ opportunity }) {
  const router = useRouter();
  const { user } = useAuth();
  const { savedOpportunityIds, toggleSaveOpportunity } = useFilterStore();
  const isSaved = opportunity ? savedOpportunityIds.includes(opportunity.id) : false;
  
  // Close handles going back in history (restoring url state)
  const close = () => {
    router.back();
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!opportunity) return null;

  const {
    title,
    description,
    source_url,
    application_url,
    category,
    min_age,
    max_age,
    is_worldwide,
    eligible_home_countries = [],
    destination_country,
    is_online,
    is_onsite,
    deadline,
    days_until_deadline,
  } = opportunity;

  const categoryLabel = {
    learning: "Learning & Scholarships",
    volunteering: "Volunteering",
    working: "Working & Internships",
    making_change: "Making a Change",
    competing: "Competing",
  }[category] || category;

  const isLastMinute = days_until_deadline >= 3 && days_until_deadline <= 5;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        />

        {/* Drawer slide-out panel */}
        <motion.aside
          className="relative h-full w-full sm:w-[500px] border-l border-border-custom bg-slate-raised p-8 shadow-2xl overflow-y-auto flex flex-col justify-between"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
        >
          {/* Main content area */}
          <div>
            {/* Header close button & Category */}
            <div className="flex items-center justify-between pb-4 border-b border-border-custom/50 mb-6">
              <span className="font-mono text-xs text-signal tracking-widest uppercase font-semibold">
                {categoryLabel}
              </span>
              <button
                onClick={close}
                className="rounded-full p-2 text-mist hover:bg-slate-surface hover:text-white transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Travel Route Info */}
            <div className="flex items-center gap-6 py-4 px-5 rounded-xl bg-slate-surface border border-border-custom/40 mb-6">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-mist">ORIGIN</span>
                <span className="font-display font-bold text-sm text-white">
                  {is_worldwide ? "WORLDWIDE" : "RESTRICTED"}
                </span>
              </div>
              <div className="flex-1 h-px border-t border-dashed border-border-custom" />
              <div className="flex flex-col text-right">
                <span className="font-mono text-[10px] text-mist">DESTINATION</span>
                <span className="font-display font-bold text-sm text-white">
                  {is_online ? "REMOTE (ONLINE)" : (destination_country || "ANYWHERE")}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="font-display font-bold text-2xl text-white leading-tight mb-4">
              {title}
            </h1>
            
            <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed mb-8">
              <p className="whitespace-pre-line">{description}</p>
            </div>

            {/* Metadata list */}
            <div className="space-y-4 border-t border-border-custom/40 pt-6">
              <h3 className="font-display font-bold text-sm text-white tracking-wide uppercase">
                Journey Parameters
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs font-mono text-mist">
                  <ShieldAlert className="h-4 w-4 text-signal/70" />
                  <div>
                    <div className="text-[10px] text-mist/60 uppercase">Age eligibility</div>
                    <div className="text-white font-bold">
                      {min_age ?? "Any"}–{max_age ?? "Any"} years
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-mist">
                  <Calendar className="h-4 w-4 text-signal/70" />
                  <div>
                    <div className="text-[10px] text-mist/60 uppercase">Closing Date</div>
                    <div className="text-white font-bold">
                      {deadline}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-mist">
                  <Monitor className="h-4 w-4 text-signal/70" />
                  <div>
                    <div className="text-[10px] text-mist/60 uppercase">Format</div>
                    <div className="text-white font-bold">
                      {is_online && is_onsite ? "Hybrid" : is_online ? "Online Only" : "Onsite Only"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-mist">
                  <Globe className="h-4 w-4 text-signal/70" />
                  <div>
                    <div className="text-[10px] text-mist/60 uppercase">Passport status</div>
                    <div className="text-white font-bold">
                      {is_worldwide ? "Universal Access" : "Check Eligible List"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Eligible Countries List */}
              {!is_worldwide && eligible_home_countries.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-slate-surface/50 border border-border-custom/30 text-xs">
                  <span className="font-mono text-mist block mb-1">ELIGIBLE CITIZENSHIPS:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {eligible_home_countries.map((code) => (
                      <span key={code} className="font-mono px-2 py-0.5 bg-slate-raised text-signal rounded text-[10px] font-bold border border-signal/15">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (CTAs) */}
          <div className="flex gap-4 border-t border-border-custom/50 pt-6 mt-8">
            <a
              href={application_url || source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-bold text-abyss hover:shadow-glow hover:bg-white transition-all duration-300 ease-smooth"
            >
              Apply Now
              <ExternalLink className="h-4 w-4" />
            </a>
            
            {opportunity && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
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
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  isSaved
                    ? "border-signal bg-signal/10 text-signal hover:bg-signal/20"
                    : "border-border-custom bg-slate-surface text-white hover:border-signal/30 hover:bg-slate-raised"
                }`}
                title={isSaved ? "Remove from Boarding Passes" : "Save this journey"}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-signal text-signal" : ""}`} />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
