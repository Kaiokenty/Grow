# Grow

Personal workout tracking and analytics. Plain-language training insights from logged sets.

## Language

**Working set**:
A set tagged `working` that counts toward volume, RPE averages, e1RM, and fatigue.
_Avoid_: Normal set, main set

**Warmup set**:
A set tagged `warmup`; excluded from analytics unless noted.
_Avoid_: Light set

**Tracked exercise**:
An exercise the user marked `is_tracked` for progression charts, stall detection, and performance-drop signals.
_Avoid_: Anchor lift, main lift

**Calendar week**:
Volume and per-lift trends bucketed by the user's week start day (e.g. "Week of Jun 2").
_Avoid_: This week, weekly

**Rolling 7 days**:
Fatigue and deload inputs use the last 7 calendar days ending today (e.g. "Last 7 days").
_Avoid_: Weekly average (when meaning fatigue)

**Training block**:
A named date range (`start_date`–`end_date`) that groups workouts by `workout.date`; no per-workout assignment.
_Avoid_: Mesocycle (until prescription exists), program

**Stall**:
Same `weight_kg` and `reps` on the best working set for ≥2 consecutive calendar weeks at similar RPE (±0.5) on a tracked exercise.
_Avoid_: Plateau (use stall), flat

**Performance drop**:
Tracked exercise e1RM down ≥3% for two consecutive calendar weeks.
_Avoid_: Regression, dip

## Relationships

- A **Workout** contains many **Working sets** and **Warmup sets**
- A **Training block** includes every **Workout** whose date falls in the block range
- **Stall** and **Performance drop** apply only to **Tracked exercises**
- **Calendar week** drives volume charts; **Rolling 7 days** drives deload scoring

## Example dialogue

> **Dev:** "Does this workout belong to the active **Training block**?"
> **Domain expert:** "Yes if `workout.date` is between the block's start and end. We don't assign blocks per workout."

## Flagged ambiguities

- "Program" = saved exercise list for starting a session; not a **Training block** and not a prescribed mesocycle.
