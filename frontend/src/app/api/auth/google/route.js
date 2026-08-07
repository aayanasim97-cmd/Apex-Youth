export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request) {
  try {
    const { credential } = await request.json();
    if (!credential) {
      return NextResponse.json({ error: "Google ID token credential is required" }, { status: 400 });
    }

    // Verify token with Google
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return NextResponse.json({ error: `Invalid Google token: ${err.message}` }, { status: 400 });
    }

    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Google token does not contain an email address" }, { status: 400 });
    }

    const email = payload.email;
    const firstName = payload.given_name || "";
    const lastName = payload.family_name || "";
    const avatarUrl = payload.picture || "";

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatarUrl,
          isStaff: false,
          isSuperuser: false,
        },
      });
    }

    // Sign JWT tokens
    const accessToken = await signAccessToken({ user_id: user.id });
    const refreshToken = await signRefreshToken({ user_id: user.id });

    const response = NextResponse.json({
      user: {
        email: user.email,
        first_name: user.firstName,
        avatar_url: user.avatarUrl,
        is_staff: user.isStaff,
        is_superuser: user.isSuperuser,
      },
    });

    // Set HttpOnly Cookies
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    response.cookies.set("refresh_token", refreshToken, {
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
