"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, LogOut, Bookmark, User, Menu, X, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import GoogleLoginButton from "@/components/ui/GoogleLoginButton";
import { useFilterStore } from "@/store/filterStore";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { category, setCategory } = useFilterStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    setIsProfileLoading(loading);
    if (loading) {
      const timer = setTimeout(() => {
        setIsProfileLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const categories = [
    { name: "Learning", slug: "learning" },
    { name: "Volunteering", slug: "volunteering" },
    { name: "Working", slug: "working" },
    { name: "Making Change", slug: "making_change" },
    { name: "Competing", slug: "competing" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-custom bg-abyss/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Brand signature */}
          <div className="flex items-center">
            <Link
              href="/"
              onClick={() => setCategory("")}
              className="flex items-center gap-2 group"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-signal/30 bg-slate-surface group-hover:border-signal transition-colors duration-300">
                <Compass className="h-5 w-5 text-signal group-hover:rotate-45 transition-transform duration-500 ease-smooth" />
                <div className="absolute inset-0 rounded-lg bg-signal/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Apex<span className="text-signal">Youth</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {categories.map((cat) => {
              const isActive = category === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  onClick={() => setCategory(cat.slug)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
                    isActive
                      ? "text-signal font-semibold bg-slate-surface/30"
                      : "text-mist hover:text-white hover:bg-slate-surface/50"
                  }`}
                >
                  {cat.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-signal shadow-glow" />
                  )}
                </Link>
              );
            })}
            <Link
              href="/dashboard"
              onClick={() => setCategory("")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md text-mist hover:text-white hover:bg-slate-surface/50"
            >
              <Bookmark className="h-4 w-4 text-signal" />
              <span>My Boarding Passes</span>
            </Link>
          </nav>

          {/* User Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {isProfileLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-signal border-t-transparent" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-border-custom bg-slate-surface p-1 pr-3 hover:border-signal/50 transition-all duration-300 focus:outline-none"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.first_name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-signal-deep text-white text-xs font-bold">
                      {user.first_name?.[0] || "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-200">
                    {user.first_name || "User"}
                  </span>
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border-custom bg-slate-raised p-2 shadow-2xl z-20 animate-in fade-in slide-in-from-top-2 duration-200 ease-smooth">
                      <div className="px-3 py-2 text-xs font-semibold text-mist border-b border-border-custom/50 mb-1">
                        Logged in as <span className="text-gray-300">{user.email}</span>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-slate-surface hover:text-white transition-colors duration-200"
                      >
                        <Bookmark className="h-4 w-4 text-signal" />
                        Saved Opportunities
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors duration-200 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <GoogleLoginButton />
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-mist hover:bg-slate-surface hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border-custom bg-abyss p-4 space-y-3">
          <nav className="flex flex-col space-y-1">
            {categories.map((cat) => {
              const isActive = category === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  onClick={() => {
                    setCategory(cat.slug);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                    isActive
                      ? "text-signal bg-slate-surface/40 font-semibold"
                      : "text-mist hover:bg-slate-surface hover:text-white"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
            <Link
              href="/dashboard"
              onClick={() => {
                setCategory("");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-mist hover:bg-slate-surface hover:text-white transition-colors"
            >
              <Bookmark className="h-4 w-4 text-signal" />
              <span>My Boarding Passes</span>
            </Link>
          </nav>
          
          <div className="border-t border-border-custom/50 pt-3">
            {isProfileLoading ? (
              <div className="flex justify-center py-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-signal border-t-transparent" />
              </div>
            ) : user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-1">
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.first_name}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div className="text-sm font-medium">
                    <div className="text-white">{user.first_name}</div>
                    <div className="text-xs text-mist">{user.email}</div>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-mist hover:bg-slate-surface hover:text-white transition-colors"
                >
                  <Bookmark className="h-4 w-4 text-signal" />
                  Saved Opportunities
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-red-400 hover:bg-red-950/20 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="px-3 py-2">
                <GoogleLoginButton />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
