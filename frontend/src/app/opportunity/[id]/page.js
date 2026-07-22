import React from "react";
import Link from "next/link";
import { getOpportunityById } from "@/lib/opportunities";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Calendar, Globe, Monitor, ShieldAlert, ExternalLink, ArrowLeft, Bookmark } from "lucide-react";
import SaveButton from "@/components/feed/SaveButton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const opportunity = await getOpportunityById(id);
    if (!opportunity) {
      return {
        title: "Opportunity Not Found | ApexYouth",
        description: "The requested opportunity could not be located on ApexYouth."
      };
    }
    
    const categoryLabel = {
      learning: "Scholarship",
      volunteering: "Volunteer Program",
      working: "Internship & Work",
      making_change: "Fellowship",
      competing: "Competition",
    }[opportunity.category] || "Opportunity";

    const titleText = `${opportunity.title} | ${categoryLabel} on ApexYouth`;
    const descText = opportunity.description || "Discover and apply to this global youth opportunity on ApexYouth.";
    
    return {
      title: titleText,
      description: descText,
      openGraph: {
        title: titleText,
        description: descText,
        url: `https://apexyouth.org/opportunity/${id}`,
        siteName: "ApexYouth",
        images: [
          {
            url: "https://apexyouth.org/images/og-share.png",
            width: 1200,
            height: 630,
            alt: opportunity.title,
          },
        ],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: titleText,
        description: descText,
        images: ["https://apexyouth.org/images/og-share.png"],
      },
    };
  } catch (error) {
    return {
      title: "Opportunity | ApexYouth",
      description: "Discover global scholarships, internships, and fellowships on ApexYouth."
    };
  }
}

export default async function StandaloneOpportunityPage({ params }) {
  const { id } = await params;
  let opportunity = null;

  try {
    opportunity = await getOpportunityById(id);
  } catch (error) {
    return (
      <div className="min-h-screen bg-abyss flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-white">Journey Not Found</h1>
          <p className="text-mist mt-2">The requested opportunity path could not be resolved.</p>
          <Link href="/" className="mt-4 text-signal hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Return to Feed
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const {
    title,
    description,
    source_url,
    application_url,
    category,
    min_age,
    max_age,
    is_worldwide,
    destination_country,
    is_online,
    is_onsite,
    deadline,
    eligible_home_countries = [],
  } = opportunity;

  const categoryLabel = {
    learning: "Learning & Scholarships",
    volunteering: "Volunteering",
    working: "Working & Internships",
    making_change: "Making a Change",
    competing: "Competing",
  }[category] || category;

  return (
    <div className="min-h-screen bg-abyss flex flex-col">
      <Navbar />
      
      <main className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-mono font-semibold text-mist hover:text-signal transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          BACK TO FEED
        </Link>

        <article className="border border-border-custom bg-slate-surface rounded-2xl p-8 md:p-10 shadow-card">
          {/* Header */}
          <div className="pb-6 border-b border-border-custom/40 mb-6">
            <span className="font-mono text-xs text-signal tracking-widest uppercase font-semibold block mb-2">
              {categoryLabel}
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight">
              {title}
            </h1>
          </div>

          {/* Quick Route Visualizer */}
          <div className="flex items-center gap-6 py-4 px-6 rounded-xl bg-slate-raised border border-border-custom/40 mb-8 max-w-md">
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
                {is_online ? "ONLINE" : (destination_country || "ANYWHERE")}
              </span>
            </div>
          </div>

          {/* Body Description */}
          <div className="prose prose-invert max-w-none text-gray-300 text-base leading-relaxed mb-8 whitespace-pre-line">
            {description}
          </div>

          {/* Parameters / Grid details */}
          <div className="space-y-6 border-t border-border-custom/40 pt-8 mb-8">
            <h3 className="font-display font-bold text-md text-white tracking-wide uppercase">
              Journey Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 text-sm font-mono text-mist">
                <ShieldAlert className="h-5 w-5 text-signal/70" />
                <div>
                  <div className="text-[10px] text-mist/60 uppercase">Age bounds</div>
                  <div className="text-white font-bold">
                    {min_age ?? "Any"}–{max_age ?? "Any"} years old
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm font-mono text-mist">
                <Calendar className="h-5 w-5 text-signal/70" />
                <div>
                  <div className="text-[10px] text-mist/60 uppercase">Closing date</div>
                  <div className="text-white font-bold">{deadline}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm font-mono text-mist">
                <Monitor className="h-5 w-5 text-signal/70" />
                <div>
                  <div className="text-[10px] text-mist/60 uppercase">Travel Format</div>
                  <div className="text-white font-bold">
                    {is_online && is_onsite ? "Hybrid" : is_online ? "Online Only" : "Onsite Only"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm font-mono text-mist">
                <Globe className="h-5 w-5 text-signal/70" />
                <div>
                  <div className="text-[10px] text-mist/60 uppercase">Passport Status</div>
                  <div className="text-white font-bold">
                    {is_worldwide ? "Universal Access" : "Country Specific"}
                  </div>
                </div>
              </div>
            </div>

            {/* Citizenship eligibility lists */}
            {!is_worldwide && eligible_home_countries.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-raised border border-border-custom/30 mt-6 text-sm">
                <span className="font-mono text-mist block mb-2">ELIGIBLE CITIZENSHIPS:</span>
                <div className="flex flex-wrap gap-2">
                  {eligible_home_countries.map((code) => (
                    <span key={code} className="font-mono px-3 py-1 bg-slate-surface text-signal rounded-lg text-xs font-bold border border-signal/15">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 border-t border-border-custom/40 pt-8 mt-8">
            <a
              href={application_url || source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-signal px-6 py-4 text-sm font-bold text-abyss hover:shadow-glow hover:bg-white transition-all duration-300 ease-smooth"
            >
              Apply Now
              <ExternalLink className="h-4 w-4" />
            </a>
            
            <SaveButton opportunity={opportunity} />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
