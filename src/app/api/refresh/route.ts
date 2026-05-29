import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resetCache } from "@/lib/data";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  if (!verifyToken(jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  resetCache();
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
}
