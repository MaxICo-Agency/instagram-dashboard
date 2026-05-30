import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/data";
import { generateScript } from "@/lib/scriptgen";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  const jar = await cookies();
  if (!verifyToken(jar.get(SESSION_COOKIE)?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let topic = "";
  let extra = "";
  try {
    const body = await req.json();
    topic = String(body.topic ?? "");
    extra = String(body.extra ?? "");
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const b = await getDashboard();
  if (!b.data || !b.patterns) return NextResponse.json({ error: "Дані ще не готові." }, { status: 200 });

  const out = await generateScript(topic, extra, b.data.media, b.patterns);
  return NextResponse.json(out);
}
