// Importa la Clase GOAT 22/04/2026 en la base de datos.
// Operación idempotente — se puede ejecutar varias veces sin duplicar datos.

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_goat_22_04_2026_done';

export function isClassGoat22042026ImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

// ── Tipos internos ─────────────────────────────────────────────────────────────

interface ExerciseDef {
  name: string;
  description: string;
  difficulty: string;
  primaryMuscle: string | null;
  is_compound: number;
  equipment: string[];
  sections: string[];
}

interface SectionExDef {
  exerciseName: string;
  sort_order: number;
  planned_repetitions?: number;
  planned_weight_value?: number;
  planned_weight_unit?: string;
  planned_distance_value?: number;
  planned_distance_unit?: string;
  planned_time_seconds?: number;
  planned_calories?: number;
  coach_notes?: string;
  notes?: string;
  suggested_scaling?: string;
}

interface SectionDef {
  sort_order: number;
  section_type: string;
  work_format: string;
  visible_title: string;
  general_description?: string;
  notes?: string;
  time_cap_seconds?: number;
  total_rounds?: number;
  exercises: SectionExDef[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function findExercise(db: SQLiteDBConnection, name: string): Promise<string | null> {
  const norm = name.trim().toUpperCase();
  const r = await db.query('SELECT id FROM exercise WHERE UPPER(TRIM(name)) = ? AND is_active = 1', [norm]);
  return (r.values?.[0]?.id as string) ?? null;
}

async function getOrCreateExercise(
  db: SQLiteDBConnection,
  def: ExerciseDef,
  maps: { diff: Map<string, string>; muscle: Map<string, string>; equip: Map<string, string>; section: Map<string, string> }
): Promise<string> {
  const existing = await findExercise(db, def.name);
  if (existing) return existing;

  const id = generateUUID();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const diffId   = def.difficulty    ? maps.diff.get(def.difficulty)      ?? null : null;
  const muscleId = def.primaryMuscle ? maps.muscle.get(def.primaryMuscle) ?? null : null;

  await db.run(
    `INSERT INTO exercise (id, name, description, difficulty_level_id, primary_muscle_group_id, is_compound, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, def.name, def.description, diffId, muscleId, def.is_compound, ts, ts]
  );
  for (const eqName of def.equipment) {
    const eqId = maps.equip.get(eqName);
    if (eqId) await db.run(
      'INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?, ?, ?, 1)',
      [generateUUID(), id, eqId]
    );
  }
  for (const secName of def.sections) {
    const secId = maps.section.get(secName);
    if (secId) await db.run(
      'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?, ?, ?)',
      [generateUUID(), id, secId]
    );
  }
  const repUnitId = await db.query('SELECT id FROM measurement_unit WHERE name = ?', ['Repeticiones'])
    .then(r => (r.values?.[0]?.id as string) ?? null);
  if (repUnitId) await db.run(
    'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, 1)',
    [generateUUID(), id, repUnitId]
  );
  console.log(`[GOAT 22/04] Ejercicio creado: "${def.name}"`);
  return id;
}

// ── Ejercicios nuevos ──────────────────────────────────────────────────────────

const NEW_EXERCISES: ExerciseDef[] = [
  // Movilidad
  {
    name: 'Band Pull-Apart',
    description: 'De pie con banda elástica a la altura del pecho, estirar la banda separando los brazos hacia los lados. Activa músculos de la escápula y deltoides posterior.',
    difficulty: 'Básico', primaryMuscle: 'Deltoides', is_compound: 0,
    equipment: ['Banda elástica'], sections: ['Entrada en calor', 'Accesorio'],
  },
  {
    name: 'Wall Shoulder External Rotation',
    description: 'De pie de lado a la pared, codo a 90° apoyado en la pared. Rotar el antebrazo hacia afuera alejándolo de la pared. Activa el manguito rotador.',
    difficulty: 'Básico', primaryMuscle: 'Deltoides', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Entrada en calor', 'Accesorio'],
  },
  {
    name: '90/90 Hip Internal Rotation Lift-Off',
    description: 'Sentado en posición 90/90 (ambas piernas a 90°). Elevar la espinilla trasera del suelo rotando internamente la cadera. Mejora la movilidad de rotación interna.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Entrada en calor', 'Accesorio'],
  },
  // Activación
  {
    name: 'Dumbbell Overhead Hold',
    description: 'De pie con dos mancuernas extendidas sobre la cabeza. Mantener la posición con el core activo, hombros estables y codos bloqueados.',
    difficulty: 'Básico', primaryMuscle: 'Deltoides', is_compound: 0,
    equipment: ['Mancuernas'], sections: ['Activación', 'Accesorio'],
  },
  {
    name: 'Plank Hold',
    description: 'Plancha alta o baja mantenida. Core completamente activo, caderas alineadas con el cuerpo. Ejercicio isométrico de estabilización.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Activación', 'Accesorio'],
  },
  {
    name: 'Dead Bug Hold with Dumbbell',
    description: 'Decúbito supino, brazos extendidos sosteniendo una mancuerna sobre el pecho, rodillas a 90°. Mantener la posición con la espalda baja pegada al suelo.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: ['Mancuernas'], sections: ['Activación', 'Accesorio'],
  },
  // WOD
  {
    name: 'Single-Arm Dumbbell Push Press',
    description: 'Press de mancuerna con un solo brazo usando impulso de piernas. Dip rápido con rodillas seguido de extensión completa del brazo sobre la cabeza.',
    difficulty: 'Básico', primaryMuscle: 'Deltoides', is_compound: 1,
    equipment: ['Mancuernas'], sections: ['WOD', 'Fuerza'],
  },
  // Estiramiento
  {
    name: 'Supine Spinal Twist',
    description: 'Acostado boca arriba, llevar una rodilla al pecho y cruzarla sobre el cuerpo hacia el lado opuesto mientras los brazos se abren. Estira la columna y glúteos.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Seated Forward Fold',
    description: 'Sentado en el suelo con piernas extendidas, doblar el torso hacia adelante alcanzando los pies. Estira isquiotibiales y zona lumbar.',
    difficulty: 'Básico', primaryMuscle: 'Isquiotibiales', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Seated Quad Stretch',
    description: 'Sentado en el suelo, llevar una pierna hacia atrás y reclinar el torso para estirar el cuádriceps de ese lado. Alternar lados.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Pigeon Pose',
    description: 'Una pierna adelante con la rodilla doblada y la cadera externa apoyada, la otra extendida atrás. Inclinarse hacia adelante para profundizar el estiramiento de glúteo y cadera.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Supine Abdominal Stretch',
    description: 'Acostado boca arriba con los brazos extendidos sobre la cabeza y las piernas estiradas, arqueando levemente la espalda. Estira el abdomen y la zona torácica.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Cobra Pose',
    description: 'Boca abajo, manos bajo los hombros, empujar el pecho hacia arriba extendiendo los brazos. Estira abdominales y columna vertebral.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: "Child's Pose",
    description: 'Arrodillado, llevar los glúteos hacia los talones y extender los brazos al frente apoyando la frente en el suelo. Estira espalda baja, caderas y hombros.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Half Kneeling Hip Flexor Stretch',
    description: 'Una rodilla apoyada en el suelo, la otra pierna adelante en ángulo de 90°. Empujar la cadera hacia adelante para estirar el flexor de cadera trasero.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Standing Biceps Stretch',
    description: 'De pie, brazos extendidos detrás del cuerpo con los pulgares apuntando hacia afuera y abajo. Estira bíceps, pecho anterior y hombros.',
    difficulty: 'Básico', primaryMuscle: 'Bíceps', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Overhead Triceps Stretch',
    description: 'De pie, llevar un brazo doblado detrás de la cabeza y empujar el codo hacia abajo con la mano opuesta. Estira el tríceps y la parte lateral del torso.',
    difficulty: 'Básico', primaryMuscle: 'Tríceps', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Wrist Extensor Stretch',
    description: 'Extender el brazo al frente con la palma hacia arriba, doblar la muñeca hacia abajo y tirar suavemente con la mano opuesta. Estira extensores del antebrazo.',
    difficulty: 'Básico', primaryMuscle: 'Antebrazos', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Vuelta a la calma'],
  },
];

// ── Secciones de la clase ──────────────────────────────────────────────────────

const CLASS_SECTIONS: SectionDef[] = [
  {
    sort_order: 1,
    section_type: 'Entrada en calor',
    work_format: 'Trabajo libre',
    visible_title: 'Calentamiento',
    notes: '6 minutos de calentamiento libre.',
    time_cap_seconds: 360,
    exercises: [],
  },
  {
    sort_order: 2,
    section_type: 'Entrada en calor',
    work_format: 'Por rondas',
    visible_title: 'Movilidad',
    notes: '2 rondas, todo 30 segundos.',
    total_rounds: 2,
    exercises: [
      { exerciseName: 'Band Pull-Apart',                      sort_order: 1, planned_time_seconds: 30 },
      { exerciseName: 'Wall Shoulder External Rotation',      sort_order: 2, planned_time_seconds: 30, coach_notes: 'Cada lado' },
      { exerciseName: '90/90 Hip Internal Rotation Lift-Off', sort_order: 3, planned_time_seconds: 30 },
    ],
  },
  {
    sort_order: 3,
    section_type: 'Activación',
    work_format: 'Por rondas',
    visible_title: 'Activación',
    notes: '3 rondas, todo 30 segundos.',
    total_rounds: 3,
    exercises: [
      { exerciseName: 'Dumbbell Overhead Hold',        sort_order: 1, planned_time_seconds: 30, planned_weight_value: 17.5, planned_weight_unit: 'Kilogramos' },
      { exerciseName: 'Plank Hold',                    sort_order: 2, planned_time_seconds: 30 },
      { exerciseName: 'Dead Bug Hold with Dumbbell',   sort_order: 3, planned_time_seconds: 30, planned_weight_value: 17.5, planned_weight_unit: 'Kilogramos' },
      { exerciseName: "Farmer's Carry",                sort_order: 4, planned_time_seconds: 30, planned_weight_value: 17.5, planned_weight_unit: 'Kilogramos' },
    ],
  },
  {
    sort_order: 4,
    section_type: 'Fuerza',
    work_format: 'Series fijas',
    visible_title: 'Fuerza — Barbell Power Snatch',
    notes:
      'Serie 1: 7 reps × 30 kg\n' +
      'Serie 2: 5 reps × 35 kg\n' +
      'Serie 3: 3 reps × 40 kg\n' +
      'Serie 4: 7 reps × 35 kg\n' +
      'Serie 5: 5 reps × 40 kg\n' +
      'Serie 6: 3 reps × 45 kg',
    total_rounds: 6,
    exercises: [
      { exerciseName: 'Barbell Power Snatch', sort_order: 1, planned_repetitions: 7,  planned_weight_value: 30, planned_weight_unit: 'Kilogramos', coach_notes: 'Serie 1: 7 reps × 30 kg' },
      { exerciseName: 'Barbell Power Snatch', sort_order: 2, planned_repetitions: 5,  planned_weight_value: 35, planned_weight_unit: 'Kilogramos', coach_notes: 'Serie 2: 5 reps × 35 kg' },
      { exerciseName: 'Barbell Power Snatch', sort_order: 3, planned_repetitions: 3,  planned_weight_value: 40, planned_weight_unit: 'Kilogramos', coach_notes: 'Serie 3: 3 reps × 40 kg' },
      { exerciseName: 'Barbell Power Snatch', sort_order: 4, planned_repetitions: 7,  planned_weight_value: 35, planned_weight_unit: 'Kilogramos', coach_notes: 'Serie 4: 7 reps × 35 kg' },
      { exerciseName: 'Barbell Power Snatch', sort_order: 5, planned_repetitions: 5,  planned_weight_value: 40, planned_weight_unit: 'Kilogramos', coach_notes: 'Serie 5: 5 reps × 40 kg' },
      { exerciseName: 'Barbell Power Snatch', sort_order: 6, planned_repetitions: 3,  planned_weight_value: 45, planned_weight_unit: 'Kilogramos', coach_notes: 'Serie 6: 3 reps × 45 kg' },
    ],
  },
  {
    sort_order: 5,
    section_type: 'WOD',
    work_format: 'For Time',
    visible_title: 'WOD — Chipper en parejas',
    notes:
      'Máximo 10 minutos. Trabajo en parejas.\n' +
      'El palindrome de reps: 20 Snatches → 30 BJO → 200m → 20 PP → 90s descanso → 20 PushPress → 200m → 30 BJO → 20 Snatches',
    time_cap_seconds: 600,
    exercises: [
      { exerciseName: 'Alternating Single Arm Dumbbell Power Snatch', sort_order: 1, planned_repetitions: 20, planned_weight_value: 15, planned_weight_unit: 'Kilogramos', coach_notes: '20 reps cada uno' },
      { exerciseName: 'Box Jump-Over',                               sort_order: 2, planned_repetitions: 30, coach_notes: '15 cada uno' },
      { exerciseName: 'Running',                                     sort_order: 3, planned_distance_value: 200, planned_distance_unit: 'Metros' },
      { exerciseName: 'Barbell Push Press',                          sort_order: 4, planned_repetitions: 20, planned_weight_value: 30, planned_weight_unit: 'Kilogramos' },
      { exerciseName: 'Single-Arm Dumbbell Push Press',              sort_order: 5, planned_repetitions: 20, planned_weight_value: 15, planned_weight_unit: 'Kilogramos', coach_notes: '90 segundos de descanso antes de este ejercicio' },
      { exerciseName: 'Running',                                     sort_order: 6, planned_distance_value: 200, planned_distance_unit: 'Metros' },
      { exerciseName: 'Box Jump-Over',                               sort_order: 7, planned_repetitions: 30, coach_notes: '15 cada uno' },
      { exerciseName: 'Alternating Single Arm Dumbbell Power Snatch', sort_order: 8, planned_repetitions: 20, planned_weight_value: 15, planned_weight_unit: 'Kilogramos', coach_notes: '20 reps cada uno' },
    ],
  },
  {
    sort_order: 6,
    section_type: 'Vuelta a la calma',
    work_format: 'Trabajo libre',
    visible_title: 'Estiramiento',
    notes: 'Cada ejercicio 20-30 segundos.',
    exercises: [
      { exerciseName: 'Supine Spinal Twist',             sort_order: 1,  planned_time_seconds: 30 },
      { exerciseName: 'Seated Forward Fold',             sort_order: 2,  planned_time_seconds: 30 },
      { exerciseName: 'Seated Quad Stretch',             sort_order: 3,  planned_time_seconds: 30 },
      { exerciseName: 'Pigeon Pose',                     sort_order: 4,  planned_time_seconds: 30 },
      { exerciseName: 'Supine Abdominal Stretch',        sort_order: 5,  planned_time_seconds: 30 },
      { exerciseName: 'Cobra Pose',                      sort_order: 6,  planned_time_seconds: 30 },
      { exerciseName: "Child's Pose",                    sort_order: 7,  planned_time_seconds: 30 },
      { exerciseName: 'Half Kneeling Hip Flexor Stretch', sort_order: 8, planned_time_seconds: 30 },
      { exerciseName: 'Standing Biceps Stretch',         sort_order: 9,  planned_time_seconds: 30 },
      { exerciseName: 'Overhead Triceps Stretch',        sort_order: 10, planned_time_seconds: 30 },
      { exerciseName: 'Wrist Extensor Stretch',          sort_order: 11, planned_time_seconds: 30 },
    ],
  },
];

// ── Lógica principal ───────────────────────────────────────────────────────────

async function importClass(db: SQLiteDBConnection): Promise<void> {
  const CLASS_NAME = 'Clase GOAT 22/04/2026';

  const existing = await db.query('SELECT id FROM class_template WHERE name = ?', [CLASS_NAME]);
  if ((existing.values?.length ?? 0) > 0) {
    console.log(`[GOAT 22/04] Plantilla "${CLASS_NAME}" ya existe, omitiendo.`);
    return;
  }

  const check = await db.query('SELECT COUNT(*) as count FROM section_type');
  if ((check.values?.[0]?.count ?? 0) === 0) {
    throw new Error('Los catálogos no están inicializados. Ejecutá "Inicializar Datos" primero.');
  }

  const [diffRows, muscleRows, equipRows, sectionRows, sectionTypeRows, workFmtRows, unitRows] =
    await Promise.all([
      db.query('SELECT id, name FROM difficulty_level'),
      db.query('SELECT id, name FROM muscle_group'),
      db.query('SELECT id, name FROM equipment'),
      db.query('SELECT id, name FROM section_type'),
      db.query('SELECT id, name FROM section_type'),
      db.query('SELECT id, name FROM work_format'),
      db.query('SELECT id, name FROM measurement_unit'),
    ]);

  const maps = {
    diff:        new Map((diffRows.values        ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    muscle:      new Map((muscleRows.values       ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    equip:       new Map((equipRows.values        ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    section:     new Map((sectionRows.values      ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    sectionType: new Map((sectionTypeRows.values  ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    workFormat:  new Map((workFmtRows.values      ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    unit:        new Map((unitRows.values         ?? []).map((r: any) => [r.name, r.id] as [string, string])),
  };

  console.log('[GOAT 22/04] Verificando ejercicios...');
  for (const def of NEW_EXERCISES) {
    await getOrCreateExercise(db, def, maps);
  }

  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const templateId = generateUUID();

  await db.run(
    `INSERT INTO class_template (id, date, name, objective, general_notes, estimated_duration_minutes, is_favorite, template_type, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 'my_classes', 1, ?, ?)`,
    [
      templateId,
      '2026-04-22',
      CLASS_NAME,
      'Movilidad de hombro y cadera + Snatch escalado + Chipper palindrome en parejas',
      'Movilidad: Band Pull-Apart, Wall Shoulder External Rotation, 90/90 Hip Internal Rotation\nActivación: Dumbbell OH Hold, Plank Hold, Dead Bug + DB, Farmer\'s Carry\nFuerza: 6 series escaladas de Barbell Power Snatch (7-5-3 / 7-5-3)\nWOD: Chipper palindrome máx 10 min en parejas',
      60,
      ts, ts,
    ]
  );

  for (const sec of CLASS_SECTIONS) {
    const sectionId   = generateUUID();
    const secTypeId   = maps.sectionType.get(sec.section_type) ?? null;
    const workFmtId   = maps.workFormat.get(sec.work_format)   ?? null;

    await db.run(
      `INSERT INTO class_section
         (id, class_template_id, section_type_id, work_format_id, sort_order,
          visible_title, general_description, time_cap_seconds, total_rounds, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sectionId, templateId, secTypeId, workFmtId, sec.sort_order,
       sec.visible_title, sec.general_description ?? null,
       sec.time_cap_seconds ?? null, sec.total_rounds ?? null,
       sec.notes ?? null, ts, ts]
    );

    for (const ex of sec.exercises) {
      const exerciseId = await findExercise(db, ex.exerciseName);
      if (!exerciseId) {
        console.warn(`[GOAT 22/04] Ejercicio no encontrado: "${ex.exerciseName}" — omitido.`);
        continue;
      }
      const weightUnitId = ex.planned_weight_unit   ? maps.unit.get(ex.planned_weight_unit)   ?? null : null;
      const distUnitId   = ex.planned_distance_unit ? maps.unit.get(ex.planned_distance_unit) ?? null : null;

      await db.run(
        `INSERT INTO section_exercise
           (id, class_section_id, exercise_id, sort_order,
            planned_repetitions, planned_weight_value, planned_weight_unit_id,
            planned_distance_value, planned_distance_unit_id,
            planned_time_seconds, planned_calories,
            coach_notes, notes, suggested_scaling,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), sectionId, exerciseId, ex.sort_order,
         ex.planned_repetitions ?? null,
         ex.planned_weight_value ?? null, weightUnitId,
         ex.planned_distance_value ?? null, distUnitId,
         ex.planned_time_seconds ?? null,
         ex.planned_calories ?? null,
         ex.coach_notes ?? null, ex.notes ?? null, ex.suggested_scaling ?? null,
         ts, ts]
      );
    }
  }

  console.log(`[GOAT 22/04] Plantilla "${CLASS_NAME}" creada.`);
}

/**
 * Importa la Clase GOAT 22/04/2026 con todos sus ejercicios y secciones.
 * Idempotente: usa flag en localStorage y verifica nombre de plantilla en BD.
 */
export async function importClassGoat22042026(): Promise<void> {
  const { openDatabase, saveDatabase } = await import('../db/database');
  const db = await openDatabase();
  await importClass(db);
  await saveDatabase();
  localStorage.setItem(IMPORT_FLAG, 'true');
  console.log('[GOAT 22/04] Importación completada.');
}
