create or replace function public.refresh_analytics_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start_day int;
  v_week_start date;
  v_tonnage numeric;
  v_workouts_completed int;
  v_avg_rpe numeric;
  v_total_sets int;
  v_rolling_rpe numeric;
begin
  select coalesce(us.week_start_day, 1)
  into v_week_start_day
  from public.users_settings us
  where us.user_id = p_user_id;

  v_week_start_day := coalesce(v_week_start_day, 1);
  v_week_start := public.week_start_for(current_date, v_week_start_day);

  select
    coalesce(sum(s.reps * s.weight_kg), 0),
    count(distinct w.id)::int,
    round(avg(s.rpe) filter (where s.rpe is not null)::numeric, 1),
    count(s.id) filter (where s.set_type = 'working')::int
  into v_tonnage, v_workouts_completed, v_avg_rpe, v_total_sets
  from public.workouts w
  left join public.sets s on s.workout_id = w.id and s.set_type = 'working'
  where w.user_id = p_user_id
    and w.date >= v_week_start
    and w.date <= current_date;

  insert into public.weekly_volume (
    user_id,
    week_start,
    tonnage,
    total_sets,
    compound_volume,
    avg_rpe,
    workouts_completed
  )
  values (
    p_user_id,
    v_week_start,
    coalesce(v_tonnage, 0),
    coalesce(v_total_sets, 0),
    0,
    v_avg_rpe,
    coalesce(v_workouts_completed, 0)
  )
  on conflict (user_id, week_start) do update set
    tonnage = excluded.tonnage,
    total_sets = excluded.total_sets,
    avg_rpe = excluded.avg_rpe,
    workouts_completed = excluded.workouts_completed;

  select round(avg(s.rpe)::numeric, 1)
  into v_rolling_rpe
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  where w.user_id = p_user_id
    and w.date >= current_date - 6
    and w.date <= current_date
    and s.set_type = 'working'
    and s.rpe is not null;

  insert into public.fatigue_signals (user_id, calculated_at, rolling_7d_avg_rpe)
  values (p_user_id, now(), v_rolling_rpe)
  on conflict (user_id) do update set
    calculated_at = excluded.calculated_at,
    rolling_7d_avg_rpe = excluded.rolling_7d_avg_rpe;
end;
$$;
