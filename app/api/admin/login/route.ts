import { NextResponse } from "next/server";
import { adminCookie, createAdminSession, requireConfiguredPasskey } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();
    if (typeof passkey !== "string" || !requireConfiguredPasskey(passkey)) {
      return NextResponse.json({ error: "Invalid admin passkey." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookie(createAdminSession()));
    return response;
  } catch { return NextResponse.json({ error: "Unable to sign in." }, { status: 500 }); }
}
