import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(countries);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
