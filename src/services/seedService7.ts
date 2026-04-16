// Clase GOAT 15/04/2026 — datos adicionales aditivos
// Operación aditiva, asume Inicializar Datos ya corrido.

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ExerciseDef {
  name: string;
  description: string;
  difficulty: string;
  primaryMuscle: string | null;
  is_compound: number;
  equipment: string[];
  sections: string[];
  video_path?: string | null;
  video_long_path?: string | null;
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

interface TemplateDef {
  name: string;
  objective: string;
  general_notes: string;
  estimated_duration_minutes: number;
  sections: SectionDef[];
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
  const diffId   = def.difficulty    ? maps.diff.get(def.difficulty)    ?? null : null;
  const muscleId = def.primaryMuscle ? maps.muscle.get(def.primaryMuscle) ?? null : null;

  await db.run(
    `INSERT INTO exercise (id, name, description, difficulty_level_id, primary_muscle_group_id,
      is_compound, video_path, video_long_path, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, def.name, def.description, diffId, muscleId,
     def.is_compound, def.video_path ?? null, def.video_long_path ?? null, ts, ts]
  );

  for (const eqName of def.equipment) {
    const eqId = maps.equip.get(eqName);
    if (eqId) await db.run(
      'INSERT OR IGNORE INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?, ?, ?, 1)',
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

  console.log(`[Seed7] Ejercicio creado: "${def.name}"`);
  return id;
}

async function createTemplate(
  db: SQLiteDBConnection,
  def: TemplateDef,
  maps: {
    diff: Map<string, string>; muscle: Map<string, string>; equip: Map<string, string>;
    section: Map<string, string>; sectionType: Map<string, string>;
    workFormat: Map<string, string>; unit: Map<string, string>;
  }
): Promise<void> {
  const existing = await db.query('SELECT id FROM class_template WHERE name = ?', [def.name]);
  if ((existing.values?.length ?? 0) > 0) {
    console.log(`[Seed7] "${def.name}" ya existe, omitiendo.`);
    return;
  }

  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const templateId = generateUUID();

  await db.run(
    `INSERT INTO class_template (id, name, objective, general_notes, estimated_duration_minutes,
      is_favorite, template_type, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 'generic', 1, ?, ?)`,
    [templateId, def.name, def.objective, def.general_notes, def.estimated_duration_minutes, ts, ts]
  );

  for (const sec of def.sections) {
    const sectionId = generateUUID();
    const secTypeId = maps.sectionType.get(sec.section_type) ?? null;
    const workFmtId = maps.workFormat.get(sec.work_format)   ?? null;

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
        console.warn(`[Seed7] Ejercicio no encontrado: "${ex.exerciseName}" — omitido.`);
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
  console.log(`[Seed7] Plantilla "${def.name}" creada.`);
}

// ── Ejercicios nuevos ──────────────────────────────────────────────────────────

const EXERCISES: ExerciseDef[] = [
  // ── Nuevos para GOAT 15/04/2026 ───────────────────────────────────────────

  {
    name: 'Spiderman Stretch Rotation',
    description: 'Desde posición de lunge, colocar una mano en el suelo junto al pie delantero. Girar el torso abriendo el brazo libre hacia el techo para trabajar la movilidad torácica y de cadera.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 0,
    equipment: [], sections: ['Entrada en calor'],
    video_path: 'https://www.youtube.com/watch?v=zzMZR0arjsc',
  },
  {
    name: 'Barbell Good Morning',
    description: 'Con barra sobre la espalda alta, bisagra de cadera llevando el torso al frente con la espalda plana. Regresa a la posición erguida. Activa isquiotibiales y erectores espinales.',
    difficulty: 'Básico', primaryMuscle: 'Isquiotibiales', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['Entrada en calor', 'Fuerza'],
    video_path: 'https://www.youtube.com/shorts/xxumNC5zFfM',
  },
  {
    name: 'Reverse Snow Angels',
    description: 'En posición prona (boca abajo), con brazos a los costados y piernas juntas. Barrer los brazos desde los costados hasta overhead y volver, como ángeles de nieve invertidos.',
    difficulty: 'Básico', primaryMuscle: 'Dorsales', is_compound: 0,
    equipment: [], sections: ['Entrada en calor'],
    video_path: 'https://www.youtube.com/shorts/MH3d544kvaM',
  },
  {
    name: 'Sally Up Sally Down',
    description: 'Sentadillas al ritmo de la canción "Flower" (Bring Sally Up, Bring Sally Down). "Sally Up" = subir a posición erguida. "Sally Down" = bajar al squat y mantener la posición.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: [], sections: ['Activación'],
    video_path: 'https://www.youtube.com/watch?v=Jv5NML-_IOg',
  },
  {
    name: 'Dumbbell Wall Sit',
    description: 'Espalda completamente apoyada contra la pared, rodillas a 90° y muslos paralelos al suelo. Sostener mancuernas sobre los muslos durante el tiempo indicado.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 0,
    equipment: ['Mancuernas'], sections: ['Fuerza'],
    video_path: 'https://www.youtube.com/shorts/qxIEsb45MGA',
  },
  {
    name: 'Barbell Bicep Curl',
    description: 'De pie, barra con agarre supinado a la anchura de los hombros. Flexionar los codos llevando la barra hasta los hombros manteniendo los codos fijos. Bajar controlado.',
    difficulty: 'Básico', primaryMuscle: 'Bíceps', is_compound: 0,
    equipment: ['Barra olímpica'], sections: ['Fuerza', 'Accesorio'],
    video_path: 'https://www.youtube.com/shorts/yRMQoSLOl6g',
    video_long_path: 'https://www.youtube.com/shorts/Rr4UZ-xYfzg',
  },
  {
    name: 'Single-Leg V-Up',
    description: 'Desde posición tumbada boca arriba con brazos overhead, elevar simultáneamente una pierna extendida y los brazos para tocar la punta del pie. Alternar con V-Up de ambas piernas.',
    difficulty: 'Intermedio', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: [], sections: ['Fuerza', 'Accesorio'],
    video_path: null,
  },
  {
    name: 'Jump Rope',
    description: 'Saltos de cuerda básicos (single-under). Un salto por cada vuelta de la cuerda. Mantener ritmo constante con muñecas girando la cuerda y saltos pequeños.',
    difficulty: 'Básico', primaryMuscle: 'Pantorrillas', is_compound: 1,
    equipment: ['Cuerda para saltar'], sections: ['Entrada en calor', 'WOD'],
    video_path: null,
  },
  {
    name: 'Partner Wall Ball Sit-Up',
    description: 'En parejas frente a frente (o espalda con espalda), hacer sit-ups pasando el balón medicinal al compañero en la cima del movimiento. El compañero lo recibe y baja.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 1,
    equipment: ['Wall ball'], sections: ['WOD'],
    video_path: 'https://www.youtube.com/shorts/_Jpx6xKMh5s',
    video_long_path: 'https://www.youtube.com/watch?v=XR2efvj-O5M',
  },

  // ── Estiramientos (creados con getOrCreate — también usados en GOAT 13/04) ──

  {
    name: 'Supine Spinal Twist',
    description: 'Tumbado boca arriba, doblar una rodilla y cruzarla sobre el cuerpo hacia el lado opuesto mientras los brazos se abren en "T". Mantener ambos hombros en el suelo.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Seated Forward Fold',
    description: 'Sentado con las piernas extendidas al frente, inclinar el torso hacia adelante alcanzando los pies o los tobillos. Mantener la espalda lo más recta posible.',
    difficulty: 'Básico', primaryMuscle: 'Isquiotibiales', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Seated Quad Stretch',
    description: 'Sentado en el suelo con una pierna extendida y la otra doblada hacia atrás. Reclinarse hacia atrás apoyándose en los brazos para estirar el cuádriceps de la pierna doblada.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Pigeon Pose',
    description: 'Desde posición de cuadrupedia, llevar una rodilla hacia adelante con la pierna en ángulo y extender la otra pierna hacia atrás. Apoyar el torso sobre la pierna delantera.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Supine Abdominal Stretch',
    description: 'Tumbado boca arriba, extender los brazos overhead y las piernas rectas, elongando toda la cadena anterior del cuerpo.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Cobra Pose',
    description: 'Tumbado boca abajo, apoyar las palmas junto al pecho y extender los brazos levantando el torso del suelo. Mantener las caderas en contacto con el suelo.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: "Child's Pose",
    description: 'Arrodillado, llevar las caderas hacia los talones y extender los brazos al frente apoyando la frente en el suelo. Estiramiento suave de espalda baja, hombros y caderas.',
    difficulty: 'Básico', primaryMuscle: 'Dorsales', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Half Kneeling Hip Flexor Stretch',
    description: 'De rodillas con una pierna adelante (90°), empujar las caderas hacia adelante sin arquear la espalda baja. Estira el flexor de cadera y el cuádriceps de la pierna trasera.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Standing Biceps Stretch',
    description: 'De pie, extender un brazo al frente con la palma hacia arriba y presionar suavemente los dedos hacia abajo con la otra mano. Estira bíceps y antebrazos.',
    difficulty: 'Básico', primaryMuscle: 'Bíceps', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Overhead Triceps Stretch',
    description: 'De pie, levantar un brazo overhead, doblar el codo llevando la mano hacia la espalda media y presionar suavemente el codo con la otra mano.',
    difficulty: 'Básico', primaryMuscle: 'Tríceps', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
  {
    name: 'Wrist Extensor Stretch',
    description: 'Extender un brazo al frente con la palma hacia abajo y doblar la muñeca hacia abajo con la otra mano. Estira los extensores del antebrazo y la muñeca.',
    difficulty: 'Básico', primaryMuscle: 'Antebrazos', is_compound: 0,
    equipment: [], sections: ['Vuelta a la calma'],
  },
];

// ── Template ───────────────────────────────────────────────────────────────────

const TEMPLATE: TemplateDef = {
  name: 'Clase GOAT 15/04/2026',
  objective: 'Movilidad de cadera y rotación torácica, Sally Challenge en activación, circuito de fuerza isométrica y WOD en parejas con salto de cuerda y snatch.',
  general_notes: 'Movilidad torácica y cadera · Activación con Sally Up/Down · Fuerza: circuito de 3 rondas por tiempo · WOD: 4 rondas de 3 min de trabajo + 1 min descanso en parejas (meta: 120 Sit-Ups totales)',
  estimated_duration_minutes: 60,
  sections: [
    // ── 1. Calentamiento ───────────────────────────────────────────────────
    {
      sort_order: 1,
      section_type: 'Entrada en calor',
      work_format: 'Trabajo libre',
      visible_title: 'Calentamiento',
      general_description: '6 minutos de calentamiento general',
      time_cap_seconds: 360,
      exercises: [],
    },

    // ── 2. Movilidad ───────────────────────────────────────────────────────
    {
      sort_order: 2,
      section_type: 'Entrada en calor',
      work_format: 'Por rondas',
      visible_title: 'Movilidad',
      general_description: '2 rondas todo 30 segundos',
      total_rounds: 2,
      exercises: [
        { exerciseName: 'Spiderman Stretch Rotation', sort_order: 1, planned_time_seconds: 30 },
        { exerciseName: 'Barbell Good Morning',       sort_order: 2, planned_time_seconds: 30 },
        { exerciseName: 'Reverse Snow Angels',        sort_order: 3, planned_time_seconds: 30 },
      ],
    },

    // ── 3. Activación – Sally Challenge ───────────────────────────────────
    {
      sort_order: 3,
      section_type: 'Activación',
      work_format: 'Trabajo libre',
      visible_title: 'Activación - Sally Challenge',
      general_description: 'Challenge Sally Up, Sally Down con la canción',
      notes: 'Sally Up = pararse | Sally Down = bajar al squat y mantener',
      exercises: [
        { exerciseName: 'Sally Up Sally Down', sort_order: 1 },
      ],
    },

    // ── 4. Fuerza – Circuito 3 rondas ─────────────────────────────────────
    {
      sort_order: 4,
      section_type: 'Fuerza',
      work_format: 'Por rondas',
      visible_title: 'Fuerza',
      general_description: '3 rondas',
      total_rounds: 3,
      notes: '40s Wall Sit · 20s descanso · 30s Hanging KTE · 30s descanso · 30s Curl · 30s descanso · 30s V-Ups · 30s descanso',
      exercises: [
        {
          exerciseName: 'Dumbbell Wall Sit',
          sort_order: 1,
          planned_time_seconds: 40,
          planned_weight_value: 12.5,
          planned_weight_unit: 'Kilogramos',
          coach_notes: '12.5 kg',
        },
        {
          exerciseName: 'Hanging Knees to Elbows',
          sort_order: 2,
          planned_time_seconds: 30,
        },
        {
          exerciseName: 'Barbell Bicep Curl',
          sort_order: 3,
          planned_time_seconds: 30,
          planned_weight_value: 20,
          planned_weight_unit: 'Kilogramos',
          coach_notes: '20 kg',
        },
        {
          exerciseName: 'Single-Leg V-Up',
          sort_order: 4,
          planned_time_seconds: 30,
          coach_notes: 'Alternar Single-Leg V-Ups con V-Ups completos',
        },
      ],
    },

    // ── 5. WOD – Intervalos en parejas ────────────────────────────────────
    {
      sort_order: 5,
      section_type: 'WOD',
      work_format: 'Intervalos',
      visible_title: 'WOD',
      general_description: '4 rondas: 3 min trabajo + 1 min descanso, en parejas',
      total_rounds: 4,
      time_cap_seconds: 960,
      notes: 'Meta: acumular 120 Sit-Ups (Partner Wall Ball) entre los dos · Uno trabaja el otro descansa en el Snatch',
      exercises: [
        {
          exerciseName: 'Jump Rope',
          sort_order: 1,
          planned_repetitions: 110,
          coach_notes: '110 saltos entre los 2',
        },
        {
          exerciseName: 'Alternating Single Arm Dumbbell Power Snatch',
          sort_order: 2,
          planned_repetitions: 20,
          coach_notes: '20 reps cada uno',
        },
        {
          exerciseName: 'Partner Wall Ball Sit-Up',
          sort_order: 3,
          coach_notes: 'Hasta terminar los 3 min · Meta total: 120 Sit-Ups',
        },
      ],
    },

    // ── 6. Estiramiento ────────────────────────────────────────────────────
    {
      sort_order: 6,
      section_type: 'Vuelta a la calma',
      work_format: 'Trabajo libre',
      visible_title: 'Estiramiento',
      general_description: 'Cada ejercicio 20-30 segundos',
      exercises: [
        { exerciseName: 'Supine Spinal Twist',            sort_order: 1,  planned_time_seconds: 25 },
        { exerciseName: 'Seated Forward Fold',            sort_order: 2,  planned_time_seconds: 25 },
        { exerciseName: 'Seated Quad Stretch',            sort_order: 3,  planned_time_seconds: 25 },
        { exerciseName: 'Pigeon Pose',                    sort_order: 4,  planned_time_seconds: 25 },
        { exerciseName: 'Supine Abdominal Stretch',       sort_order: 5,  planned_time_seconds: 25 },
        { exerciseName: 'Cobra Pose',                     sort_order: 6,  planned_time_seconds: 25 },
        { exerciseName: "Child's Pose",                   sort_order: 7,  planned_time_seconds: 25 },
        { exerciseName: 'Half Kneeling Hip Flexor Stretch', sort_order: 8, planned_time_seconds: 25 },
        { exerciseName: 'Standing Biceps Stretch',        sort_order: 9,  planned_time_seconds: 25 },
        { exerciseName: 'Overhead Triceps Stretch',       sort_order: 10, planned_time_seconds: 25 },
        { exerciseName: 'Wrist Extensor Stretch',         sort_order: 11, planned_time_seconds: 25 },
      ],
    },
  ],
};

// ── Flag de control (localStorage) ───────────────────────────────────────────

const IMPORT_FLAG = 'goat_class_15_04_2026_done';

export function isGoatClass15042026Done(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

// ── Punto de entrada ──────────────────────────────────────────────────────────

export async function importGoatClass15042026(): Promise<{ exercises: number; created: boolean }> {
  console.log('[Seed7] Iniciando Clase GOAT 15/04/2026...');

  const { openDatabase } = await import('../db/database');
  const db = await openDatabase();

  const check = await db.query('SELECT COUNT(*) as count FROM section_type');
  if ((check.values?.[0]?.count ?? 0) === 0) {
    throw new Error('Los catálogos no están inicializados. Ejecutá "Inicializar Datos" primero.');
  }

  // Verificar si la clase ya existe
  const existing = await db.query('SELECT id FROM class_template WHERE name = ?', [TEMPLATE.name]);
  if ((existing.values?.length ?? 0) > 0) {
    console.log('[Seed7] La clase ya existe en la BD.');
    markDone();
    return { exercises: 0, created: false };
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

  // Crear ejercicios nuevos
  console.log('[Seed7] Verificando ejercicios...');
  let exercisesCreated = 0;
  for (const def of EXERCISES) {
    const prev = await findExercise(db, def.name);
    if (!prev) exercisesCreated++;
    await getOrCreateExercise(db, def, maps);
  }

  // Actualizar video del Hanging Knees to Elbows si no tiene uno
  await db.run(
    `UPDATE exercise SET video_path = ? WHERE UPPER(TRIM(name)) = 'HANGING KNEES TO ELBOWS' AND (video_path IS NULL OR video_path = '')`,
    ['https://www.youtube.com/shorts/i27Xj9VgQik']
  );

  // Crear plantilla de la clase
  console.log('[Seed7] Creando plantilla...');
  await createTemplate(db, TEMPLATE, maps);

  const { saveDatabase } = await import('../db/database');
  await saveDatabase();

  markDone();
  console.log('[Seed7] Clase GOAT 15/04/2026 completada.');
  return { exercises: exercisesCreated, created: true };
}
