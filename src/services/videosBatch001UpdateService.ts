// Asigna video_path (video corto) a ejercicios — Batch 001 / GOAT 22/04/2026

import { getDatabase, saveDatabase } from '../db/database';
import { BATCH_001_VIDEO_PAIRS } from '../data/batch001VideoPairs';

const UPDATE_FLAG = 'videos_batch_001_done';

export function isVideosBatch001UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

export async function updateVideosBatch001(
  selections: Record<string, 'A' | 'B'>
): Promise<{ updated: number; skippedNoExercise: number; skippedNoVideo: number }> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updated = 0;
  let skippedNoExercise = 0;
  let skippedNoVideo = 0;

  for (const pair of BATCH_001_VIDEO_PAIRS) {
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
      console.warn(`[VideosBatch001] No encontrado: "${pair.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_path = ?, updated_at = ? WHERE id = ?',
      [videoUrl, ts, exerciseId]
    );

    console.log(`[VideosBatch001] OK: "${pair.exerciseName}" → ${videoUrl}`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
