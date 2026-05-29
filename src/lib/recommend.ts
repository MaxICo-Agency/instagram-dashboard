import type { Signals } from "./types";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

export function ruleBasedNarrative(s: Signals): string {
  const L: string[] = [];
  L.push("## Контент");
  L.push(
    `- Середній перегляд — **${Math.round(s.avgViews).toLocaleString("uk-UA")}**, ER ≈ **${s.avgER}%**. ${
      s.avgER >= 5 ? "Сильно — масштабуй робочі теми." : "Цілься в 5%+: більше користі, збережень і поширень."
    }`,
  );
  if (s.topPostCaption)
    L.push(`- Найкраще зайшло: «${s.topPostCaption}» (${(s.topPostViews ?? 0).toLocaleString("uk-UA")} переглядів). Зроби серію на цю тему.`);
  L.push("## Формат");
  L.push(`- Найрезультативніший формат — **${s.bestFormat}**. Зміщуй контент-план у його бік.`);
  L.push(`- Save-rate **${s.avgSaveRate}%**, share-rate **${s.avgShareRate}%** — підсилюй корисні гайди/чеклісти, що зберігають.`);
  L.push("## Час публікацій");
  L.push(`- Найкращий слот — **${s.bestDay}, ${s.bestHour}**. Постингу зараз ≈ **${s.postsPerWeek}/тиждень**.`);
  L.push("## Аудиторія");
  L.push(
    `- Приріст за 30 днів — **${s.followerGrowth30d >= 0 ? "+" : ""}${s.followerGrowth30d}** (${s.followerGrowthPct30d}%). ${
      s.followerGrowth30d > 0 ? "Тримай каденс і CTA на підписку." : "Додай CTA та колаборації для нового охоплення."
    }`,
  );
  L.push("## Stories");
  L.push("- Дублюй найкращі Reels у Stories з опитуваннями/CTA — це додає охоплення й тапи в профіль.");
  return L.join("\n");
}

function buildPrompt(s: Signals): string {
  return [
    "Ти — стратег Instagram-маркетингу агенції MaxIco. На основі метрик акаунта напиши стислі, конкретні рекомендації УКРАЇНСЬКОЮ.",
    "Формат: Markdown, рівно 5 секцій: `## Контент`, `## Формат`, `## Час публікацій`, `## Аудиторія`, `## Stories`.",
    "У кожній 2–3 булети. Кожен спирається на конкретне число з даних і дає дію. Жирним виділяй цифри. Без вступів і висновків.",
    "",
    "Дані (JSON):",
    JSON.stringify(s),
  ].join("\n");
}

export async function getRecommendations(s: Signals): Promise<string> {
  if (!OPENAI_KEY) return ruleBasedNarrative(s);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 750,
        messages: [
          { role: "system", content: "Ти досвідчений SMM-стратег. Пишеш стисло, по ділу, українською." },
          { role: "user", content: buildPrompt(s) },
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const json = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("empty");
    return text;
  } catch {
    return ruleBasedNarrative(s);
  }
}
