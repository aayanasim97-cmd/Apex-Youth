import React from "react";
import Link from "next/link";
import { Compass, Globe, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border-custom bg-abyss py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-border-custom/50 pb-8 mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-signal/20 bg-slate-surface text-signal">
              <Compass className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Apex<span className="text-signal">Youth</span>
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-mist">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/learning" className="hover:text-white transition-colors">Scholarships</Link>
            <Link href="/volunteering" className="hover:text-white transition-colors">Volunteering</Link>
            <Link href="/working" className="hover:text-white transition-colors">Internships</Link>
            <Link href="/making_change" className="hover:text-white transition-colors">Making Change</Link>
            <Link href="/competing" className="hover:text-white transition-colors">Competing</Link>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-mist">
          <p>© {new Date().getFullYear()} ApexYouth. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Empowering youth mobility worldwide with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> & AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
