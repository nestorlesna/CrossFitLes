// Registra image_url en la BD para ejercicios con SVG nuevo — Clase GOAT 22/04/2026

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'images_clase22042026_done_v1';

export function isImagesClase22042026UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface ImageAssignment {
  exerciseName: string;
  imageUrl: string;
}

const IMAGE_ASSIGNMENTS: ImageAssignment[] = [
  // Movilidad
  { exerciseName: 'Band Pull-Apart',                      imageUrl: '/img/exercises/band-pull-apart.svg' },
  { exerciseName: 'Wall Shoulder External Rotation',      imageUrl: '/img/exercises/wall-shoulder-external-rotation.svg' },
  { exerciseName: '90/90 Hip Internal Rotation Lift-Off', imageUrl: '/img/exercises/hip-90-90-internal-rotation-liftoff.svg' },
  // Activación
  { exerciseName: 'Dumbbell Overhead Hold',               imageUrl: '/img/exercises/dumbbell-overhead-hold.svg' },
  { exerciseName: 'Plank Hold',                           imageUrl: '/img/exercises/plank-hold.svg' },
  { exerciseName: 'Dead Bug Hold with Dumbbell',          imageUrl: '/img/exercises/dead-bug-hold-dumbbell.svg' },
  // WOD
  { exerciseName: 'Single-Arm Dumbbell Push Press',       imageUrl: '/img/exercises/single-arm-dumbbell-push-press.svg' },
  // Estiramiento
  { exerciseName: 'Supine Spinal Twist',                  imageUrl: '/img/exercises/supine-spinal-twist.svg' },
  { exerciseName: 'Seated Forward Fold',                  imageUrl: '/img/exercises/seated-forward-fold.svg' },
  { exerciseName: 'Seated Quad Stretch',                  imageUrl: '/img/exercises/seated-quad-stretch.svg' },
  { exerciseName: 'Pigeon Pose',                          imageUrl: '/img/exercises/pigeon-pose.svg' },
  { exerciseName: 'Supine Abdominal Stretch',             imageUrl: '/img/exercises/supine-abdominal-stretch.svg' },
  { exerciseName: 'Cobra Pose',                           imageUrl: '/img/exercises/cobra-pose.svg' },
  { exerciseName: "Child's Pose",                         imageUrl: '/img/exercises/childs-pose.svg' },
  { exerciseName: 'Half Kneeling Hip Flexor Stretch',     imageUrl: '/img/exercises/half-kneeling-hip-flexor-stretch.svg' },
  { exerciseName: 'Standing Biceps Stretch',              imageUrl: '/img/exercises/standing-biceps-stretch.svg' },
  { exerciseName: 'Overhead Triceps Stretch',             imageUrl: '/img/exercises/overhead-triceps-stretch.svg' },
  { exerciseName: 'Wrist Extensor Stretch',               imageUrl: '/img/exercises/wrist-extensor-stretch.svg' },
];

export async function updateImagesClase22042026(): Promise<{
  updated: number;
  skippedNoExercise: number;
}> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updated = 0;
  let skippedNoExercise = 0;

  for (const assignment of IMAGE_ASSIGNMENTS) {
    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))',
      [assignment.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[ImagesClase22042026] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET image_url = ?, updated_at = ? WHERE id = ?',
      [assignment.imageUrl, ts, exerciseId]
    );

    console.log(`[ImagesClase22042026] OK: "${assignment.exerciseName}" → ${assignment.imageUrl}`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise };
}
