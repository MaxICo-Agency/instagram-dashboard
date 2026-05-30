import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR || "/app/data";
const FILE = path.join(DATA_DIR, "config.json");

export interface AppConfig {
  igToken: string;
  igUserId: string;
  igApiHost: string;
  igGraphVersion: string;
  openaiKey: string;
  openaiModel: string;
}

function fromEnv(): AppConfig {
  return {
    igToken: process.env.IG_ACCESS_TOKEN || "",
    igUserId: process.env.IG_USER_ID || "me",
    igApiHost: process.env.IG_API_HOST || "https://graph.instagram.com",
    igGraphVersion: process.env.IG_GRAPH_VERSION || "v21.0",
    openaiKey: process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4.1",
  };
}

let cache: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (cache) return cache;
  let merged: AppConfig = fromEnv();
  try {
    const saved = JSON.parse(await fs.readFile(FILE, "utf8"));
    merged = { ...merged, ...saved };
  } catch {}
  cache = merged;
  return merged;
}

// Persists only non-empty patched values (so blank fields don't wipe env defaults).
export async function saveConfig(patch: Partial<AppConfig>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let saved: Record<string, string> = {};
  try {
    saved = JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {}
  for (const [k, v] of Object.entries(patch)) if (typeof v === "string" && v.trim()) saved[k] = v.trim();
  await fs.writeFile(FILE, JSON.stringify(saved), "utf8");
  cache = null;
}

export function maskConfig(c: AppConfig) {
  const mask = (s: string) => (s ? `${s.slice(0, 4)}…${s.slice(-4)}` : "");
  return {
    igTokenSet: Boolean(c.igToken),
    igToken: mask(c.igToken),
    igUserId: c.igUserId,
    igApiHost: c.igApiHost,
    openaiKeySet: Boolean(c.openaiKey),
    openaiKey: mask(c.openaiKey),
    openaiModel: c.openaiModel,
  };
}
