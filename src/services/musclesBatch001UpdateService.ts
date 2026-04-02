// Asigna grupos musculares a ejercicios individuales — Batch 001
// Usa el mismo patrón que los import services (await getDatabase + db.run).

import { getDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const UPDATE_FLAG = 'muscles_batch_001_done_v2';

const CATALOG_NAME: Record<string, string> = {
  'Pectorales':       'Pectoral mayor',
  'Dorsales':         'Dorsal ancho',
  'Deltoides':        'Deltoides anterior',
  'Bíceps':           'Bíceps braquial',
  'Tríceps':          'Tríceps braquial',
  'Trapecio':         'Trapecio (superior)',
  'Antebrazos':       'Flexores antebrazo',
  'Cuádriceps':       'Recto femoral',
  'Isquiotibiales':   'Bíceps femoral',
  'Glúteos':          'Glúteo mayor',
  'Pantorrillas':     'Gastrocnemio (gemelos)',
  'Core/Abdominales': 'Recto abdominal',
};

function toDbName(name: string): string {
  return CATALOG_NAME[name] ?? name;
}

export function isMusclesBatch001UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface MuscleAssignment {
  exerciseName: string;
  primary: string;
  secondary: string[];
}

const MUSCLE_ASSIGNMENTS: MuscleAssignment[] = [
  { exerciseName: 'Lateral Raise to Overhead', primary: 'Deltoides', secondary: ['Trapecio'] },
];

export async function updateMusclesBatch001(): Promise<{
  updated: number;
  skippedNoExercise: number;
  skippedNoMuscle: number;
}> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const muscleRows = await db.query('SELECT id, name FROM muscle_group WHERE is_active = 1');
  const muscleMap = new Map(
    (muscleRows.values ?? []).map((r: any) => [r.name as string, r.id as string])
  );
  console.log(`[MusclesUpdate Batch001] Catálogo cargado: ${muscleMap.size} músculos`);

  let updated = 0;
  let skippedNoExercise = 0;
  let skippedNoMuscle = 0;

  for (const assignment of MUSCLE_ASSIGNMENTS) {
    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))',
      [assignment.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[MusclesUpdate Batch001] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    const primaryId = muscleMap.get(toDbName(assignment.primary));
    if (!primaryId) {
      console.warn(`[MusclesUpdate Batch001] Músculo no en catálogo: "${assignment.primary}" → "${toDbName(assignment.primary)}"`);
      skippedNoMuscle++;
      continue;
    }

    // Borrar músculos existentes y reasignar
    await db.run('DELETE FROM exercise_muscle_group WHERE exercise_id = ?', [exerciseId]);
    await db.run(
      'UPDATE exercise SET primary_muscle_group_id = NULL, updated_at = ? WHERE id = ?',
      [ts, exerciseId]
    );

    await db.run(
      'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 1)',
      [generateUUID(), exerciseId, primaryId]
    );
    await db.run(
      'UPDATE exercise SET primary_muscle_group_id = ?, updated_at = ? WHERE id = ?',
      [primaryId, ts, exerciseId]
    );

    for (const secName of assignment.secondary) {
      const secId = muscleMap.get(toDbName(secName));
      if (secId) {
        await db.run(
          'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
          [generateUUID(), exerciseId, secId]
        );
      }
    }

    console.log(`[MusclesUpdate Batch001] OK: "${assignment.exerciseName}"`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoMuscle };
}
