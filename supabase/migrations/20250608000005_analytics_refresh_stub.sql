create or replace function public.refresh_analytics_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  raise notice 'refresh_analytics_for_user stub called for %', p_user_id;
end;
$$;

create or replace function public.trigger_refresh_analytics_for_workout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if tg_op = 'DELETE' then
    target_user_id := old.user_id;
  else
    target_user_id := new.user_id;
  end if;

  perform public.refresh_analytics_for_user(target_user_id);
  return coalesce(new, old);
end;
$$;

create trigger workouts_refresh_analytics
  after insert or update or delete on public.workouts
  for each row execute function public.trigger_refresh_analytics_for_workout();
