-- Muscle attribution: primary (1.0), secondary (0.5), other (0.3)
-- muscle_groups kept in sync via trigger for search/filter compat

create or replace function public.is_valid_grow_muscle(m text)
returns boolean
language sql
immutable
as $$
  select m = any (array[
    'chest', 'triceps', 'biceps', 'shoulders', 'rear_delts', 'upper_back',
    'back', 'quads', 'hamstrings', 'glutes', 'calves', 'forearms', 'core'
  ]::text[]);
$$;

create or replace function public.backfill_muscle_attribution_from_groups(groups text[])
returns table (
  primary_muscle text,
  secondary_muscles text[],
  other_muscles text[]
)
language sql
immutable
as $$
  select
    groups[1],
    coalesce(groups[2:3], '{}'::text[]),
    case
      when coalesce(array_length(groups, 1), 0) > 3 then groups[4:]
      else '{}'::text[]
    end;
$$;

create or replace function public.sync_exercise_muscle_groups()
returns trigger
language plpgsql
as $$
begin
  new.muscle_groups := array_remove(
    array_cat(
      array_cat(array[new.primary_muscle], coalesce(new.secondary_muscles, '{}')),
      coalesce(new.other_muscles, '{}')
    ),
    null
  );
  return new;
end;
$$;

-- exercise_templates
alter table public.exercise_templates
  add column if not exists primary_muscle text,
  add column if not exists secondary_muscles text[] not null default '{}',
  add column if not exists other_muscles text[] not null default '{}';

update public.exercise_templates
set
  primary_muscle = (
    select b.primary_muscle
    from public.backfill_muscle_attribution_from_groups(muscle_groups) b
  ),
  secondary_muscles = (
    select b.secondary_muscles
    from public.backfill_muscle_attribution_from_groups(muscle_groups) b
  ),
  other_muscles = (
    select b.other_muscles
    from public.backfill_muscle_attribution_from_groups(muscle_groups) b
  )
where primary_muscle is null;

alter table public.exercise_templates
  alter column primary_muscle set not null;

alter table public.exercise_templates
  add constraint exercise_templates_primary_muscle_valid
    check (public.is_valid_grow_muscle(primary_muscle));

drop trigger if exists exercise_templates_sync_muscle_groups on public.exercise_templates;
create trigger exercise_templates_sync_muscle_groups
  before insert or update on public.exercise_templates
  for each row execute function public.sync_exercise_muscle_groups();

-- exercises
alter table public.exercises
  add column if not exists primary_muscle text,
  add column if not exists secondary_muscles text[] not null default '{}',
  add column if not exists other_muscles text[] not null default '{}';

update public.exercises
set
  primary_muscle = (
    select b.primary_muscle
    from public.backfill_muscle_attribution_from_groups(muscle_groups) b
  ),
  secondary_muscles = (
    select b.secondary_muscles
    from public.backfill_muscle_attribution_from_groups(muscle_groups) b
  ),
  other_muscles = (
    select b.other_muscles
    from public.backfill_muscle_attribution_from_groups(muscle_groups) b
  )
where primary_muscle is null;

alter table public.exercises
  alter column primary_muscle set not null;

alter table public.exercises
  add constraint exercises_primary_muscle_valid
    check (public.is_valid_grow_muscle(primary_muscle));

drop trigger if exists exercises_sync_muscle_groups on public.exercises;
create trigger exercises_sync_muscle_groups
  before insert or update on public.exercises
  for each row execute function public.sync_exercise_muscle_groups();

-- muscle_weekly_volume
create table if not exists public.muscle_weekly_volume (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  muscle text not null,
  weighted_tonnage_kg numeric not null default 0,
  sets integer not null default 0,
  avg_rpe numeric(2, 1),
  primary key (user_id, week_start, muscle),
  constraint muscle_weekly_volume_muscle_valid
    check (public.is_valid_grow_muscle(muscle))
);

alter table public.muscle_weekly_volume enable row level security;

create policy "muscle_weekly_volume_own" on public.muscle_weekly_volume
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- signup copies attribution columns
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.exercises (
    user_id,
    name,
    category,
    muscle_groups,
    primary_muscle,
    secondary_muscles,
    other_muscles,
    is_compound,
    movement_type
  )
  select
    new.id,
    t.name,
    t.category,
    t.muscle_groups,
    t.primary_muscle,
    t.secondary_muscles,
    t.other_muscles,
    t.is_compound,
    t.movement_type
  from public.exercise_templates t;

  return new;
end;
$$;
