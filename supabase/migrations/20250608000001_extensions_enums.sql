create type public.set_type as enum ('working', 'warmup');
create type public.movement_type as enum (
  'upper_push',
  'upper_pull',
  'lower_compound',
  'lower_hinge',
  'isolation'
);
create type public.display_unit as enum ('kg', 'lbs');
create type public.deload_tier as enum ('lean', 'moderate', 'strong');
