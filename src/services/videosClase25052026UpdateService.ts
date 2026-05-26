// src/services/videosClase25052026UpdateService.ts
// Asigna URLs de video a ejercicios — Clase GOAT 25/05/2026
// Solo cubre los ejercicios que no tenían video al importar la clase.

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'videos_clase_25_05_2026_done_v1';

export function isVideosClase25052026UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface VideoAssignment {
  exerciseName: string;
  videoShortPath: string | null;   // video_path — popup sesión (Shorts o video corto)
  videoLongPath: string | null;    // video_long_path — explicativo (tutorial, > 2 min)
}

const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  // ─── Activación / Fuerza / WOD ──────────────────────────────────────────
  {
    exerciseName: 'Squat Press-Out',
    videoShortPath: 'https://www.youtube.com/shorts/bl83fI7Cs6c',
    videoLongPath:  'https://www.youtube.com/watch?v=cJWPjkkZ6iA',
  },
  {
    exerciseName: 'Box Jump',
    videoShortPath: 'https://www.youtube.com/shorts/iqhhDf0ggSA',
    videoLongPath:  'https://www.youtube.com/watch?v=Tyni8wPbpWs',
  },
  {
    exerciseName: 'Barbell Front Squat',
    videoShortPath: 'https://www.youtube.com/shorts/r6Z_h_WAX5o',
    videoLongPath:  'https://www.youtube.com/watch?v=Q4REDQdplnM',
  },
  {
    exerciseName: 'Power Clean',
    videoShortPath: 'https://www.youtube.com/shorts/8HZ2tQNJiPA',
    videoLongPath:  'https://www.youtube.com/watch?v=GVt4uQ0sDJE',
  },
  {
    exerciseName: 'Hanging Toes-to-Bar',
    videoShortPath: 'https://www.youtube.com/shorts/8Hdy1u8MBgA',
    videoLongPath:  'https://www.youtube.com/watch?v=DVMrILiX_oc',
  },
  {
    exerciseName: 'Burpee Over the Bar',
    videoShortPath: 'https://www.youtube.com/shorts/8QPyif3vjKU',
    videoLongPath:  'https://www.youtube.com/watch?v=BX_t8RArfKw',
  },

  // ─── Estiramiento (Vuelta a la calma) ───────────────────────────────────
  {
    exerciseName: 'Supine Spinal Twist',
    videoShortPath: 'https://www.youtube.com/shorts/eyW9qmwfeCw',
    videoLongPath:  'https://www.youtube.com/watch?v=eSOoB4Dj5_8',
  },
  {
    exerciseName: 'Seated Forward Fold',
    videoShortPath: 'https://www.youtube.com/shorts/imptdV-1wKY',
    videoLongPath:  null,
  },
  {
    exerciseName: 'Seated Quad Stretch',
    videoShortPath: 'https://www.youtube.com/shorts/OMFbUvSphts',
    videoLongPath:  'https://www.youtube.com/watch?v=ytjU-GnGR6M',
  },
  {
    exerciseName: 'Pigeon Pose',
    videoShortPath: 'https://www.youtube.com/shorts/IcCVlpWE-UA',
    videoLongPath:  null,
  },
  {
    exerciseName: 'Supine Abdominal Stretch',
    videoShortPath: null,
    videoLongPath:  'https://www.youtube.com/watch?v=uHlyJs1hONU',
  },
  {
    exerciseName: 'Cobra Pose',
    videoShortPath: 'https://www.youtube.com/shorts/S1oRzYElqag',
    videoLongPath:  'https://www.youtube.com/watch?v=fOdrW7nf9gw',
  },
  {
    exerciseName: "Child's Pose",
    videoShortPath: 'https://www.youtube.com/shorts/YAmAET3Uomk',
    videoLongPath:  'https://www.youtube.com/watch?v=b6ShzRG-g4k',
  },
  {
    exerciseName: 'Half Kneeling Hip Flexor Stretch',
    videoShortPath: 'https://www.youtube.com/shorts/QtnvAYy86mg',
    videoLongPath:  'https://www.youtube.com/watch?v=nJVogxD2eck',
  },
  {
    exerciseName: 'Standing Biceps Stretch',
    videoShortPath: null,
    videoLongPath:  'https://www.youtube.com/watch?v=ZPN1cDnv300',
  },
  {
    exerciseName: 'Overhead Triceps Stretch',
    videoShortPath: 'https://www.youtube.com/shorts/DzlrPqLkPTk',
    videoLongPath:  'https://www.youtube.com/watch?v=cPTrm13hSSo',
  },
  {
    exerciseName: 'Wrist Extensor Stretch',
    videoShortPath: 'https://www.youtube.com/shorts/yZcvTeLFx4U',
    videoLongPath:  'https://www.youtube.com/watch?v=rQlDHgTUbO0',
  },
];

export async function updateVideosClase25052026(): Promise<{
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
      console.warn(`[VideosUpdate 25/05/2026] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_path = ?, video_long_path = ?, updated_at = ? WHERE id = ?',
      [assignment.videoShortPath ?? null, assignment.videoLongPath ?? null, ts, exerciseId]
    );

    console.log(`[VideosUpdate 25/05/2026] OK: "${assignment.exerciseName}"`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
