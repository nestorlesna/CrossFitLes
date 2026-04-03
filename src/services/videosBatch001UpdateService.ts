// Asigna URLs de video a ejercicios — Batch 001
// Videos buscados y verificados por Claude vía WebSearch/WebFetch.

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'videos_batch_001_done_v2';

export function isVideosBatch001UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface VideoAssignment {
  exerciseName: string;
  videoShortPath: string | null;   // video_path — popup sesión
  videoLongPath: string | null;    // video_long_path — tutorial explicativo
}

const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  // Catalyst Athletics: tutorial olímpico → explicativo
  {
    exerciseName: 'Back Squat',
    videoShortPath: null,
    videoLongPath: 'https://www.youtube.com/watch?v=6Ai-ne7Lh6M',
  },
];

export async function updateVideosBatch001(): Promise<{
  updated: number;
  skippedNoExercise: number;
  skippedNoVideo: number;
}> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updated = 0;
  let skippedNoExercise = 0;
  let skippedNoVideo = 0;

  for (const assignment of VIDEO_ASSIGNMENTS) {
    if (!assignment.videoShortPath && !assignment.videoLongPath) {
      skippedNoVideo++;
      continue;
    }

    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))',
      [assignment.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[VideosUpdate Batch001] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_path = ?, video_long_path = ?, updated_at = ? WHERE id = ?',
      [assignment.videoShortPath ?? null, assignment.videoLongPath ?? null, ts, exerciseId]
    );

    console.log(`[VideosUpdate Batch001] OK: "${assignment.exerciseName}"`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
