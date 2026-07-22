"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useFilterStore } from "@/store/filterStore";
import FilterPanel from "@/components/filters/FilterPanel";
import { OpportunityGrid } from "@/components/feed/OpportunityGrid";
import { BookOpen, Heart, Briefcase, Award, GraduationCap, Compass, Sparkles } from "lucide-react";

export default function HomeClient() {
  const { category, setCategory, status, setStatus, searchQuery, setSearchQuery } = useFilterStore();
  const router = useRouter();
  const pathname = usePathname();

  // Synchronize Zustand filter store category with the URL pathname
  useEffect(() => {
    if (pathname === "/") {
      setCategory("");
    } else {
      const slug = pathname.replace(/^\//, ""); // Remove leading slash
      const validSlugs = ["learning", "volunteering", "working", "making_change", "competing"];
      if (validSlugs.includes(slug)) {
        setCategory(slug);
      }
    }
  }, [pathname, setCategory]);

  const categories = [
    { slug: "", name: "All Routes", icon: Compass },
    { slug: "learning", name: "Scholarships", icon: GraduationCap },
    { slug: "volunteering", name: "Volunteering", icon: Heart },
    { slug: "working", name: "Internships", icon: Briefcase },
    { slug: "making_change", name: "Making Change", icon: Sparkles },
    { slug: "competing", name: "Competing", icon: Award },
  ];

  return (
    <>
      {/* Load Google Client Sign-In library */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border-custom bg-abyss py-20 lg:py-24">
        {/* Drifting route lines background SVGs */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <svg className="absolute top-10 left-10 w-96 h-40 animate-[pulse_6s_infinite]" viewBox="0 0 100 40">
            <path d="M 0 30 Q 50 0 100 30" fill="none" stroke="#2DD4E8" strokeWidth="1" strokeDasharray="5,5" />
          </svg>
          <svg className="absolute bottom-10 right-20 w-[500px] h-60 animate-[pulse_8s_infinite_1s]" viewBox="0 0 100 40">
            <path d="M 0 10 Q 50 40 100 10" fill="none" stroke="#2DD4E8" strokeWidth="1" strokeDasharray="3,3" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/5 px-3.5 py-1 text-xs font-mono font-medium text-signal mb-6">
            <Sparkles className="h-3 w-3" />
            <span>CONNECTING YOUTH WITH GLOBAL EDUCATION & WORK</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
            Find where the <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal to-white">world</span> takes you next.
          </h1>
          
          <p className="text-mist text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Discover funded scholarships, volunteer missions, international internships, and change-making fellowships tailored to you.
          </p>

          {/* Modern Search Bar */}
          <div className="max-w-2xl mx-auto mb-10 relative">
            <div className="relative flex items-center rounded-2xl border border-border-custom bg-slate-raised p-1.5 focus-within:border-signal/50 focus-within:shadow-glow transition-all duration-300">
              <span className="pl-4 text-mist">
                <svg className="h-5 w-5 text-signal/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search scholarships, internships, countries, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const el = document.getElementById("opportunities-feed");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full bg-transparent border-0 px-4 py-2 text-sm text-white placeholder-mist/50 focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="pr-2 text-xs font-mono font-bold text-mist hover:text-white"
                >
                  CLEAR
                </button>
              )}
            </div>
            
            {/* Quick Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-mono text-mist">
              <span>Try searching:</span>
              {["Germany", "Fully Funded", "Summer 2026", "Internship"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    const el = document.getElementById("opportunities-feed");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-full border border-border-custom bg-slate-surface/40 px-3 py-1 text-xs hover:border-signal/30 hover:text-signal transition-all duration-200"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips Container */}
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setCategory(cat.slug);
                    router.push(cat.slug ? `/${cat.slug}` : "/");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide border transition-all duration-300 ${
                    isSelected
                      ? "border-signal bg-signal text-abyss shadow-glow font-bold"
                      : "border-border-custom bg-slate-surface text-mist hover:border-signal/30 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? "text-abyss" : "text-signal/70"}`} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Filter & Feed Section */}
      <section id="opportunities-feed" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
        <FilterPanel />
        
        {/* Eurodesk-style Status Selector Tabs */}
        <div className="flex border-b border-border-custom/30 pb-px gap-2 overflow-x-auto whitespace-nowrap">
          {["all", "open", "upcoming"].map((s) => {
            const isSelected = status === s;
            const label = {
              all: "All Opportunities",
              open: "Open Now",
              upcoming: "Upcoming / Opening Soon"
            }[s];
            
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`relative pb-3 px-5 text-xs font-mono font-bold tracking-widest transition-colors ${
                  isSelected ? "text-signal" : "text-mist hover:text-white"
                }`}
              >
                {label.toUpperCase()}
                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-signal shadow-glow" />
                )}
              </button>
            );
          })}
        </div>

        <OpportunityGrid />
      </section>
    </>
  );
}
