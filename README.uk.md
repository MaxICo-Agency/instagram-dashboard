<!-- LANG -->
[🇬🇧 English](README.md) · **🇺🇦 Українською**

# Instagram Dashboard

Самостійно-розгортуваний **дашборд аналітики Instagram з AI** — ефективність Reels, охоплення, залученість, приріст підписників, демографія аудиторії, **Whisper-транскрипти**, аналіз паттернів мовлення та **AI-генератор скриптів** у твоєму стилі. З адмін-входом. Зроблено **[MaxICo Labs](https://maxicolabs.com/)**.

🔗 **Демо:** https://inst-dashbord.maxicolabs.com

![Огляд](docs/screenshots/overview.png)

## Що показує

| Вкладка | Вміст |
|---|---|
| **Огляд** | KPI з **вибором періоду (7 / 30 / 90 днів / весь час) і порівнянням із попереднім періодом**, кращий день/час/формат, графік переглядів, топ-пости (клікабельні) |
| **Публікації** | Повна таблиця: пошук, фільтр за типом, сортування, мінібари переглядів, бейджі ER%, лінки на пости |
| **Підписники** | Приріст із відмітками Reels, кореляція «перегляди → приріст» |
| **Інсайти** | За днем тижня, місячна динаміка, збереження vs поширення, розподіл, топ за ER% |
| **Паттерни** | З Whisper-транскриптів: довжина скрипта vs перегляди, питання в хуку, розмовність, слова-магніти/збереження |
| **Скрипти** | Транскрипти кожного рилса |
| **Генератор** | AI пише скрипт Reel у **твоєму** стилі на основі твоїх топ-транскриптів + паттернів |
| **Аудиторія** | Реальна демографія: стать, вік, країни, міста |
| **AI-поради** | Рекомендації LLM на основі твоїх метрик |

## Стек / формат

Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Recharts · OpenAI (chat + Whisper) · збереження у файлі на Docker-volume. Без зовнішньої БД.

## Швидкий старт (локально)

```bash
git clone https://github.com/MaxICo-Agency/instagram-dashboard.git
cd instagram-dashboard
pnpm install                 # або npm install
cp .env.example .env.local   # заповни (див. нижче)
pnpm dev                     # → http://localhost:3000
```

Перший екран — **адмін-вхід** (логін/пароль із `.env.local`). Далі або реальні дані (якщо є токен), або екран підключення.

## Конфігурація

Задай у `.env.local` (локально) / `.env` (сервер) — **або додай пізніше прямо в дашборді: ⚙ Налаштування → API-ключі** (зберігається на сервері, без передеплою):

```env
# Адмін-вхід
ADMIN_USERNAME=admin
ADMIN_PASSWORD=твій_пароль
AUTH_SECRET=випадковий_рядок         # openssl rand -hex 32

# Instagram API
IG_ACCESS_TOKEN=                     # токен зі scope instagram_business_manage_insights
IG_USER_ID=me                        # або ig-business-account-id
IG_API_HOST=https://graph.instagram.com
IG_OWNER_HANDLE=твій_нік             # для UTM у футтері
IG_REQUIRE_LIVE=1                    # прод: ніколи не показувати демо

# OpenAI (AI-поради, генератор, Whisper-транскрипти)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1
```

> **Токен Instagram і ключ OpenAI можна повністю керувати з UI** — відкрий **⚙ Налаштування**, встав їх і натисни **Зберегти**. Вони зберігаються на data-volume сервера.

### Як отримати токен Instagram
Повний гайд зі скриншотами: **[`docs/Instagram-Dashboard-Інструкція.pdf`](docs/Instagram-Dashboard-%D0%86%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%86%D1%96%D1%8F.pdf)**.
Коротко: акаунт **Business/Creator** прив'язаний до Meta-апа → сценарій **«Manage messaging & content on Instagram»** → додай дозвіл `instagram_business_manage_insights` → згенеруй токен.

### AI-фічі (Whisper / Генератор)
Потрібен робочий `OPENAI_API_KEY`. У **⚙ Налаштування → «Транскрибувати рилси»** додаток завантажує кожен рилс і розшифровує через OpenAI Whisper (зберігає на data-volume). Після цього **Паттерни**, **Скрипти** і **Генератор** працюють на твоїх реальних транскриптах.

## Деплой (Docker + Traefik)

```bash
git clone https://github.com/MaxICo-Agency/instagram-dashboard.git /opt/instagram-dashboard
cd /opt/instagram-dashboard
cp .env.example .env && nano .env     # ADMIN_*, AUTH_SECRET, IG_*, OPENAI_*, IG_REQUIRE_LIVE=1
docker compose up -d --build
```

`docker-compose.yml` містить Traefik-лейбли для `inst-dashbord.maxicolabs.com` (HTTPS через Let's Encrypt) і named-volume `data` (`/app/data`) для транскриптів + збереженого конфігу. Спершу постав DNS A-запис субдомену на сервер; для свого домену зміни лейбл `Host(...)`.

## Безпека

- Кожна сторінка і кожен `/api/*` — за **адмін-входом** (підписаний cookie). Неавторизовані запити редіректяться / повертають 401.
- Секрети — лише в `.env`/`.env.local` чи на data-volume, **ніколи не комітяться** (`.gitignore` + build-guard).
- `noindex` на всіх сторінках. Збірка через `next build --webpack` (Turbopack падає на не-ASCII шляхах).

## Примітки

- Дані кешуються 10 хв; **Оновити** (або `POST /api/refresh`) скидає кеш.
- Футтер **MaxICo Labs** обов'язковий на кожній сторінці (build-guard валить збірку, якщо його прибрати).

---

<sub>Зроблено **[MaxICo Labs](https://maxicolabs.com/)** · performance-маркетинг UA/US · потрібне індивідуальне рішення? `all@maxico.agency`</sub>
