import { apiFetch } from "./api-client";

export async function getOpportunities(filters = {}) {
  const query = new URLSearchParams();
  if (filters.category) query.append("category", filters.category);
  if (filters.age) query.append("age", filters.age);
  if (filters.homeCountry) query.append("home_country", filters.homeCountry);
  if (filters.destinationCountry) query.append("destination_country", filters.destinationCountry);
  if (filters.mode && filters.mode !== "all") query.append("mode", filters.mode);
  if (filters.lastMinute) query.append("last_minute", "true");
  if (filters.status && filters.status !== "all") query.append("status", filters.status);
  if (filters.search) query.append("search", filters.search);
  if (filters.cursor) query.append("cursor", filters.cursor);

  console.log(`[API Client] getOpportunities Request URL: /api/opportunities/?${query.toString()}`);
  const res = await apiFetch(`/api/opportunities/?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch opportunities");
  }
  
  const data = await res.json();
  
  // Custom cursor parser for CursorPagination.
  // Django CursorPagination returns urls like "http://...?cursor=cD0yMDI2LTA3..."
  // We extract the cursor token to pass back on subsequent pages.
  let next_cursor = null;
  if (data.next) {
    const nextUrl = new URL(data.next);
    next_cursor = nextUrl.searchParams.get("cursor");
  }
  
  return {
    results: data.results,
    next_cursor,
  };
}

export async function getOpportunityById(id) {
  const res = await apiFetch(`/api/opportunities/${id}/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch opportunity ${id}`);
  }
  return res.json();
}

export async function getCategories() {
  const res = await apiFetch("/api/categories/");
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

export async function getCountries() {
  const res = await apiFetch("/api/countries/");
  if (!res.ok) {
    throw new Error("Failed to fetch countries");
  }
  return res.json();
}
