insert into public.exercise_templates (name, category, muscle_groups, is_compound, movement_type) values
  ('Barbell Back Squat', 'Squat', array['quads', 'glutes'], true, 'lower_compound'),
  ('Front Squat', 'Squat', array['quads', 'core'], true, 'lower_compound'),
  ('Leg Press', 'Squat', array['quads', 'glutes'], true, 'lower_compound'),
  ('Romanian Deadlift', 'Hinge', array['hamstrings', 'glutes'], true, 'lower_hinge'),
  ('Conventional Deadlift', 'Hinge', array['hamstrings', 'glutes', 'back'], true, 'lower_hinge'),
  ('Barbell Bench Press', 'Press', array['chest', 'triceps', 'shoulders'], true, 'upper_push'),
  ('Incline Bench Press', 'Press', array['chest', 'shoulders'], true, 'upper_push'),
  ('Overhead Press', 'Press', array['shoulders', 'triceps'], true, 'upper_push'),
  ('Dumbbell Shoulder Press', 'Press', array['shoulders', 'triceps'], true, 'upper_push'),
  ('Barbell Row', 'Pull', array['back', 'biceps'], true, 'upper_pull'),
  ('Pull-Up', 'Pull', array['back', 'biceps'], true, 'upper_pull'),
  ('Chin-Up', 'Pull', array['back', 'biceps'], true, 'upper_pull'),
  ('Lat Pulldown', 'Pull', array['back', 'biceps'], true, 'upper_pull'),
  ('Cable Row', 'Pull', array['back', 'biceps'], true, 'upper_pull'),
  ('Dumbbell Row', 'Pull', array['back', 'biceps'], true, 'upper_pull'),
  ('Leg Curl', 'Isolation', array['hamstrings'], false, 'isolation'),
  ('Leg Extension', 'Isolation', array['quads'], false, 'isolation'),
  ('Calf Raise', 'Isolation', array['calves'], false, 'isolation'),
  ('Barbell Curl', 'Isolation', array['biceps'], false, 'isolation'),
  ('Dumbbell Curl', 'Isolation', array['biceps'], false, 'isolation'),
  ('Tricep Pushdown', 'Isolation', array['triceps'], false, 'isolation'),
  ('Skull Crusher', 'Isolation', array['triceps'], false, 'isolation'),
  ('Lateral Raise', 'Isolation', array['shoulders'], false, 'isolation'),
  ('Face Pull', 'Isolation', array['rear_delts', 'upper_back'], false, 'isolation'),
  ('Cable Fly', 'Isolation', array['chest'], false, 'isolation'),
  ('Dumbbell Fly', 'Isolation', array['chest'], false, 'isolation'),
  ('Hip Thrust', 'Hinge', array['glutes', 'hamstrings'], true, 'lower_hinge'),
  ('Bulgarian Split Squat', 'Squat', array['quads', 'glutes'], true, 'lower_compound'),
  ('Hack Squat', 'Squat', array['quads'], true, 'lower_compound'),
  ('Seated Cable Row', 'Pull', array['back', 'biceps'], true, 'upper_pull'),
  ('Dips', 'Press', array['chest', 'triceps'], true, 'upper_push'),
  ('Close-Grip Bench Press', 'Press', array['triceps', 'chest'], true, 'upper_push'),
  ('Pec Deck', 'Isolation', array['chest'], false, 'isolation'),
  ('Hammer Curl', 'Isolation', array['biceps', 'forearms'], false, 'isolation'),
  ('Reverse Pec Deck', 'Isolation', array['rear_delts'], false, 'isolation'),
  ('Ab Wheel Rollout', 'Core', array['core'], false, 'isolation'),
  ('Hanging Leg Raise', 'Core', array['core'], false, 'isolation'),
  ('Plank', 'Core', array['core'], false, 'isolation');

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
    is_compound,
    movement_type
  )
  select
    new.id,
    t.name,
    t.category,
    t.muscle_groups,
    t.is_compound,
    t.movement_type
  from public.exercise_templates t;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
