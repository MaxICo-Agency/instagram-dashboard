# AGENTS.md — інструкція для AI-агента

Ти відкрив папку проєкту **Instagram Dashboard** (MaxIco Agency). Це готовий до запуску дашборд аналітики Instagram з AI-рекомендаціями. Твоє завдання — підняти його і (за наявності токена) підключити реальні дані. Дій автономно за цим планом.

## Що це
- **Стек:** Next.js 16 (App Router, TypeScript) + Tailwind v4 + Recharts + OpenAI.
- **Дані:** `src/lib/ig.ts` тягне аналітику з `graph.instagram.com`. Без токена — демо-режим (`src/lib/sample.ts`, акаунт `@max_shapoval`). У проді з `IG_REQUIRE_LIVE=1` замість демо показується екран підключення.
- **Логіка:** `src/lib/analytics.ts` рахує метрики, `src/lib/recommend.ts` кличе OpenAI (є офлайн-фолбек), `src/lib/data.ts` кешує бандл 10 хв.

## Локальний запуск
```bash
pnpm install            # або npm install
cp .env.example .env.local
pnpm dev                # next dev --webpack → http://localhost:3000
```
> Білд/дев використовують `--webpack` (Turbopack падає на шляхах із не-ASCII символами). На латиничному шляху можна `next dev --turbopack`.

## Підключення реальних даних
Заповни `.env.local`:
```
IG_ACCESS_TOKEN=<токен зі scope instagram_business_basic + instagram_business_manage_insights>
IG_USER_ID=<ID Instagram Business акаунта>
IG_GRAPH_VERSION=v21.0
OPENAI_API_KEY=<для AI-порад; без нього — фолбек на правилах>
OPENAI_MODEL=gpt-4.1
```
Як отримати токен — `docs/Instagram-Dashboard-Інструкція.pdf` (Facebook Page → прив'язати Instagram → developers.facebook.com → застосунок + дозволи → Graph API Explorer → токен). Перевір токен: `GET https://graph.instagram.com/v21.0/me?fields=username,followers_count&access_token=...`.

## Деплой (Docker + Traefik)
```bash
# на сервері з Traefik (мережа maxico-platform_public, resolver "le"):
cp .env.example .env && nano .env       # додай токен + IG_REQUIRE_LIVE=1
docker compose up -d --build
```
`docker-compose.yml` уже містить Traefik-лейбли для `inst-dashbord.maxicolabs.com` (websecure + Let's Encrypt). Перед запуском переконайся, що DNS A-запис субдомену вказує на сервер.

## Перевірка
- Локально: `pnpm exec tsc --noEmit` має бути чисто; `GET /` → 200; `POST /api/refresh` скидає кеш.
- Прод: відкрий домен → має показати реальні цифри (не демо). Якщо бачиш екран «Потрібне підключення» — токен відсутній або недійсний.

## Важливе
- Секрети — лише в `.env.local`/`.env`, ніколи не коміть. `.gitignore` це покриває.
- Не вмикай Turbopack на не-ASCII шляху. Не показуй фейкові дані у проді (тримай `IG_REQUIRE_LIVE=1`).
