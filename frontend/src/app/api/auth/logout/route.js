export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.set("access_token", "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
  });
  
  response.cookies.set("refresh_token", "", {
    path: "/api/auth/refresh",
    expires: new Date(0),
    httpOnly: true,
  });

  return response;
}
