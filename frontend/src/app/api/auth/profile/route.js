export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helper";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      avatar_url: user.avatarUrl,
      is_staff: user.isStaff,
      is_superuser: user.isSuperuser,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
