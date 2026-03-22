// Seed de Inicialización 3: plantillas del CrossFit Open 26.1, 26.2 y 26.3
// Operación ADITIVA — no borra nada. Asume que la Inicialización 2 ya corrió.
// Se puede ejecutar directamente desde la UI (no requiere recarga de página).

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

export const INIT3_DONE_FLAG = 'seed_v3_open26_done';

// ── Tipos internos ────────────────────────────────────────────────────────────

interface ExerciseDef {
  name: string;
  description: string;
  difficulty: string;          // nombre en español
  primaryMuscle: string | null; // nombre en español
  is_compound: number;
  equipment: string[];          // nombres en español
  sections: string[];           // nombres de section_type
}

interface SectionExDef {
  exerciseName: string;
  sort_order: number;
  planned_repetitions?: number;
  planned_weight_value?: number;
  planned_weight_unit?: string;   // 'Kilogramos' | 'Libras' | 'Metros'
  planned_distance_value?: number;
  planned_distance_unit?: string;
  planned_time_seconds?: number;
  coach_notes?: string;
  notes?: string;
  suggested_scaling?: string;
}

interface SectionDef {
  sort_order: number;
  section_type: string;           // nombre de section_type
  work_format: string;            // nombre de work_format
  visible_title: string;
  general_description?: string;
  notes?: string;
  time_cap_seconds?: number;
  total_rounds?: number;
  exercises: SectionExDef[];
}

interface TemplateDef {
  name: string;
  objective: string;
  general_notes: string;
  estimated_duration_minutes: number;
  sections: SectionDef[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Busca un ejercicio por nombre; devuelve su ID o null
async function findExercise(db: SQLiteDBConnection, name: string): Promise<string | null> {
  const norm = name.trim().toUpperCase();
  const r = await db.query('SELECT id FROM exercise WHERE UPPER(TRIM(name)) = ? AND is_active = 1', [norm]);
  return (r.values?.[0]?.id as string) ?? null;
}

// Busca un catálogo por nombre en cualquier tabla simple; devuelve el ID
async function findId(db: SQLiteDBConnection, table: string, name: string): Promise<string | null> {
  const r = await db.query(`SELECT id FROM ${table} WHERE name = ?`, [name]);
  return (r.values?.[0]?.id as string) ?? null;
}

// Crea un ejercicio si no existe y devuelve su ID
async function getOrCreateExercise(
  db: SQLiteDBConnection,
  def: ExerciseDef,
  maps: {
    diff: Map<string, string>;
    muscle: Map<string, string>;
    equip: Map<string, string>;
    section: Map<string, string>;
  }
): Promise<string> {
  const existing = await findExercise(db, def.name);
  if (existing) return existing;

  const id = generateUUID();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const diffId   = def.difficulty    ? maps.diff.get(def.difficulty)    ?? null : null;
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

  // Unidad por defecto: Repeticiones
  const repUnitId = await findId(db, 'measurement_unit', 'Repeticiones');
  if (repUnitId) await db.run(
    'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, 1)',
    [generateUUID(), id, repUnitId]
  );

  console.log(`[Seed3] Ejercicio creado: "${def.name}"`);
  return id;
}

// Inserta una plantilla completa con sus secciones y ejercicios
async function createTemplate(
  db: SQLiteDBConnection,
  def: TemplateDef,
  maps: {
    diff: Map<string, string>;
    muscle: Map<string, string>;
    equip: Map<string, string>;
    section: Map<string, string>;
    sectionType: Map<string, string>;
    workFormat: Map<string, string>;
    unit: Map<string, string>;
  }
): Promise<void> {
  // Verificar si ya existe una plantilla con ese nombre
  const existing = await db.query('SELECT id FROM class_template WHERE name = ?', [def.name]);
  if ((existing.values?.length ?? 0) > 0) {
    console.log(`[Seed3] Plantilla "${def.name}" ya existe, omitiendo.`);
    return;
  }

  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const templateId = generateUUID();

  await db.run(
    `INSERT INTO class_template (id, name, objective, general_notes, estimated_duration_minutes, is_favorite, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    [templateId, def.name, def.objective, def.general_notes, def.estimated_duration_minutes, ts, ts]
  );

  for (const sec of def.sections) {
    const sectionId = generateUUID();
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
        console.warn(`[Seed3] Ejercicio no encontrado: "${ex.exerciseName}" — se omite de la sección.`);
        continue;
      }

      const weightUnitId   = ex.planned_weight_unit   ? maps.unit.get(ex.planned_weight_unit)   ?? null : null;
      const distUnitId     = ex.planned_distance_unit ? maps.unit.get(ex.planned_distance_unit) ?? null : null;

      await db.run(
        `INSERT INTO section_exercise
           (id, class_section_id, exercise_id, sort_order,
            planned_repetitions, planned_weight_value, planned_weight_unit_id,
            planned_distance_value, planned_distance_unit_id,
            planned_time_seconds, coach_notes, notes, suggested_scaling,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), sectionId, exerciseId, ex.sort_order,
         ex.planned_repetitions ?? null,
         ex.planned_weight_value ?? null, weightUnitId,
         ex.planned_distance_value ?? null, distUnitId,
         ex.planned_time_seconds ?? null,
         ex.coach_notes ?? null, ex.notes ?? null, ex.suggested_scaling ?? null,
         ts, ts]
      );
    }
  }

  console.log(`[Seed3] Plantilla "${def.name}" creada.`);
}

