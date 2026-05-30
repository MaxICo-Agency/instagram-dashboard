import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/data";
import { getTranscribeStatus, runTranscription } from "@/lib/transcripts";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

async function authed() {
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value);
}

export async function POST() {
  if (!(await authed())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await getDashboard();
  const reels = (b.data?.media || []).filter((m) => m.mediaProductType === "REELS" && m.mediaUrl && !m.transcript);
  // fire-and-forget (persistent node server keeps it running)
  void runTranscription(reels);
  return NextResponse.json({ ok: true, queued: reels.length });
}

export async function GET() {
  if (!(await authed())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json(getTranscribeStatus());
}
