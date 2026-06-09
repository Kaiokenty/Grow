-- Muscle map + dashboard RPCs

create or replace function public.get_dashboard_muscle_heatmap(p_week_start_day int default 1)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_week_start date;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  v_week_start := public.week_start_for(current_date, p_week_start_day);

  return coalesce((
    select json_agg(json_build_object(
      'muscle', m.muscle,
      'weighted_tonnage_kg', round(m.weighted_tonnage_kg)::bigint,
      'sets', m.sets,
      'avg_rpe', m.avg_rpe
    ) order by m.weighted_tonnage_kg desc)
    from public.muscle_weekly_volume m
    where m.user_id = v_user_id and m.week_start = v_week_start
  ), '[]'::json);
end;
$$;

grant execute on function public.get_dashboard_muscle_heatmap(int) to authenticated;

create or replace function public.get_muscle_week_stats(
  p_muscle text,
  p_week_start_day int default 1
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_week_start date;
  v_prior_week_start date;
  v_stats record;
  v_prior_tonnage numeric;
  v_delta_pct numeric;
  v_rolling_rpe numeric;
  v_top_exercises json;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.is_valid_grow_muscle(p_muscle) then raise exception 'Invalid muscle'; end if;

  v_week_start := public.week_start_for(current_date, p_week_start_day);
  v_prior_week_start := v_week_start - 7;

  select weighted_tonnage_kg, sets, avg_rpe
  into v_stats
  from public.muscle_weekly_volume
  where user_id = v_user_id and week_start = v_week_start and muscle = p_muscle;

  select weighted_tonnage_kg into v_prior_tonnage
  from public.muscle_weekly_volume
  where user_id = v_user_id and week_start = v_prior_week_start and muscle = p_muscle;

  if coalesce(v_prior_tonnage, 0) > 0 and v_stats.weighted_tonnage_kg is not null then
    v_delta_pct := round(
      ((v_stats.weighted_tonnage_kg - v_prior_tonnage) / v_prior_tonnage * 100)::numeric, 1
    );
  end if;

  select round(avg(s.rpe)::numeric, 1) into v_rolling_rpe
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  join public.exercises e on e.id = s.exercise_id
  where w.user_id = v_user_id
    and w.date >= current_date - 6 and w.date <= current_date
    and s.set_type = 'working' and s.rpe is not null
    and (
      e.primary_muscle = p_muscle
      or p_muscle = any (e.secondary_muscles)
      or p_muscle = any (e.other_muscles)
    );

  select coalesce(json_agg(row_to_json(t) order by t.weighted_tonnage_kg desc), '[]'::json)
  into v_top_exercises
  from (
    select
      e.id as exercise_id,
      e.name,
      round(sum(
        s.reps * s.weight_kg * case
          when e.primary_muscle = p_muscle then 1.0
          when p_muscle = any (e.secondary_muscles) then 0.5
          else 0.3
        end
      ))::bigint as weighted_tonnage_kg,
      count(*)::int as sets
    from public.sets s
    join public.workouts w on w.id = s.workout_id
    join public.exercises e on e.id = s.exercise_id
    where w.user_id = v_user_id
      and w.date >= v_week_start and w.date <= current_date
      and s.set_type = 'working'
      and (
        e.primary_muscle = p_muscle
        or p_muscle = any (e.secondary_muscles)
        or p_muscle = any (e.other_muscles)
      )
    group by e.id, e.name
    order by sum(
      s.reps * s.weight_kg * case
        when e.primary_muscle = p_muscle then 1.0
        when p_muscle = any (e.secondary_muscles) then 0.5
        else 0.3
      end
    ) desc
    limit 10
  ) t;

  return json_build_object(
    'muscle', p_muscle,
    'week_start', v_week_start,
    'weighted_tonnage_kg', coalesce(round(v_stats.weighted_tonnage_kg)::bigint, 0),
    'sets', coalesce(v_stats.sets, 0),
    'avg_rpe', v_stats.avg_rpe,
    'prior_week_delta_pct', v_delta_pct,
    'rolling_7d_avg_rpe', v_rolling_rpe,
    'top_exercises', v_top_exercises
  );
end;
$$;

grant execute on function public.get_muscle_week_stats(text, int) to authenticated;

create or replace function public.get_muscle_volume_history(
  p_muscle text,
  p_weeks int default 6
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_week_start_day int;
  v_start date;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.is_valid_grow_muscle(p_muscle) then raise exception 'Invalid muscle'; end if;

  select coalesce(us.week_start_day, 1) into v_week_start_day
  from public.users_settings us where us.user_id = v_user_id;

  v_start := public.week_start_for(current_date, v_week_start_day)
    - (greatest(p_weeks, 1) - 1) * 7;

  return coalesce((
    select json_agg(json_build_object(
      'week_start', m.week_start,
      'weighted_tonnage_kg', round(m.weighted_tonnage_kg)::bigint
    ) order by m.week_start)
    from public.muscle_weekly_volume m
    where m.user_id = v_user_id
      and m.muscle = p_muscle
      and m.week_start >= v_start
  ), '[]'::json);
end;
$$;

grant execute on function public.get_muscle_volume_history(text, int) to authenticated;

create or replace function public.get_fatigue_summary()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.fatigue_signals%rowtype;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_row from public.fatigue_signals where user_id = v_user_id;

  if not found then
    return json_build_object(
      'deload_score', 0,
      'deload_tier', 'lean',
      'deload_reason', 'Log workouts to see fatigue signals.',
      'rolling_7d_avg_rpe', null,
      'rpe_trend', null,
      'performance_drop_detected', false
    );
  end if;

  return json_build_object(
    'deload_score', v_row.deload_score,
    'deload_tier', v_row.deload_tier,
    'deload_reason', v_row.deload_reason,
    'rolling_7d_avg_rpe', v_row.rolling_7d_avg_rpe,
    'rpe_trend', v_row.rpe_trend,
    'performance_drop_detected', v_row.performance_drop_detected
  );
end;
$$;

grant execute on function public.get_fatigue_summary() to authenticated;

create or replace function public.get_weekly_summary_nlg(p_week_start_day int default 1)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_week_start date;
  v_prior_week_start date;
  v_lines text[] := '{}';
  v_lift record;
  v_muscle record;
  v_fatigue public.fatigue_signals%rowtype;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  v_week_start := public.week_start_for(current_date, p_week_start_day);
  v_prior_week_start := v_week_start - 7;

  for v_lift in
    select
      ex.name,
      ep.e1rm as curr_e1rm,
      ep_prev.e1rm as prior_e1rm
    from public.exercises ex
    left join public.exercise_performance ep
      on ep.exercise_id = ex.id and ep.user_id = v_user_id and ep.week_start = v_week_start
    left join public.exercise_performance ep_prev
      on ep_prev.exercise_id = ex.id and ep_prev.user_id = v_user_id and ep_prev.week_start = v_prior_week_start
    where ex.user_id = v_user_id and ex.is_tracked
      and ep.e1rm is not null and ep_prev.e1rm is not null
    limit 5
  loop
    if v_lift.curr_e1rm > v_lift.prior_e1rm * 1.01 then
      v_lines := array_append(v_lines, v_lift.name || ' e1RM up.');
    elsif v_lift.curr_e1rm < v_lift.prior_e1rm * 0.99 then
      v_lines := array_append(v_lines, v_lift.name || ' e1RM down.');
    else
      v_lines := array_append(v_lines, v_lift.name || ' e1RM flat.');
    end if;
  end loop;

  for v_muscle in
    select
      m.muscle,
      m.weighted_tonnage_kg as curr,
      mp.weighted_tonnage_kg as prior
    from public.muscle_weekly_volume m
    left join public.muscle_weekly_volume mp
      on mp.user_id = m.user_id and mp.muscle = m.muscle and mp.week_start = v_prior_week_start
    where m.user_id = v_user_id and m.week_start = v_week_start
    order by m.weighted_tonnage_kg desc
    limit 3
  loop
    if coalesce(v_muscle.prior, 0) = 0 then
      v_lines := array_append(v_lines, initcap(replace(v_muscle.muscle, '_', ' ')) || ' volume new this week.');
    elsif v_muscle.curr > v_muscle.prior * 1.05 then
      v_lines := array_append(v_lines, initcap(replace(v_muscle.muscle, '_', ' ')) || ' volume up.');
    elsif v_muscle.curr < v_muscle.prior * 0.95 then
      v_lines := array_append(v_lines, initcap(replace(v_muscle.muscle, '_', ' ')) || ' volume down.');
    else
      v_lines := array_append(v_lines, initcap(replace(v_muscle.muscle, '_', ' ')) || ' volume flat.');
    end if;
  end loop;

  select * into v_fatigue from public.fatigue_signals where user_id = v_user_id;
  if found and coalesce(v_fatigue.rpe_trend, 0) > 0.2 then
    v_lines := array_append(v_lines, 'RPE trending high — ' || coalesce(v_fatigue.deload_tier::text, 'lean') || ' deload.');
  end if;

  return json_build_object(
    'lines', v_lines,
    'text', array_to_string(v_lines, ' ')
  );
end;
$$;

grant execute on function public.get_weekly_summary_nlg(int) to authenticated;

-- Extend dashboard summary with prior-week volume delta
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
  v_prior_week_start date;
  v_rolling_start date := current_date - 6;
  v_workouts_this_week int;
  v_weekly_tonnage numeric;
  v_prior_tonnage numeric;
  v_rolling_rpe numeric;
  v_total_workouts bigint;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  v_week_start := public.week_start_for(current_date, p_week_start_day);
  v_prior_week_start := v_week_start - 7;

  select count(*)::int into v_workouts_this_week
  from public.workouts w
  where w.user_id = v_user_id
    and w.date >= v_week_start and w.date <= current_date;

  select coalesce(sum(s.reps * s.weight_kg), 0) into v_weekly_tonnage
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  where w.user_id = v_user_id
    and w.date >= v_week_start and w.date <= current_date
    and s.set_type = 'working';

  select coalesce(tonnage, 0) into v_prior_tonnage
  from public.weekly_volume
  where user_id = v_user_id and week_start = v_prior_week_start;

  select round(avg(s.rpe)::numeric, 1) into v_rolling_rpe
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  where w.user_id = v_user_id
    and w.date >= v_rolling_start and w.date <= current_date
    and s.set_type = 'working' and s.rpe is not null;

  select count(*) into v_total_workouts from public.workouts w where w.user_id = v_user_id;

  return json_build_object(
    'workouts_this_week', v_workouts_this_week,
    'weekly_tonnage_kg', coalesce(round(v_weekly_tonnage)::bigint, 0),
    'prior_week_tonnage_kg', coalesce(round(v_prior_tonnage)::bigint, 0),
    'rolling_7d_avg_rpe', v_rolling_rpe,
    'total_workouts', v_total_workouts,
    'week_start', v_week_start
  );
end;
$$;
