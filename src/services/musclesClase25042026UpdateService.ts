// Asigna grupos musculares a los ejercicios de la Clase GOAT 25/04/2026

import { getDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const UPDATE_FLAG = 'muscles_clase_25_04_2026_done';

export function isMusclesClase25042026UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

const SIMPLIFIED_TO_GRANULAR: Record<string, string> = {
  'Deltoides':       'Deltoides anterior',
  'Cuádriceps':      'Recto femoral',
  'Isquiotibiales':  'Bíceps femoral',
  'Glúteos':         'Glúteo mayor',
  'Dorsales':        'Dorsal ancho',
  'Trapecio':        'Trapecio (superior)',
  'Bíceps':          'Bíceps braquial',
  'Tríceps':         'Tríceps braquial',
  'Pantorrillas':    'Gastrocnemio (gemelos)',
  'Core/Abdominales':'Recto abdominal',
  'Antebrazos':      'Flexores antebrazo',
  'Pectorales':      'Pectoral mayor',
};

function toDbName(name: string): string {
  return SIMPLIFIED_TO_GRANULAR[name] ?? name;
}

interface MuscleAssignment {
  exerciseName: string;
  primary: string;
  secondary: string[];
}

const MUSCLE_ASSIGNMENTS: MuscleAssignment[] = [
  // Movilidad
  { exerciseName: 'Wall Lat Stretch',                  primary: 'Dorsales',         secondary: ['Deltoides', 'Core/Abdominales'] },
  { exerciseName: 'Wall Shoulder CAR',                 primary: 'Deltoides',        secondary: ['Trapecio', 'Dorsales'] },
  { exerciseName: 'Goblet Squat Hold Press',           primary: 'Cuádriceps',       secondary: ['Glúteos', 'Deltoides', 'Core/Abdominales'] },
  // Activación
  { exerciseName: 'Core Overhead Hold with Side Bend', primary: 'Core/Abdominales', secondary: ['Deltoides', 'Trapecio'] },
  { exerciseName: 'Wall Sit with Leg Extension',       primary: 'Cuádriceps',       secondary: ['Glúteos', 'Core/Abdominales'] },
  // Fuerza
  { exerciseName: 'Barbell Overhead Squat',            primary: 'Cuádriceps',       secondary: ['Glúteos', 'Deltoides', 'Core/Abdominales'] },
  // WOD
  { exerciseName: 'Dual Dumbbell Snatch with Burpee',  primary: 'Cuádriceps',       secondary: ['Glúteos', 'Deltoides', 'Trapecio', 'Core/Abdominales', 'Pectorales'] },
  { exerciseName: 'Rowing',                            primary: 'Dorsales',         secondary: ['Bíceps', 'Core/Abdominales', 'Cuádriceps', 'Isquiotibiales'] },
  { exerciseName: 'Wall Ball Shot',                    primary: 'Cuádriceps',       secondary: ['Glúteos', 'Deltoides', 'Core/Abdominales'] },
  { exerciseName: 'Pull-Up',                           primary: 'Dorsales',         secondary: ['Bíceps', 'Core/Abdominales'] },
];

export async function updateMusclesClase25042026(): Promise<{ updated: number; skipped: number }> {
  const db = await getDatabase();

  const muscleRows = await db.query('SELECT id, name FROM muscle_group WHERE is_active = 1');
  const muscleMap = new Map(
    (muscleRows.values ?? []).map((r: any) => [r.name as string, r.id as string])
  );

  let updated = 0;
  let skipped = 0;

  for (const assignment of MUSCLE_ASSIGNMENTS) {
    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?)) AND is_active = 1',
      [assignment.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[MusclesUpdate 25/04] Ejercicio no encontrado: ${assignment.exerciseName}`);
      skipped++;
      continue;
    }

    const existing = await db.query(
      'SELECT id FROM exercise_muscle_group WHERE exercise_id = ?',
      [exerciseId]
    );
    if ((existing.values?.length ?? 0) > 0) {
      skipped++;
      continue;
    }

    const primaryDbName = toDbName(assignment.primary);
    const primaryId = muscleMap.get(primaryDbName);
    if (primaryId) {
      await db.run(
        'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 1)',
        [generateUUID(), exerciseId, primaryId]
      );
      await db.run(
        'UPDATE exercise SET primary_muscle_group_id = ?, updated_at = ? WHERE id = ?',
        [primaryId, new Date().toISOString().replace('T', ' ').substring(0, 19), exerciseId]
      );
    }

    for (const secName of assignment.secondary) {
      const secId = muscleMap.get(toDbName(secName));
      if (secId) {
        await db.run(
          'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
          [generateUUID(), exerciseId, secId]
        );
      }
    }

    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skipped };
}
