import { dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { getOpportunities } from "@/lib/opportunities";
import Providers from "@/app/providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomeClient from "@/components/HomeClient";

export default async function HomePage() {
  const queryClient = getQueryClient();
  
  const defaultFilters = { 
    age: "", 
    homeCountry: "", 
    destinationCountry: "", 
    mode: "all", 
    lastMinute: false, 
    category: "" 
  };

  // Prefetch first page of opportunities server-side for search engines (SEO)
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["opportunities", defaultFilters],
    queryFn: () => getOpportunities(defaultFilters),
    initialPageParam: null,
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <Providers dehydratedState={dehydratedState}>
      <div className="min-h-screen bg-abyss flex flex-col">
        <Navbar />
        <HomeClient />
        <Footer />
      </div>
    </Providers>
  );
}
