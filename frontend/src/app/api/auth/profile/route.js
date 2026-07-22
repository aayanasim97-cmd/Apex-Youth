import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const djangoApiUrl = process.env.DJANGO_API_URL || "http://127.0.0.1:8000";
    const cookieHeader = request.headers.get("cookie") || "";
    
    const djangoRes = await fetch(`${djangoApiUrl}/api/auth/profile/`, {
      method: "GET",
      headers: {
        "Cookie": cookieHeader,
      },
    });

    if (djangoRes.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await djangoRes.json();
    return NextResponse.json(data, { status: djangoRes.status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
