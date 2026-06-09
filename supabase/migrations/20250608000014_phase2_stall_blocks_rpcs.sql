-- Phase 2 finish: stall detection, fatigue/NLG updates, training block RPCs

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
  v_stalled_exercises text[];
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

  -- stall: tracked lift same weight+reps two consecutive weeks, RPE within 0.5
  select coalesce(array_agg(ex.name order by ex.name), '{}')
  into v_stalled_exercises
  from public.exercises ex
  join public.exercise_performance ep on ep.exercise_id = ex.id and ep.user_id = p_user_id
    and ep.week_start = v_week_start
  join public.exercise_performance ep_prev on ep_prev.exercise_id = ex.id and ep_prev.user_id = p_user_id
    and ep_prev.week_start = v_prior_week_start
  where ex.user_id = p_user_id
    and ex.is_tracked
    and ep.best_set_json is not null and ep_prev.best_set_json is not null
    and (ep.best_set_json->>'weight_kg')::numeric = (ep_prev.best_set_json->>'weight_kg')::numeric
    and (ep.best_set_json->>'reps')::int = (ep_prev.best_set_json->>'reps')::int
    and ep.best_set_json->>'rpe' is not null
    and ep_prev.best_set_json->>'rpe' is not null
    and abs(
      (ep.best_set_json->>'rpe')::numeric - (ep_prev.best_set_json->>'rpe')::numeric
    ) <= 0.5;

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
    performance_drop_detected, dropped_exercises, stalled_exercises,
    consecutive_high_rpe_sessions, deload_score, deload_tier, deload_reason
  )
  values (
    p_user_id, now(), v_rolling_rpe, v_rpe_trend,
    coalesce(v_performance_drop, false), coalesce(v_dropped_exercises, '{}'),
    coalesce(v_stalled_exercises, '{}'),
    coalesce(v_consecutive_high, 0), v_deload_score, v_deload_tier, v_deload_reason
  )
  on conflict (user_id) do update set
    calculated_at = excluded.calculated_at,
    rolling_7d_avg_rpe = excluded.rolling_7d_avg_rpe,
    rpe_trend = excluded.rpe_trend,
    performance_drop_detected = excluded.performance_drop_detected,
    dropped_exercises = excluded.dropped_exercises,
    stalled_exercises = excluded.stalled_exercises,
    consecutive_high_rpe_sessions = excluded.consecutive_high_rpe_sessions,
    deload_score = excluded.deload_score,
    deload_tier = excluded.deload_tier,
    deload_reason = excluded.deload_reason;
end;
$$;

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
      'performance_drop_detected', false,
      'stalled_exercises', '[]'::json
    );
  end if;

  return json_build_object(
    'deload_score', v_row.deload_score,
    'deload_tier', v_row.deload_tier,
    'deload_reason', v_row.deload_reason,
    'rolling_7d_avg_rpe', v_row.rolling_7d_avg_rpe,
    'rpe_trend', v_row.rpe_trend,
    'performance_drop_detected', v_row.performance_drop_detected,
    'stalled_exercises', coalesce(to_json(v_row.stalled_exercises), '[]'::json)
  );
end;
$$;

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
  v_stall record;
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

  for v_stall in
    select
      ex.name,
      (ep.best_set_json->>'weight_kg')::numeric as weight_kg,
      (ep.best_set_json->>'reps')::int as reps
    from public.exercises ex
    join public.exercise_performance ep on ep.exercise_id = ex.id and ep.user_id = v_user_id
      and ep.week_start = v_week_start
    where ex.user_id = v_user_id
      and ex.name = any(
        select unnest(fs.stalled_exercises)
        from public.fatigue_signals fs
        where fs.user_id = v_user_id
      )
  loop
    v_lines := array_append(
      v_lines,
      v_stall.name || ' stalled — same ' || trim(to_char(v_stall.weight_kg, '999990.9')) || 'kg×' || v_stall.reps || ' two weeks.'
    );
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

-- Training blocks

