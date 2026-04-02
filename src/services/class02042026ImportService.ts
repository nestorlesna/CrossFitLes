// Servicio de importación de la Clase GOAT 02/04/2026
// Crea los ejercicios nuevos y la plantilla con sus 5 secciones:
// Calentamiento · Movilidad (2 rondas/30s) · Activación (3 rondas/1 min)
// · Fuerza (6 rondas, 5 reps) · WOD (EMOM 4 rondas)

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_02_04_2026_done';

export function isClass02042026ImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markImportDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

async function findExercise(db: SQLiteDBConnection, name: string): Promise<string | null> {
  const r = await db.query(`SELECT id FROM exercise WHERE name = ? AND is_active = 1`, [name]);
  return (r.values?.[0]?.id as string) ?? null;
}

interface ExerciseInput {
  name: string;
  description: string;
  technical_notes?: string;
  video_long_path?: string;
  image_url?: string;
  difficulty: string;
  primaryMuscle: string;
  is_compound: number;
  secondaryMuscles: string[];
  equipment: string[];
  tags: string[];
  sections: string[];
  units: string[];
}

// ─── Ejercicios a crear (si no existen) ──────────────────────────────────────

const EXERCISES: ExerciseInput[] = [
  {
    name: 'Wall Thoracic Extensions',
    image_url: '/img/exercises/wall-thoracic-extensions.svg',
    description:
      'De pie frente a una pared con los brazos extendidos y manos apoyadas. Caminar los pies hacia atrás e inclinar el torso hacia adelante, dejando que la columna torácica se extienda mientras los brazos permanecen contra la pared.',
    technical_notes:
      'El objetivo es la movilidad torácica, no lumbar. Mantener el core activo para que el movimiento ocurra en la zona media de la espalda. Los brazos pueden estar a distintas alturas para trabajar diferentes segmentos. Respirar profundo en cada extensión.',
    video_long_path: 'https://www.youtube.com/shorts/3kd40d5m1WE',
    difficulty: 'Básico',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: ['Dorsales'],
    equipment: [],
    tags: ['movilidad'],
    sections: ['Entrada en calor', 'Movilidad'],
    units: ['Segundos', 'Repeticiones'],
  },
  {
    name: 'Yoga Push-Up',
    image_url: '/img/exercises/yoga-push-up.svg',
    description:
      'Comenzar en posición downward dog (V invertida). Llevar el cuerpo hacia adelante en un arco, bajando el pecho entre las manos (chaturanga/push-up bajo) y luego extender los brazos para llegar a cobra o upward dog. Volver a downward dog.',
    technical_notes:
      'El movimiento combina tres posiciones de yoga en una secuencia fluida. En chaturanga los codos rozan el cuerpo. En upward dog las caderas y piernas se despegan del suelo. Mantener el core activo en todo momento. Es un excelente calentamiento de movilidad para toda la cadena anterior y posterior.',
    video_long_path: 'https://www.youtube.com/watch?v=-7TEPQKkTxI',
    difficulty: 'Básico',
    primaryMuscle: 'Pectorales',
    is_compound: 1,
    secondaryMuscles: ['Deltoides', 'Tríceps', 'Core/Abdominales', 'Dorsales'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Entrada en calor', 'Movilidad'],
    units: ['Repeticiones', 'Segundos'],
  },
  {
    name: 'Isometric Lunge',
    image_url: '/img/exercises/isometric-lunge.svg',
    description:
      'Con mancuernas en cada mano, posicionarse en lunge (una pierna adelante, otra atrás). Bajar hasta que la rodilla trasera quede a pocos centímetros del suelo y mantener esa posición el tiempo indicado. La pierna delantera a 90° en rodilla y cadera.',
    technical_notes:
      'Mantener el torso completamente erguido durante la isometría. La rodilla delantera no debe sobrepasar la punta del pie. El peso cae sobre el talón del pie delantero. Trabajar cada pierna por separado. El tiempo de mantenimiento construye fuerza e hipertrofia en glúteos y cuádriceps.',
    video_long_path: 'https://www.youtube.com/shorts/VsurwTOm7JI',
    difficulty: 'Intermedio',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: ['Mancuernas'],
    tags: ['isométrico', 'unilateral'],
    sections: ['Activación', 'Fuerza'],
    units: ['Segundos', 'Kilogramos'],
  },
  {
    name: 'Weighted Plank',
    image_url: '/img/exercises/weighted-plank.svg',
    description:
      'Plancha baja (apoyado en antebrazos y pies) con un disco o placa colocada sobre la parte alta de la espalda. Mantener el cuerpo completamente alineado — cabeza, hombros, cadera y talones en línea recta.',
    technical_notes:
      'La carga sobre la espalda incrementa la activación del core. No dejar caer la cadera ni elevarla. Los codos directamente bajo los hombros. Respiración constante y controlada. Progresar el peso gradualmente.',
    video_long_path: 'https://www.youtube.com/shorts/8tGo4goopno',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: ['Glúteos', 'Deltoides'],
    equipment: ['Disco'],
    tags: ['isométrico', 'core', 'bilateral'],
    sections: ['Activación', 'Fuerza'],
    units: ['Segundos', 'Kilogramos'],
  },
];

// ─── Ejercicios existentes que solo necesitamos encontrar ─────────────────────
// Barbell Deadlift, Wall Ball Shot, Hanging Toes to Bar, Assault Bike, Rowing

// ─── Función principal de importación ────────────────────────────────────────

export async function importClass02042026(): Promise<{ exercises: number; created: boolean }> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Verificar si la plantilla ya existe
  const existing = await db.query(
    `SELECT id FROM class_template WHERE name = 'Clase GOAT 02/04/2026' AND is_active = 1`
  );
  if ((existing.values?.length ?? 0) > 0) {
    markImportDone();
    return { exercises: 0, created: false };
  }

  // Cargar mapas de catálogos
  const [difficultyRows, muscleRows, equipRows, tagRows, sectionRows, unitRows, formatRows] =
    await Promise.all([
      db.query('SELECT id, name FROM difficulty_level WHERE is_active = 1'),
      db.query('SELECT id, name FROM muscle_group WHERE is_active = 1'),
      db.query('SELECT id, name FROM equipment WHERE is_active = 1'),
      db.query('SELECT id, name FROM tag WHERE is_active = 1'),
      db.query('SELECT id, name FROM section_type WHERE is_active = 1'),
      db.query('SELECT id, name FROM measurement_unit WHERE is_active = 1'),
      db.query('SELECT id, name FROM work_format WHERE is_active = 1'),
    ]);

  const difficultyMap = new Map((difficultyRows.values ?? []).map((r: any) => [r.name, r.id]));
  const muscleMap = new Map((muscleRows.values ?? []).map((r: any) => [r.name, r.id]));
  const equipmentMap = new Map((equipRows.values ?? []).map((r: any) => [r.name, r.id]));
  const tagMap = new Map((tagRows.values ?? []).map((r: any) => [r.name, r.id]));
  const sectionMap = new Map((sectionRows.values ?? []).map((r: any) => [r.name, r.id]));
  const unitMap = new Map((unitRows.values ?? []).map((r: any) => [r.name, r.id]));
  const formatMap = new Map((formatRows.values ?? []).map((r: any) => [r.name, r.id]));

  // Agregar 'Disco' si no está en el catálogo de equipamiento
  if (!equipmentMap.has('Disco')) {
    const discoId = generateUUID();
    await db.run(
      `INSERT OR IGNORE INTO equipment (id, name, category, sort_order, is_active, created_at, updated_at)
       VALUES (?, 'Disco', 'other', 16, 1, ?, ?)`,
      [discoId, timestamp, timestamp]
    );
    equipmentMap.set('Disco', discoId);
  }

  // Agregar tags nuevos si no existen
  for (const tagName of ['isométrico', 'core']) {
    if (!tagMap.has(tagName)) {
      const tagId = generateUUID();
      await db.run(
        `INSERT OR IGNORE INTO tag (id, name, color, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, '#64748b', 99, 1, ?, ?)`,
        [tagId, tagName, timestamp, timestamp]
      );
      tagMap.set(tagName, tagId);
    }
  }

  // ── Paso 1: Crear ejercicios (si no existen) ─────────────────────────────
  let exercisesCreated = 0;
  const exerciseIdMap = new Map<string, string>();

  for (const ex of EXERCISES) {
    let exId = await findExercise(db, ex.name);

    if (!exId) {
      exId = generateUUID();
      const diffId = difficultyMap.get(ex.difficulty) ?? null;
      const primaryMuscleId = muscleMap.get(ex.primaryMuscle) ?? null;

      await db.run(
        `INSERT INTO exercise
           (id, name, description, technical_notes, video_long_path, image_url,
            difficulty_level_id, primary_muscle_group_id, is_compound, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          exId, ex.name, ex.description, ex.technical_notes ?? null,
          ex.video_long_path ?? null, ex.image_url ?? null,
          diffId, primaryMuscleId, ex.is_compound, timestamp, timestamp,
        ]
      );

      // Músculo principal en la tabla de relación
      if (primaryMuscleId) {
        await db.run(
          'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 1)',
          [generateUUID(), exId, primaryMuscleId]
        );
      }

      for (const mName of ex.secondaryMuscles) {
        const mId = muscleMap.get(mName);
        if (mId) await db.run(
          'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
          [generateUUID(), exId, mId]
        );
      }
      for (const eName of ex.equipment) {
        const eId = equipmentMap.get(eName);
        if (eId) await db.run(
          'INSERT INTO exercise_equipment (id, exercise_id, equipment_id) VALUES (?, ?, ?)',
          [generateUUID(), exId, eId]
        );
      }
      for (const tName of ex.tags) {
        const tId = tagMap.get(tName);
        if (tId) await db.run(
          'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?, ?, ?)',
          [generateUUID(), exId, tId]
        );
      }
      for (const sName of ex.sections) {
        const sId = sectionMap.get(sName);
        if (sId) await db.run(
          'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?, ?, ?)',
          [generateUUID(), exId, sId]
        );
      }
      for (let i = 0; i < ex.units.length; i++) {
        const uId = unitMap.get(ex.units[i]);
        if (uId) await db.run(
          'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, ?)',
          [generateUUID(), exId, uId, i === 0 ? 1 : 0]
        );
      }

      exercisesCreated++;
    }

    exerciseIdMap.set(ex.name, exId);
  }

  // Buscar ejercicios existentes
  for (const name of ['90/90 Hip Rotation', 'Barbell Deadlift', 'Wall Ball Shot', 'Hanging Toes to Bar', 'Assault Bike', 'Rowing']) {
    const id = await findExercise(db, name);
    if (id) exerciseIdMap.set(name, id);
  }

  // ── Paso 2: Crear la plantilla ────────────────────────────────────────────
  const templateId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, name, date, objective, estimated_duration_minutes, is_favorite, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 60, 0, 1, ?, ?)`,
    [
      templateId,
      'Clase GOAT 02/04/2026',
      '2026-04-02',
      'Movilidad torácica y de cadera, activación isométrica de piernas, Deadlift por series de fuerza y WOD EMOM Wall Ball + Toes to Bar',
      timestamp, timestamp,
    ]
  );

  const warmupTypeId = sectionMap.get('Entrada en calor');
  const activTypeId  = sectionMap.get('Activación');
  const fuerzaTypeId = sectionMap.get('Fuerza');
  const wodTypeId    = sectionMap.get('WOD');
  const porRondasId  = formatMap.get('Por rondas');
  const emomId       = formatMap.get('EMOM');
  const trabLibreId  = formatMap.get('Trabajo libre');
  const kgId         = unitMap.get('Kilogramos');

  const exId = (name: string) => exerciseIdMap.get(name);

  // ── Sección 1: Calentamiento ─────────────────────────────────────────────
  const s1 = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, 'Calentamiento', '6 minutos de calentamiento general', 360, ?, ?)`,
    [s1, templateId, warmupTypeId, trabLibreId, timestamp, timestamp]
  );

  // ── Sección 2: Movilidad ─────────────────────────────────────────────────
  const s2 = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 2, 'Movilidad', '2 rondas, todo 30 segundos', 2, ?, ?)`,
    [s2, templateId, warmupTypeId, porRondasId, timestamp, timestamp]
  );
  const movilidadExs = [
    { name: 'Wall Thoracic Extensions', notes: null },
    { name: '90/90 Hip Rotation', notes: null },
    { name: 'Yoga Push-Up', notes: null },
  ];
  for (let i = 0; i < movilidadExs.length; i++) {
    const { name, notes } = movilidadExs[i];
    const id = exId(name);
    if (id) await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, planned_time_seconds, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 30, ?, ?, ?)`,
      [generateUUID(), s2, id, i + 1, notes, timestamp, timestamp]
    );
  }

  // ── Sección 3: Activación ─────────────────────────────────────────────────
  const s3 = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, total_rounds, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 3, 'Activación', '3 rondas — 1 minuto por ejercicio, descansás lo que queda del minuto', 3, 540, ?, ?)`,
    [s3, templateId, activTypeId, emomId, timestamp, timestamp]
  );
  const activExs = [
    { name: 'Isometric Lunge', reps: null, kg: 12.5, secs: 30, notes: 'Pie izquierdo adelante — 30 segundos' },
    { name: 'Isometric Lunge', reps: null, kg: 12.5, secs: 30, notes: 'Pie derecho adelante — 30 segundos' },
    { name: 'Weighted Plank', reps: null, kg: 10,   secs: 30, notes: '10 kg sobre la espalda — 30 segundos' },
  ];
  for (let i = 0; i < activExs.length; i++) {
    const { name, kg, secs, notes } = activExs[i];
    const id = exId(name);
    if (id) await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, planned_time_seconds,
          planned_weight_value, planned_weight_unit_id, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s3, id, i + 1, secs, kg, kgId, notes, timestamp, timestamp]
    );
  }

  // ── Sección 4: Fuerza — Barbell Deadlift ─────────────────────────────────
  const s4 = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 4, 'Fuerza', '6 rondas · 5 repeticiones · 80-100% del 1RM', 6, ?, ?)`,
    [s4, templateId, fuerzaTypeId, porRondasId, timestamp, timestamp]
  );
  const deadliftId = exId('Barbell Deadlift');
  if (deadliftId) await db.run(
    `INSERT INTO section_exercise
       (id, class_section_id, exercise_id, sort_order, planned_repetitions,
        coach_notes, created_at, updated_at)
     VALUES (?, ?, ?, 1, 5, '1ra 80 kg · 2da-5ta 90 kg · 6ta 100 kg', ?, ?)`,
    [generateUUID(), s4, deadliftId, timestamp, timestamp]
  );

  // ── Sección 5: WOD — EMOM 4 rondas ───────────────────────────────────────
  const s5 = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, total_rounds, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 5, 'WOD', 'EMOM — 4 rondas, todo cada 1 minuto', 4, 240, ?, ?)`,
    [s5, templateId, wodTypeId, emomId, timestamp, timestamp]
  );
  const wodExs = [
    { name: 'Wall Ball Shot', reps: 18, kg: 9,   notes: '9 kg' },
    { name: 'Hanging Toes to Bar', reps: 12, kg: null, notes: null },
    { name: 'Assault Bike', reps: null, kg: null, notes: 'Rondas 1 y 4 — 12 calorías' },
    { name: 'Rowing', reps: null, kg: null, notes: 'Rondas 2 y 3 — 12 calorías' },
  ];
  for (let i = 0; i < wodExs.length; i++) {
    const { name, reps, kg, notes } = wodExs[i];
    const id = exId(name);
    if (id) await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, planned_repetitions,
          planned_weight_value, planned_weight_unit_id, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s5, id, i + 1, reps ?? null, kg ?? null, kg ? kgId : null, notes, timestamp, timestamp]
    );
  }

  markImportDone();
  return { exercises: exercisesCreated, created: true };
}
