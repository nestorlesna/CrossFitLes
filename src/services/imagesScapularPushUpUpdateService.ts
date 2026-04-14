// src/services/imagesScapularPushUpUpdateService.ts
// Registra image_url en la BD para Scapular Push-Up (versión cuadrupedia / perro malo-perro bueno)

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'images_scapular_push_up_done_v1';

export function isImagesScapularPushUpUpdateDone(): boolean {
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
  { exerciseName: 'Scapular Push-Up', imageUrl: '/img/exercises/scapular-push-up.svg' },
];

export async function updateImagesScapularPushUp(): Promise<{
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
      console.warn(`[ImagesUpdate] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET image_url = ?, updated_at = ? WHERE id = ?',
      [assignment.imageUrl, ts, exerciseId]
    );

    console.log(`[ImagesUpdate] OK: "${assignment.exerciseName}" → ${assignment.imageUrl}`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise };
}
