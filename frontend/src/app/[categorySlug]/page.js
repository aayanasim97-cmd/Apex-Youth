import { notFound } from "next/navigation";
import { dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { getOpportunities } from "@/lib/opportunities";
import Providers from "@/app/providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryClient from "@/components/CategoryClient";

export default async function CategoryPage({ params }) {
  const { categorySlug } = await params;
  
  const validSlugs = ["learning", "volunteering", "working", "making_change", "competing"];
  if (!validSlugs.includes(categorySlug)) {
    notFound();
  }

  const queryClient = getQueryClient();
  const filters = { 
    age: "", 
    homeCountry: "", 
    destinationCountry: "", 
    mode: "all", 
    lastMinute: false, 
    category: categorySlug 
  };

  // Prefetch the specific category feed server-side for SEO crawlers
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["opportunities", filters],
    queryFn: () => getOpportunities(filters),
    initialPageParam: null,
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <Providers dehydratedState={dehydratedState}>
      <div className="min-h-screen bg-abyss flex flex-col">
        <Navbar />
        <CategoryClient categorySlug={categorySlug} />
        <Footer />
      </div>
    </Providers>
  );
}
