// Asigna URLs de video a ejercicios — Batch 002
// Videos buscados y verificados por Claude vía WebFetch sobre crossfit.com y catalystathletics.com.

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'videos_batch_002_done_v3';

export function isVideosBatch002UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface VideoAssignment {
  exerciseName: string;
  videoShortPath: string | null;   // video_path — popup sesión (Shorts o demo rápida)
  videoLongPath: string | null;    // video_long_path — tutorial explicativo
}

// Todos los videos de este batch provienen de CrossFit Essentials y Catalyst Athletics
// → son tutoriales explicativos → van a videoLongPath
// videoShortPath queda null hasta que se encuentren demos cortas para cada ejercicio
const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  // ── CrossFit Essentials (crossfit.com) — tutoriales oficiales ───────────────
  { exerciseName: 'Barbell Back Squat',                videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=6Ai-ne7Lh6M' },
  { exerciseName: 'Back Squat',                        videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=6Ai-ne7Lh6M' },
  { exerciseName: 'Barbell Front Squat',               videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=Akd5xmZlsvg' },
  { exerciseName: 'Barbell Clean and Jerk',            videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=PjY1rH4_MOA' },
  { exerciseName: 'Barbell Hang Clean and Jerk',       videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=PjY1rH4_MOA' },
  { exerciseName: 'Barbell Deadlift',                  videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=1ZXobu7JvvE' },
  { exerciseName: 'Barbell Hang Clean',                videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=0aP3tgKZcHQ' },
  { exerciseName: 'Barbell Hang Power Cluster',        videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=0aP3tgKZcHQ' },
  { exerciseName: 'Barbell Muscle Snatch',             videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=GhxhiehJcQY' },
  { exerciseName: 'Barbell Sumo Deadlift High Pull',   videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=gh55vVlwlQg' },
  { exerciseName: 'Barbell Strict Press',              videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=iaBVSJm78ko' },
  { exerciseName: 'Box Jump',                          videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=NBY9-kTuHEk' },
  { exerciseName: 'Box Jump-Over',                     videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=NBY9-kTuHEk' },
  { exerciseName: 'Burpee Over the Bar',               videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=auBLPXO8Fww' },
  { exerciseName: 'Double Under',                      videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=82jNjDS19lg' },
  { exerciseName: 'Dumbbell Thruster',                 videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=L219ltL15zk' },
  { exerciseName: 'GHD Back Extension',                videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=ivDB23Kcv-A' },
  { exerciseName: 'GHD Sit-Up',                        videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=oFwt7WfnPcc' },
  { exerciseName: 'Kettlebell Sumo Deadlift High Pull', videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=gh55vVlwlQg' },
  { exerciseName: 'Ring Dip',                          videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=EznLCDBAPIU' },
  { exerciseName: 'Wall Ball Shot',                    videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=EqjGKsiIMCE' },

  // ── Catalyst Athletics (catalystathletics.com) — tutoriales olímpicos ────────
  { exerciseName: 'Farmer\'s Carry',                   videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=ZvUkhUesX0Y' },
  { exerciseName: 'Barbell Lunge',                     videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=iCWAMA9Zeus' },
  { exerciseName: 'Barbell Upright Row',               videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=jDmNzL_jctc' },
  { exerciseName: 'Dumbbell Bench Press',              videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=IxQDQ2jwS5Y' },

  // ── CrossFit — ejercicios específicos ─────────────────────────────────────
  { exerciseName: 'Rowing',                            videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=gh55vVlwlQg' },
  { exerciseName: 'Hanging Toes to Bar',               videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=oFwt7WfnPcc' },
  { exerciseName: 'Hanging Knees to Elbows',           videoShortPath: null, videoLongPath: 'https://www.youtube.com/watch?v=oFwt7WfnPcc' },
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
      console.warn(`[VideosUpdate Batch002] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_path = ?, video_long_path = ?, updated_at = ? WHERE id = ?',
      [assignment.videoShortPath ?? null, assignment.videoLongPath ?? null, ts, exerciseId]
    );

    console.log(`[VideosUpdate Batch002] OK: "${assignment.exerciseName}"`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
