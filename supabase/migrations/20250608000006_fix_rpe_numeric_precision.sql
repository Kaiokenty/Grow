-- RPE range is 6–10 (0.5 steps). numeric(2,1) maxes at 9.9 and rejects 10.
alter table public.sets
  alter column rpe type numeric(3, 1);
