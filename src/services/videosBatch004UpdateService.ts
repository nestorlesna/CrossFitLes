// Asigna video_long_path (video explicativo) a ejercicios — Batch 004 / GOAT 25/04/2026

import { getDatabase, saveDatabase } from '../db/database';
import { BATCH_004_VIDEO_PAIRS } from '../data/batch004VideoPairs';

const UPDATE_FLAG = 'videos_batch_004_done';

export function isVideosBatch004UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

export async function updateVideosBatch004(
  selections: Record<string, 'A' | 'B'>
): Promise<{ updated: number; skippedNoExercise: number; skippedNoVideo: number }> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updated = 0;
  let skippedNoExercise = 0;
  let skippedNoVideo = 0;

  for (const pair of BATCH_004_VIDEO_PAIRS) {
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
      console.warn(`[VideosBatch004] No encontrado: "${pair.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_long_path = ?, updated_at = ? WHERE id = ?',
      [videoUrl, ts, exerciseId]
    );

    console.log(`[VideosBatch004] OK: "${pair.exerciseName}" → ${videoUrl}`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