// ── Ejercicios específicos del Open (a crear si no existen) ───────────────────

const OPEN_EXERCISES: ExerciseDef[] = [
  {
    name: 'Wall Ball Shot',
    description: 'Sentadilla completa con balón medicinal lanzándolo hacia una marca en la pared (target 3 m / 10 ft). Recibir el balón y repetir sin pausa.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Wall ball'],
    sections: ['WOD', 'Entrada en calor'],
  },
  {
    name: 'Box Jump-Over',
    description: 'Salto sobre el box (o alrededor) terminando completamente al otro lado. Se puede hacer con salto o step-over según Rx.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Box de salto'],
    sections: ['WOD', 'Entrada en calor'],
  },
  {
    name: 'Med-Ball Box Step-Over',
    description: 'Paso sobre el box cargando un balón medicinal. Variante de menor impacto respecto al box jump-over.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Box de salto', 'Balón medicinal'],
    sections: ['WOD'],
  },
  {
    name: 'Chest-to-Bar Pull-Up',
    description: 'Dominada estricta o con kipping donde el pecho toca la barra al llegar arriba. Mayor rango de movimiento que la dominada estándar.',
    difficulty: 'Avanzado', primaryMuscle: 'Dorsales', is_compound: 1,
    equipment: ['Pull-up bar'],
    sections: ['WOD', 'Habilidad'],
  },
  {
    name: 'Burpee Over the Bar',
    description: 'Burpee lateral sobre la barra olímpica en el suelo. Caer al lado, burpee, saltar sobre la barra al otro lado.',
    difficulty: 'Intermedio', primaryMuscle: 'Core/Abdominales', is_compound: 1,
    equipment: [],
    sections: ['WOD'],
  },
];

// ── Definiciones de los 3 templates ──────────────────────────────────────────

