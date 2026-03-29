// Actualiza el campo image_url de los ejercicios con sus SVGs animados.
// Cada entrada: nombre exacto en BD → ruta relativa al SVG en /img/exercises/.
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

const EXERCISE_IMAGES: [string, string][] = [
  // ── seedService.ts — base (25) ─────────────────────────────────────────────
  ['Air Squat',              '/img/exercises/air-squat.svg'],
  ['Thruster',               '/img/exercises/thruster.svg'],
  ['Pull-up',                '/img/exercises/pullup.svg'],
  ['Push-up',                '/img/exercises/pushup.svg'],
  ['Deadlift',               '/img/exercises/deadlift.svg'],
  ['Power Clean',            '/img/exercises/power-clean.svg'],
  ['Snatch',                 '/img/exercises/snatch.svg'],
  ['Clean & Jerk',           '/img/exercises/clean-and-jerk.svg'],
  ['Overhead Squat',         '/img/exercises/overhead-squat.svg'],
  ['Front Squat',            '/img/exercises/front-squat.svg'],
  ['Shoulder Press',         '/img/exercises/shoulder-press.svg'],
  ['Push Press',             '/img/exercises/push-press.svg'],
  ['Wall Ball Shot',         '/img/exercises/wall-ball-shot.svg'],
  ['Box Jump',               '/img/exercises/box-jump.svg'],
  ['Burpee',                 '/img/exercises/burpee.svg'],
  ['Double Under',           '/img/exercises/double-under.svg'],
  ['Rowing',                 '/img/exercises/rowing.svg'],
  ['Toes to Bar (T2B)',      '/img/exercises/toes-to-bar.svg'],
  ['Kettlebell Swing',       '/img/exercises/kettlebell-swing.svg'],
  ['Wall Walk',              '/img/exercises/wall-walk.svg'],
  ['Dips',                   '/img/exercises/dips.svg'],
  ['Hollow Hold',            '/img/exercises/hollow-hold.svg'],
  ['Walking Lunge',          '/img/exercises/walking-lunge.svg'],
  ['Back Squat',             '/img/exercises/back-squat.svg'],
  ['Running',                '/img/exercises/running.svg'],

  // ── seedService3.ts — Open 26 (3) ─────────────────────────────────────────
  ['Box Jump-Over',              '/img/exercises/box-jump-over.svg'],
  ['Chest-to-Bar Pull-Up',       '/img/exercises/chest-to-bar-pull-up.svg'],
  ['Burpee Over the Bar',        '/img/exercises/burpee-over-the-bar.svg'],

  // ── seedService4.ts — Girls & Heroes (21) ─────────────────────────────────
  ['Bodyweight Push Up',             '/img/exercises/bodyweight-push-up.svg'],
  ['Bodyweight Sit Up',              '/img/exercises/bodyweight-sit-up.svg'],
  ['Bodyweight Handstand Push-Up',   '/img/exercises/bodyweight-handstand-push-up.svg'],
  ['Bodyweight Pistol Squat',        '/img/exercises/bodyweight-pistol-squat.svg'],
  ['Ring Dip',                       '/img/exercises/ring-dip.svg'],
  ['Barbell Overhead Squat',         '/img/exercises/barbell-overhead-squat.svg'],
  ['Barbell Bench Press',            '/img/exercises/barbell-bench-press.svg'],
  ['GHD Back Extension',             '/img/exercises/ghd-back-extension.svg'],
  ['Rope Climb',                     '/img/exercises/rope-climb.svg'],
  ['Dumbbell Split Clean',           '/img/exercises/dumbbell-split-clean.svg'],
  ['GHD Sit-Up',                     '/img/exercises/ghd-sit-up.svg'],
  ['Hanging Knees to Elbows',        '/img/exercises/hanging-knees-to-elbows.svg'],
  ['Barbell Deadlift',               '/img/exercises/barbell-deadlift.svg'],
  ['Barbell Power Snatch',           '/img/exercises/barbell-power-snatch.svg'],
  ['Barbell Clean and Jerk',         '/img/exercises/barbell-clean-and-jerk.svg'],
  ['Barbell Push Jerk',              '/img/exercises/barbell-push-jerk.svg'],
  ['Barbell Push Press',             '/img/exercises/barbell-push-press.svg'],
  ['Barbell Hang Power Clean',       '/img/exercises/barbell-hang-power-clean.svg'],
  ['Barbell Squat Clean',            '/img/exercises/barbell-squat-clean.svg'],
  ['Barbell Sumo Deadlift High Pull', '/img/exercises/barbell-sumo-deadlift-high-pull.svg'],
  ['Ring Handstand Push-Up',         '/img/exercises/ring-handstand-push-up.svg'],

  // ── seedService5.ts — WODs Marzo 2026 (12) ────────────────────────────────
  ['Hanging Toes to Bar',                  '/img/exercises/hanging-toes-to-bar.svg'],
  ['Barbell Lunge',                        '/img/exercises/barbell-lunge.svg'],
  ['Single-Leg Dumbbell Romanian Deadlift', '/img/exercises/single-leg-dumbbell-romanian-deadlift.svg'],
  ['Bar Muscle-Up',                        '/img/exercises/bar-muscle-up.svg'],
  ['Barbell Hang Clean and Jerk',          '/img/exercises/barbell-hang-clean-and-jerk.svg'],
  ['Kettlebell Snatch',                    '/img/exercises/kettlebell-snatch.svg'],
  ['Weighted Box Step-Up',                 '/img/exercises/weighted-box-step-up.svg'],
  ['Russian Twist',                        '/img/exercises/russian-twist.svg'],
  ['Kettlebell Ground-to-Overhead',        '/img/exercises/kettlebell-ground-to-overhead.svg'],
  ['Kettlebell Front Squat',               '/img/exercises/kettlebell-front-squat.svg'],
  ['Kettlebell Push-Up',                   '/img/exercises/kettlebell-push-up.svg'],
  ['Assault Bike',                         '/img/exercises/assault-bike.svg'],

  // ── seedService6.ts — WODs Feb–Mar 2026 (21) ──────────────────────────────
  ['Barbell Front Squat',                  '/img/exercises/barbell-front-squat.svg'],
  ['Barbell Romanian Deadlift',            '/img/exercises/barbell-romanian-deadlift.svg'],
  ['Barbell Strict Press',                 '/img/exercises/barbell-strict-press.svg'],
  ['Barbell Hang Muscle Clean and Press',  '/img/exercises/barbell-hang-muscle-clean-and-press.svg'],
  ['Barbell Muscle Snatch',                '/img/exercises/barbell-muscle-snatch.svg'],
  ['Barbell Hang Power Snatch',            '/img/exercises/barbell-hang-power-snatch.svg'],
  ['Barbell Hang Clean',                   '/img/exercises/barbell-hang-clean.svg'],
  ['Barbell Hang Power Cluster',           '/img/exercises/barbell-hang-power-cluster.svg'],
  ['Barbell Bent Over Row',                '/img/exercises/barbell-bent-over-row.svg'],
  ['Barbell Upright Row',                  '/img/exercises/barbell-upright-row.svg'],
  ['Nordic Hamstring Curl',                '/img/exercises/nordic-hamstring-curl.svg'],
  ['Shuttle Run',                          '/img/exercises/shuttle-run.svg'],
  ['Dumbbell Bench Press',                 '/img/exercises/dumbbell-bench-press.svg'],
  ['Dumbbell Alternating Bent Over Row',   '/img/exercises/dumbbell-alternating-bent-over-row.svg'],
  ['Dumbbell Bicep Curl',                  '/img/exercises/dumbbell-bicep-curl.svg'],
  ['Dumbbell Thruster',                    '/img/exercises/dumbbell-thruster.svg'],
  ["Dumbbell Devil's Press",               '/img/exercises/dumbbell-devils-press.svg'],
  ['Dumbbell Front Rack Lunge',            '/img/exercises/dumbbell-front-rack-lunge.svg'],
  ['Dumbbell One-Arm Overhead Lunge',      '/img/exercises/dumbbell-one-arm-overhead-lunge.svg'],
  ['Hollow Rock',                          '/img/exercises/hollow-rock.svg'],
  ['Kettlebell Clean and Jerk',            '/img/exercises/kettlebell-clean-and-jerk.svg'],

  // ── Ejercicios en clases — batch extra (15) ────────────────────────────────

  // 7 nuevos SVGs
  ['Alternating Single Arm Dumbbell Power Snatch', '/img/exercises/alternating-single-arm-dumbbell-power-snatch.svg'],
  ['Bodyweight Glute Bridge',                      '/img/exercises/bodyweight-glute-bridge.svg'],
  ['Double Dumbbell Overhead Walking Lunge',       '/img/exercises/double-dumbbell-overhead-walking-lunge.svg'],
  ['Med-Ball Box Step-Over',                       '/img/exercises/med-ball-box-step-over.svg'],
  ['Ring Row',                                     '/img/exercises/ring-row.svg'],
  ['Ring Strict Muscle Up',                        '/img/exercises/ring-strict-muscle-up.svg'],
  ['Superband Shoulder Dislocates',                '/img/exercises/superband-shoulder-dislocates.svg'],

  // Ejercicios del entrenamiento de Nestor 28/03/2026
  ['Toe Touch Sit-Up',                   '/img/exercises/toe-touch-sit-up.svg'],
  ['Hollow to Superman Roll',            '/img/exercises/hollow-to-superman-roll.svg'],
  ['Plank to Opposite Toe Touch',        '/img/exercises/plank-to-opposite-toe-touch.svg'],
  ['Dumbbell Front Raise',               '/img/exercises/dumbbell-front-raise.svg'],
  ['Bent-Over Dumbbell Lateral Raise',   '/img/exercises/bent-over-dumbbell-lateral-raise.svg'],
  ['Stability Ball Plate Crunch',        '/img/exercises/stability-ball-plate-crunch.svg'],
  ["Farmer's Carry",                     '/img/exercises/farmers-carry.svg'],
  ['Kettlebell Sumo Deadlift High Pull', '/img/exercises/kettlebell-sumo-deadlift-high-pull.svg'],

  // 8 reusan SVG de ejercicio equivalente
  ['Bar Pull Up',                '/img/exercises/pullup.svg'],
  ['Barbell Back Squat',         '/img/exercises/back-squat.svg'],
  ['Barbell Power Clean',        '/img/exercises/power-clean.svg'],
  ['Barbell Thruster',           '/img/exercises/thruster.svg'],
  ['Bodyweight Burpee',          '/img/exercises/burpee.svg'],
  ['Bodyweight Hollow Body Hold','/img/exercises/hollow-hold.svg'],
  ['Bodyweight Squat',           '/img/exercises/air-squat.svg'],
  ['Bodyweight Walking Lunge',   '/img/exercises/walking-lunge.svg'],
];

/**
 * Actualiza image_url en la tabla exercise para los 91 ejercicios con SVG.
 * Siempre aplica el UPDATE por nombre (idempotente).
 * Retorna el número de ejercicios encontrados y actualizados.
 */
export async function updateExerciseImages(db: SQLiteDBConnection): Promise<number> {
  let updated = 0;

  for (const [name, path] of EXERCISE_IMAGES) {
    const result = await db.run(
      'UPDATE exercise SET image_url = ? WHERE name = ?',
      [path, name]
    );
    if ((result.changes?.changes ?? 0) > 0) updated++;
  }

  return updated;
}
