import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const djangoApiUrl = process.env.DJANGO_API_URL || "http://127.0.0.1:8000";
    const cookieHeader = request.headers.get("cookie") || "";
    
    const djangoRes = await fetch(`${djangoApiUrl}/api/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
    });

    const data = await djangoRes.json();
    const response = NextResponse.json(data, { status: djangoRes.status });

    // Forward rotated set-cookie headers from Django back to the browser
    const setCookies = djangoRes.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      setCookies.forEach((cookie) => {
        response.headers.append("set-cookie", cookie);
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
