// Asigna URLs de video corto (video_path) a 67 ejercicios — Batch 003
// Usa las selecciones interactivas del usuario desde VideoBatch003Page.
// Este módulo se ejecuta automáticamente cuando el usuario guarda desde la UI.

import { getDatabase, saveDatabase } from '../db/database';
import { BATCH_003_VIDEO_PAIRS } from '../data/batch003VideoPairs';

const UPDATE_FLAG = 'videos_batch_003_done';

export function isVideosBatch003UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

export async function updateVideosBatch003(
  selections: Record<string, 'A' | 'B'>
): Promise<{
  updated: number;
  skippedNoExercise: number;
  skippedNoVideo: number;
}> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updated = 0;
  let skippedNoExercise = 0;
  let skippedNoVideo = 0;

  for (const pair of BATCH_003_VIDEO_PAIRS) {
    const choice = selections[pair.exerciseName];
    if (!choice) {
      skippedNoVideo++;
      continue;
    }

    const videoUrl = choice === 'A' ? pair.videoA : pair.videoB;

    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))',
      [pair.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[VideosUpdate Batch003] No encontrado: "${pair.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_path = ?, updated_at = ? WHERE id = ?',
      [videoUrl, ts, exerciseId]
    );

    console.log(`[VideosUpdate Batch003] OK: "${pair.exerciseName}" → ${videoUrl}`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
