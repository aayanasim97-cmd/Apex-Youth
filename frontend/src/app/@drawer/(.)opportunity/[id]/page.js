import { getOpportunityById } from "@/lib/opportunities";
import DetailDrawer from "@/components/drawer/DetailDrawer";

export default async function InterceptedOpportunityDrawer({ params }) {
  // Await params since Next.js params are asynchronous in dynamic routing
  const { id } = await params;
  let opportunity = null;

  try {
    opportunity = await getOpportunityById(id);
  } catch (error) {
    console.error("Failed to fetch intercepted opportunity:", error);
  }

  return <DetailDrawer opportunity={opportunity} />;
}
