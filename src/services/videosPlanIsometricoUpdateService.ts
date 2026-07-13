// Asigna URLs de video a los 32 ejercicios del Plan Isométrico (Isometrico-1 a 4).
// video_path      → video corto, se ve en el popup durante la sesión.
// video_long_path → tutorial explicativo, se ve en el detalle del ejercicio.
import { openDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'videos_plan_isometrico_done_v1';

export function isVideosPlanIsometricoUpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface VideoAssignment {
  exerciseName: string;
  videoShortPath: string | null;
  videoLongPath: string | null;
}

const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  // ── Entrada en calor ───────────────────────────────────────────────────────
  {
    exerciseName: 'March in Place',
    videoShortPath: 'https://www.youtube.com/shorts/5l-A5_-BPUg',
    videoLongPath: 'https://www.youtube.com/watch?v=QilgMPG7OaA',
  },
  {
    exerciseName: 'Arm Circles',
    videoShortPath: 'https://www.youtube.com/shorts/RN40wyH6x9o',
    videoLongPath: 'https://www.youtube.com/watch?v=mwDgFY86zck',
  },
  {
    exerciseName: 'Cat-Cow',
    videoShortPath: 'https://www.youtube.com/shorts/rbuptYr2CGM',
    videoLongPath: 'https://www.youtube.com/watch?v=xyNwxiuERXc',
  },
  {
    exerciseName: 'Air Squat',
    videoShortPath: 'https://www.youtube.com/watch?v=C_VtOYc6j5c',
    videoLongPath: 'https://www.youtube.com/watch?v=iczbNSZEGIU',
  },

  // ── Día 1 · Core ───────────────────────────────────────────────────────────
  {
    exerciseName: 'Plank Hold',
    videoShortPath: 'https://www.youtube.com/shorts/6xWUlLvltvQ',
    videoLongPath: 'https://www.youtube.com/watch?v=gSDNblPRh1U',
  },
  {
    exerciseName: 'Side Plank',
    videoShortPath: 'https://www.youtube.com/watch?v=pitOuJxdyI0',
    videoLongPath: 'https://www.youtube.com/watch?v=rCxF2nG9vQ0',
  },
  {
    exerciseName: 'Hollow Hold',
    videoShortPath: 'https://www.youtube.com/shorts/skVSiMgOhc0',
    videoLongPath: 'https://www.youtube.com/watch?v=HAfUt2Cco74',
  },
  {
    exerciseName: 'Bird Dog Hold',
    videoShortPath: 'https://www.youtube.com/shorts/LWdKrBi9Lks',
    videoLongPath: 'https://www.youtube.com/watch?v=wGh2fZU20-M',
  },
  {
    exerciseName: 'Superman Hold',
    videoShortPath: 'https://www.youtube.com/shorts/ZUQzFACmLmo',
    videoLongPath: 'https://www.youtube.com/watch?v=LZoWdePF1NQ',
  },
  {
    exerciseName: 'Dead Bug',
    videoShortPath: 'https://www.youtube.com/shorts/XcYtWYMz39w',
    videoLongPath: 'https://www.youtube.com/watch?v=lqnuY3wiBzA',
  },
  {
    exerciseName: 'Ab Wheel Kneeling Rollout',
    videoShortPath: 'https://www.youtube.com/shorts/hutwpqVBdok',
    videoLongPath: 'https://www.youtube.com/watch?v=2Uw8oDIF2AY',
  },

  // ── Día 2 · Piernas ────────────────────────────────────────────────────────
  {
    exerciseName: 'Wall Sit',
    videoShortPath: 'https://www.youtube.com/shorts/mDdLC-yKudY',
    videoLongPath: 'https://www.youtube.com/watch?v=qbwoTaNH6as',
  },
  {
    exerciseName: 'Bodyweight Glute Bridge',
    videoShortPath: 'https://www.youtube.com/watch?v=FFLNpa2CN_Q',
    videoLongPath: 'https://www.youtube.com/watch?v=rVdk_9rwRIM',
  },
  {
    exerciseName: 'Isometric Lunge',
    videoShortPath: 'https://www.youtube.com/shorts/495P768V5sQ',
    videoLongPath: 'https://www.youtube.com/watch?v=FvrSfS9cQ9w',
  },
  {
    exerciseName: 'Clamshell Hold',
    videoShortPath: 'https://www.youtube.com/shorts/FrF9jTHLlg0',
    videoLongPath: 'https://www.youtube.com/watch?v=Cigb7cbcNxs',
  },
  {
    exerciseName: 'Calf Raise Hold',
    videoShortPath: 'https://www.youtube.com/shorts/2IZDcabLLoM',
    videoLongPath: 'https://www.youtube.com/watch?v=yp_sC7Mvo3g',
  },
  {
    exerciseName: 'Tempo Squat 3-1-3',
    videoShortPath: 'https://www.youtube.com/shorts/9imncDx8eQg',
    videoLongPath: 'https://www.youtube.com/watch?v=0WS8THp4Kuk',
  },

  // ── Día 3 · Tren superior ──────────────────────────────────────────────────
  {
    exerciseName: 'Isometric Push-Up Hold',
    videoShortPath: 'https://www.youtube.com/watch?v=Zm47HCvFzxQ',
    videoLongPath: 'https://www.youtube.com/watch?v=bJU2YQm7zMM',
  },
  {
    exerciseName: 'Tempo Push-Up',
    videoShortPath: 'https://www.youtube.com/watch?v=zNR4AtwQ1AI',
    videoLongPath: 'https://www.youtube.com/watch?v=dHeMPgul4A0',
  },
  {
    exerciseName: 'Scapular Plank Hold',
    videoShortPath: 'https://www.youtube.com/shorts/PUV5_OzY2nY',
    videoLongPath: 'https://www.youtube.com/watch?v=tIap-_QHdv0',
  },
  {
    exerciseName: 'Pike Hold',
    videoShortPath: 'https://www.youtube.com/watch?v=exlk6d6BhKc',
    videoLongPath: 'https://www.youtube.com/watch?v=oXT2HEQe1wM',
  },
  {
    exerciseName: 'Towel Isometric Row',
    videoShortPath: 'https://www.youtube.com/watch?v=WB7jIOz6i7g',
    videoLongPath: 'https://www.youtube.com/watch?v=62NT4yA4igM',
  },
  {
    exerciseName: 'Towel Isometric Curl',
    videoShortPath: 'https://www.youtube.com/watch?v=e_cYNEaDZeg',
    videoLongPath: 'https://www.youtube.com/watch?v=p8z4fhUWhP4',
  },

  // ── Día 4 · Cardio suave ───────────────────────────────────────────────────
  {
    exerciseName: 'Step Jack',
    videoShortPath: 'https://www.youtube.com/shorts/XQuY76XD_LU',
    videoLongPath: 'https://www.youtube.com/watch?v=QlTvs93astY',
  },
  {
    exerciseName: 'Mountain Climbers',
    videoShortPath: 'https://www.youtube.com/shorts/fpmWW6iXfes',
    videoLongPath: 'https://www.youtube.com/watch?v=ZhiCSdOVJp0',
  },
  {
    exerciseName: 'Shadow Boxing',
    videoShortPath: 'https://www.youtube.com/shorts/lYRjlkCCxKk',
    videoLongPath: 'https://www.youtube.com/watch?v=Q5WrJoYhpHE',
  },
  {
    exerciseName: 'Jump Rope',
    videoShortPath: 'https://www.youtube.com/shorts/WA1xNoWA7yA',
    videoLongPath: 'https://www.youtube.com/watch?v=Y3wzaWE9QRY',
  },

  // ── Vuelta a la calma ──────────────────────────────────────────────────────
  {
    exerciseName: 'Standing Quad Stretch',
    videoShortPath: 'https://www.youtube.com/shorts/Ztwz8rrDShk',
    videoLongPath: 'https://www.youtube.com/watch?v=Jb6JEEUGbDY',
  },
  {
    exerciseName: 'Standing Hamstring Stretch',
    videoShortPath: 'https://www.youtube.com/watch?v=rowLtvhu_3E',
    videoLongPath: 'https://www.youtube.com/watch?v=B0jl9k3ImKU',
  },
  {
    exerciseName: 'Supine Figure-4 Stretch',
    videoShortPath: 'https://www.youtube.com/shorts/UFLUfFLSBCA',
    videoLongPath: 'https://www.youtube.com/watch?v=-g0nuyTHMrI',
  },
  {
    exerciseName: 'Doorway Chest Stretch',
    videoShortPath: 'https://www.youtube.com/shorts/CiIshHzAkQQ',
    videoLongPath: 'https://www.youtube.com/watch?v=M850sCj9LHQ',
  },
  {
    exerciseName: '4-6 Breathing',
    videoShortPath: 'https://www.youtube.com/watch?v=B7vkIbbRBPU',
    videoLongPath: 'https://www.youtube.com/watch?v=-awHHifx4sc',
  },
];

export async function updateVideosPlanIsometrico(): Promise<{
  updated: number;
  skippedNoExercise: number;
  skippedNoVideo: number;
}> {
  const db = await openDatabase();
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
      console.warn(`[VideosPlanIsometrico] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_path = ?, video_long_path = ?, updated_at = ? WHERE id = ?',
      [assignment.videoShortPath, assignment.videoLongPath, ts, exerciseId]
    );

    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
