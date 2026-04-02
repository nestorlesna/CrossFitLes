// Asigna URLs de video a ejercicios — Batch 002
// Videos buscados y verificados por Claude vía WebFetch sobre crossfit.com y catalystathletics.com.

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'videos_batch_002_done_v1';

export function isVideosBatch002UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface VideoAssignment {
  exerciseName: string;
  videoLongPath: string;
}

const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  // ── CrossFit Essentials (crossfit.com) — canal oficial ───────────────────
  { exerciseName: 'Barbell Back Squat',                videoLongPath: 'https://www.youtube.com/watch?v=6Ai-ne7Lh6M' },
  { exerciseName: 'Back Squat',                        videoLongPath: 'https://www.youtube.com/watch?v=6Ai-ne7Lh6M' },
  { exerciseName: 'Barbell Front Squat',               videoLongPath: 'https://www.youtube.com/watch?v=Akd5xmZlsvg' },
  { exerciseName: 'Barbell Clean and Jerk',            videoLongPath: 'https://www.youtube.com/watch?v=PjY1rH4_MOA' },
  { exerciseName: 'Barbell Hang Clean and Jerk',       videoLongPath: 'https://www.youtube.com/watch?v=PjY1rH4_MOA' },
  { exerciseName: 'Barbell Deadlift',                  videoLongPath: 'https://www.youtube.com/watch?v=1ZXobu7JvvE' },
  { exerciseName: 'Barbell Hang Clean',                videoLongPath: 'https://www.youtube.com/watch?v=0aP3tgKZcHQ' },
  { exerciseName: 'Barbell Hang Power Cluster',        videoLongPath: 'https://www.youtube.com/watch?v=0aP3tgKZcHQ' },
  { exerciseName: 'Barbell Muscle Snatch',             videoLongPath: 'https://www.youtube.com/watch?v=GhxhiehJcQY' },
  { exerciseName: 'Barbell Sumo Deadlift High Pull',   videoLongPath: 'https://www.youtube.com/watch?v=gh55vVlwlQg' },
  { exerciseName: 'Barbell Strict Press',              videoLongPath: 'https://www.youtube.com/watch?v=iaBVSJm78ko' },
  { exerciseName: 'Box Jump',                          videoLongPath: 'https://www.youtube.com/watch?v=NBY9-kTuHEk' },
  { exerciseName: 'Box Jump-Over',                     videoLongPath: 'https://www.youtube.com/watch?v=NBY9-kTuHEk' },
  { exerciseName: 'Burpee Over the Bar',               videoLongPath: 'https://www.youtube.com/watch?v=auBLPXO8Fww' },
  { exerciseName: 'Double Under',                      videoLongPath: 'https://www.youtube.com/watch?v=82jNjDS19lg' },
  { exerciseName: 'Dumbbell Thruster',                 videoLongPath: 'https://www.youtube.com/watch?v=L219ltL15zk' },
  { exerciseName: 'GHD Back Extension',                videoLongPath: 'https://www.youtube.com/watch?v=ivDB23Kcv-A' },
  { exerciseName: 'GHD Sit-Up',                        videoLongPath: 'https://www.youtube.com/watch?v=oFwt7WfnPcc' },
  { exerciseName: 'Kettlebell Sumo Deadlift High Pull', videoLongPath: 'https://www.youtube.com/watch?v=gh55vVlwlQg' },
  { exerciseName: 'Ring Dip',                          videoLongPath: 'https://www.youtube.com/watch?v=EznLCDBAPIU' },
  { exerciseName: 'Wall Ball Shot',                    videoLongPath: 'https://www.youtube.com/watch?v=EqjGKsiIMCE' },

  // ── Catalyst Athletics (catalystathletics.com) ────────────────────────────
  { exerciseName: 'Farmer\'s Carry',                   videoLongPath: 'https://www.youtube.com/watch?v=ZvUkhUesX0Y' },
  { exerciseName: 'Barbell Lunge',                     videoLongPath: 'https://www.youtube.com/watch?v=iCWAMA9Zeus' },
  { exerciseName: 'Barbell Upright Row',               videoLongPath: 'https://www.youtube.com/watch?v=jDmNzL_jctc' },
  { exerciseName: 'Dumbbell Bench Press',              videoLongPath: 'https://www.youtube.com/watch?v=IxQDQ2jwS5Y' },

  // ── CrossFit — ejercicios específicos ─────────────────────────────────────
  { exerciseName: 'Rowing',                            videoLongPath: 'https://www.youtube.com/watch?v=gh55vVlwlQg' },
  { exerciseName: 'Hanging Toes to Bar',               videoLongPath: 'https://www.youtube.com/watch?v=oFwt7WfnPcc' },
  { exerciseName: 'Hanging Knees to Elbows',           videoLongPath: 'https://www.youtube.com/watch?v=oFwt7WfnPcc' },
];

export async function updateVideosBatch002(): Promise<{
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
    if (!assignment.videoLongPath) {
      skippedNoVideo++;
      continue;
    }

    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))',
      [assignment.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[VideosUpdate Batch002] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_long_path = ?, updated_at = ? WHERE id = ?',
      [assignment.videoLongPath, ts, exerciseId]
    );

    console.log(`[VideosUpdate Batch002] OK: "${assignment.exerciseName}"`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
