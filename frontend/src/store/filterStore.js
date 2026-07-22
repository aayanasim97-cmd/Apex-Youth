import { create } from "zustand";

export const useFilterStore = create((set) => ({
  age: "",
  homeCountry: "",
  destinationCountry: "",
  mode: "all",
  lastMinute: false,
  category: "",
  status: "all",
  searchQuery: "",
  savedOpportunityIds: [],

  setAge: (age) => set({ age }),
  setHomeCountry: (homeCountry) => set({ homeCountry }),
  setDestinationCountry: (destinationCountry) => set({ destinationCountry }),
  setMode: (mode) => set({ mode }),
  setLastMinute: (lastMinute) => set({ lastMinute }),
  setCategory: (category) => set({ category }),
  setStatus: (status) => set({ status }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSavedOpportunityIds: (savedOpportunityIds) => set({ savedOpportunityIds }),
  toggleSaveOpportunity: (id) => set((state) => {
    const exists = state.savedOpportunityIds.includes(id);
    const updated = exists
      ? state.savedOpportunityIds.filter((x) => x !== id)
      : [...state.savedOpportunityIds, id];
    return { savedOpportunityIds: updated };
  }),
  
  resetFilters: () => set({
    age: "",
    homeCountry: "",
    destinationCountry: "",
    mode: "all",
    lastMinute: false,
    status: "all",
    searchQuery: "",
  }),
}));
