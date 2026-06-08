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

## Repo layout

```
Grow/
├── AGENTS.md
├── phases.txt              # Locked decisions + phase scope (source of truth)
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/                # e1RM, unit conversion, analytics helpers
│   ├── stores/             # Zustand (workout session)
│   └── pages/ or routes/
├── supabase/
│   └── migrations/         # Schema + RLS + refresh functions
└── .cursor/rules/          # Cursor-specific guardrails
```

Nested `AGENTS.md` files may be added under `src/` or `supabase/` if those areas grow large.

## Commands

> Commands (Phase 0 scaffold):

```bash
npm install
npm run dev              # Vite dev server (default :5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # Vitest (add in Phase 0)
npm run lint             # ESLint (add in Phase 0)
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

## Phase discipline

Build in order: **Phase 0 → 0.5 → 1 → 2 → 3** (see `phases.txt`). Do not start Phase 3 (AI programming) until Phase 2 analytics feel right on real data.

Current focus: **Phase 0.5** — body heatmap UI prototype (`@mjcdev/react-body-highlighter`, mock volume).

## Non-obvious domain rules (summary)

Full detail in `phases.txt`. Highlights agents often get wrong:

- **Sets:** `working` vs `warmup` — only working sets feed analytics
- **Weight:** store `weight_kg`; convert at UI boundary from user display unit
- **Time:** calendar week for volume/progression; rolling 7-day for fatigue (label both clearly)
- **e1RM:** reps ≤ 10; formula per `movement_type` (not one global Epley)
- **Out of scope:** social, streaks, nutrition, iOS, multi-user (until promoted in `phases.txt`)
