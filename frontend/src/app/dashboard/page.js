"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { OpportunityCard } from "@/components/feed/OpportunityCard";
import { useFilterStore } from "@/store/filterStore";
import { db } from "@/lib/db";
import { Bookmark, Compass, PlaneTakeoff, ShieldAlert } from "lucide-react";

export default function DashboardPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { savedOpportunityIds } = useFilterStore();

  useEffect(() => {
    async function loadBookmarks() {
      if (typeof window !== "undefined" && db) {
        try {
          const data = await db.bookmarks.toArray();
          setBookmarks(data);
        } catch (err) {
          console.error("Failed to load bookmarks from IndexedDB:", err);
        }
      }
      setLoading(false);
    }
    loadBookmarks();
  }, [savedOpportunityIds]);

  return (
    <div className="min-h-screen bg-abyss flex flex-col justify-between">
      <div>
        <Navbar />
        
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
          {/* Dashboard Header */}
          <div className="border-b border-border-custom/30 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/5 px-3 py-1 text-xs font-mono font-medium text-signal">
                <PlaneTakeoff className="h-3.5 w-3.5" />
                <span>READY FOR DEPARTURE</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                My <span className="text-signal">Boarding Passes</span>
              </h1>
              <p className="text-mist text-sm max-w-xl">
                Your saved global scholarships, fellowships, and internships are compiled here, prepared for takeoff.
              </p>
            </div>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-surface border border-border-custom hover:border-signal/30 px-5 py-3 text-sm font-semibold text-white hover:text-signal transition-all duration-300"
            >
              <Compass className="h-4 w-4" />
              Browse More Routes
            </Link>
          </div>

          {/* Bookmarks Grid / Empty State */}
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-signal border-t-transparent" />
            </div>
          ) : bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {bookmarks.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunity/${opp.id}`}
                  className="focus:outline-none focus:ring-2 focus:ring-signal rounded-2xl"
                >
                  <OpportunityCard opportunity={opp} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-border-custom/50 rounded-2xl bg-slate-surface/10 p-8 max-w-xl mx-auto">
              <Bookmark className="h-12 w-12 text-mist/30 mb-4 stroke-[1.5]" />
              <h3 className="font-display text-lg font-bold text-white">Your boarding pass rack is empty</h3>
              <p className="text-sm text-mist mt-1 mb-6 max-w-xs">
                You haven't saved any journeys yet. Explore our global opportunity listings and tap the bookmark stamp to start planning.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-3 text-sm font-bold text-abyss hover:shadow-glow hover:bg-white transition-all duration-300"
              >
                Find Opportunities
              </Link>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
