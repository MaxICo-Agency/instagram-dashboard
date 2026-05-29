import type { Signals } from "./types";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// Deterministic fallback used when OpenAI is unavailable — always non-empty.
export function ruleBasedNarrative(s: Signals): string {
  const lines: string[] = [];
  lines.push("## Контент");
  lines.push(
    `- Середня залученість поста — **${Math.round(s.avgInteractionsPerPost)}** взаємодій (ER ≈ **${pct(s.engagementRatePct)}**). ${
      s.engagementRatePct >= 3
        ? "Це сильний показник — масштабуй те, що працює."
        : "Цілься в 3%+ : більше збережень і поширень через корисні гайди/чеклісти."
    }`,
  );
  if (s.topPostCaption) {
    lines.push(
      `- Найкращий пост: «${s.topPostCaption}» (${s.topPostInteractions} взаємодій, ${s.topPostType}). Зроби продовження/серію на цю тему.`,
    );
  }
  lines.push("## Формат");
  lines.push(
    `- Найрезультативніший формат — **${s.bestFormat}** (≈${Math.round(
      s.bestFormatAvgInteractions,
    )} взаємодій/пост). Зміщуй контент-план у його бік.`,
  );
  if (s.reelsAvgWatchSec) {
    lines.push(
      `- Середній час перегляду Reels — **${s.reelsAvgWatchSec.toFixed(1)} с**. Підсилюй гачок у перші 3 секунди, щоб зменшити skip-rate.`,
    );
  }
  lines.push("## Час публікацій");
  lines.push(
    `- Найкращий слот — **${s.bestDay}, ${s.bestHour}**. Плануй ключові пости на цей час; постингу зараз ≈ **${s.postsPerWeek.toFixed(
      1,
    )}/тиждень**.`,
  );
  lines.push("## Аудиторія");
  lines.push(
    `- Приріст за 30 днів — **${s.followerGrowth30d >= 0 ? "+" : ""}${s.followerGrowth30d}** (${pct(
      s.followerGrowthPct30d,
    )}). ${
      s.followerGrowth30d > 0
        ? "Тренд позитивний — підтримуй каденс і CTA на підписку."
        : "Додай CTA на підписку та колаборації для нового охоплення."
    }`,
  );
  if (typeof s.profileLinkTaps === "number") {
    lines.push(
      `- Тапів по посиланнях у профілі — **${s.profileLinkTaps}**. Тестуй чіткіший заклик у біо та в підписах.`,
    );
  }
  return lines.join("\n");
}

function buildPrompt(s: Signals): string {
  return [
    "Ти — стратег Instagram-маркетингу агенції MaxIco. На основі метрик аккаунта напиши стислі, конкретні рекомендації УКРАЇНСЬКОЮ.",
    "Формат: Markdown, рівно 5 секцій з заголовками `## Контент`, `## Формат`, `## Час публікацій`, `## Аудиторія`, `## Stories`.",
    "У кожній секції 2–3 пункти-булети. Кожен пункт спирається на конкретне число з даних і дає дію. Без вступів і висновків. Жирним виділяй ключові цифри.",
    "",
    "Дані (JSON):",
    JSON.stringify(s, null, 0),
  ].join("\n");
}

export async function getRecommendations(s: Signals): Promise<string> {
  if (!OPENAI_KEY) return ruleBasedNarrative(s);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 700,
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
    if (!text) throw new Error("empty completion");
    return text;
  } catch {
    return ruleBasedNarrative(s);
  }
}
