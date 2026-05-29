# Instagram Analytics Dashboard (`ig-pulse`) — Design Spec

- **Date:** 2026-05-29
- **Owner:** Max Shapoval (MaxIco Agency)
- **Status:** APPROVED (design) — pending implementation plan
- **Location:** `MaxICo/AI PROJECT/my/ig-pulse/`
- **Stack:** Next.js 15 (App Router, TS) + Prisma + Postgres, Docker + Traefik on VPS
- **LLM:** OpenAI `gpt-4.1` (narrative recommendations, Ukrainian)

---

## 1. Goal & Scope

A web dashboard showing **current analytics for one Instagram Business/Creator account** plus **AI recommendations in Ukrainian**. The account connects via OAuth through the **existing Meta app** (App ID `930282…9606`, project `dm zahar manager`) with the `instagram_business_manage_insights` scope added. The app runs **always-on on the MaxIco VPS**; a cron worker syncs metrics and Stories into Postgres, and the dashboard reads from the DB (it does **not** hit the IG API on every page load, because of the 200-calls/hour/account rate limit).

### In scope (MVP — this spec)
- OAuth connect for **one** IG account via the existing app (insights scope).
- Scheduled sync: account insights, media list + per-media insights, Stories insights (24h poll). Idempotent time-series snapshots in Postgres.
- Dashboard UI: account header, KPI cards, reach/views + follower trend charts, engagement breakdown, top-posts table, Reels panel, Stories panel, audience demographics, AI recommendations card. Manual "Sync now" + last-synced timestamp.
- Hybrid recommendations: deterministic rule engine computes signals → OpenAI writes the narrative.
- Single-user login gate (dashboard is on a public VPS). `noindex`.
- Deploy: Docker + docker-compose (app + postgres) + Traefik labels.

### Out of scope (v2 — explicitly NOT built now)
- Multi-account management.
- Competitor benchmark via `business_discovery` (requires the **Facebook-Login** path / different token).
- Hashtag tracking (`ig_hashtag_search`).
- Telegram / Trinity-triggered reports + PDF export (Trinity schedule could later trigger the sync endpoint).

---

## 2. Architecture & Modules

- **Next.js 15** App Router (TS) · Tailwind v4 + shadcn/ui · **Recharts** for charts · MaxIco dark theme (`#0D04B7` primary, `#B8F700` accent, Inter, Cyrillic-safe).
- **Prisma + Postgres** for persistence.

| Module | Responsibility |
|---|---|
| `lib/ig/client.ts` | IG API client (`graph.instagram.com`, latest stable Graph version — target v25.0, verify at impl). fetch + pagination + **rate-limiter** (token-bucket ≤200/hr/account; reads `X-App-Usage` / `X-Business-Use-Case-Usage`; backoff on errors 4/17/32 and OAuthException 190). |
| `lib/ig/oauth.ts` | OAuth connect, short→long-lived (60-day) token exchange, auto-refresh (`ig_refresh_token`, token must be ≥24h old). Token **encrypted at rest**. |
| `lib/sync/*` | `syncAccountInsights`, `syncMedia`, `syncMediaInsights`, `syncStories`. Incremental + idempotent upserts. |
| `lib/analytics/*` | Derived metrics: engagement rate, growth deltas, best time/format, story drop-off, reel hook score. |
| `lib/recommendations/*` | Rule engine → signals (JSON) → OpenAI `gpt-4.1` narrative. |
| `worker/cron.ts` | node-cron: account+media daily, Stories every ~3h, daily token-refresh check. Separate process in compose. |
| `app/api/*` | OAuth callback; protected `POST /sync` (manual sync); minimal data endpoints if needed (server components read DB directly). |
| `app/(dashboard)/*` | Dashboard pages/components. |
| `lib/auth.ts` | Single-user session (password from env, signed cookie). |
| `lib/crypto.ts` | AES encrypt/decrypt for tokens (key from env). |

---

## 3. Data Model (Prisma — summary)

