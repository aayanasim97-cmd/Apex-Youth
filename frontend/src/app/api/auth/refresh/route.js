export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { verifyToken, signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is missing from cookies" }, { status: 400 });
    }

    const payload = await verifyToken(refreshToken);
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // Sign new JWT tokens (Token Rotation)
    const newAccessToken = await signAccessToken({ user_id: payload.user_id });
    const newRefreshToken = await signRefreshToken({ user_id: payload.user_id });

    const response = NextResponse.json({ refreshed: true });

    // Set new HttpOnly Cookies
    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/api/auth/refresh",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
