// Asigna grupos musculares a los ejercicios de la Clase GOAT 22/04/2026

import { getDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const UPDATE_FLAG = 'muscles_clase_22_04_2026_done';

export function isMusclesClase22042026UpdateDone(): boolean {
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
  // ── Movilidad ────────────────────────────────────────────────────────────────
  { exerciseName: 'Band Pull-Apart',                      primary: 'Deltoides',       secondary: ['Trapecio', 'Dorsales'] },
  { exerciseName: 'Wall Shoulder External Rotation',      primary: 'Deltoides',       secondary: ['Trapecio', 'Dorsales'] },
  { exerciseName: '90/90 Hip Internal Rotation Lift-Off', primary: 'Glúteos',         secondary: ['Isquiotibiales', 'Core/Abdominales'] },
  // ── Activación ───────────────────────────────────────────────────────────────
  { exerciseName: 'Dumbbell Overhead Hold',               primary: 'Deltoides',       secondary: ['Tríceps', 'Core/Abdominales'] },
  { exerciseName: 'Plank Hold',                           primary: 'Core/Abdominales', secondary: ['Deltoides', 'Glúteos'] },
  { exerciseName: 'Dead Bug Hold with Dumbbell',          primary: 'Core/Abdominales', secondary: ['Deltoides'] },
  { exerciseName: "Farmer's Carry",                       primary: 'Trapecio',        secondary: ['Antebrazos', 'Core/Abdominales', 'Cuádriceps'] },
  // ── Fuerza ───────────────────────────────────────────────────────────────────
  { exerciseName: 'Barbell Power Snatch',                 primary: 'Cuádriceps',      secondary: ['Glúteos', 'Deltoides', 'Trapecio', 'Core/Abdominales'] },
  // ── WOD ──────────────────────────────────────────────────────────────────────
  { exerciseName: 'Alternating Single Arm Dumbbell Power Snatch', primary: 'Cuádriceps', secondary: ['Glúteos', 'Deltoides', 'Trapecio', 'Core/Abdominales'] },
  { exerciseName: 'Box Jump-Over',                        primary: 'Cuádriceps',      secondary: ['Glúteos', 'Isquiotibiales', 'Pantorrillas'] },
  { exerciseName: 'Running',                              primary: 'Cuádriceps',      secondary: ['Isquiotibiales', 'Glúteos', 'Pantorrillas'] },
  { exerciseName: 'Barbell Push Press',                   primary: 'Deltoides',       secondary: ['Tríceps', 'Cuádriceps', 'Core/Abdominales'] },
  { exerciseName: 'Single-Arm Dumbbell Push Press',       primary: 'Deltoides',       secondary: ['Tríceps', 'Cuádriceps', 'Core/Abdominales'] },
  // ── Estiramiento ─────────────────────────────────────────────────────────────
  { exerciseName: 'Supine Spinal Twist',                  primary: 'Core/Abdominales', secondary: ['Dorsales', 'Glúteos'] },
  { exerciseName: 'Seated Forward Fold',                  primary: 'Isquiotibiales',  secondary: ['Pantorrillas', 'Dorsales'] },
  { exerciseName: 'Seated Quad Stretch',                  primary: 'Cuádriceps',      secondary: ['Isquiotibiales'] },
  { exerciseName: 'Pigeon Pose',                          primary: 'Glúteos',         secondary: ['Cuádriceps', 'Isquiotibiales'] },
  { exerciseName: 'Supine Abdominal Stretch',             primary: 'Core/Abdominales', secondary: ['Pectorales', 'Bíceps'] },
  { exerciseName: 'Cobra Pose',                           primary: 'Core/Abdominales', secondary: ['Dorsales', 'Pectorales'] },
  { exerciseName: "Child's Pose",                         primary: 'Dorsales',        secondary: ['Glúteos', 'Core/Abdominales'] },
  { exerciseName: 'Half Kneeling Hip Flexor Stretch',     primary: 'Cuádriceps',      secondary: ['Core/Abdominales'] },
  { exerciseName: 'Standing Biceps Stretch',              primary: 'Bíceps',          secondary: ['Pectorales', 'Deltoides'] },
  { exerciseName: 'Overhead Triceps Stretch',             primary: 'Tríceps',         secondary: ['Deltoides'] },
  { exerciseName: 'Wrist Extensor Stretch',               primary: 'Antebrazos',      secondary: [] },
];

export async function updateMusclesClase22042026(): Promise<{ updated: number; skipped: number }> {
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
      console.warn(`[MusclesClase22042026] Ejercicio no encontrado: ${assignment.exerciseName}`);
      skipped++;
      continue;
    }

    const existing = await db.query(
      'SELECT id FROM exercise_muscle_group WHERE exercise_id = ?',
      [exerciseId]
    );
    if ((existing.values?.length ?? 0) > 0) {
      console.debug(`[MusclesClase22042026] Ya tiene músculos: ${assignment.exerciseName}`);
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
    } else {
      console.warn(`[MusclesClase22042026] Músculo primario no encontrado: "${primaryDbName}"`);
    }

    for (const secName of assignment.secondary) {
      const secDbName = toDbName(secName);
      const secId = muscleMap.get(secDbName);
      if (secId) {
        await db.run(
          'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
          [generateUUID(), exerciseId, secId]
        );
      } else {
        console.warn(`[MusclesClase22042026] Músculo secundario no encontrado: "${secDbName}"`);
      }
    }

    updated++;
    console.info(`[MusclesClase22042026] Músculos asignados: ${assignment.exerciseName}`);
  }

  await saveDatabase();
  markDone();
  return { updated, skipped };
}