const TEMPLATE_26_1: TemplateDef = {
  name: 'CrossFit Open 26.1',
  objective: 'Chipper de wall balls y box jumps — resistencia muscular y capacidad aeróbica',
  general_notes: 'For Time — Time cap: 12 minutos\n' +
    '20-18-30-18-40-18-66-18-40-18-30-18-20\n' +
    '♀ 14 lb (6 kg) / 9 ft target | ♂ 20 lb (9 kg) / 10 ft target\n' +
    'Box height: ♀ 20" / ♂ 24"',
  estimated_duration_minutes: 20,
  sections: [
    {
      sort_order: 1,
      section_type: 'Entrada en calor',
      work_format: 'Por rondas',
      visible_title: 'Calentamiento',
      general_description: 'Activar piernas, core y movilidad de cadera',
      total_rounds: 2,
      exercises: [
        { exerciseName: 'Bodyweight Squat',        sort_order: 1, planned_repetitions: 15 },
        { exerciseName: 'Bodyweight Walking Lunge', sort_order: 2, planned_repetitions: 10, coach_notes: '5 por lado' },
        { exerciseName: 'Bodyweight Glute Bridge',  sort_order: 3, planned_repetitions: 10 },
        { exerciseName: 'Wall Ball Shot',           sort_order: 4, planned_repetitions: 10, coach_notes: 'Peso de trabajo, técnica de recepción' },
      ],
    },
    {
      sort_order: 2,
      section_type: 'WOD',
      work_format: 'For Time',
      visible_title: 'WOD — For Time (12 min cap)',
      general_description: 'Chipper: completar todos los movimientos en orden sin rondas',
      notes: '♀ Wall ball 6 kg (9 ft) | ♂ 9 kg (10 ft)\nBox height ♀ 20" / ♂ 24"',
      time_cap_seconds: 720,
      exercises: [
        { exerciseName: 'Wall Ball Shot',        sort_order: 1,  planned_repetitions: 20 },
        { exerciseName: 'Box Jump-Over',         sort_order: 2,  planned_repetitions: 18 },
        { exerciseName: 'Wall Ball Shot',        sort_order: 3,  planned_repetitions: 30 },
        { exerciseName: 'Box Jump-Over',         sort_order: 4,  planned_repetitions: 18 },
        { exerciseName: 'Wall Ball Shot',        sort_order: 5,  planned_repetitions: 40 },
        { exerciseName: 'Med-Ball Box Step-Over',sort_order: 6,  planned_repetitions: 18 },
        { exerciseName: 'Wall Ball Shot',        sort_order: 7,  planned_repetitions: 66 },
        { exerciseName: 'Med-Ball Box Step-Over',sort_order: 8,  planned_repetitions: 18 },
        { exerciseName: 'Wall Ball Shot',        sort_order: 9,  planned_repetitions: 40 },
        { exerciseName: 'Box Jump-Over',         sort_order: 10, planned_repetitions: 18 },
        { exerciseName: 'Wall Ball Shot',        sort_order: 11, planned_repetitions: 30 },
        { exerciseName: 'Box Jump-Over',         sort_order: 12, planned_repetitions: 18 },
        { exerciseName: 'Wall Ball Shot',        sort_order: 13, planned_repetitions: 20 },
      ],
    },
  ],
};

