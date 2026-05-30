import { interactions } from "./analytics";
import { getConfig } from "./config";
import type { Patterns } from "./patterns";
import type { IgMedia } from "./types";

function score(r: IgMedia): number {
  const v = r.views ?? 0;
  const er = v > 0 ? interactions(r) / v : 0;
  const s = (r.saved ?? 0) / Math.max(v, 1);
  return v * (1 + er * 5 + s * 20);
}

export async function generateScript(
  topic: string,
  extra: string,
  media: IgMedia[],
  patterns: Patterns,
): Promise<{ result?: string; error?: string }> {
  const cfg = await getConfig();
  if (!cfg.openaiKey) return { error: "Немає OpenAI-ключа. Додай його в ⚙ Налаштування." };
  if (!topic.trim()) return { error: "Вкажи тему рилса." };

  const withText = media.filter((m) => (m.transcript || "").length > 5 && (m.views ?? 0) > 0);
  if (withText.length < 3) {
    return { error: "Замало транскриптів. Спершу запусти транскрипцію в ⚙ Налаштуваннях (Whisper)." };
  }

  const top = [...withText].sort((a, b) => score(b) - score(a)).slice(0, 10);
  const examples = top
    .map(
      (r) =>
        `[${(r.timestamp || "").slice(0, 10)} · ${(r.views ?? 0).toLocaleString("uk-UA")} переглядів · збереж. ${r.saved ?? 0}]\n${r.transcript}`,
    )
    .join("\n\n---\n\n");

  const hookWords = patterns.hookWords.map((w) => w.word).slice(0, 5).join(", ");
  const winWords = patterns.winnerWords.map((w) => w.word).slice(0, 8).join(", ");
  const qBetter = patterns.questionVsStatement.withQ > patterns.questionVsStatement.withoutQ;
  const casualBetter = patterns.casualness.high > patterns.casualness.low;

  const styleProfile = `ПРОФІЛЬ СТИЛЮ @max.shapoval (з ${withText.length} рилсів):
• Краща довжина: ${patterns.bestLength || `~${patterns.avgWordCount} слів`}
• Хук: ${qBetter ? "починати з питання" : "починати з провокаційного твердження"}
• Стиль: ${casualBetter ? "розмовний зі сленгом — дає більше переглядів" : "нейтральний діловий"}
• Слова-магніти для хука: ${hookWords || "—"}
• Слова тем, що заходять: ${winWords || "—"}
• Сер. ER кращих: ${patterns.avgER}%`;

  const system = `Ти — персональний скрипт-райтер блогера @max.shapoval (Instagram Reels, ніша: маркетинг / таргет / SMM / AI для бізнесу). Ти глибоко вивчив його дані й точно знаєш, що працює.

${styleProfile}

Твоя задача — писати скрипти, які звучать на 100% як він сам, не як ШІ. Пиши УКРАЇНСЬКОЮ.`;

  const user = `Ось мої топ-рилси — вивчи мій стиль, ритм, переходи:

${examples}

---

Напиши скрипт на тему: **${topic}**
${extra ? `Контекст/акцент: ${extra}` : ""}

Правила:
1. Стиль "yapping" — не зупинятись, говорити так, ніби тебе пре від теми.
2. Довжина: ${patterns.bestLength || `~${patterns.avgWordCount} слів`}.
3. Хук (перші 2–3 фрази) має зупинити скрол (${qBetter ? "питання" : "провокація"}).
4. ${casualBetter ? "Розмовна мова, можна сленг." : "Розмовно, але без зайвого мату."}
5. ${hookWords ? "Вживай слова-магніти в хуку: " + hookWords : ""}
6. Копіюй ритм і переходи з прикладів.

Формат:

🎣 ХУК:
[перші 2–3 фрази]

📝 ПОВНИЙ СКРИПТ:
[весь скрипт, готовий до запису]

🔍 РОЗБІР:
- Тип хука: …
- Ключові тригери: …`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.openaiKey}` },
      body: JSON.stringify({
        model: cfg.openaiModel,
        temperature: 0.8,
        max_tokens: 1600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      cache: "no-store",
    });
    const j = await res.json();
    if (!res.ok || j.error) return { error: j?.error?.message || `OpenAI ${res.status}` };
    return { result: j.choices?.[0]?.message?.content?.trim() || "" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
