/**
 * Generates scripts/sample-grow-export-2month.json
 * Run: node scripts/generate-2month-export.mjs
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const exercises = [
  {
    name: 'Barbell Back Squat',
    movement_type: 'lower_compound',
    category: 'legs',
    muscle_groups: ['quads', 'glutes', 'hamstrings'],
    primary_muscle: 'quads',
    secondary_muscles: ['glutes', 'hamstrings'],
    other_muscles: [],
    is_compound: true,
    is_tracked: true,
  },
  {
    name: 'Romanian Deadlift',
    movement_type: 'lower_hinge',
    category: 'legs',
    muscle_groups: ['hamstrings', 'glutes', 'back'],
    primary_muscle: 'hamstrings',
    secondary_muscles: ['glutes', 'back'],
    other_muscles: [],
    is_compound: true,
    is_tracked: true,
  },
  {
    name: 'Bench Press',
    movement_type: 'upper_push',
    category: 'chest',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    primary_muscle: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    other_muscles: [],
    is_compound: true,
    is_tracked: true,
  },
  {
    name: 'Overhead Press',
    movement_type: 'upper_push',
    category: 'shoulders',
    muscle_groups: ['shoulders', 'triceps'],
    primary_muscle: 'shoulders',
    secondary_muscles: ['triceps'],
    other_muscles: ['chest'],
    is_compound: true,
    is_tracked: true,
  },
  {
    name: 'Barbell Row',
    movement_type: 'upper_pull',
    category: 'back',
    muscle_groups: ['back', 'biceps'],
    primary_muscle: 'back',
    secondary_muscles: ['biceps'],
    other_muscles: [],
    is_compound: true,
    is_tracked: true,
  },
  {
    name: 'Lat Pulldown',
    movement_type: 'upper_pull',
    category: 'back',
    muscle_groups: ['back', 'biceps'],
    primary_muscle: 'back',
    secondary_muscles: ['biceps'],
    other_muscles: [],
    is_compound: false,
    is_tracked: false,
  },
  {
    name: 'Leg Press',
    movement_type: 'lower_compound',
    category: 'legs',
    muscle_groups: ['quads', 'glutes'],
    primary_muscle: 'quads',
    secondary_muscles: ['glutes'],
    other_muscles: [],
    is_compound: true,
    is_tracked: false,
  },
  {
    name: 'Incline Dumbbell Press',
    movement_type: 'upper_push',
    category: 'chest',
    muscle_groups: ['chest', 'shoulders', 'triceps'],
    primary_muscle: 'chest',
    secondary_muscles: ['shoulders', 'triceps'],
    other_muscles: [],
    is_compound: false,
    is_tracked: false,
  },
  {
    name: 'Cable Fly',
    movement_type: 'isolation',
    category: 'chest',
    muscle_groups: ['chest'],
    primary_muscle: 'chest',
    secondary_muscles: [],
    other_muscles: [],
    is_compound: false,
    is_tracked: false,
  },
  {
    name: 'Lateral Raise',
    movement_type: 'isolation',
    category: 'shoulders',
    muscle_groups: ['shoulders'],
    primary_muscle: 'shoulders',
    secondary_muscles: [],
    other_muscles: [],
    is_compound: false,
    is_tracked: false,
  },
  {
    name: 'Tricep Pushdown',
    movement_type: 'isolation',
    category: 'arms',
    muscle_groups: ['triceps'],
    primary_muscle: 'triceps',
    secondary_muscles: [],
    other_muscles: [],
    is_compound: false,
    is_tracked: false,
  },
  {
    name: 'Barbell Curl',
    movement_type: 'isolation',
    category: 'arms',
    muscle_groups: ['biceps'],
    primary_muscle: 'biceps',
    secondary_muscles: [],
    other_muscles: [],
    is_compound: false,
    is_tracked: false,
  },
  {
    name: 'Leg Curl',
    movement_type: 'isolation',
    category: 'legs',
    muscle_groups: ['hamstrings'],
    primary_muscle: 'hamstrings',
    secondary_muscles: [],
    other_muscles: [],
    is_compound: false,
    is_tracked: false,
  },
  {
    name: 'Calf Raise',
    movement_type: 'isolation',
    category: 'legs',
    muscle_groups: ['calves'],
    primary_muscle: 'calves',
    secondary_muscles: [],
    other_muscles: [],
    is_compound: false,
    is_tracked: false,
  },
]

const key = (name) => {
  const ex = exercises.find((e) => e.name === name)
  return { name, movement_type: ex.movement_type }
}

function addSets(rows, exerciseName, workingSets, warmups = []) {
  let n = 1
  for (const w of warmups) {
    rows.push({
      exercise_key: key(exerciseName),
      set_number: n++,
      set_type: 'warmup',
      reps: w.reps,
      weight_kg: w.weight,
      rpe: null,
      notes: null,
    })
  }
  for (const s of workingSets) {
    rows.push({
      exercise_key: key(exerciseName),
      set_number: n++,
      set_type: 'working',
      reps: s.reps,
      weight_kg: s.weight,
      rpe: s.rpe,
      notes: s.notes ?? null,
    })
  }
  return rows
}

// 8 weeks × 3 sessions = 24 base; add week 9 partial = 27 workouts
const start = new Date('2026-04-07') // Monday

function dateStr(offsetDays) {
  const d = new Date(start)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

// week offsets: Mon/Wed/Fri pattern with occasional Sat
const sessionDays = [
  0, 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25, 28, 30, 32, 35, 37, 39, 42, 44, 46, 49, 51, 53, 56, 58, 60,
]

const templates = [
  // Push A — progression then bench stall weeks 7-8
  (week) => {
    const squatBump = Math.min(week * 2.5, 15)
    const bench = week < 6 ? 80 + week * 2.5 : 95 // stall at 95×5
    const ohp = 50 + week * 1.25
    const rpeBase = week < 4 ? 7.5 : week < 7 ? 8 : 8.5 + (week >= 8 ? 0.5 : 0)
    const sets = []
    addSets(sets, 'Bench Press', [
      { reps: 5, weight: bench, rpe: rpeBase },
      { reps: 5, weight: bench, rpe: rpeBase + 0.5 },
      { reps: 5, weight: bench - 2.5, rpe: rpeBase },
    ], [{ reps: 10, weight: 60 }])
    addSets(sets, 'Overhead Press', [
      { reps: 6, weight: ohp, rpe: rpeBase },
      { reps: 6, weight: ohp, rpe: rpeBase + 0.5 },
    ])
    addSets(sets, 'Incline Dumbbell Press', [
      { reps: 10, weight: 28 + week, rpe: 7.5 },
      { reps: 10, weight: 28 + week, rpe: 8 },
    ])
    addSets(sets, 'Lateral Raise', [
      { reps: 15, weight: 8, rpe: 7 },
      { reps: 15, weight: 8, rpe: 7.5 },
    ])
    addSets(sets, 'Tricep Pushdown', [
      { reps: 12, weight: 25 + week, rpe: 7.5 },
      { reps: 12, weight: 25 + week, rpe: 8 },
    ])
    return {
      notes: `Push A — week ${week + 1}${week >= 6 ? ' (bench stalling)' : ''}`,
      duration: 58 + (week % 3) * 4,
      sets,
    }
  },
  // Pull A
  (week) => {
    const row = 70 + week * 2.5
    const lat = 55 + week * 2
    const rpe = week < 5 ? 7.5 : 8 + (week >= 7 ? 0.5 : 0)
    const sets = []
    addSets(sets, 'Barbell Row', [
      { reps: 6, weight: row, rpe: rpe },
      { reps: 6, weight: row, rpe: rpe + 0.5 },
      { reps: 8, weight: row - 5, rpe: rpe },
    ])
    addSets(sets, 'Lat Pulldown', [
      { reps: 10, weight: lat, rpe: 7.5 },
      { reps: 10, weight: lat, rpe: 8 },
    ])
    addSets(sets, 'Barbell Curl', [
      { reps: 10, weight: 30 + week, rpe: 7.5 },
      { reps: 10, weight: 30 + week, rpe: 8 },
    ])
    return {
      notes: `Pull A — week ${week + 1}`,
      duration: 52 + week,
      sets,
    }
  },
  // Legs A — squat progresses then slight drop weeks 7-8 for performance_drop signal
  (week) => {
    let squat = 100 + week * 5
    if (week >= 7) squat -= (week - 6) * 7.5
    if (week >= 8) squat -= 5
    const rdl = 90 + week * 2.5
    const rpe = week < 4 ? 7.5 : week < 7 ? 8.5 : 9
    const sets = []
    addSets(sets, 'Barbell Back Squat', [
      { reps: 5, weight: squat, rpe: rpe },
      { reps: 5, weight: squat, rpe: rpe + 0.5 },
      { reps: 5, weight: squat - 5, rpe: rpe },
    ], [{ reps: 8, weight: 60 }, { reps: 5, weight: 80 }])
    addSets(sets, 'Romanian Deadlift', [
      { reps: 8, weight: rdl, rpe: rpe - 0.5 },
      { reps: 8, weight: rdl, rpe: rpe },
    ])
    addSets(sets, 'Leg Press', [
      { reps: 12, weight: 120 + week * 5, rpe: 7.5 },
      { reps: 12, weight: 120 + week * 5, rpe: 8 },
    ])
    addSets(sets, 'Leg Curl', [
      { reps: 12, weight: 35 + week, rpe: 7.5 },
      { reps: 12, weight: 35 + week, rpe: 8 },
    ])
    addSets(sets, 'Calf Raise', [
      { reps: 15, weight: 60 + week * 2, rpe: 7 },
      { reps: 15, weight: 60 + week * 2, rpe: 7.5 },
    ])
    return {
      notes: `Legs A — week ${week + 1}${week >= 7 ? ' (squat fatigue)' : ''}`,
      duration: 68 + (week % 2) * 5,
      sets,
    }
  },
]

const workouts = sessionDays.map((dayOffset, i) => {
  const week = Math.floor(i / 3)
  const template = templates[i % 3]
  const session = template(week)
  return {
    date: dateStr(dayOffset),
    duration_minutes: session.duration,
    notes: session.notes,
    sets: session.sets,
  }
})

const programs = [
  {
    name: 'Upper / Lower 4-day',
    notes: 'Push + Pull + Legs + Upper pump. Full-body hypertrophy split.',
    exercise_keys: [
      key('Bench Press'),
      key('Overhead Press'),
      key('Incline Dumbbell Press'),
      key('Barbell Row'),
      key('Lat Pulldown'),
      key('Barbell Back Squat'),
      key('Romanian Deadlift'),
      key('Leg Curl'),
    ],
  },
  {
    name: 'Strength Fundamentals',
    notes: 'Tracked compounds only — use for progression-focused blocks.',
    exercise_keys: [
      key('Barbell Back Squat'),
      key('Bench Press'),
      key('Barbell Row'),
      key('Romanian Deadlift'),
      key('Overhead Press'),
    ],
  },
  {
    name: 'Arms & Shoulders Pump',
    notes: 'Accessory day — isolation volume.',
    exercise_keys: [
      key('Lateral Raise'),
      key('Cable Fly'),
      key('Tricep Pushdown'),
      key('Barbell Curl'),
    ],
  },
  {
    name: 'Leg Day Complete',
    notes: 'Quads + hams + calves template.',
    exercise_keys: [
      key('Barbell Back Squat'),
      key('Leg Press'),
      key('Romanian Deadlift'),
      key('Leg Curl'),
      key('Calf Raise'),
    ],
  },
]

const exportData = {
  grow_version: 1,
  exported_at: new Date().toISOString(),
  display_unit_hint: 'kg',
  exercises,
  workouts,
  programs,
  _meta: {
    description: '2-month synthetic hypertrophy block (27 sessions, Apr–Jun 2026)',
    sessions: workouts.length,
    programs: programs.length,
    exercises: exercises.length,
    scenarios: [
      'Bench stall weeks 7-8 (same 95kg×5)',
      'Squat performance drop weeks 7-8',
      'RPE creep into deload territory final 2 weeks',
      'Warmup + working set mix',
    ],
  },
}

const outPath = join(__dirname, 'sample-grow-export-2month.json')
writeFileSync(outPath, JSON.stringify(exportData, null, 2) + '\n')
console.log(`Wrote ${outPath}`)
console.log(`  ${workouts.length} workouts, ${programs.length} programs, ${exercises.length} exercises`)
console.log(`  ${workouts[0].date} → ${workouts[workouts.length - 1].date}`)