const TEMPLATE_26_2: TemplateDef = {
  name: 'CrossFit Open 26.2',
  objective: '3 rondas escalando habilidad de tracción: Pull-up → Chest-to-Bar → Ring Muscle-Up',
  general_notes: 'For Time — sin time cap especificado\n' +
    'Cada ronda: 80 ft (24 m) DB OH Lunge + 20 Alt DB Snatch + 20 pull-up variation\n' +
    '♂ 50 lb (22 kg) dumbbell | ♀ 35 lb (16 kg) dumbbell',
  estimated_duration_minutes: 25,
  sections: [
    {
      sort_order: 1,
      section_type: 'Entrada en calor',
      work_format: 'Por rondas',
      visible_title: 'Calentamiento',
      general_description: 'Activar hombros, espalda y movilidad de cadera',
      total_rounds: 2,
      exercises: [
        { exerciseName: 'Superband Shoulder Dislocates', sort_order: 1, planned_repetitions: 10, coach_notes: 'Agarre amplio, movimiento lento' },
        { exerciseName: 'Ring Row',                      sort_order: 2, planned_repetitions: 10, coach_notes: 'Cuerpo recto, retracción escapular' },
        { exerciseName: 'Bodyweight Walking Lunge',      sort_order: 3, planned_repetitions: 10, coach_notes: '5 por lado, overhead opcional' },
        { exerciseName: 'Bodyweight Hollow Body Hold',   sort_order: 4, planned_time_seconds: 20, coach_notes: 'Posición de base para gimnásticos' },
      ],
    },
    {
      sort_order: 2,
      section_type: 'WOD',
      work_format: 'Por rondas',
      visible_title: 'Ronda 1 — Pull-Ups',
      notes: '♂ 22 kg dumbbell | ♀ sugerido: 16 kg',
      total_rounds: 1,
      exercises: [
        {
          exerciseName: 'Double Dumbbell Overhead Walking Lunge',
          sort_order: 1,
          planned_distance_value: 24, planned_distance_unit: 'Metros',
          planned_weight_value: 22,   planned_weight_unit: 'Kilogramos',
          suggested_scaling: '16 kg (♀)',
          coach_notes: '80 ft = 24 m, mancuernas sobre la cabeza',
        },
        {
          exerciseName: 'Alternating Single Arm Dumbbell Power Snatch',
          sort_order: 2,
          planned_repetitions: 20,
          planned_weight_value: 22, planned_weight_unit: 'Kilogramos',
          suggested_scaling: '16 kg (♀)',
          coach_notes: '10 por lado, alternando',
        },
        {
          exerciseName: 'Bar Pull Up',
          sort_order: 3,
          planned_repetitions: 20,
          coach_notes: 'Kipping permitido',
        },
      ],
    },
    {
      sort_order: 3,
      section_type: 'WOD',
      work_format: 'Por rondas',
      visible_title: 'Ronda 2 — Chest-to-Bar Pull-Ups',
      notes: '♂ 22 kg dumbbell | ♀ sugerido: 16 kg',
      total_rounds: 1,
      exercises: [
        {
          exerciseName: 'Double Dumbbell Overhead Walking Lunge',
          sort_order: 1,
          planned_distance_value: 24, planned_distance_unit: 'Metros',
          planned_weight_value: 22,   planned_weight_unit: 'Kilogramos',
          suggested_scaling: '16 kg (♀)',
        },
        {
          exerciseName: 'Alternating Single Arm Dumbbell Power Snatch',
          sort_order: 2,
          planned_repetitions: 20,
          planned_weight_value: 22, planned_weight_unit: 'Kilogramos',
          suggested_scaling: '16 kg (♀)',
        },
        {
          exerciseName: 'Chest-to-Bar Pull-Up',
          sort_order: 3,
          planned_repetitions: 20,
          coach_notes: 'Pecho debe tocar la barra en la parte superior',
        },
      ],
    },
    {
      sort_order: 4,
      section_type: 'WOD',
      work_format: 'Por rondas',
      visible_title: 'Ronda 3 — Ring Muscle-Ups',
      notes: '♂ 22 kg dumbbell | ♀ sugerido: 16 kg',
      total_rounds: 1,
      exercises: [
        {
          exerciseName: 'Double Dumbbell Overhead Walking Lunge',
          sort_order: 1,
          planned_distance_value: 24, planned_distance_unit: 'Metros',
          planned_weight_value: 22,   planned_weight_unit: 'Kilogramos',
          suggested_scaling: '16 kg (♀)',
        },
        {
          exerciseName: 'Alternating Single Arm Dumbbell Power Snatch',
          sort_order: 2,
          planned_repetitions: 20,
          planned_weight_value: 22, planned_weight_unit: 'Kilogramos',
          suggested_scaling: '16 kg (♀)',
        },
        {
          exerciseName: 'Ring Strict Muscle Up',
          sort_order: 3,
          planned_repetitions: 20,
          coach_notes: 'Muscle-up estricto en anillas',
          suggested_scaling: 'C2B pull-up o ring row + ring dip',
        },
      ],
    },
  ],
};

