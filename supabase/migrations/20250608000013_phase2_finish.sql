-- Phase 2 finish: rest timer settings + stalled_exercises on fatigue_signals

alter table public.users_settings
  add column if not exists rest_timer_enabled boolean not null default false,
  add column if not exists rest_timer_seconds smallint not null default 90
    check (rest_timer_seconds between 30 and 600);

alter table public.fatigue_signals
  add column if not exists stalled_exercises text[] not null default '{}';
