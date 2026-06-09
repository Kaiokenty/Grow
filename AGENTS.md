# Grow

Personal workout tracking and analytics web app. Goal: plain-language training insights (progression, fatigue, deload) — not just charts. Solo use first; full-body hypertrophy/strength with RPE.

**Domain decisions and build phases:** [`phases.txt`](phases.txt) — read before implementing features or schema changes.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript + shadcn/ui + Tailwind |
| Server state | TanStack Query |
| Workout session UI | Zustand |
| Backend | Supabase (Postgres + Auth); no custom server for MVP |
| Charts | Recharts |
| Body map | `@mjcdev/react-body-highlighter` |

## Repo layout

```
Grow/
├── AGENTS.md
├── phases.txt              # Locked decisions + phase scope (source of truth)
├── src/
│   ├── components/
│   │   ├── body-map/       # MuscleMapExplorer, BodyHeatmap, detail panels
│   │   ├── dashboard/      # DeloadCard, charts, weekly summary
│   │   ├── workout/        # Logger UI (SetTable, ExerciseCard, …)
│   │   └── layout/         # AppShell, LoggerShell
│   ├── hooks/
│   ├── lib/
│   │   ├── body-map/       # Slug mapping, attribution weights, intensity
│   │   ├── e1rm/           # Formula dispatch by movement_type
│   │   └── api/            # Supabase fetchers + RPC wrappers
│   ├── stores/             # Zustand (workout session)
│   └── pages/
├── supabase/
│   └── migrations/         # Schema + RLS + refresh functions + RPCs
└── .cursor/rules/
```

## Commands

```bash
npm install
npm run dev              # Vite dev server (default :5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # Vitest
npm run lint             # ESLint
```

Supabase (local CLI):

```bash
npx supabase start       # Local Postgres + Auth
npx supabase db push     # Apply migrations to linked project
npx supabase gen types typescript --local > src/lib/database.types.ts
```

## Verify before finishing

```bash
npm run lint
npm run test
npm run build
```

For schema changes: confirm RLS policies and run migrations locally before marking done.

## Environment

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never commit `.env` or keys. Use `.env.example` with empty placeholders.

### Auth redirect URLs (password reset)

`ForgotPasswordPage` sends users to `{origin}/reset-password`. Add these in **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:

- `http://localhost:5173/reset-password` (local Vite)
- Your production URL, e.g. `https://your-domain.com/reset-password`

Local `supabase start` uses matching URLs in [`supabase/config.toml`](supabase/config.toml) (`site_url` + `additional_redirect_urls`).

## Phase discipline

Build in order: **Phase 0 → 0.5 → 1 → 2 → 3 → 3.5** (see `phases.txt`). Do not start Phase 3 (AI programming) until Phase 2 analytics feel right on real data. Phase 3.5 (mobile UI + Android deploy) can start once Phase 2 is good enough for daily phone use — does not require Phase 3.

**Current focus: Phase 2** — complete. Tune deload thresholds on real/imported data (`scripts/sample-grow-export-v1.json`) before Phase 3.

| Phase | Status |
|---|---|
| 0 Scaffold + schema | Done |
| 0.5 Body heatmap prototype | Done |
| 1 Logging MVP | Done |
| 2 Analytics + body map dashboard | Done |
| 3 AI programming | Not started |
| 3.5 Mobile UI revamp + Android deploy | Not started |

## Key routes

| Path | Purpose |
|---|---|
| `/` | Dashboard — body-map hero, deload card, charts |
| `/body-map` | Deep dive — sparkline, full exercise list per muscle |
| `/workouts/active` | Live workout logger |
| `/workouts/:id/summary` | Post-workout summary (after save) |
| `/workouts/:id` | Workout detail (read-only) |
| `/exercises` | Exercise library with tiered muscle attribution |
| Settings → Export/Import | JSON backup + test data seed (grow-export v1) |
| `/blocks` | Training blocks — start/end, summary, compare |

**Phase 3.5 (mobile):** bottom tab nav on small screens, logger thumb UX, static deploy (Vercel/Netlify/CF Pages) + Supabase prod redirect URLs, optional PWA. Detail in `phases.txt` §3.5.

## Non-obvious domain rules (summary)

Full detail in `phases.txt`. Highlights agents often get wrong:

- **Sets:** `working` vs `warmup` — only working sets feed analytics
- **Weight:** store `weight_kg`; convert at UI boundary from user display unit
- **Time:** calendar week for volume/progression; rolling 7-day for fatigue (label both clearly)
- **e1RM:** reps ≤ 10; formula per `movement_type` (not one global Epley)
- **Muscle volume:** weighted attribution (primary 1.0, secondary 0.5, other 0.3); headline weekly tonnage is raw (no double-count)
- **Analytics:** pre-calculated on workout save via `refresh_analytics_for_user` trigger — do not heavy-aggregate in client
- **Out of scope:** social, streaks, nutrition, iOS, multi-user (until promoted in `phases.txt`)
