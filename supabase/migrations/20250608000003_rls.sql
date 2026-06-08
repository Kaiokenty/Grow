alter table public.users_settings enable row level security;
alter table public.exercises enable row level security;
alter table public.programs enable row level security;
alter table public.program_exercises enable row level security;
alter table public.training_blocks enable row level security;
alter table public.workouts enable row level security;
alter table public.sets enable row level security;
alter table public.weekly_volume enable row level security;
alter table public.exercise_performance enable row level security;
alter table public.fatigue_signals enable row level security;
alter table public.recovery_metrics enable row level security;
alter table public.exercise_templates enable row level security;

create policy "users_settings_own" on public.users_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercises_own" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "programs_own" on public.programs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "program_exercises_own" on public.program_exercises
  for all using (
    exists (
      select 1 from public.programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  );

create policy "training_blocks_own" on public.training_blocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workouts_own" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sets_own" on public.sets
  for all using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "weekly_volume_own" on public.weekly_volume
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercise_performance_own" on public.exercise_performance
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "fatigue_signals_own" on public.fatigue_signals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recovery_metrics_own" on public.recovery_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercise_templates_read" on public.exercise_templates
  for select to authenticated using (true);
