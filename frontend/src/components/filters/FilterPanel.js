"use client";
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCountries } from "@/lib/opportunities";
import { useFilterStore } from "@/store/filterStore";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { X, Search, SlidersHorizontal, ShieldAlert, Monitor, Map, Milestone } from "lucide-react";

export default function FilterPanel() {
  const {
    age,
    homeCountry,
    destinationCountry,
    mode,
    lastMinute,
    setAge,
    setHomeCountry,
    setDestinationCountry,
    setMode,
    setLastMinute,
    resetFilters,
  } = useFilterStore();

  const [ageInput, setAgeInput] = useState(age);
  const debouncedAge = useDebouncedValue(ageInput, 300);

  // Sync debounced age to store
  useEffect(() => {
    setAge(debouncedAge);
  }, [debouncedAge, setAge]);

  // Sync store age changes (e.g. reset) to input
  useEffect(() => {
    setAgeInput(age);
  }, [age]);

  // Fetch countries once (React Query caches this automatically)
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: getCountries,
    staleTime: Infinity, // Country list is static reference data, fetch only once
  });

  return (
    <div className="w-full rounded-2xl border border-border-custom bg-slate-surface p-6 shadow-card">
      <div className="flex items-center justify-between pb-4 border-b border-border-custom/30 mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-signal" />
          <h2 className="font-display font-bold text-lg text-white">Filter Path</h2>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs font-mono font-semibold text-mist hover:text-signal transition-colors"
        >
          RESET ALL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 1. Home Country Autocomplete */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-mist uppercase tracking-wider flex items-center gap-1.5">
            <Milestone className="h-3.5 w-3.5 text-signal/70" />
            Home Location
          </label>
          <CountryAutocomplete
            countries={countries}
            selectedValue={homeCountry}
            onChange={setHomeCountry}
            placeholder="Search home country..."
          />
        </div>

        {/* 2. Destination Country Autocomplete */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-mist uppercase tracking-wider flex items-center gap-1.5">
            <Map className="h-3.5 w-3.5 text-signal/70" />
            Destination
          </label>
          <CountryAutocomplete
            countries={countries}
            selectedValue={destinationCountry}
            onChange={setDestinationCountry}
            placeholder="Search destination..."
          />
        </div>

        {/* 3. Age Limit Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-mist uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-signal/70" />
            Your Age: {ageInput || "Any"}
          </label>
          <div className="flex items-center gap-4 py-1">
            <input
              type="range"
              min="10"
              max="40"
              value={ageInput || 18}
              onChange={(e) => setAgeInput(Number(e.target.value))}
              className="flex-1 accent-signal h-1 bg-slate-raised rounded-lg appearance-none cursor-pointer"
            />
            {ageInput && (
              <button
                onClick={() => setAgeInput("")}
                className="text-xs text-mist hover:text-red-400 p-1"
                title="Clear age filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Toggles & Modes */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-mist uppercase tracking-wider flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5 text-signal/70" />
            Filters & Formats
          </label>
          
          <div className="flex gap-2">
            {/* Mode selection buttons */}
            <button
              onClick={() => setMode("all")}
              className={`flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border font-bold transition-all duration-200 ${
                mode === "all"
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-border-custom bg-slate-raised/35 text-mist hover:border-mist/50 hover:text-white"
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setMode("online")}
              className={`flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border font-bold transition-all duration-200 ${
                mode === "online"
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-border-custom bg-slate-raised/35 text-mist hover:border-mist/50 hover:text-white"
              }`}
            >
              ONLINE
            </button>
            <button
              onClick={() => setMode("onsite")}
              className={`flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border font-bold transition-all duration-200 ${
                mode === "onsite"
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-border-custom bg-slate-raised/35 text-mist hover:border-mist/50 hover:text-white"
              }`}
            >
              ONSITE
            </button>
          </div>

          {/* Last Minute stamp filter */}
          <label className="flex items-center gap-2 mt-2 cursor-pointer select-none text-xs text-mist hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={lastMinute}
              onChange={(e) => setLastMinute(e.target.checked)}
              className="accent-signal rounded border-border-custom bg-slate-raised h-4 w-4"
            />
            <span className="font-semibold uppercase tracking-wider font-mono">Passport stamp: Last Minute only</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Sub-component: Autocomplete Country Combobox
function CountryAutocomplete({ countries, selectedValue, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  // Sync selectedValue changes
  const selectedCountry = countries.find((c) => c.iso_code === selectedValue);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Client-side fuzzy/substring filtering
  const filteredCountries = query === ""
    ? countries
    : countries.filter((country) =>
        country.name.toLowerCase().includes(query.toLowerCase()) ||
        country.iso_code.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist/60" />
        <input
          type="text"
          className="w-full pl-9 pr-8 py-2 text-sm bg-slate-raised border border-border-custom rounded-lg text-white placeholder-mist/50 focus:outline-none focus:border-signal/50 focus:ring-1 focus:ring-signal/30 transition-all duration-200"
          placeholder={selectedCountry ? selectedCountry.name : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {selectedValue ? (
          <button
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-mist hover:text-red-400 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border-custom bg-slate-raised py-1 text-sm shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          {filteredCountries.length === 0 ? (
            <li className="px-4 py-2 text-mist text-xs">No matching countries.</li>
          ) : (
            filteredCountries.map((country) => (
              <li
                key={country.iso_code}
                onClick={() => {
                  onChange(country.iso_code);
                  setQuery("");
                  setIsOpen(false);
                }}
                className={`cursor-pointer select-none px-4 py-2 hover:bg-slate-surface hover:text-white transition-colors flex items-center justify-between ${
                  selectedValue === country.iso_code ? "text-signal font-bold" : "text-gray-200"
                }`}
              >
                <span>{country.name}</span>
                <span className="font-mono text-xs text-mist">{country.iso_code}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
