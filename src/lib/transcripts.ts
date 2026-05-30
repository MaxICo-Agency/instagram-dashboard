import { promises as fs } from "node:fs";
import path from "node:path";
import type { IgMedia } from "./types";

const DATA_DIR = process.env.DATA_DIR || "/app/data";
const FILE = path.join(DATA_DIR, "transcripts.json");
const KEY = process.env.OPENAI_API_KEY || "";

export type TranscriptMap = Record<string, string>;

export async function loadTranscripts(): Promise<TranscriptMap> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

async function saveTranscripts(map: TranscriptMap): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(map), "utf8");
}

async function transcribeOne(mediaUrl: string): Promise<string> {
  const audio = await fetch(mediaUrl);
  if (!audio.ok) throw new Error(`download ${audio.status}`);
  const buf = await audio.arrayBuffer();
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "video/mp4" }), "reel.mp4");
  fd.append("model", "whisper-1");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: fd,
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j?.error?.message || `whisper ${r.status}`);
  return (j.text || "").trim();
}

// Module-level sync status (single-instance).
let status = { running: false, total: 0, done: 0, error: "" as string, finishedAt: 0 };
export function getTranscribeStatus() {
  return status;
}

export async function runTranscription(reels: IgMedia[]): Promise<void> {
  if (status.running) return;
  if (!KEY) {
    status = { running: false, total: 0, done: 0, error: "Немає OPENAI_API_KEY", finishedAt: Date.now() };
    return;
  }
  const map = await loadTranscripts();
  const todo = reels.filter((m) => m.mediaUrl && !map[m.id]);
  status = { running: true, total: todo.length, done: 0, error: "", finishedAt: 0 };
  for (const m of todo) {
    try {
      map[m.id] = await transcribeOne(m.mediaUrl!);
    } catch (e) {
      map[m.id] = "";
      status.error = (e as Error).message;
    }
    status.done += 1;
    await saveTranscripts(map);
  }
  status.running = false;
  status.finishedAt = Date.now();
}
