create table public.users_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_unit public.display_unit not null default 'kg',
  week_start_day smallint not null default 1 check (week_start_day between 0 and 6),
  chart_weeks smallint not null default 6 check (chart_weeks > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  muscle_groups text[] not null default '{}',
  is_compound boolean not null default false,
  movement_type public.movement_type not null,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text,
  muscle_groups text[] not null default '{}',
  is_compound boolean not null default false,
  movement_type public.movement_type not null,
  is_tracked boolean not null default false,
  e1rm_formula text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_exercises (
  program_id uuid not null references public.programs (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  sort_order integer not null,
  primary key (program_id, exercise_id)
);

create table public.training_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  duration_minutes integer,
  notes text,
  program_id uuid references public.programs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  set_number integer not null,
  set_type public.set_type not null default 'working',
  reps integer not null check (reps > 0),
  weight_kg numeric not null check (weight_kg >= 0),
  rpe numeric(2, 1) check (rpe is null or (rpe >= 6 and rpe <= 10)),
  notes text,
  created_at timestamptz not null default now(),
  unique (workout_id, exercise_id, set_number)
);

create table public.weekly_volume (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  tonnage numeric not null default 0,
  total_sets integer not null default 0,
  compound_volume numeric not null default 0,
  avg_rpe numeric(2, 1),
  workouts_completed integer not null default 0,
  primary key (user_id, week_start)
);

create table public.exercise_performance (
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  week_start date not null,
  e1rm numeric,
  best_set_json jsonb,
  weekly_volume numeric not null default 0,
  weekly_sets integer not null default 0,
  primary key (user_id, exercise_id, week_start)
);

create table public.fatigue_signals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  calculated_at timestamptz not null default now(),
  rolling_7d_avg_rpe numeric(2, 1),
  rpe_trend numeric(3, 2),
  performance_drop_detected boolean not null default false,
  dropped_exercises uuid[] not null default '{}',
  consecutive_high_rpe_sessions integer not null default 0,
  deload_score smallint not null default 0 check (deload_score between 0 and 100),
  deload_tier public.deload_tier,
  deload_reason text
);

create table public.recovery_metrics (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sleep_hours numeric(3, 1),
  hrv numeric,
  resting_hr smallint,
  body_weight_kg numeric,
  primary key (user_id, date)
);

create index exercises_user_id_idx on public.exercises (user_id);
create index workouts_user_id_date_idx on public.workouts (user_id, date desc);
create index sets_workout_id_idx on public.sets (workout_id);
create index sets_exercise_id_idx on public.sets (exercise_id);
