import { NextResponse } from "next/server";
import { resetCache } from "@/lib/data";

export async function POST() {
  resetCache();
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
}