const TEMPLATE_26_3: TemplateDef = {
  name: 'CrossFit Open 26.3',
  objective: 'Barbell cycling con peso escalado en 3 bloques — potencia y tolerancia al lactato',
  general_notes: 'For Time — Time cap: 16 minutos\n' +
    '6 rondas (2 rondas × 3 bloques de peso):\n' +
    '12 Burpees Over the Bar · 12 Cleans · 12 Burpees Over the Bar · 12 Thrusters\n\n' +
    '♂ Pesos: Bloque 1→ 43 kg | Bloque 2→ 52 kg | Bloque 3→ 61 kg\n' +
    '♀ Sugerido: Bloque 1→ 29 kg | Bloque 2→ 34 kg | Bloque 3→ 38 kg',
  estimated_duration_minutes: 25,
  sections: [
    {
      sort_order: 1,
      section_type: 'Entrada en calor',
      work_format: 'Por rondas',
      visible_title: 'Calentamiento',
      general_description: 'Activar cadena posterior, hombros y patrón del clean/thruster',
      total_rounds: 2,
      exercises: [
        { exerciseName: 'Bodyweight Squat',              sort_order: 1, planned_repetitions: 10, coach_notes: 'Profundidad completa' },
        { exerciseName: 'Bodyweight Glute Bridge',       sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Superband Shoulder Dislocates', sort_order: 3, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Burpee',             sort_order: 4, planned_repetitions: 5,  coach_notes: 'Ritmo moderado, activar cardio' },
      ],
    },
    {
      sort_order: 2,
      section_type: 'WOD',
      work_format: 'For Time',
      visible_title: 'WOD — For Time (16 min cap)',
      general_description: '6 rondas con pesos escalonados — cambiar disco cada 2 rondas',
      notes: '♂ Pesos por bloque (2 rondas c/u):\n' +
        '  Bloque 1 (R1-R2): 43 kg\n' +
        '  Bloque 2 (R3-R4): 52 kg\n' +
        '  Bloque 3 (R5-R6): 61 kg\n\n' +
        '♀ Sugerido: 29 / 34 / 38 kg',
      time_cap_seconds: 960,
      total_rounds: 6,
      exercises: [
        {
          exerciseName: 'Burpee Over the Bar',
          sort_order: 1,
          planned_repetitions: 12,
          coach_notes: 'Lateral sobre la barra, cuerpo paralelo a la barra',
        },
        {
          exerciseName: 'Barbell Power Clean',
          sort_order: 2,
          planned_repetitions: 12,
          planned_weight_value: 43, planned_weight_unit: 'Kilogramos',
          coach_notes: 'Peso inicial (bloque 1). Cambiar disco en R3 y R5',
          notes: 'Peso ♂: R1-R2: 43 kg → R3-R4: 52 kg → R5-R6: 61 kg',
          suggested_scaling: '♀ sugerido: 29 / 34 / 38 kg',
        },
        {
          exerciseName: 'Burpee Over the Bar',
          sort_order: 3,
          planned_repetitions: 12,
          coach_notes: 'Mismo lado o lateral, mantener ritmo constante',
        },
        {
          exerciseName: 'Barbell Thruster',
          sort_order: 4,
          planned_repetitions: 12,
          planned_weight_value: 43, planned_weight_unit: 'Kilogramos',
          coach_notes: 'Mismo peso que los cleans del bloque actual',
          notes: 'Peso ♂: R1-R2: 43 kg → R3-R4: 52 kg → R5-R6: 61 kg',
          suggested_scaling: '♀ sugerido: 29 / 34 / 38 kg',
        },
      ],
    },
  ],
};

// ── Punto de entrada principal ────────────────────────────────────────────────

/**
 * Agrega las 3 plantillas del CrossFit Open 26 a la base de datos.
 * Operación aditiva: no borra ni modifica datos existentes.
 * Crea automáticamente los ejercicios específicos del Open si no existen.
 */
export async function addOpenTemplates(db: SQLiteDBConnection): Promise<void> {
  console.log('[Seed3] Iniciando Inicialización 3 — Open 26.1, 26.2, 26.3...');

  // Verificar que los catálogos estén inicializados antes de continuar
  const sectionTypeCount = await db.query('SELECT COUNT(*) as count FROM section_type');
  const count = sectionTypeCount.values?.[0]?.count ?? 0;
  if (count === 0) {
    throw new Error('Los catálogos no están inicializados. Ejecutá "Inicializar Datos" primero.');
  }

  // Cargar mapas de IDs de los catálogos
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
    diff:        new Map((diffRows.values    ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    muscle:      new Map((muscleRows.values  ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    equip:       new Map((equipRows.values   ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    section:     new Map((sectionRows.values ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    sectionType: new Map((sectionTypeRows.values ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    workFormat:  new Map((workFmtRows.values ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    unit:        new Map((unitRows.values    ?? []).map((r: any) => [r.name, r.id] as [string, string])),
  };

  // 1. Crear ejercicios específicos del Open si no existen
  console.log('[Seed3] Verificando/creando ejercicios del Open...');
  for (const exDef of OPEN_EXERCISES) {
    await getOrCreateExercise(db, exDef, maps);
  }

  // 2. Crear las 3 plantillas
  console.log('[Seed3] Creando plantillas...');
  await createTemplate(db, TEMPLATE_26_1, maps);
  await createTemplate(db, TEMPLATE_26_2, maps);
  await createTemplate(db, TEMPLATE_26_3, maps);

  // Persistir al store de IndexedDB (jeep-sqlite web)
  const { saveDatabase } = await import('../db/database');
  await saveDatabase();
  console.log('[Seed3] Datos persistidos al store.');

  localStorage.setItem(INIT3_DONE_FLAG, 'true');
  console.log('[Seed3] Inicialización 3 completada.');
}
