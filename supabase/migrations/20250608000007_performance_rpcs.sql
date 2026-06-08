-- Week start helper (p_week_start_day: 0=Sunday … 6=Saturday)
create or replace function public.week_start_for(p_date date, p_week_start_day int)
returns date
language sql
immutable
as $$
  select p_date - ((extract(dow from p_date)::int - p_week_start_day + 7) % 7);
$$;

-- Dashboard summary: one round-trip for home stats
create or replace function public.get_dashboard_summary(p_week_start_day int default 1)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_week_start date;
  v_rolling_start date := current_date - 6;
  v_workouts_this_week int;
  v_weekly_tonnage numeric;
  v_rolling_rpe numeric;
  v_total_workouts bigint;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_week_start := public.week_start_for(current_date, p_week_start_day);

  select count(*)::int
  into v_workouts_this_week
  from public.workouts w
  where w.user_id = v_user_id
    and w.date >= v_week_start
    and w.date <= current_date;

  select coalesce(sum(s.reps * s.weight_kg), 0)
  into v_weekly_tonnage
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  where w.user_id = v_user_id
    and w.date >= v_week_start
    and w.date <= current_date
    and s.set_type = 'working';

  select round(avg(s.rpe)::numeric, 1)
  into v_rolling_rpe
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  where w.user_id = v_user_id
    and w.date >= v_rolling_start
    and w.date <= current_date
    and s.set_type = 'working'
    and s.rpe is not null;

  select count(*)
  into v_total_workouts
  from public.workouts w
  where w.user_id = v_user_id;

  return json_build_object(
    'workouts_this_week', v_workouts_this_week,
    'weekly_tonnage_kg', coalesce(round(v_weekly_tonnage)::bigint, 0),
    'rolling_7d_avg_rpe', v_rolling_rpe,
    'total_workouts', v_total_workouts
  );
end;
$$;

grant execute on function public.get_dashboard_summary(int) to authenticated;

-- Paginated workout list with exercise count
create or replace function public.list_workouts(p_limit int default 25, p_offset int default 0)
returns table (
  id uuid,
  user_id uuid,
  date date,
  duration_minutes integer,
  notes text,
  program_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  exercise_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    w.id,
    w.user_id,
    w.date,
    w.duration_minutes,
    w.notes,
    w.program_id,
    w.created_at,
    w.updated_at,
    count(distinct s.exercise_id) as exercise_count
  from public.workouts w
  left join public.sets s on s.workout_id = w.id
  where w.user_id = auth.uid()
  group by w.id
  order by w.date desc, w.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.list_workouts(int, int) to authenticated;
