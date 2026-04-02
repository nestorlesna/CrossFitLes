// Asigna grupos musculares — Batch 002
// Ejercicios de las clases 28/03/2026 + Barbell Thruster
// Usa el mismo patrón que los import services (await getDatabase + db.run + toDbName).

import { getDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const UPDATE_FLAG = 'muscles_batch_002_done_v1';

export function isMusclesBatch002UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

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

interface MuscleAssignment {
  exerciseName: string;
  primary: string;
  secondary: string[];
}

const MUSCLE_ASSIGNMENTS: MuscleAssignment[] = [
  { exerciseName: 'Barbell Thruster',                  primary: 'Cuádriceps',        secondary: ['Glúteos', 'Deltoides', 'Tríceps', 'Core/Abdominales'] },
  { exerciseName: 'Bent-Over Dumbbell Lateral Raise',  primary: 'Deltoides',         secondary: ['Trapecio', 'Dorsales'] },
  { exerciseName: 'Burpee Over The Bar',               primary: 'Core/Abdominales',  secondary: ['Cuádriceps', 'Pectorales', 'Deltoides'] },
  { exerciseName: 'Dumbbell Front Raise',              primary: 'Deltoides',         secondary: ['Trapecio'] },
  { exerciseName: "Farmer's Carry",                    primary: 'Trapecio',          secondary: ['Antebrazos', 'Core/Abdominales', 'Cuádriceps'] },
  { exerciseName: 'Hollow to Superman Roll',           primary: 'Core/Abdominales',  secondary: ['Dorsales', 'Glúteos'] },
  { exerciseName: 'Kettlebell Sumo Deadlift High Pull',primary: 'Glúteos',           secondary: ['Cuádriceps', 'Isquiotibiales', 'Deltoides', 'Trapecio'] },
  { exerciseName: 'Plank to Opposite Toe Touch',       primary: 'Core/Abdominales',  secondary: ['Deltoides', 'Glúteos'] },
  { exerciseName: 'Stability Ball Plate Crunch',       primary: 'Core/Abdominales',  secondary: [] },
];

export async function updateMusclesBatch002(): Promise<{
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
  console.log(`[MusclesUpdate Batch002] Catálogo cargado: ${muscleMap.size} músculos`);

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
      console.warn(`[MusclesUpdate Batch002] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    const primaryId = muscleMap.get(toDbName(assignment.primary));
    if (!primaryId) {
      console.warn(`[MusclesUpdate Batch002] Músculo no en catálogo: "${assignment.primary}" → "${toDbName(assignment.primary)}"`);
      skippedNoMuscle++;
      continue;
    }

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

    console.log(`[MusclesUpdate Batch002] OK: "${assignment.exerciseName}"`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoMuscle };
}