create or replace function public.start_training_block(
  p_name text,
  p_start_date date default current_date,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  if exists (
    select 1 from public.training_blocks tb
    where tb.user_id = v_user_id and tb.end_date is null
  ) then
    raise exception 'An active training block already exists. End it before starting a new one.';
  end if;

  if exists (
    select 1 from public.training_blocks tb
    where tb.user_id = v_user_id
      and daterange(tb.start_date, coalesce(tb.end_date, 'infinity'::date), '[]')
          && daterange(p_start_date, 'infinity'::date, '[]')
  ) then
    raise exception 'Date range overlaps an existing training block.';
  end if;

  insert into public.training_blocks (user_id, name, start_date, notes)
  values (v_user_id, p_name, p_start_date, p_notes)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.start_training_block(text, date, text) to authenticated;

create or replace function public.end_training_block(p_block_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  update public.training_blocks
  set end_date = current_date, updated_at = now()
  where id = p_block_id and user_id = v_user_id and end_date is null;

  if not found then
    raise exception 'Active block not found or already ended.';
  end if;
end;
$$;

grant execute on function public.end_training_block(uuid) to authenticated;

create or replace function public.get_training_blocks()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  return coalesce((
    select json_agg(row_to_json(b) order by b.start_date desc)
    from (
      select
        tb.id,
        tb.name,
        tb.start_date,
        tb.end_date,
        tb.notes,
        (tb.end_date is null) as is_active
      from public.training_blocks tb
      where tb.user_id = v_user_id
    ) b
  ), '[]'::json);
end;
$$;

grant execute on function public.get_training_blocks() to authenticated;

create or replace function public.get_block_summary(p_block_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_block public.training_blocks%rowtype;
  v_tonnage numeric;
  v_sets int;
  v_avg_rpe numeric;
  v_pr_count int;
  v_end date;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_block
  from public.training_blocks
  where id = p_block_id and user_id = v_user_id;

  if not found then raise exception 'Block not found'; end if;

  v_end := coalesce(v_block.end_date, current_date);

  select
    coalesce(sum(s.reps * s.weight_kg), 0),
    count(s.id) filter (where s.set_type = 'working')::int,
    round(avg(s.rpe) filter (where s.set_type = 'working' and s.rpe is not null)::numeric, 1)
  into v_tonnage, v_sets, v_avg_rpe
  from public.workouts w
  join public.sets s on s.workout_id = w.id
  where w.user_id = v_user_id
    and w.date >= v_block.start_date
    and w.date <= v_end;

  select count(*)::int into v_pr_count
  from public.exercises ex
  where ex.user_id = v_user_id and ex.is_tracked
    and (
      select max(public.calc_e1rm_simple(s.weight_kg, s.reps))
      from public.sets s
      join public.workouts w on w.id = s.workout_id
      where w.user_id = v_user_id
        and s.exercise_id = ex.id
        and s.set_type = 'working'
        and s.reps <= 10
        and w.date >= v_block.start_date
        and w.date <= v_end
    ) > coalesce((
      select max(public.calc_e1rm_simple(s.weight_kg, s.reps))
      from public.sets s
      join public.workouts w on w.id = s.workout_id
      where w.user_id = v_user_id
        and s.exercise_id = ex.id
        and s.set_type = 'working'
        and s.reps <= 10
        and w.date < v_block.start_date
    ), 0);

  return json_build_object(
    'block_id', v_block.id,
    'name', v_block.name,
    'start_date', v_block.start_date,
    'end_date', v_block.end_date,
    'tonnage', coalesce(v_tonnage, 0),
    'total_sets', coalesce(v_sets, 0),
    'avg_rpe', v_avg_rpe,
    'pr_count', coalesce(v_pr_count, 0),
    'top_exercises', coalesce((
      select json_agg(row_to_json(t) order by t.tonnage desc)
      from (
        select
          e.name,
          coalesce(sum(s.reps * s.weight_kg), 0) as tonnage,
          count(s.id) filter (where s.set_type = 'working')::int as sets
        from public.sets s
        join public.workouts w on w.id = s.workout_id
        join public.exercises e on e.id = s.exercise_id
        where w.user_id = v_user_id
          and w.date >= v_block.start_date
          and w.date <= v_end
          and s.set_type = 'working'
        group by e.id, e.name
        order by tonnage desc
        limit 5
      ) t
    ), '[]'::json)
  );
end;
$$;

grant execute on function public.get_block_summary(uuid) to authenticated;

create or replace function public.compare_training_blocks(p_block_a uuid, p_block_b uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_summary_a json;
  v_summary_b json;
  v_tonnage_a numeric;
  v_tonnage_b numeric;
  v_rpe_a numeric;
  v_rpe_b numeric;
  v_pct_delta numeric;
  v_rpe_delta numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  v_summary_a := public.get_block_summary(p_block_a);
  v_summary_b := public.get_block_summary(p_block_b);

  v_tonnage_a := (v_summary_a->>'tonnage')::numeric;
  v_tonnage_b := (v_summary_b->>'tonnage')::numeric;
  v_rpe_a := (v_summary_a->>'avg_rpe')::numeric;
  v_rpe_b := (v_summary_b->>'avg_rpe')::numeric;

  v_pct_delta := case
    when coalesce(v_tonnage_a, 0) = 0 then null
    else round(((v_tonnage_b - v_tonnage_a) / v_tonnage_a) * 100, 1)
  end;

  v_rpe_delta := case
    when v_rpe_a is null or v_rpe_b is null then null
    else round(v_rpe_b - v_rpe_a, 1)
  end;

  return json_build_object(
    'block_a', v_summary_a,
    'block_b', v_summary_b,
    'volume_pct_delta', v_pct_delta,
    'avg_rpe_delta', v_rpe_delta
  );
end;
$$;

grant execute on function public.compare_training_blocks(uuid, uuid) to authenticated;
