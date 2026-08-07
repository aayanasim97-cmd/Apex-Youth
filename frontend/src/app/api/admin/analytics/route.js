export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || (!user.isStaff && !user.isSuperuser)) {
      return NextResponse.json({ error: "Forbidden: Administrative access required" }, { status: 403 });
    }

    const total_opportunities = await prisma.opportunity.count();
    const active_opportunities = await prisma.opportunity.count({
      where: { isActive: true },
    });

    const total_logs = await prisma.ingestionLog.count();
    const created_logs = await prisma.ingestionLog.count({
      where: { status: "created" },
    });
    const updated_logs = await prisma.ingestionLog.count({
      where: { status: "updated" },
    });
    const rejected_logs = await prisma.ingestionLog.count({
      where: { status: "rejected" },
    });

    const logs = await prisma.ingestionLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        opportunity: true,
      },
    });

    const latest_logs = logs.map((log) => ({
      id: log.id,
      status: log.status,
      errors: log.errors,
      created_at: log.createdAt.toISOString(),
      opportunity_title: log.opportunity?.title || null,
    }));

    return NextResponse.json({
      total_opportunities,
      active_opportunities,
      expired_purged_count: total_logs > active_opportunities ? total_logs - active_opportunities : 0,
      total_logs,
      created_logs,
      updated_logs,
      rejected_logs,
      latest_logs,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
