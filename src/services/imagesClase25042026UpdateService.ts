// Registra image_url en la BD para los ejercicios nuevos de la Clase GOAT 25/04/2026

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'images_clase_25_04_2026_done_v1';

export function isImagesClase25042026UpdateDone(): boolean {
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
  { exerciseName: 'Wall Lat Stretch',                  imageUrl: '/img/exercises/wall-lat-stretch.svg' },
  { exerciseName: 'Wall Shoulder CAR',                 imageUrl: '/img/exercises/wall-shoulder-car.svg' },
  { exerciseName: 'Goblet Squat Hold Press',           imageUrl: '/img/exercises/goblet-squat-hold-press.svg' },
  { exerciseName: 'Core Overhead Hold with Side Bend', imageUrl: '/img/exercises/core-overhead-hold-side-bend.svg' },
  { exerciseName: 'Wall Sit with Leg Extension',       imageUrl: '/img/exercises/wall-sit-with-leg-extension.svg' },
  { exerciseName: 'Dual Dumbbell Snatch with Burpee',  imageUrl: '/img/exercises/dual-dumbbell-snatch-with-burpee.svg' },
];

export async function updateImagesClase25042026(): Promise<{ updated: number; skippedNoExercise: number }> {
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
      console.warn(`[ImagesUpdate 25/04] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET image_url = ?, updated_at = ? WHERE id = ?',
      [assignment.imageUrl, ts, exerciseId]
    );
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise };
}
