import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ONE_DAY_SEC = 60 * 60 * 24;

/** Sets HttpOnly `token` on the app origin (Vercel). Cross-origin API cookies never apply here. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token =
    typeof body === "object" &&
    body !== null &&
    "token" in body &&
    typeof (body as { token: unknown }).token === "string"
      ? (body as { token: string }).token
      : null;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const store = await cookies();
  store.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_DAY_SEC,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete("token");
  return NextResponse.json({ ok: true });
}