- **Account** — `igUserId`, `username`, `name`, `biography`, `website`, `profilePictureUrl`, `followersCount`, `followsCount`, `mediaCount`, `accessTokenEnc`, `tokenExpiresAt`, `lastSyncedAt`.
- **AccountSnapshot** — daily time-series: `accountId`, `date`, `followersCount`, `reach`, `views`, `accountsEngaged`, `totalInteractions`, `profileLinksTaps`, `netFollows`, `raw` (JSON). Unique `(accountId, date)`.
- **Media** — `igMediaId`, `accountId`, `mediaType`, `mediaProductType` (FEED/REELS/STORY), `caption`, `permalink`, `timestamp`, `thumbnailUrl`, `likeCount`, `commentsCount`.
- **MediaInsightSnapshot** — `mediaId`, `capturedAt`, `reach`, `views`, `likes`, `comments`, `saved`, `shares`, `totalInteractions`, `reelsAvgWatchTime`, `reelsSkipRate`, `raw`.
- **StorySnapshot** — `accountId`, `storyMediaId`, `capturedAt`, `reach`, `views`, `replies`, `tapsForward`, `tapsBack`, `exits`, `follows`, `raw`.
- **Demographic** — `accountId`, `capturedAt`, `dimension` (age/gender/country/city), `breakdown` (JSON).
- **Recommendation** — `accountId`, `generatedAt`, `signals` (JSON), `narrativeMarkdown`, `model`.

---

## 4. Data Flow

1. **Connect:** OAuth → exchange for long-lived token → store encrypted in `Account`.
2. **Sync (cron or manual):** rate-limited client → IG API → upsert `Media` + write `*Snapshot` rows. Incremental: new media fully; recent media (<14 days) refreshed; older media synced once. Stories polled every ~3h within the 24h window and persisted.
3. **Analyze:** compute derived metrics from snapshots.
4. **Recommend:** rules build signals → OpenAI → store `Recommendation`.
5. **Display:** dashboard reads from Postgres only (fast, no live API on load). "Sync now" triggers an on-demand, rate-aware sync.

---

## 5. Recommendations Engine (hybrid)

**Rules compute signals:**
- Engagement rate = `total_interactions / reach`.
- Follower growth trend (net follows over 7/30 days).
- Best posting weekday/hour (media `timestamp` × reach heatmap).
- Best format (reach/engagement by `media_product_type`).
- Reel hook quality (`reels_skip_rate` + `ig_reels_avg_watch_time`).
- Story completion (`1 − exits/reach`).
- Posting cadence (gaps between posts).

**Signals (JSON) → OpenAI `gpt-4.1`** → concise Ukrainian recommendations grouped: **Контент / Формат / Час / Аудиторія / Stories**, each citing the metric that justifies it. Deterministic signals mean the model explains real numbers, not hallucinations.

---

## 6. UI (single dashboard page)

Account header → KPI cards (followers + net growth, reach, views, engagement rate, profile link taps) → Reach/Views + Followers trend charts (30/90-day toggle) → engagement breakdown → top-posts table (sortable by reach/saves/engagement) → Reels panel (views, avg watch time, skip rate) → Stories panel (views, exits, replies, follows) → audience demographics (age/gender/geo) → AI recommendations card. "Sync now" button + last-synced timestamp. Login gate, `noindex`.

---

## 7. Security & Reliability

- Tokens encrypted at rest (AES; key in env, never committed).
- Dashboard behind single-user login; `noindex`; secrets in a **new** `.env` for this project (copy App ID/secret from `dm zahar manager`; generate a fresh insights-scoped token via OAuth — do not reuse the messaging token).
- Sync errors logged + surfaced in a "sync health" badge; partial failures don't break the dashboard (last good snapshot shown).
- Token auto-refresh before day 60.

---

## 8. Testing

- Unit tests (deterministic): analytics calculations, rate-limiter behavior, recommendation rules.
- IG API responses mocked (no live calls in tests).

---

## 9. Deployment

- Multi-stage Dockerfile; docker-compose (`app` + `postgres` + `worker`).
- Traefik labels, subdomain (e.g. `ig.maxico.site`), `noindex` until launch.
- `prisma migrate deploy` on release. Env on VPS (`161.97.107.251`).

---

## 10. Setup Risk (must resolve before live data)

The existing app is currently connected to **@maki.med.bariatric**. To connect a **different** account and pull insights, the target account must either:
- be under Max's access (added as a **tester/role** on the app while it's in Development mode), **or**
- the app needs **Advanced Access** (App Review) for `instagram_business_manage_insights`.

If the target is Max's own / a MaxIco account or a client under his Business Manager, this is quick. The OAuth flow will be built to connect any account the authenticated user can grant.

---

## 11. Open Questions (to confirm during planning)

- Exact target IG account (username) for the first connection.
- Final subdomain for Traefik.
- Postgres: shared VPS instance vs dedicated container for this project.
