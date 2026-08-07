import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const oppId = parseInt(id, 10);

    if (isNaN(oppId)) {
      return NextResponse.json({ error: "Invalid opportunity ID" }, { status: 400 });
    }

    const opp = await prisma.opportunity.findUnique({
      where: { id: oppId },
      include: {
        category: true,
        destinationCountry: true,
        eligibleHomeCountries: {
          include: {
            country: true,
          },
        },
      },
    });

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = opp.deadline ? new Date(opp.deadline) : null;
    let days_until_deadline = null;
    if (deadlineDate) {
      const diffTime = deadlineDate.getTime() - today.getTime();
      days_until_deadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const formatted = {
      id: opp.id,
      title: opp.title,
      description: opp.description,
      source_url: opp.sourceUrl,
      application_url: opp.applicationUrl,
      category: opp.category.slug,
      min_age: opp.minAge,
      max_age: opp.maxAge,
      eligible_home_countries: opp.eligibleHomeCountries.map((ehc) => ehc.country.isoCode),
      is_worldwide: opp.isWorldwide,
      destination_country: opp.destinationCountry?.isoCode || null,
      is_online: opp.isOnline,
      is_onsite: opp.isOnsite,
      deadline: opp.deadline.toISOString().split("T")[0],
      start_date: opp.startDate ? opp.startDate.toISOString().split("T")[0] : null,
      days_until_deadline,
      is_active: opp.isActive,
      created_at: opp.createdAt.toISOString(),
      updated_at: opp.updatedAt.toISOString(),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
