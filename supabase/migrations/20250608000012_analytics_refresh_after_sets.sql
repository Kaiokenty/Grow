-- Analytics refresh: auth guard, client-callable RPC, trigger on delete only

create or replace function public.refresh_analytics_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start_day int;
  v_week_start date;
  v_prior_week_start date;
  v_tonnage numeric;
  v_compound_tonnage numeric;
  v_workouts_completed int;
  v_avg_rpe numeric;
  v_total_sets int;
  v_rolling_rpe numeric;
  v_prior_rolling_rpe numeric;
  v_rpe_trend numeric;
  v_consecutive_high int;
  v_performance_drop boolean;
  v_dropped_exercises uuid[];
  v_deload_score int;
  v_deload_tier public.deload_tier;
  v_deload_reason text;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'not authorized';
  end if;

  select coalesce(us.week_start_day, 1)
  into v_week_start_day
  from public.users_settings us
  where us.user_id = p_user_id;

  v_week_start_day := coalesce(v_week_start_day, 1);
  v_week_start := public.week_start_for(current_date, v_week_start_day);
  v_prior_week_start := v_week_start - 7;

  -- weekly_volume (raw tonnage — no muscle double-count)
  select
    coalesce(sum(s.reps * s.weight_kg), 0),
    coalesce(sum(s.reps * s.weight_kg) filter (where e.is_compound), 0),
    count(distinct w.id)::int,
    round(avg(s.rpe) filter (where s.rpe is not null)::numeric, 1),
    count(s.id) filter (where s.set_type = 'working')::int
  into v_tonnage, v_compound_tonnage, v_workouts_completed, v_avg_rpe, v_total_sets
  from public.workouts w
  left join public.sets s on s.workout_id = w.id and s.set_type = 'working'
  left join public.exercises e on e.id = s.exercise_id
  where w.user_id = p_user_id
    and w.date >= v_week_start
    and w.date <= current_date;

  insert into public.weekly_volume (
    user_id, week_start, tonnage, total_sets, compound_volume, avg_rpe, workouts_completed
  )
  values (
    p_user_id, v_week_start,
    coalesce(v_tonnage, 0), coalesce(v_total_sets, 0),
    coalesce(v_compound_tonnage, 0), v_avg_rpe, coalesce(v_workouts_completed, 0)
  )
  on conflict (user_id, week_start) do update set
    tonnage = excluded.tonnage,
    total_sets = excluded.total_sets,
    compound_volume = excluded.compound_volume,
    avg_rpe = excluded.avg_rpe,
    workouts_completed = excluded.workouts_completed;

  -- exercise_performance for current calendar week
  delete from public.exercise_performance
  where user_id = p_user_id and week_start = v_week_start;

  insert into public.exercise_performance (
    user_id, exercise_id, week_start, e1rm, best_set_json, weekly_volume, weekly_sets
  )
  select
    p_user_id,
    agg.exercise_id,
    v_week_start,
    public.calc_e1rm_simple(agg.best_weight_kg, agg.best_reps),
    jsonb_build_object(
      'reps', agg.best_reps,
      'weight_kg', agg.best_weight_kg,
      'rpe', agg.best_rpe
    ),
    agg.weekly_volume,
    agg.weekly_sets
  from (
    select
      s.exercise_id,
      sum(s.reps * s.weight_kg) as weekly_volume,
      count(*)::int as weekly_sets,
      (
        select s2.weight_kg
        from public.sets s2
        join public.workouts w2 on w2.id = s2.workout_id
        where w2.user_id = p_user_id
          and w2.date >= v_week_start and w2.date <= current_date
          and s2.exercise_id = s.exercise_id
          and s2.set_type = 'working'
          and s2.reps <= 10
        order by public.calc_e1rm_simple(s2.weight_kg, s2.reps) desc nulls last
        limit 1
      ) as best_weight_kg,
      (
        select s2.reps
        from public.sets s2
        join public.workouts w2 on w2.id = s2.workout_id
        where w2.user_id = p_user_id
          and w2.date >= v_week_start and w2.date <= current_date
          and s2.exercise_id = s.exercise_id
          and s2.set_type = 'working'
          and s2.reps <= 10
        order by public.calc_e1rm_simple(s2.weight_kg, s2.reps) desc nulls last
        limit 1
      ) as best_reps,
      (
        select s2.rpe
        from public.sets s2
        join public.workouts w2 on w2.id = s2.workout_id
        where w2.user_id = p_user_id
          and w2.date >= v_week_start and w2.date <= current_date
          and s2.exercise_id = s.exercise_id
          and s2.set_type = 'working'
          and s2.reps <= 10
        order by public.calc_e1rm_simple(s2.weight_kg, s2.reps) desc nulls last
        limit 1
      ) as best_rpe
    from public.sets s
    join public.workouts w on w.id = s.workout_id
    where w.user_id = p_user_id
      and w.date >= v_week_start and w.date <= current_date
      and s.set_type = 'working'
    group by s.exercise_id
  ) agg;

  -- muscle_weekly_volume (weighted attribution)
  delete from public.muscle_weekly_volume
  where user_id = p_user_id and week_start = v_week_start;

  insert into public.muscle_weekly_volume (
    user_id, week_start, muscle, weighted_tonnage_kg, sets, avg_rpe
  )
  select
    p_user_id,
    v_week_start,
    contrib.muscle,
    coalesce(sum(contrib.weighted_tonnage), 0),
    count(*)::int,
    round(avg(s.rpe) filter (where s.rpe is not null)::numeric, 1)
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  join public.exercises e on e.id = s.exercise_id
  cross join lateral (
    select e.primary_muscle as muscle, s.reps * s.weight_kg * 1.0 as weighted_tonnage
    union all
    select unnest(e.secondary_muscles), s.reps * s.weight_kg * 0.5
    union all
    select unnest(e.other_muscles), s.reps * s.weight_kg * 0.3
  ) contrib
  where w.user_id = p_user_id
    and w.date >= v_week_start and w.date <= current_date
    and s.set_type = 'working'
  group by contrib.muscle;

  -- rolling 7-day RPE
  select round(avg(s.rpe)::numeric, 1)
  into v_rolling_rpe
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  where w.user_id = p_user_id
    and w.date >= current_date - 6 and w.date <= current_date
    and s.set_type = 'working' and s.rpe is not null;

  select round(avg(s.rpe)::numeric, 1)
  into v_prior_rolling_rpe
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  where w.user_id = p_user_id
    and w.date >= current_date - 13 and w.date <= current_date - 7
    and s.set_type = 'working' and s.rpe is not null;

  v_rpe_trend := coalesce(v_rolling_rpe, 0) - coalesce(v_prior_rolling_rpe, 0);

  -- consecutive high-RPE sessions (RPE >= 8.5 on any working set)
  select count(*)::int into v_consecutive_high
  from (
    select w.id,
      bool_or(s.rpe >= 8.5) as had_high
    from public.workouts w
    join public.sets s on s.workout_id = w.id and s.set_type = 'working'
    where w.user_id = p_user_id
    group by w.id, w.date
    order by w.date desc
    limit 10
  ) recent
  where recent.had_high;

  -- performance drop: tracked exercise e1rm down >=3% for 2 consecutive weeks
  select
    coalesce(bool_or(true), false),
    coalesce(array_agg(distinct ep.exercise_id) filter (where ep.exercise_id is not null), '{}')
  into v_performance_drop, v_dropped_exercises
  from public.exercises ex
  join public.exercise_performance ep on ep.exercise_id = ex.id and ep.user_id = p_user_id
    and ep.week_start = v_week_start
  join public.exercise_performance ep_prev on ep_prev.exercise_id = ex.id and ep_prev.user_id = p_user_id
    and ep_prev.week_start = v_prior_week_start
  where ex.user_id = p_user_id
    and ex.is_tracked
    and ep.e1rm is not null and ep_prev.e1rm is not null
    and ep.e1rm <= ep_prev.e1rm * 0.97;

  -- deload score 0–100
  v_deload_score := 0;
  if coalesce(v_rolling_rpe, 0) >= 8.5 then v_deload_score := v_deload_score + 30;
  elsif coalesce(v_rolling_rpe, 0) >= 8.0 then v_deload_score := v_deload_score + 20;
  elsif coalesce(v_rolling_rpe, 0) >= 7.5 then v_deload_score := v_deload_score + 10;
  end if;

  if v_rpe_trend >= 0.5 then v_deload_score := v_deload_score + 25;
  elsif v_rpe_trend >= 0.25 then v_deload_score := v_deload_score + 15;
  elsif v_rpe_trend > 0 then v_deload_score := v_deload_score + 5;
  end if;

  if v_performance_drop then v_deload_score := v_deload_score + 25; end if;
  v_deload_score := v_deload_score + least(v_consecutive_high * 5, 20);
  v_deload_score := least(v_deload_score, 100);

  v_deload_tier := case
    when v_deload_score >= 67 then 'strong'::public.deload_tier
    when v_deload_score >= 34 then 'moderate'::public.deload_tier
    else 'lean'::public.deload_tier
  end;

  v_deload_reason := case
    when v_deload_score < 34 then 'Training load looks sustainable — no strong deload signal.'
    when v_performance_drop and coalesce(v_rolling_rpe, 0) >= 8
      then 'Tracked lifts dipped while rolling 7-day RPE is elevated.'
    when v_performance_drop
      then 'Tracked lift e1RM down ≥3% for two consecutive weeks.'
    when coalesce(v_rolling_rpe, 0) >= 8.5
      then 'Rolling 7-day average RPE is high — accumulated fatigue likely.'
    when v_rpe_trend >= 0.25
      then 'RPE trending up over the last 7 days vs the prior week.'
  else 'Multiple fatigue signals — consider backing off volume or intensity.'
  end;

  insert into public.fatigue_signals (
    user_id, calculated_at, rolling_7d_avg_rpe, rpe_trend,
    performance_drop_detected, dropped_exercises,
    consecutive_high_rpe_sessions, deload_score, deload_tier, deload_reason
  )
  values (
    p_user_id, now(), v_rolling_rpe, v_rpe_trend,
    coalesce(v_performance_drop, false), coalesce(v_dropped_exercises, '{}'),
    coalesce(v_consecutive_high, 0), v_deload_score, v_deload_tier, v_deload_reason
  )
  on conflict (user_id) do update set
    calculated_at = excluded.calculated_at,
    rolling_7d_avg_rpe = excluded.rolling_7d_avg_rpe,
    rpe_trend = excluded.rpe_trend,
    performance_drop_detected = excluded.performance_drop_detected,
    dropped_exercises = excluded.dropped_exercises,
    consecutive_high_rpe_sessions = excluded.consecutive_high_rpe_sessions,
    deload_score = excluded.deload_score,
    deload_tier = excluded.deload_tier,
    deload_reason = excluded.deload_reason;
end;
$$;

grant execute on function public.refresh_analytics_for_user(uuid) to authenticated;

drop trigger if exists workouts_refresh_analytics on public.workouts;

create trigger workouts_refresh_analytics
  after delete on public.workouts
  for each row execute function public.trigger_refresh_analytics_for_workout();
