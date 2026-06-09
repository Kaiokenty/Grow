-- Analytics range: p_weeks on muscle RPCs (1 = current week only)

create or replace function public.analytics_range_bounds(
  p_week_start_day int,
  p_weeks int,
  p_user_id uuid default null
)
returns table(range_start date, range_end date, week_count int)
language plpgsql
stable
as $$
declare
  v_range_end date;
  v_range_start date;
  v_week_count int;
begin
  v_range_end := public.week_start_for(current_date, p_week_start_day);

  if coalesce(p_weeks, 0) <= 0 then
    select min(public.week_start_for(w.date, p_week_start_day))
    into v_range_start
    from public.workouts w
    where w.user_id = p_user_id;

    v_range_start := coalesce(v_range_start, v_range_end);
  else
    v_range_start := v_range_end - (greatest(p_weeks, 1) - 1) * 7;
  end if;

  v_week_count := ((v_range_end - v_range_start) / 7) + 1;

  return query select v_range_start, v_range_end, v_week_count;
end;
$$;

create or replace function public.get_dashboard_muscle_heatmap(
  p_week_start_day int default 1,
  p_weeks int default 1
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bounds record;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_bounds
  from public.analytics_range_bounds(p_week_start_day, p_weeks, v_user_id);

  return coalesce((
    select json_agg(json_build_object(
      'muscle', agg.muscle,
      'weighted_tonnage_kg', agg.weighted_tonnage_kg_avg,
      'weighted_tonnage_kg_total', agg.weighted_tonnage_kg_total,
      'sets', agg.sets_per_week,
      'sets_total', agg.sets_total,
      'avg_rpe', agg.avg_rpe
    ) order by agg.weighted_tonnage_kg_avg desc)
    from (
      select
        m.muscle,
        round(avg(m.weighted_tonnage_kg))::bigint as weighted_tonnage_kg_avg,
        round(sum(m.weighted_tonnage_kg))::bigint as weighted_tonnage_kg_total,
        round(avg(m.sets)::numeric, 1) as sets_per_week,
        sum(m.sets)::int as sets_total,
        round(avg(m.avg_rpe) filter (where m.avg_rpe is not null)::numeric, 1) as avg_rpe
      from public.muscle_weekly_volume m
      where m.user_id = v_user_id
        and m.week_start >= v_bounds.range_start
        and m.week_start <= v_bounds.range_end
      group by m.muscle
    ) agg
  ), '[]'::json);
end;
$$;

create or replace function public.get_muscle_week_stats(
  p_muscle text,
  p_week_start_day int default 1,
  p_weeks int default 1
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bounds record;
  v_prior_start date;
  v_prior_end date;
  v_period_tonnage numeric;
  v_prior_tonnage numeric;
  v_period_sets int;
  v_delta_pct numeric;
  v_rolling_rpe numeric;
  v_session_count int;
  v_top_exercises json;
  v_range_end_date date;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.is_valid_grow_muscle(p_muscle) then raise exception 'Invalid muscle'; end if;

  select * into v_bounds
  from public.analytics_range_bounds(p_week_start_day, p_weeks, v_user_id);

  v_range_end_date := least(v_bounds.range_end + 6, current_date);
  v_prior_end := v_bounds.range_start - 1;
  v_prior_start := v_prior_end - (v_bounds.week_count - 1) * 7;

  select
    coalesce(sum(m.weighted_tonnage_kg), 0),
    coalesce(sum(m.sets), 0)
  into v_period_tonnage, v_period_sets
  from public.muscle_weekly_volume m
  where m.user_id = v_user_id
    and m.muscle = p_muscle
    and m.week_start >= v_bounds.range_start
    and m.week_start <= v_bounds.range_end;

  select coalesce(sum(m.weighted_tonnage_kg), 0)
  into v_prior_tonnage
  from public.muscle_weekly_volume m
  where m.user_id = v_user_id
    and m.muscle = p_muscle
    and m.week_start >= v_prior_start
    and m.week_start <= v_prior_end;

  if coalesce(v_prior_tonnage, 0) > 0 and v_period_tonnage > 0 then
    v_delta_pct := round(
      ((v_period_tonnage - v_prior_tonnage) / v_prior_tonnage * 100)::numeric, 1
    );
  end if;

  select count(distinct w.id)::int into v_session_count
  from public.sets s
  join public.workouts w on w.id = s.workout_id
  join public.exercises e on e.id = s.exercise_id
  where w.user_id = v_user_id
    and w.date >= v_bounds.range_start
    and w.date <= v_range_end_date
    and s.set_type = 'working'
    and (
      e.primary_muscle = p_muscle
      or p_muscle = any (e.secondary_muscles)
      or p_muscle = any (e.other_muscles)
    );

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
      and w.date >= v_bounds.range_start
      and w.date <= v_range_end_date
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
    'week_start', v_bounds.range_start,
    'range_end', v_bounds.range_end,
    'period_weeks', v_bounds.week_count,
    'weighted_tonnage_kg', coalesce(round(v_period_tonnage / greatest(v_bounds.week_count, 1))::bigint, 0),
    'weighted_tonnage_kg_total', coalesce(round(v_period_tonnage)::bigint, 0),
    'sets', coalesce(round(v_period_sets::numeric / greatest(v_bounds.week_count, 1), 1), 0),
    'sets_total', coalesce(v_period_sets, 0),
    'session_count', coalesce(v_session_count, 0),
    'avg_rpe', null,
    'prior_week_delta_pct', v_delta_pct,
    'rolling_7d_avg_rpe', v_rolling_rpe,
    'current_week_in_progress', v_bounds.range_end = public.week_start_for(current_date, p_week_start_day),
    'top_exercises', v_top_exercises
  );
end;
$$;

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
  v_bounds record;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.is_valid_grow_muscle(p_muscle) then raise exception 'Invalid muscle'; end if;

  select coalesce(us.week_start_day, 1) into v_week_start_day
  from public.users_settings us where us.user_id = v_user_id;

  select * into v_bounds
  from public.analytics_range_bounds(v_week_start_day, p_weeks, v_user_id);

  return coalesce((
    select json_agg(json_build_object(
      'week_start', series.week_start,
      'weighted_tonnage_kg', coalesce(round(m.weighted_tonnage_kg)::bigint, 0)
    ) order by series.week_start)
    from generate_series(
      v_bounds.range_start,
      v_bounds.range_end,
      interval '7 days'
    ) as series(week_start)
    left join public.muscle_weekly_volume m
      on m.user_id = v_user_id
      and m.muscle = p_muscle
      and m.week_start = series.week_start::date
  ), '[]'::json);
end;
$$;

grant execute on function public.get_dashboard_muscle_heatmap(int, int) to authenticated;
grant execute on function public.get_muscle_week_stats(text, int, int) to authenticated;
