// Importa la Clase GOAT 25/04/2026 en la base de datos.
// Operación idempotente — se puede ejecutar varias veces sin duplicar datos.

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_goat_25_04_2026_done';

export function isClassGoat25042026ImportDone(): boolean {
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
  image_url?: string;
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
    `INSERT INTO exercise (id, name, description, difficulty_level_id, primary_muscle_group_id,
      is_compound, image_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, def.name, def.description, diffId, muscleId, def.is_compound,
     def.image_url ?? null, ts, ts]
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
  console.log(`[GOAT 25/04] Ejercicio creado: "${def.name}"`);
  return id;
}

// ── Ejercicios nuevos ──────────────────────────────────────────────────────────

const NEW_EXERCISES: ExerciseDef[] = [
  // Movilidad
  {
    name: 'Wall Lat Stretch',
    description: 'De pie junto a una pared con un brazo extendido apoyado. Inclinar el cuerpo lateralmente alejándose de la pared para estirar el músculo dorsal ancho.',
    difficulty: 'Básico', primaryMuscle: 'Dorsales', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Entrada en calor', 'Accesorio'],
    image_url: '/img/exercises/wall-lat-stretch.svg',
  },
  {
    name: 'Wall Shoulder CAR',
    description: 'De pie junto a una pared, codo apoyado a 90°. Realizar una rotación articular controlada del hombro alejando el antebrazo de la pared. Mejora el rango de movimiento del hombro.',
    difficulty: 'Básico', primaryMuscle: 'Deltoides', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Entrada en calor', 'Accesorio'],
    image_url: '/img/exercises/wall-shoulder-car.svg',
  },
  {
    name: 'Goblet Squat Hold Press',
    description: 'Sosteniendo una kettlebell o mancuerna al pecho, bajar a la posición de squat goblet y en el fondo extender los brazos al frente (press-out). Mejora la movilidad de cadera y tobillo.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Kettlebell'], sections: ['Entrada en calor', 'Activación'],
    image_url: '/img/exercises/goblet-squat-hold-press.svg',
  },
  // Activación
  {
    name: 'Core Overhead Hold with Side Bend',
    description: 'De pie, sostener una mancuerna con un brazo extendido sobre la cabeza. Realizar una flexión lateral del torso manteniendo el brazo overhead. Trabaja la estabilidad del core y el hombro.',
    difficulty: 'Intermedio', primaryMuscle: 'Core/Abdominales', is_compound: 1,
    equipment: ['Mancuernas'], sections: ['Activación', 'Fuerza'],
    image_url: '/img/exercises/core-overhead-hold-side-bend.svg',
  },
  {
    name: 'Wall Sit with Leg Extension',
    description: 'En posición de wall sit (espalda apoyada en pared, rodillas a 90°), extender una pierna horizontalmente sin perder la posición. Trabaja la resistencia del cuádriceps.',
    difficulty: 'Intermedio', primaryMuscle: 'Cuádriceps', is_compound: 0,
    equipment: ['Sin equipamiento'], sections: ['Activación', 'Fuerza'],
    image_url: '/img/exercises/wall-sit-with-leg-extension.svg',
  },
  // WOD
  {
    name: 'Dual Dumbbell Snatch with Burpee',
    description: 'Desde el suelo, realizar un burpee con mancuernas en las manos. Al incorporarse, ejecutar un snatch doble (ambas mancuernas simultáneamente) hasta overhead. Movimiento explosivo total.',
    difficulty: 'Avanzado', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Mancuernas'], sections: ['WOD', 'Fuerza'],
    image_url: '/img/exercises/dual-dumbbell-snatch-with-burpee.svg',
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
      { exerciseName: 'Wall Lat Stretch',      sort_order: 1, planned_time_seconds: 30 },
      { exerciseName: 'Wall Shoulder CAR',     sort_order: 2, planned_time_seconds: 30, coach_notes: 'Brazo izquierdo en ronda 1, derecho en ronda 2' },
      { exerciseName: 'Goblet Squat Hold Press', sort_order: 3, planned_time_seconds: 30, planned_weight_value: 5, planned_weight_unit: 'Kilogramos' },
    ],
  },
  {
    sort_order: 3,
    section_type: 'Activación',
    work_format: 'Trabajo libre',
    visible_title: 'Activación',
    exercises: [
      { exerciseName: 'Core Overhead Hold with Side Bend', sort_order: 1, planned_weight_value: 15, planned_weight_unit: 'Kilogramos', coach_notes: 'Brazo derecho' },
      { exerciseName: 'Core Overhead Hold with Side Bend', sort_order: 2, planned_weight_value: 15, planned_weight_unit: 'Kilogramos', coach_notes: 'Brazo izquierdo' },
      { exerciseName: 'Wall Sit with Leg Extension',       sort_order: 3 },
    ],
  },
  {
    sort_order: 4,
    section_type: 'Fuerza',
    work_format: 'E2MOM',
    visible_title: 'Fuerza — Overhead Squat',
    notes: '4 rondas de 2 minutos. Rondas 1-2: 40 kg × 4 reps. Rondas 3-4: 50 kg × 4 reps.',
    total_rounds: 4,
    exercises: [
      { exerciseName: 'Barbell Overhead Squat', sort_order: 1, planned_repetitions: 4, planned_weight_value: 40, planned_weight_unit: 'Kilogramos', coach_notes: 'Rondas 1-2: 40 kg | Rondas 3-4: 50 kg' },
    ],
  },
  {
    sort_order: 5,
    section_type: 'WOD',
    work_format: 'Intervalos',
    visible_title: 'WOD — Intervalos A/B',
    notes: '4 rondas de 2 minutos. Cada ronda: A) 10 cal Rowing + 15 Wall Ball Shot, B) 8 Pull-Up + 8 Dual DB Snatch with Burpee.',
    time_cap_seconds: 480,
    total_rounds: 4,
    exercises: [
      { exerciseName: 'Rowing',                        sort_order: 1, planned_calories: 10, coach_notes: 'Serie A' },
      { exerciseName: 'Wall Ball Shot',                sort_order: 2, planned_repetitions: 15, coach_notes: 'Serie A' },
      { exerciseName: 'Pull-Up',                       sort_order: 3, planned_repetitions: 8, coach_notes: 'Serie B' },
      { exerciseName: 'Dual Dumbbell Snatch with Burpee', sort_order: 4, planned_repetitions: 8, coach_notes: 'Serie B' },
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
  const CLASS_NAME = 'Clase GOAT 25/04/2026';

  const existing = await db.query('SELECT id FROM class_template WHERE name = ?', [CLASS_NAME]);
  if ((existing.values?.length ?? 0) > 0) {
    console.log(`[GOAT 25/04] Plantilla "${CLASS_NAME}" ya existe, omitiendo.`);
    return;
  }

  const check = await db.query('SELECT COUNT(*) as count FROM section_type');
  if ((check.values?.[0]?.count ?? 0) === 0) {
    throw new Error('Los catálogos no están inicializados. Ejecutá "Inicializar Datos" primero.');
  }

  const [diffRows, muscleRows, equipRows, sectionRows, workFmtRows, unitRows] =
    await Promise.all([
      db.query('SELECT id, name FROM difficulty_level'),
      db.query('SELECT id, name FROM muscle_group'),
      db.query('SELECT id, name FROM equipment'),
      db.query('SELECT id, name FROM section_type'),
      db.query('SELECT id, name FROM work_format'),
      db.query('SELECT id, name FROM measurement_unit'),
    ]);

  const maps = {
    diff:        new Map((diffRows.values    ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    muscle:      new Map((muscleRows.values  ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    equip:       new Map((equipRows.values   ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    section:     new Map((sectionRows.values ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    workFormat:  new Map((workFmtRows.values ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    unit:        new Map((unitRows.values    ?? []).map((r: any) => [r.name, r.id] as [string, string])),
  };

  console.log('[GOAT 25/04] Verificando ejercicios...');
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
      '2026-04-25',
      CLASS_NAME,
      'Movilidad de hombro y core + estabilidad overhead + WOD mixto con remo y snatch doble',
      'Movilidad: Wall Lat Stretch, Wall Shoulder CAR, Goblet Squat Hold Press\n' +
      'Activación: Core Overhead Hold with Side Bend, Wall Sit with Leg Extension\n' +
      'Fuerza: Barbell Overhead Squat E2MOM (40/50 kg × 4 reps)\n' +
      'WOD: 4 rondas de 2 min, Intervalos A/B (Rowing+WallBall / Pull-Up+DualDBSnatch)',
      60,
      ts, ts,
    ]
  );

  for (const sec of CLASS_SECTIONS) {
    const sectionId  = generateUUID();
    const secTypeId  = maps.section.get(sec.section_type)    ?? null;
    const workFmtId  = maps.workFormat.get(sec.work_format)  ?? null;

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
        console.warn(`[GOAT 25/04] Ejercicio no encontrado: "${ex.exerciseName}" — omitido.`);
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
            coach_notes, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), sectionId, exerciseId, ex.sort_order,
         ex.planned_repetitions ?? null,
         ex.planned_weight_value ?? null, weightUnitId,
         ex.planned_distance_value ?? null, distUnitId,
         ex.planned_time_seconds ?? null,
         ex.planned_calories ?? null,
         ex.coach_notes ?? null, ex.notes ?? null,
         ts, ts]
      );
    }
  }

  console.log(`[GOAT 25/04] Plantilla "${CLASS_NAME}" creada.`);
}

export async function importClassGoat25042026(): Promise<void> {
  const { openDatabase, saveDatabase } = await import('../db/database');
  const db = await openDatabase();
  await importClass(db);
  await saveDatabase();
  localStorage.setItem(IMPORT_FLAG, 'true');
  console.log('[GOAT 25/04] Importación completada.');
}
