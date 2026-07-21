// Asigna el campo video_long_path (video explicativo / tutorial largo) a los
// ejercicios que aún no lo tienen. Sólo toca video_long_path — nunca video_path.
// Idempotente: sólo actualiza filas cuyo video_long_path está vacío, así que
// re-ejecutarlo no pisa valores ya cargados.
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

// [nombre exacto en BD, URL de YouTube del tutorial explicativo]
// Todos los IDs verificados vía el endpoint oembed de YouTube (HTTP 200).
const EXERCISE_LONG_VIDEOS: [string, string][] = [
  ['90/90 Hip Internal Rotation Lift-Off', 'https://www.youtube.com/watch?v=sLWSmo0uk2E'],
  ['Assault Bike',                         'https://www.youtube.com/watch?v=Sg3Id7Lu8XU'],
  ['Barbell Bent Over Row',                'https://www.youtube.com/watch?v=G8l_8chR5BE'],
  ['Barbell Hang Power Snatch',            'https://www.youtube.com/watch?v=SpDPcj0W3Yw'],
  ['Bodyweight Walking Lunge',             'https://www.youtube.com/watch?v=BenhAbJiTsw'],
  ['Dead Bug Hold with Dumbbell',          'https://www.youtube.com/watch?v=p4xj3tD1doc'],
  ['Dual Dumbbell Snatch with Burpee',     'https://www.youtube.com/watch?v=TYs7vmCvprE'],
  ['Dumbbell Overhead Hold',               'https://www.youtube.com/watch?v=QKsPGwXjxjM'],
  ['Dumbbell Wall Sit',                    'https://www.youtube.com/watch?v=bKQQLpQbJ7s'],
  ['Goblet Squat Hold Press',              'https://www.youtube.com/watch?v=vLYbCkqfRdY'],
  ['Kettlebell Good Morning to Squat',     'https://www.youtube.com/watch?v=0lcPSo2gRoY'],
  ['Partner Wall Ball Over Bar',           'https://www.youtube.com/watch?v=_KfCGKfP1_g'],
  ['Reverse Snow Angels',                  'https://www.youtube.com/watch?v=b3e9rENJGCE'],
  ['Ring Row',                             'https://www.youtube.com/watch?v=VQn3aGSUorc'],
  ['Sally Up Sally Down',                  'https://www.youtube.com/watch?v=7ZL1Ds5dOaM'],
  ['Shadow Boxing',                        'https://www.youtube.com/watch?v=Q5WrJoYhpHE'],
  ['SkiErg',                               'https://www.youtube.com/watch?v=B0lIgT5PHc8'],
  ['Spiderman Stretch Rotation',           'https://www.youtube.com/watch?v=il1AhduOqfA'],
  ['Standing Cross Crunch',                'https://www.youtube.com/watch?v=unMZPDjMn10'],
  ['Wall Lat Stretch',                     'https://www.youtube.com/watch?v=JW_B7HJFT2Q'],
  ['Wall Shoulder External Rotation',      'https://www.youtube.com/watch?v=KqewWibqWgo'],
  ['Weighted Sit-Up',                      'https://www.youtube.com/watch?v=D_pSUxAQJ_s'],
  ['Y Raises',                             'https://www.youtube.com/watch?v=GPwvS56XWBk'],
];

export interface VideoLongUpdateResult {
  updated: number;    // filas a las que se les cargó el video explicativo
  alreadyHad: number; // el ejercicio existía pero ya tenía video explicativo
  notFound: number;   // no existe ningún ejercicio con ese nombre en la BD
}

/**
 * Asigna video_long_path a los ejercicios listados que aún no lo tienen.
 * No modifica video_path (video corto). Idempotente.
 */
export async function updateExerciseVideoLong(
  db: SQLiteDBConnection
): Promise<VideoLongUpdateResult> {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  let updated = 0;
  let alreadyHad = 0;
  let notFound = 0;

  for (const [name, url] of EXERCISE_LONG_VIDEOS) {
    const res = await db.run(
      `UPDATE exercise
         SET video_long_path = ?, updated_at = ?
       WHERE name = ? AND (video_long_path IS NULL OR video_long_path = '')`,
      [url, ts, name]
    );
    const changed = res.changes?.changes ?? 0;
    if (changed > 0) {
      updated += changed;
      continue;
    }
    // No hubo cambios: ¿el ejercicio no existe o ya tenía video?
    const chk = await db.query('SELECT 1 FROM exercise WHERE name = ? LIMIT 1', [name]);
    if ((chk.values?.length ?? 0) === 0) notFound++;
    else alreadyHad++;
  }

  return { updated, alreadyHad, notFound };
}

/**
 * Versión standalone: abre su propia conexión, aplica y persiste.
 * Idempotente — se puede ejecutar varias veces sin problema.
 */
export async function runVideoLongUpdate(): Promise<VideoLongUpdateResult> {
  const { openDatabase, saveDatabase } = await import('../db/database');
  const db = await openDatabase();
  const result = await updateExerciseVideoLong(db);
  await saveDatabase();
  return result;
}
