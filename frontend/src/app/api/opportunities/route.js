import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const age = searchParams.get("age");
    const home_country = searchParams.get("home_country");
    const destination_country = searchParams.get("destination_country");
    const mode = searchParams.get("mode");
    const last_minute = searchParams.get("last_minute");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const cursorStr = searchParams.get("cursor");

    const limit = 10;
    const cursor = cursorStr ? parseInt(cursorStr, 10) : 1;
    const skip = (cursor - 1) * limit;

    const conditions = [{ isActive: true }];

    if (category) {
      conditions.push({
        category: {
          slug: category,
        },
      });
    }

    if (age) {
      const ageVal = parseInt(age, 10);
      conditions.push({
        AND: [
          { OR: [{ minAge: null }, { minAge: { lte: ageVal } }] },
          { OR: [{ maxAge: null }, { maxAge: { gte: ageVal } }] },
        ],
      });
    }

    if (home_country) {
      conditions.push({
        OR: [
          { isWorldwide: true },
          { isOnline: true },
          {
            eligibleHomeCountries: {
              some: {
                country: {
                  isoCode: {
                    equals: home_country,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (destination_country) {
      conditions.push({
        destinationCountry: {
          isoCode: {
            equals: destination_country,
            mode: "insensitive",
          },
        },
      });
    }

    if (mode === "online") {
      conditions.push({ isOnline: true });
    } else if (mode === "onsite") {
      conditions.push({ isOnsite: true });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (last_minute === "true") {
      const threeDays = new Date(today);
      threeDays.setDate(today.getDate() + 3);
      const fiveDays = new Date(today);
      fiveDays.setDate(today.getDate() + 5);
      conditions.push({
        deadline: {
          gte: threeDays,
          lte: fiveDays,
        },
      });
    }

    if (status === "open") {
      conditions.push({
        deadline: { gte: today },
        OR: [
          { startDate: null },
          { startDate: { lte: today } },
        ],
      });
    } else if (status === "upcoming") {
      conditions.push({
        OR: [
          { startDate: { gte: today } },
          {
            AND: [
              { startDate: null },
              { deadline: { gte: today } },
            ],
          },
        ],
      });
    }

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const where = { AND: conditions };

    const opportunities = await prisma.opportunity.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        destinationCountry: true,
        eligibleHomeCountries: {
          include: {
            country: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = opportunities.map((opp) => {
      const deadlineDate = opp.deadline ? new Date(opp.deadline) : null;
      let days_until_deadline = null;
      if (deadlineDate) {
        const diffTime = deadlineDate.getTime() - today.getTime();
        days_until_deadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
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
    });

    const next_cursor = opportunities.length === limit ? String(cursor + 1) : null;
    const baseUrl = request.nextUrl.origin;
    
    const nextQuery = new URLSearchParams(searchParams);
    if (next_cursor) {
      nextQuery.set("cursor", next_cursor);
    }
    const nextUrl = next_cursor ? `${baseUrl}/api/opportunities?${nextQuery.toString()}` : null;

    return NextResponse.json({
      results: formatted,
      next: nextUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
