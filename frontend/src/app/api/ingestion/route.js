import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function fixSpellingErrors(text) {
  if (!text) return "";

  const corrections = {
    "democratistaion": "democratisation",
    "democratistaions": "democratisations",
    "oppurtunity": "opportunity",
    "oppurtunities": "opportunities",
    "scholarshup": "scholarship",
    "scholarshups": "scholarships",
    "internshup": "internship",
    "internshups": "internships",
    "fellowshup": "fellowship",
    "fellowshups": "fellowships",
    "voluntering": "volunteering",
    "competion": "competition",
    "competions": "competitions",
    "eligibilty": "eligibility",
    "unspecfied": "unspecified",
    "goverment": "government",
    "goverments": "governments",
    "developement": "development",
    "developements": "developments",
    "enviroment": "environment",
    "enviroments": "environments",
    "programe": "program",
    "programes": "programs",
    "programmes": "programs",
    "receipient": "recipient",
    "receipients": "recipients",
    "requriment": "requirement",
    "requriments": "requirements",
    "applicaton": "application",
    "applicatons": "applications"
  };

  let cleaned = text;
  for (const [pattern, replacement] of Object.entries(corrections)) {
    const regex = new RegExp(`\\b${pattern}\\b`, "gi");
    cleaned = cleaned.replace(regex, (match) => {
      if (match[0] === match[0].toUpperCase()) {
        if (match === match.toUpperCase()) {
          return replacement.toUpperCase();
        }
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return cleaned;
}

export async function POST(request) {
  let body;
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Api-Key ${process.env.N8N_API_KEY || "default-secret-n8n-key-12345"}`) {
      return NextResponse.json({ error: "Unauthorized API Key" }, { status: 401 });
    }

    body = await request.json();

    // Replicate Django validations
    const errors = {};
    if (!body.title) errors.title = ["This field is required."];
    if (!body.description) errors.description = ["This field is required."];
    if (!body.source_url) errors.source_url = ["This field is required."];
    if (!body.category) errors.category = ["This field is required."];
    if (!body.deadline) errors.deadline = ["This field is required."];

    if (body.deadline) {
      const deadlineDate = new Date(body.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        errors.deadline = ["Deadline cannot be in the past."];
      }
    }

    if (body.min_age !== undefined && body.max_age !== undefined) {
      if (body.min_age !== null && body.max_age !== null && body.min_age > body.max_age) {
        errors.min_age = ["min_age cannot be greater than max_age."];
      }
    }

    if (Object.keys(errors).length > 0) {
      await prisma.ingestionLog.create({
        data: {
          payload: body,
          status: "rejected",
          errors,
        },
      });
      return NextResponse.json(errors, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { slug: body.category },
    });
    if (!category) {
      return NextResponse.json({ error: `Category ${body.category} not found` }, { status: 400 });
    }

    let destinationCountryId = null;
    if (body.destination_country) {
      const destCountry = await prisma.country.findUnique({
        where: { isoCode: body.destination_country },
      });
      if (destCountry) {
        destinationCountryId = destCountry.id;
      }
    }

    const correctedTitle = fixSpellingErrors(body.title);
    const correctedDescription = fixSpellingErrors(body.description);

    // Replicate Django update_or_create logic
    const opportunity = await prisma.opportunity.upsert({
      where: { sourceUrl: body.source_url },
      update: {
        title: correctedTitle,
        description: correctedDescription,
        applicationUrl: body.application_url || null,
        categoryId: category.id,
        minAge: body.min_age !== undefined ? body.min_age : null,
        maxAge: body.max_age !== undefined ? body.max_age : null,
        isWorldwide: body.is_worldwide || false,
        destinationCountryId,
        isOnline: body.is_online || false,
        isOnsite: body.is_onsite || false,
        deadline: new Date(body.deadline),
      },
      create: {
        title: correctedTitle,
        description: correctedDescription,
        sourceUrl: body.source_url,
        applicationUrl: body.application_url || null,
        categoryId: category.id,
        minAge: body.min_age !== undefined ? body.min_age : null,
        maxAge: body.max_age !== undefined ? body.max_age : null,
        isWorldwide: body.is_worldwide || false,
        destinationCountryId,
        isOnline: body.is_online || false,
        isOnsite: body.is_onsite || false,
        deadline: new Date(body.deadline),
      },
    });

    // Replicate eligible home countries M2M sync
    await prisma.opportunityEligibleHomeCountry.deleteMany({
      where: { opportunityId: opportunity.id },
    });

    if (body.eligible_home_countries && body.eligible_home_countries.length > 0) {
      const countries = await prisma.country.findMany({
        where: {
          isoCode: { in: body.eligible_home_countries },
        },
      });

      await prisma.opportunityEligibleHomeCountry.createMany({
        data: countries.map((c) => ({
          opportunityId: opportunity.id,
          countryId: c.id,
        })),
      });
    }

    // Determine created vs updated using logs/timestamp comparison
    // Django checks 'created' output from update_or_create
    const created = opportunity.createdAt.getTime() === opportunity.updatedAt.getTime();

    await prisma.ingestionLog.create({
      data: {
        payload: body,
        status: created ? "created" : "updated",
        opportunityId: opportunity.id,
      },
    });

    return NextResponse.json(
      { id: opportunity.id, created },
      { status: 201 }
    );
  } catch (error) {
    if (body) {
      try {
        await prisma.ingestionLog.create({
          data: {
            payload: body,
            status: "rejected",
            errors: { exception: error.message },
          },
        });
      } catch (logErr) {
        console.error("Failed to write error ingestion log:", logErr);
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
