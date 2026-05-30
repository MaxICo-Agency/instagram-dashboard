import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConfig, maskConfig, saveConfig } from "@/lib/config";
import { resetCache } from "@/lib/data";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

async function authed() {
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await authed())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json(maskConfig(await getConfig()));
}

export async function POST(req: Request) {
  if (!(await authed())) return NextResponse.json({ ok: false }, { status: 401 });
  let body: Record<string, string> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await saveConfig({
    igToken: body.igToken,
    igUserId: body.igUserId,
    igApiHost: body.igApiHost,
    openaiKey: body.openaiKey,
    openaiModel: body.openaiModel,
  });
  resetCache();
  return NextResponse.json({ ok: true });
}
