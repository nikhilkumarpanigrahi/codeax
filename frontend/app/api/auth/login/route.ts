import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "codeax_session";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  const username = (body.username || "").trim();
  const password = (body.password || "").trim();

  const expectedUser = process.env.CODEAX_AUTH_USERNAME || "admin";
  const expectedPass = process.env.CODEAX_AUTH_PASSWORD || "codeax123";

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ ok: false, message: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "authenticated",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
