// Benchmarks históricos de CrossFit: Chicas (Girls) y Héroes (Heroes)
// Operación ADITIVA — no borra nada. Asume que Inicializar Datos ya corrió.

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

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
  const r = await db.query('SELECT id FROM exercise WHERE name = ? AND is_active = 1', [name]);
  return (r.values?.[0]?.id as string) ?? null;
}

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

  const repUnitId = await db.query('SELECT id FROM measurement_unit WHERE name = ?', ['Repeticiones'])
    .then(r => (r.values?.[0]?.id as string) ?? null);
  if (repUnitId) await db.run(
    'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, 1)',
    [generateUUID(), id, repUnitId]
  );

  console.log(`[Seed4] Ejercicio creado: "${def.name}"`);
  return id;
}

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
  const existing = await db.query('SELECT id FROM class_template WHERE name = ?', [def.name]);
  if ((existing.values?.length ?? 0) > 0) {
    console.log(`[Seed4] Plantilla "${def.name}" ya existe, omitiendo.`);
    return;
  }

  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const templateId = generateUUID();

  await db.run(
    `INSERT INTO class_template (id, name, objective, general_notes, estimated_duration_minutes, is_favorite, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?)`,
    [templateId, def.name, def.objective, def.general_notes, def.estimated_duration_minutes, ts, ts]
  );

  for (const sec of def.sections) {
    const sectionId  = generateUUID();
    const secTypeId  = maps.sectionType.get(sec.section_type) ?? null;
    const workFmtId  = maps.workFormat.get(sec.work_format)   ?? null;

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
        console.warn(`[Seed4] Ejercicio no encontrado: "${ex.exerciseName}" — se omite.`);
        continue;
      }
      const weightUnitId = ex.planned_weight_unit   ? maps.unit.get(ex.planned_weight_unit)   ?? null : null;
      const distUnitId   = ex.planned_distance_unit ? maps.unit.get(ex.planned_distance_unit) ?? null : null;

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

  console.log(`[Seed4] Plantilla "${def.name}" creada.`);
}

// ── Calentamiento genérico reutilizable ───────────────────────────────────────

function warmup(exercises: SectionExDef[]): SectionDef {
  return {
    sort_order: 1,
    section_type: 'Entrada en calor',
    work_format: 'Por rondas',
    visible_title: 'Calentamiento',
    total_rounds: 2,
    exercises,
  };
}

// ── Ejercicios nuevos a crear si no existen ───────────────────────────────────

const BENCHMARK_EXERCISES: ExerciseDef[] = [
  {
    name: 'Running',
    description: 'Carrera a pie a ritmo aeróbico o de WOD. Distancia variable según el workout.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: [], sections: ['WOD', 'Entrada en calor'],
  },
  {
    name: 'Rowing',
    description: 'Remo en máquina ergómetro. Activa espalda, piernas y core.',
    difficulty: 'Básico', primaryMuscle: 'Dorsales', is_compound: 1,
    equipment: ['Rower'], sections: ['WOD', 'Entrada en calor'],
  },
  {
    name: 'Bodyweight Push Up',
    description: 'Flexión de brazos con el cuerpo recto. Activa pectorales, tríceps y deltoides.',
    difficulty: 'Básico', primaryMuscle: 'Pectorales', is_compound: 1,
    equipment: [], sections: ['WOD', 'Entrada en calor', 'Fuerza'],
  },
  {
    name: 'Bodyweight Sit Up',
    description: 'Abdominal completo desde el suelo hasta sentarse. Activa el core completo.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: [], sections: ['WOD', 'Accesorio'],
  },
  {
    name: 'Kettlebell Swing',
    description: 'Balanceo de kettlebell desde entre las piernas hasta nivel de hombros (americano: sobre la cabeza). Potencia de cadena posterior.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 1,
    equipment: ['Kettlebell'], sections: ['WOD', 'Entrada en calor'],
  },
  {
    name: 'Box Jump',
    description: 'Salto con dos pies sobre el cajón pliométrico aterrizando con cadera en extensión. Potencia de piernas.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Box de salto'], sections: ['WOD', 'Entrada en calor'],
  },
  {
    name: 'Bodyweight Handstand Push-Up',
    description: 'Flexión invertida en pino (vertical) contra la pared o libre. Activa deltoides y tríceps.',
    difficulty: 'Avanzado', primaryMuscle: 'Deltoides', is_compound: 1,
    equipment: [], sections: ['WOD', 'Habilidad'],
  },
  {
    name: 'Bodyweight Pistol Squat',
    description: 'Sentadilla completa con una sola pierna, la otra extendida al frente. Requiere fuerza, equilibrio y flexibilidad.',
    difficulty: 'Avanzado', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: [], sections: ['WOD', 'Habilidad'],
  },
  {
    name: 'Double Under',
    description: 'Salto de cuerda donde la cuerda pasa dos veces bajo los pies en un solo salto.',
    difficulty: 'Intermedio', primaryMuscle: 'Pantorrillas', is_compound: 0,
    equipment: ['Cuerda para saltar'], sections: ['WOD', 'Entrada en calor'],
  },
  {
    name: 'Ring Dip',
    description: 'Fondos en anillas. Mayor rango de movimiento y estabilización que las paralelas.',
    difficulty: 'Intermedio', primaryMuscle: 'Tríceps', is_compound: 1,
    equipment: ['Anillas'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Overhead Squat',
    description: 'Sentadilla completa con barra sobre la cabeza en agarre snatch. Movilidad y estabilidad total.',
    difficulty: 'Avanzado', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Bench Press',
    description: 'Press de banca plano con barra olímpica. Fuerza máxima de pectorales.',
    difficulty: 'Básico', primaryMuscle: 'Pectorales', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['Fuerza'],
  },
  {
    name: 'GHD Back Extension',
    description: 'Extensión lumbar en máquina GHD. Fortalece cadena posterior baja.',
    difficulty: 'Básico', primaryMuscle: 'Isquiotibiales', is_compound: 0,
    equipment: ['GHD'], sections: ['Accesorio'],
  },
  {
    name: 'Rope Climb',
    description: 'Subida de cuerda hasta tocar el tope (tipicamente 4-5 m). Fuerza de tracción y agarre.',
    difficulty: 'Avanzado', primaryMuscle: 'Dorsales', is_compound: 1,
    equipment: [], sections: ['WOD', 'Habilidad'],
  },
  {
    name: 'Dumbbell Split Clean',
    description: 'Clean con mancuernas cayendo en posición de split (tijera). Potencia y coordinación.',
    difficulty: 'Intermedio', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Mancuernas'], sections: ['WOD'],
  },
  {
    name: 'GHD Sit-Up',
    description: 'Abdominal completo en máquina GHD con extensión de cadera total. Alta demanda de core.',
    difficulty: 'Intermedio', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: ['GHD'], sections: ['WOD', 'Accesorio'],
  },
  {
    name: 'Hanging Knees to Elbows',
    description: 'Colgado de la barra, llevar las rodillas a tocar los codos. Core y flexores de cadera.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: ['Pull-up bar'], sections: ['WOD', 'Accesorio'],
  },
  {
    name: 'Barbell Deadlift',
    description: 'Levantamiento de peso muerto convencional desde el suelo. Cadena posterior completa.',
    difficulty: 'Básico', primaryMuscle: 'Isquiotibiales', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Power Snatch',
    description: 'Arranque de potencia desde el suelo: barra de suelo a sobre la cabeza en un solo movimiento explosivo sin squat completo.',
    difficulty: 'Avanzado', primaryMuscle: 'Trapecio', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Clean and Jerk',
    description: 'Dos tiempos olímpicos: cargada (clean) seguida de envión (jerk). Movimiento completo de halterofilia.',
    difficulty: 'Avanzado', primaryMuscle: 'Trapecio', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Push Jerk',
    description: 'Envión dividido: desde rack frontal, flexión de rodillas y empuje explosivo hasta barra sobre la cabeza.',
    difficulty: 'Avanzado', primaryMuscle: 'Deltoides', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Push Press',
    description: 'Press de hombros con impulso de piernas. Más peso que el press estricto.',
    difficulty: 'Intermedio', primaryMuscle: 'Deltoides', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Hang Power Clean',
    description: 'Cargada de potencia desde la posición de colgado (encima de las rodillas). Sin llegar al suelo.',
    difficulty: 'Intermedio', primaryMuscle: 'Trapecio', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Squat Clean',
    description: 'Cargada completa al squat: barra de suelo a rack frontal cayendo en sentadilla completa.',
    difficulty: 'Avanzado', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Sumo Deadlift High Pull',
    description: 'Peso muerto sumo seguido de tirón alto hasta la barbilla. Potencia explosiva de cadena posterior.',
    difficulty: 'Intermedio', primaryMuscle: 'Glúteos', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD'],
  },
  {
    name: 'Ring Handstand Push-Up',
    description: 'Flexión invertida en anillas. Mayor rango de movimiento y dificultad que el HSPU en pared.',
    difficulty: 'Experto', primaryMuscle: 'Deltoides', is_compound: 1,
    equipment: ['Anillas'], sections: ['WOD', 'Habilidad'],
  },
];

// ── GIRLS — 21 plantillas ─────────────────────────────────────────────────────

const GIRLS_TEMPLATES: TemplateDef[] = [
  // 1. BÁRBARA
  {
    name: 'CrossFit Girl: Bárbara',
    objective: '5 rondas con 3 min de descanso — resistencia muscular total',
    general_notes: '5 Rondas con 3 minutos de descanso entre rondas\nApuntar tiempo de cada ronda.',
    estimated_duration_minutes: 40,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Squat',   sort_order: 1, planned_repetitions: 15 },
        { exerciseName: 'Bodyweight Push Up',  sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Bar Pull Up',         sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas (3 min rest)',
        notes: '3 minutos de descanso entre rondas. Apuntar tiempo por ronda.',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Bar Pull Up',        sort_order: 1, planned_repetitions: 20 },
          { exerciseName: 'Bodyweight Push Up',  sort_order: 2, planned_repetitions: 30 },
          { exerciseName: 'Bodyweight Sit Up',   sort_order: 3, planned_repetitions: 40 },
          { exerciseName: 'Bodyweight Squat',    sort_order: 4, planned_repetitions: 50 },
        ],
      },
    ],
  },

  // 2. CHELSEA
  {
    name: 'CrossFit Girl: Chelsea',
    objective: 'EMOM 30 minutos — capacidad aeróbica y resistencia a la fatiga',
    general_notes: 'EMOM 30 minutos\nCompletar las repeticiones en el primer minuto y descansar el tiempo restante.\nSi no se completan, se convierte en AMRAP.',
    estimated_duration_minutes: 35,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Squat',  sort_order: 1, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Push Up', sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Bar Pull Up',        sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'EMOM',
        visible_title: 'WOD — EMOM 30 minutos',
        time_cap_seconds: 1800,
        exercises: [
          { exerciseName: 'Bar Pull Up',        sort_order: 1, planned_repetitions: 5  },
          { exerciseName: 'Bodyweight Push Up',  sort_order: 2, planned_repetitions: 10 },
          { exerciseName: 'Bodyweight Squat',    sort_order: 3, planned_repetitions: 15 },
        ],
      },
    ],
  },

  // 3. MARY
  {
    name: 'CrossFit Girl: Mary',
    objective: 'AMRAP 20 minutos — gimnástico de alto nivel',
    general_notes: 'AMRAP 20 minutos\nContar rondas + repeticiones extra.',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Squat',           sort_order: 1, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Handstand Push-Up',sort_order: 2, planned_repetitions: 3, coach_notes: 'O piked push-up' },
        { exerciseName: 'Bar Pull Up',                 sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'AMRAP',
        visible_title: 'WOD — AMRAP 20 min',
        time_cap_seconds: 1200,
        exercises: [
          { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 1, planned_repetitions: 5  },
          { exerciseName: 'Bodyweight Pistol Squat',      sort_order: 2, planned_repetitions: 10, coach_notes: '5 por pierna' },
          { exerciseName: 'Bar Pull Up',                  sort_order: 3, planned_repetitions: 15 },
        ],
      },
    ],
  },

  // 4. CINDY
  {
    name: 'CrossFit Girl: Cindy',
    objective: 'AMRAP 20 minutos — fitness general y capacidad aeróbica',
    general_notes: 'AMRAP 20 minutos\nUno de los benchmarks más populares. Contar rondas + reps.',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Squat',  sort_order: 1, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Push Up', sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Bar Pull Up',        sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'AMRAP',
        visible_title: 'WOD — AMRAP 20 min',
        time_cap_seconds: 1200,
        exercises: [
          { exerciseName: 'Bar Pull Up',        sort_order: 1, planned_repetitions: 5  },
          { exerciseName: 'Bodyweight Push Up',  sort_order: 2, planned_repetitions: 10 },
          { exerciseName: 'Bodyweight Squat',    sort_order: 3, planned_repetitions: 15 },
        ],
      },
    ],
  },

  // 5. ANNIE
  {
    name: 'CrossFit Girl: Annie',
    objective: '50-40-30-20-10 doble salto y abdominales — habilidad y core',
    general_notes: 'For Time\nEsquema: 50-40-30-20-10 repeticiones de cada ejercicio.\n♀ y ♂ mismo peso (cuerda).',
    estimated_duration_minutes: 15,
    sections: [
      warmup([
        { exerciseName: 'Double Under',      sort_order: 1, planned_repetitions: 20, coach_notes: 'O 40 single unders' },
        { exerciseName: 'Bodyweight Sit Up', sort_order: 2, planned_repetitions: 15 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (50-40-30-20-10)',
        general_description: 'Completar todas las reps de un ejercicio antes de pasar al siguiente en cada bloque',
        exercises: [
          { exerciseName: 'Double Under',      sort_order: 1,  planned_repetitions: 50 },
          { exerciseName: 'Bodyweight Sit Up', sort_order: 2,  planned_repetitions: 50 },
          { exerciseName: 'Double Under',      sort_order: 3,  planned_repetitions: 40 },
          { exerciseName: 'Bodyweight Sit Up', sort_order: 4,  planned_repetitions: 40 },
          { exerciseName: 'Double Under',      sort_order: 5,  planned_repetitions: 30 },
          { exerciseName: 'Bodyweight Sit Up', sort_order: 6,  planned_repetitions: 30 },
          { exerciseName: 'Double Under',      sort_order: 7,  planned_repetitions: 20 },
          { exerciseName: 'Bodyweight Sit Up', sort_order: 8,  planned_repetitions: 20 },
          { exerciseName: 'Double Under',      sort_order: 9,  planned_repetitions: 10 },
          { exerciseName: 'Bodyweight Sit Up', sort_order: 10, planned_repetitions: 10 },
        ],
      },
    ],
  },

  // 6. NICOLE
  {
    name: 'CrossFit Girl: Nicole',
    objective: 'AMRAP 20 min — carrera + máximas dominadas',
    general_notes: 'AMRAP 20 minutos\nCada ronda: correr 400m, luego máximas dominadas sin soltar la barra.\nAnotar número de pull-ups de cada ronda.',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Running',   sort_order: 1, planned_distance_value: 200, planned_distance_unit: 'Metros', coach_notes: 'Ritmo suave' },
        { exerciseName: 'Bar Pull Up', sort_order: 2, planned_repetitions: 5 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'AMRAP',
        visible_title: 'WOD — AMRAP 20 min',
        notes: 'Anotar el número de pull-ups de cada ronda. Puntaje = total pull-ups.',
        time_cap_seconds: 1200,
        exercises: [
          { exerciseName: 'Running',   sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Bar Pull Up', sort_order: 2, coach_notes: 'Máximas repeticiones sin soltar la barra' },
        ],
      },
    ],
  },

  // 7. ANGIE
  {
    name: 'CrossFit Girl: Angie',
    objective: 'For Time — 100 reps de 4 movimientos en orden',
    general_notes: 'For Time\nCompletar TODAS las repeticiones de un ejercicio antes de pasar al siguiente.\nNo se puede pasar al siguiente hasta terminar las 100 del anterior.',
    estimated_duration_minutes: 30,
    sections: [
      warmup([
        { exerciseName: 'Bar Pull Up',        sort_order: 1, planned_repetitions: 5  },
        { exerciseName: 'Bodyweight Push Up',  sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Sit Up',   sort_order: 3, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Squat',    sort_order: 4, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (chipper 400 reps)',
        notes: 'Completar todas las reps de cada ejercicio antes de avanzar.',
        exercises: [
          { exerciseName: 'Bar Pull Up',        sort_order: 1, planned_repetitions: 100 },
          { exerciseName: 'Bodyweight Push Up',  sort_order: 2, planned_repetitions: 100 },
          { exerciseName: 'Bodyweight Sit Up',   sort_order: 3, planned_repetitions: 100 },
          { exerciseName: 'Bodyweight Squat',    sort_order: 4, planned_repetitions: 100 },
        ],
      },
    ],
  },

  // 8. EVA
  {
    name: 'CrossFit Girl: Eva',
    objective: '5 rondas — carrera larga + kettlebell swings',
    general_notes: '5 Rondas For Time\n♂ 32 kg kettlebell | ♀ 24 kg kettlebell',
    estimated_duration_minutes: 40,
    sections: [
      warmup([
        { exerciseName: 'Running',         sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros' },
        { exerciseName: 'Kettlebell Swing', sort_order: 2, planned_repetitions: 10, coach_notes: 'Peso de trabajo' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ 32 kg | ♀ 24 kg kettlebell',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Running',         sort_order: 1, planned_distance_value: 800, planned_distance_unit: 'Metros' },
          { exerciseName: 'Kettlebell Swing', sort_order: 2, planned_repetitions: 30, planned_weight_value: 32, planned_weight_unit: 'Kilogramos', suggested_scaling: '24 kg (♀)' },
        ],
      },
    ],
  },

  // 9. HELEN
  {
    name: 'CrossFit Girl: Helen',
    objective: '3 rondas — carrera + kettlebell + pull-ups',
    general_notes: '3 Rondas For Time\n♂ 24 kg kettlebell (1,5 pood) | ♀ 16 kg (1 pood)',
    estimated_duration_minutes: 15,
    sections: [
      warmup([
        { exerciseName: 'Running',         sort_order: 1, planned_distance_value: 200, planned_distance_unit: 'Metros' },
        { exerciseName: 'Kettlebell Swing', sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Bar Pull Up',      sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 3 Rondas For Time',
        notes: '♂ 24 kg | ♀ 16 kg kettlebell',
        total_rounds: 3,
        exercises: [
          { exerciseName: 'Running',         sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Kettlebell Swing', sort_order: 2, planned_repetitions: 21, planned_weight_value: 24, planned_weight_unit: 'Kilogramos', suggested_scaling: '16 kg (♀)' },
          { exerciseName: 'Bar Pull Up',      sort_order: 3, planned_repetitions: 12 },
        ],
      },
    ],
  },

  // 10. KELLY
  {
    name: 'CrossFit Girl: Kelly',
    objective: '5 rondas — carrera + box jumps + wall balls',
    general_notes: '5 Rondas For Time\n♂ Box 24" / Wall ball 9 kg | ♀ Box 20" / Wall ball 6 kg',
    estimated_duration_minutes: 40,
    sections: [
      warmup([
        { exerciseName: 'Running',       sort_order: 1, planned_distance_value: 200, planned_distance_unit: 'Metros' },
        { exerciseName: 'Box Jump',       sort_order: 2, planned_repetitions: 10, coach_notes: '24"/20"' },
        { exerciseName: 'Wall Ball Shot', sort_order: 3, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ Box 24" · Wall ball 9 kg | ♀ Box 20" · Wall ball 6 kg',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Running',       sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Box Jump',       sort_order: 2, planned_repetitions: 30, coach_notes: '24" (♂) / 20" (♀)', suggested_scaling: '20" (♀)' },
          { exerciseName: 'Wall Ball Shot', sort_order: 3, planned_repetitions: 30, planned_weight_value: 9, planned_weight_unit: 'Kilogramos', suggested_scaling: '6 kg (♀)' },
        ],
      },
    ],
  },

  // 11. KAREN
  {
    name: 'CrossFit Girl: Karen',
    objective: 'For Time — 150 Wall Balls',
    general_notes: 'For Time\n150 Wall Balls\n♂ 9 kg (20 lb) / 10 ft target | ♀ 6 kg (14 lb) / 9 ft target',
    estimated_duration_minutes: 15,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Squat', sort_order: 1, planned_repetitions: 15 },
        { exerciseName: 'Wall Ball Shot',   sort_order: 2, planned_repetitions: 15, coach_notes: 'Peso de trabajo, activar técnica' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time',
        notes: '♂ 9 kg / 10 ft target | ♀ 6 kg / 9 ft target',
        exercises: [
          { exerciseName: 'Wall Ball Shot', sort_order: 1, planned_repetitions: 150, planned_weight_value: 9, planned_weight_unit: 'Kilogramos', suggested_scaling: '6 kg (♀)' },
        ],
      },
    ],
  },

  // 12. AMANDA
  {
    name: 'CrossFit Girl: Amanda',
    objective: '9-7-5 Muscle-ups y Snatches — potencia olímpica',
    general_notes: 'For Time — 9-7-5\n♂ 61 kg snatch | ♀ 43 kg snatch',
    estimated_duration_minutes: 15,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Squat',   sort_order: 1, planned_repetitions: 10 },
        { exerciseName: 'Barbell Power Snatch', sort_order: 2, planned_repetitions: 5, coach_notes: 'Técnica, peso ligero' },
        { exerciseName: 'Ring Strict Muscle Up', sort_order: 3, planned_repetitions: 2, coach_notes: 'O ring rows' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (9-7-5)',
        notes: '♂ 61 kg | ♀ 43 kg snatch',
        exercises: [
          { exerciseName: 'Ring Strict Muscle Up', sort_order: 1, planned_repetitions: 9 },
          { exerciseName: 'Barbell Power Snatch',  sort_order: 2, planned_repetitions: 9,  planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
          { exerciseName: 'Ring Strict Muscle Up', sort_order: 3, planned_repetitions: 7 },
          { exerciseName: 'Barbell Power Snatch',  sort_order: 4, planned_repetitions: 7,  planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
          { exerciseName: 'Ring Strict Muscle Up', sort_order: 5, planned_repetitions: 5 },
          { exerciseName: 'Barbell Power Snatch',  sort_order: 6, planned_repetitions: 5,  planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
        ],
      },
    ],
  },

  // 13. JACKIE
  {
    name: 'CrossFit Girl: Jackie',
    objective: 'For Time — Remo + Thrusters + Pull-ups',
    general_notes: 'For Time\n♂ 20 kg Thruster | ♀ 15 kg Thruster\nUno de los benchmarks más cortos: apunta a < 10 minutos.',
    estimated_duration_minutes: 15,
    sections: [
      warmup([
        { exerciseName: 'Rowing',          sort_order: 1, planned_distance_value: 500, planned_distance_unit: 'Metros', coach_notes: 'Ritmo moderado' },
        { exerciseName: 'Barbell Thruster', sort_order: 2, planned_repetitions: 10, coach_notes: 'Peso de trabajo' },
        { exerciseName: 'Bar Pull Up',      sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time',
        notes: '♂ 20 kg Thruster | ♀ 15 kg',
        exercises: [
          { exerciseName: 'Rowing',          sort_order: 1, planned_distance_value: 1000, planned_distance_unit: 'Metros' },
          { exerciseName: 'Barbell Thruster', sort_order: 2, planned_repetitions: 50, planned_weight_value: 20, planned_weight_unit: 'Kilogramos', suggested_scaling: '15 kg (♀)' },
          { exerciseName: 'Bar Pull Up',      sort_order: 3, planned_repetitions: 30 },
        ],
      },
    ],
  },

  // 14. DIANE
  {
    name: 'CrossFit Girl: Diane',
    objective: '21-15-9 Peso muerto y HSPU — fuerza y habilidad',
    general_notes: 'For Time — 21-15-9\n♂ 102 kg Deadlift | ♀ 70 kg',
    estimated_duration_minutes: 15,
    sections: [
      warmup([
        { exerciseName: 'Barbell Deadlift',           sort_order: 1, planned_repetitions: 5,  coach_notes: 'Peso ligero, activar cadena posterior' },
        { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 2, planned_repetitions: 3,  coach_notes: 'O piked push-up' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (21-15-9)',
        notes: '♂ 102 kg Deadlift | ♀ 70 kg',
        exercises: [
          { exerciseName: 'Barbell Deadlift',            sort_order: 1, planned_repetitions: 21, planned_weight_value: 102, planned_weight_unit: 'Kilogramos', suggested_scaling: '70 kg (♀)' },
          { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 2, planned_repetitions: 21 },
          { exerciseName: 'Barbell Deadlift',            sort_order: 3, planned_repetitions: 15, planned_weight_value: 102, planned_weight_unit: 'Kilogramos', suggested_scaling: '70 kg (♀)' },
          { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 4, planned_repetitions: 15 },
          { exerciseName: 'Barbell Deadlift',            sort_order: 5, planned_repetitions: 9,  planned_weight_value: 102, planned_weight_unit: 'Kilogramos', suggested_scaling: '70 kg (♀)' },
          { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 6, planned_repetitions: 9  },
        ],
      },
    ],
  },

  // 15. FRAN
  {
    name: 'CrossFit Girl: Fran',
    objective: '21-15-9 Thrusters y Pull-ups — el benchmark más icónico',
    general_notes: 'For Time — 21-15-9\n♂ 43 kg Thruster | ♀ 29 kg\nMetaobjetivo: < 10 min (elite: < 3 min)',
    estimated_duration_minutes: 15,
    sections: [
      warmup([
        { exerciseName: 'Barbell Thruster', sort_order: 1, planned_repetitions: 10, coach_notes: 'Peso ligero, engrasar movimiento' },
        { exerciseName: 'Bar Pull Up',      sort_order: 2, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (21-15-9)',
        notes: '♂ 43 kg Thruster | ♀ 29 kg',
        exercises: [
          { exerciseName: 'Barbell Thruster', sort_order: 1, planned_repetitions: 21, planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '29 kg (♀)' },
          { exerciseName: 'Bar Pull Up',      sort_order: 2, planned_repetitions: 21 },
          { exerciseName: 'Barbell Thruster', sort_order: 3, planned_repetitions: 15, planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '29 kg (♀)' },
          { exerciseName: 'Bar Pull Up',      sort_order: 4, planned_repetitions: 15 },
          { exerciseName: 'Barbell Thruster', sort_order: 5, planned_repetitions: 9,  planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '29 kg (♀)' },
          { exerciseName: 'Bar Pull Up',      sort_order: 6, planned_repetitions: 9  },
        ],
      },
    ],
  },

  // 16. ELIZABETH
  {
    name: 'CrossFit Girl: Elizabeth',
    objective: '21-15-9 Cleans y Ring Dips — potencia y empuje',
    general_notes: 'For Time — 21-15-9\n♂ 61 kg Clean | ♀ 43 kg',
    estimated_duration_minutes: 15,
    sections: [
      warmup([
        { exerciseName: 'Barbell Power Clean', sort_order: 1, planned_repetitions: 5, coach_notes: 'Peso ligero' },
        { exerciseName: 'Ring Dip',            sort_order: 2, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (21-15-9)',
        notes: '♂ 61 kg Clean | ♀ 43 kg',
        exercises: [
          { exerciseName: 'Barbell Power Clean', sort_order: 1, planned_repetitions: 21, planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
          { exerciseName: 'Ring Dip',            sort_order: 2, planned_repetitions: 21 },
          { exerciseName: 'Barbell Power Clean', sort_order: 3, planned_repetitions: 15, planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
          { exerciseName: 'Ring Dip',            sort_order: 4, planned_repetitions: 15 },
          { exerciseName: 'Barbell Power Clean', sort_order: 5, planned_repetitions: 9,  planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
          { exerciseName: 'Ring Dip',            sort_order: 6, planned_repetitions: 9  },
        ],
      },
    ],
  },

  // 17. NANCY
  {
    name: 'CrossFit Girl: Nancy',
    objective: '5 rondas — carrera + overhead squats',
    general_notes: '5 Rondas For Time\n♂ 43 kg OHS | ♀ 29 kg',
    estimated_duration_minutes: 20,
    sections: [
      warmup([
        { exerciseName: 'Running',               sort_order: 1, planned_distance_value: 200, planned_distance_unit: 'Metros' },
        { exerciseName: 'Barbell Overhead Squat', sort_order: 2, planned_repetitions: 5, coach_notes: 'Técnica y movilidad' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ 43 kg OHS | ♀ 29 kg',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Running',               sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Barbell Overhead Squat', sort_order: 2, planned_repetitions: 15, planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '29 kg (♀)' },
        ],
      },
    ],
  },

  // 18. LYNNE
  {
    name: 'CrossFit Girl: Lynne',
    objective: '5 rondas a máximas repeticiones — fuerza relativa al cuerpo',
    general_notes: '5 Rondas — Máximas repeticiones (sin time cap)\nBench press con el peso corporal del atleta.\nDescanso entre rondas según necesidad. No hay tiempo.',
    estimated_duration_minutes: 30,
    sections: [
      warmup([
        { exerciseName: 'Barbell Bench Press', sort_order: 1, planned_repetitions: 10, coach_notes: 'Peso ligero, activar' },
        { exerciseName: 'Bar Pull Up',         sort_order: 2, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas, Máx Reps',
        notes: 'Bench press = peso corporal del atleta. Descanso libre entre rondas. Anotar reps de cada ronda.',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Barbell Bench Press', sort_order: 1, coach_notes: 'Peso corporal del atleta — máximas reps' },
          { exerciseName: 'Bar Pull Up',         sort_order: 2, coach_notes: 'Máximas reps sin soltar la barra' },
        ],
      },
    ],
  },

  // 19. ISABEL
  {
    name: 'CrossFit Girl: Isabel',
    objective: 'For Time — 30 Snatches',
    general_notes: 'For Time\n30 Snatches\n♂ 61 kg | ♀ 43 kg\nMetaobjetivo: < 5 minutos',
    estimated_duration_minutes: 10,
    sections: [
      warmup([
        { exerciseName: 'Barbell Power Snatch', sort_order: 1, planned_repetitions: 5, coach_notes: 'Peso ligero, técnica' },
        { exerciseName: 'Bodyweight Squat',     sort_order: 2, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time',
        notes: '♂ 61 kg | ♀ 43 kg',
        exercises: [
          { exerciseName: 'Barbell Power Snatch', sort_order: 1, planned_repetitions: 30, planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
        ],
      },
    ],
  },

  // 20. LINDA
  {
    name: 'CrossFit Girl: Linda',
    objective: '10-9-8-7-6-5-4-3-2-1 tres barras — fuerza total',
    general_notes: 'For Time — 10-9-8-7-6-5-4-3-2-1\nDeadlift: 1,5× peso corporal\nBench press: 1× peso corporal\nClean: 0,75× peso corporal\nLas 3 barras se cargan con pesos diferentes según el atleta.',
    estimated_duration_minutes: 30,
    sections: [
      warmup([
        { exerciseName: 'Barbell Deadlift',    sort_order: 1, planned_repetitions: 5, coach_notes: 'Peso ligero' },
        { exerciseName: 'Barbell Bench Press', sort_order: 2, planned_repetitions: 5 },
        { exerciseName: 'Barbell Power Clean', sort_order: 3, planned_repetitions: 5 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (10-9-8-7-6-5-4-3-2-1)',
        general_description: 'Completar cada bloque antes de bajar las reps. Rotar entre las 3 barras.',
        notes: 'Deadlift = 1,5× PC | Bench = 1× PC | Clean = 0,75× PC\nEjemplo 80 kg: DL 120 kg · BP 80 kg · Clean 60 kg',
        exercises: [
          { exerciseName: 'Barbell Deadlift',    sort_order: 1, planned_repetitions: 10, coach_notes: '1,5× peso corporal' },
          { exerciseName: 'Barbell Bench Press', sort_order: 2, planned_repetitions: 10, coach_notes: '1× peso corporal' },
          { exerciseName: 'Barbell Power Clean', sort_order: 3, planned_repetitions: 10, coach_notes: '0,75× peso corporal' },
        ],
      },
    ],
  },

  // 21. GRACE
  {
    name: 'CrossFit Girl: Grace',
    objective: 'For Time — 30 Clean and Jerks',
    general_notes: 'For Time\n30 Clean and Jerks\n♂ 61 kg | ♀ 43 kg\nMetaobjetivo: < 5 minutos',
    estimated_duration_minutes: 10,
    sections: [
      warmup([
        { exerciseName: 'Barbell Clean and Jerk', sort_order: 1, planned_repetitions: 5, coach_notes: 'Peso ligero, técnica' },
        { exerciseName: 'Bodyweight Squat',       sort_order: 2, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time',
        notes: '♂ 61 kg | ♀ 43 kg',
        exercises: [
          { exerciseName: 'Barbell Clean and Jerk', sort_order: 1, planned_repetitions: 30, planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
        ],
      },
    ],
  },
];

// ── HEROES — 21 plantillas ────────────────────────────────────────────────────

const HEROES_TEMPLATES: TemplateDef[] = [
  // 1. JT
  {
    name: 'CrossFit Hero: JT',
    objective: '21-15-9 HSPU, Ring Dips y Push-ups — empuje total',
    general_notes: 'For Time — 21-15-9\nEn honor a PO1 John Thomas, caído en combate.',
    estimated_duration_minutes: 20,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 1, planned_repetitions: 3, coach_notes: 'O piked push-up' },
        { exerciseName: 'Ring Dip',                    sort_order: 2, planned_repetitions: 5  },
        { exerciseName: 'Bodyweight Push Up',           sort_order: 3, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (21-15-9)',
        exercises: [
          { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 1, planned_repetitions: 21 },
          { exerciseName: 'Ring Dip',                    sort_order: 2, planned_repetitions: 21 },
          { exerciseName: 'Bodyweight Push Up',           sort_order: 3, planned_repetitions: 21 },
          { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 4, planned_repetitions: 15 },
          { exerciseName: 'Ring Dip',                    sort_order: 5, planned_repetitions: 15 },
          { exerciseName: 'Bodyweight Push Up',           sort_order: 6, planned_repetitions: 15 },
          { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 7, planned_repetitions: 9  },
          { exerciseName: 'Ring Dip',                    sort_order: 8, planned_repetitions: 9  },
          { exerciseName: 'Bodyweight Push Up',           sort_order: 9, planned_repetitions: 9  },
        ],
      },
    ],
  },

  // 2. MICHAEL
  {
    name: 'CrossFit Hero: Michael',
    objective: '3 rondas — carrera + lumbares + abdominales',
    general_notes: '3 Rondas For Time\nEn honor al MSgt Michael Maltz.',
    estimated_duration_minutes: 35,
    sections: [
      warmup([
        { exerciseName: 'Running',         sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros' },
        { exerciseName: 'GHD Back Extension', sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Sit Up',  sort_order: 3, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 3 Rondas For Time',
        total_rounds: 3,
        exercises: [
          { exerciseName: 'Running',           sort_order: 1, planned_distance_value: 800, planned_distance_unit: 'Metros' },
          { exerciseName: 'GHD Back Extension', sort_order: 2, planned_repetitions: 50 },
          { exerciseName: 'Bodyweight Sit Up',  sort_order: 3, planned_repetitions: 50 },
        ],
      },
    ],
  },

  // 3. TOMMY V
  {
    name: 'CrossFit Hero: Tommy V',
    objective: '5 rondas con escalera de thrusters y rope climbs',
    general_notes: '5 Rondas For Time\nEn honor al Lt Michael P. McGreevy.\n♂ 29 kg Thruster | ♀ 20 kg\nCuerda: 4-5 metros\nCada ronda tiene 3 bloques de thrusters + rope climbs (21-12, 15-9, 9-6).',
    estimated_duration_minutes: 40,
    sections: [
      warmup([
        { exerciseName: 'Barbell Thruster', sort_order: 1, planned_repetitions: 10, coach_notes: 'Peso ligero' },
        { exerciseName: 'Rope Climb',       sort_order: 2, planned_repetitions: 2,  coach_notes: 'Técnica de subida' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ 29 kg | ♀ 20 kg\nCada ronda: 21T+12RC → 15T+9RC → 9T+6RC',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Barbell Thruster', sort_order: 1, planned_repetitions: 21, planned_weight_value: 29, planned_weight_unit: 'Kilogramos', suggested_scaling: '20 kg (♀)' },
          { exerciseName: 'Rope Climb',       sort_order: 2, planned_repetitions: 12, coach_notes: '4 metros' },
          { exerciseName: 'Barbell Thruster', sort_order: 3, planned_repetitions: 15, planned_weight_value: 29, planned_weight_unit: 'Kilogramos' },
          { exerciseName: 'Rope Climb',       sort_order: 4, planned_repetitions: 9  },
          { exerciseName: 'Barbell Thruster', sort_order: 5, planned_repetitions: 9,  planned_weight_value: 29, planned_weight_unit: 'Kilogramos' },
          { exerciseName: 'Rope Climb',       sort_order: 6, planned_repetitions: 6  },
        ],
      },
    ],
  },

  // 4. JOSHIE
  {
    name: 'CrossFit Hero: Joshie',
    objective: '3 rondas — DB Snatch alternado y pull-ups',
    general_notes: '3 Rondas For Time\n♂ 22 kg mancuerna | ♀ 16 kg\n21 snatches con brazo derecho, luego 21 pull-ups, luego 21 snatches con brazo izquierdo, luego 21 pull-ups.',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Alternating Single Arm Dumbbell Power Snatch', sort_order: 1, planned_repetitions: 10, coach_notes: '5 por lado' },
        { exerciseName: 'Bar Pull Up',                                  sort_order: 2, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 3 Rondas For Time',
        notes: '♂ 22 kg | ♀ 16 kg mancuerna',
        total_rounds: 3,
        exercises: [
          { exerciseName: 'Alternating Single Arm Dumbbell Power Snatch', sort_order: 1, planned_repetitions: 21, planned_weight_value: 22, planned_weight_unit: 'Kilogramos', coach_notes: 'Solo brazo derecho', suggested_scaling: '16 kg (♀)' },
          { exerciseName: 'Bar Pull Up',                                  sort_order: 2, planned_repetitions: 21 },
          { exerciseName: 'Alternating Single Arm Dumbbell Power Snatch', sort_order: 3, planned_repetitions: 21, planned_weight_value: 22, planned_weight_unit: 'Kilogramos', coach_notes: 'Solo brazo izquierdo', suggested_scaling: '16 kg (♀)' },
          { exerciseName: 'Bar Pull Up',                                  sort_order: 4, planned_repetitions: 21 },
        ],
      },
    ],
  },

  // 5. BADGER
  {
    name: 'CrossFit Hero: Badger',
    objective: '3 rondas — Squat Cleans, Pull-ups y carrera',
    general_notes: '3 Rondas For Time\nEn honor al SO2 Adam Lee Brown.\n♂ 43 kg Squat Clean | ♀ 29 kg',
    estimated_duration_minutes: 35,
    sections: [
      warmup([
        { exerciseName: 'Barbell Squat Clean', sort_order: 1, planned_repetitions: 5, coach_notes: 'Técnica' },
        { exerciseName: 'Bar Pull Up',         sort_order: 2, planned_repetitions: 5  },
        { exerciseName: 'Running',             sort_order: 3, planned_distance_value: 200, planned_distance_unit: 'Metros' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 3 Rondas For Time',
        notes: '♂ 43 kg | ♀ 29 kg Squat Clean',
        total_rounds: 3,
        exercises: [
          { exerciseName: 'Barbell Squat Clean', sort_order: 1, planned_repetitions: 30, planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '29 kg (♀)' },
          { exerciseName: 'Bar Pull Up',         sort_order: 2, planned_repetitions: 30 },
          { exerciseName: 'Running',             sort_order: 3, planned_distance_value: 800, planned_distance_unit: 'Metros' },
        ],
      },
    ],
  },

  // 6. DANIEL
  {
    name: 'CrossFit Hero: Daniel',
    objective: 'Chipper simétrico — pull-ups, carrera y thrusters',
    general_notes: 'For Time — Chipper simétrico\nEn honor al Army Cpt Daniel Whitten.\n♂ 43 kg Thruster | ♀ 29 kg',
    estimated_duration_minutes: 30,
    sections: [
      warmup([
        { exerciseName: 'Bar Pull Up',      sort_order: 1, planned_repetitions: 5  },
        { exerciseName: 'Barbell Thruster', sort_order: 2, planned_repetitions: 5, coach_notes: 'Peso de trabajo' },
        { exerciseName: 'Running',          sort_order: 3, planned_distance_value: 400, planned_distance_unit: 'Metros' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (chipper simétrico)',
        notes: '♂ 43 kg | ♀ 29 kg Thruster',
        exercises: [
          { exerciseName: 'Bar Pull Up',      sort_order: 1, planned_repetitions: 50 },
          { exerciseName: 'Running',          sort_order: 2, planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Barbell Thruster', sort_order: 3, planned_repetitions: 21, planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '29 kg (♀)' },
          { exerciseName: 'Running',          sort_order: 4, planned_distance_value: 800, planned_distance_unit: 'Metros' },
          { exerciseName: 'Barbell Thruster', sort_order: 5, planned_repetitions: 21, planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '29 kg (♀)' },
          { exerciseName: 'Running',          sort_order: 6, planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Bar Pull Up',      sort_order: 7, planned_repetitions: 50 },
        ],
      },
    ],
  },

  // 7. MURPH
  {
    name: 'CrossFit Hero: Murph',
    objective: 'For Time — 1 milla + 100 pull-ups + 200 push-ups + 300 squats + 1 milla',
    general_notes: 'For Time — con chaleco lastrado 10 kg (opcional)\nEn honor al Lt Michael Murphy.\nSe puede dividir pull-ups, push-ups y squats en cualquier combinación (ej: 20 rondas de 5+10+15).',
    estimated_duration_minutes: 50,
    sections: [
      warmup([
        { exerciseName: 'Running',           sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros', coach_notes: 'Ritmo suave' },
        { exerciseName: 'Bar Pull Up',        sort_order: 2, planned_repetitions: 5  },
        { exerciseName: 'Bodyweight Push Up', sort_order: 3, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Squat',   sort_order: 4, planned_repetitions: 15 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (con chaleco 10 kg)',
        notes: 'Chaleco 10 kg recomendado. Se puede partir en rondas (ej: 20×5+10+15).',
        exercises: [
          { exerciseName: 'Running',           sort_order: 1, planned_distance_value: 1600, planned_distance_unit: 'Metros', coach_notes: '1 milla' },
          { exerciseName: 'Bar Pull Up',        sort_order: 2, planned_repetitions: 100 },
          { exerciseName: 'Bodyweight Push Up', sort_order: 3, planned_repetitions: 200 },
          { exerciseName: 'Bodyweight Squat',   sort_order: 4, planned_repetitions: 300 },
          { exerciseName: 'Running',           sort_order: 5, planned_distance_value: 1600, planned_distance_unit: 'Metros', coach_notes: '1 milla' },
        ],
      },
    ],
  },

  // 8. JASON
  {
    name: 'CrossFit Hero: Jason',
    objective: 'Chipper con Muscle-ups escalando — squats + muscle-ups en pirámide',
    general_notes: 'For Time — Chipper\n100 Squats · 5 MU · 75 Squats · 10 MU · 50 Squats · 15 MU · 25 Squats · 20 MU',
    estimated_duration_minutes: 30,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Squat',   sort_order: 1, planned_repetitions: 15 },
        { exerciseName: 'Ring Strict Muscle Up', sort_order: 2, planned_repetitions: 2, coach_notes: 'O ring row + ring dip' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (chipper pirámide)',
        exercises: [
          { exerciseName: 'Bodyweight Squat',    sort_order: 1, planned_repetitions: 100 },
          { exerciseName: 'Ring Strict Muscle Up', sort_order: 2, planned_repetitions: 5   },
          { exerciseName: 'Bodyweight Squat',    sort_order: 3, planned_repetitions: 75  },
          { exerciseName: 'Ring Strict Muscle Up', sort_order: 4, planned_repetitions: 10  },
          { exerciseName: 'Bodyweight Squat',    sort_order: 5, planned_repetitions: 50  },
          { exerciseName: 'Ring Strict Muscle Up', sort_order: 6, planned_repetitions: 15  },
          { exerciseName: 'Bodyweight Squat',    sort_order: 7, planned_repetitions: 25  },
          { exerciseName: 'Ring Strict Muscle Up', sort_order: 8, planned_repetitions: 20  },
        ],
      },
    ],
  },

  // 9. JOSH
  {
    name: 'CrossFit Hero: Josh',
    objective: '21-15-9 Overhead Squats y Pull-ups (reps dobles)',
    general_notes: 'For Time\n21 OHS + 42 Pull-ups | 15 OHS + 30 Pull-ups | 9 OHS + 18 Pull-ups\n♂ 61 kg OHS | ♀ 43 kg',
    estimated_duration_minutes: 20,
    sections: [
      warmup([
        { exerciseName: 'Barbell Overhead Squat', sort_order: 1, planned_repetitions: 5, coach_notes: 'Técnica' },
        { exerciseName: 'Bar Pull Up',            sort_order: 2, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time',
        notes: '♂ 61 kg OHS | ♀ 43 kg',
        exercises: [
          { exerciseName: 'Barbell Overhead Squat', sort_order: 1, planned_repetitions: 21, planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
          { exerciseName: 'Bar Pull Up',            sort_order: 2, planned_repetitions: 42 },
          { exerciseName: 'Barbell Overhead Squat', sort_order: 3, planned_repetitions: 15, planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
          { exerciseName: 'Bar Pull Up',            sort_order: 4, planned_repetitions: 30 },
          { exerciseName: 'Barbell Overhead Squat', sort_order: 5, planned_repetitions: 9,  planned_weight_value: 61, planned_weight_unit: 'Kilogramos', suggested_scaling: '43 kg (♀)' },
          { exerciseName: 'Bar Pull Up',            sort_order: 6, planned_repetitions: 18 },
        ],
      },
    ],
  },

  // 10. McGHEE
  {
    name: 'CrossFit Hero: McGhee',
    objective: 'AMRAP 30 minutos — deadlift, push-ups y box jumps',
    general_notes: 'AMRAP 30 minutos\nEn honor al Capt Brian R. Bunting.\n♂ 82 kg Deadlift | ♀ 56 kg\nBox 24" (♂) / 20" (♀)',
    estimated_duration_minutes: 35,
    sections: [
      warmup([
        { exerciseName: 'Barbell Deadlift',  sort_order: 1, planned_repetitions: 5, coach_notes: 'Peso ligero' },
        { exerciseName: 'Bodyweight Push Up', sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Box Jump',           sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'AMRAP',
        visible_title: 'WOD — AMRAP 30 min',
        notes: '♂ 82 kg DL · Box 24" | ♀ 56 kg · Box 20"',
        time_cap_seconds: 1800,
        exercises: [
          { exerciseName: 'Barbell Deadlift',  sort_order: 1, planned_repetitions: 5,  planned_weight_value: 82, planned_weight_unit: 'Kilogramos', suggested_scaling: '56 kg (♀)' },
          { exerciseName: 'Bodyweight Push Up', sort_order: 2, planned_repetitions: 13 },
          { exerciseName: 'Box Jump',           sort_order: 3, planned_repetitions: 9,  coach_notes: '24" (♂) / 20" (♀)' },
        ],
      },
    ],
  },

  // 11. NATE
  {
    name: 'CrossFit Hero: Nate',
    objective: 'AMRAP 20 minutos — muscle-ups, HSPU y kettlebell swings',
    general_notes: 'AMRAP 20 minutos\nEn honor al CPO Nate Hardy.\n♂ 32 kg KB | ♀ 24 kg\n2 Muscle-ups · 4 HSPU · 8 KB Swings por ronda',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Ring Strict Muscle Up',     sort_order: 1, planned_repetitions: 2, coach_notes: 'O ring row + dip' },
        { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 2, planned_repetitions: 3  },
        { exerciseName: 'Kettlebell Swing',          sort_order: 3, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'AMRAP',
        visible_title: 'WOD — AMRAP 20 min',
        notes: '♂ 32 kg KB | ♀ 24 kg',
        time_cap_seconds: 1200,
        exercises: [
          { exerciseName: 'Ring Strict Muscle Up',     sort_order: 1, planned_repetitions: 2 },
          { exerciseName: 'Bodyweight Handstand Push-Up', sort_order: 2, planned_repetitions: 4 },
          { exerciseName: 'Kettlebell Swing',          sort_order: 3, planned_repetitions: 8, planned_weight_value: 32, planned_weight_unit: 'Kilogramos', suggested_scaling: '24 kg (♀)' },
        ],
      },
    ],
  },

  // 12. GRIFF
  {
    name: 'CrossFit Hero: Griff',
    objective: 'For Time — carrera y carrera hacia atrás',
    general_notes: 'For Time\nEn honor al SSgt Travis Griffin.\n800m forward · 400m backward · 800m forward · 400m backward\nCorrer hacia atrás a ritmo seguro.',
    estimated_duration_minutes: 20,
    sections: [
      warmup([
        { exerciseName: 'Running', sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros', coach_notes: 'Suave' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time',
        notes: 'Correr hacia atrás con cuidado — superficie plana y sin obstáculos.',
        exercises: [
          { exerciseName: 'Running', sort_order: 1, planned_distance_value: 800, planned_distance_unit: 'Metros', coach_notes: 'Hacia adelante' },
          { exerciseName: 'Running', sort_order: 2, planned_distance_value: 400, planned_distance_unit: 'Metros', coach_notes: 'Hacia atrás (backpedal)' },
          { exerciseName: 'Running', sort_order: 3, planned_distance_value: 800, planned_distance_unit: 'Metros', coach_notes: 'Hacia adelante' },
          { exerciseName: 'Running', sort_order: 4, planned_distance_value: 400, planned_distance_unit: 'Metros', coach_notes: 'Hacia atrás (backpedal)' },
        ],
      },
    ],
  },

  // 13. RYAN
  {
    name: 'CrossFit Hero: Ryan',
    objective: '5 rondas — Muscle-ups y Burpees',
    general_notes: '5 Rondas For Time\nEn honor al Spc Ryan C. Baumann.',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Ring Strict Muscle Up', sort_order: 1, planned_repetitions: 2, coach_notes: 'O ring row + dip' },
        { exerciseName: 'Bodyweight Burpee',     sort_order: 2, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Ring Strict Muscle Up', sort_order: 1, planned_repetitions: 7  },
          { exerciseName: 'Bodyweight Burpee',     sort_order: 2, planned_repetitions: 21 },
        ],
      },
    ],
  },

  // 14. ERIN
  {
    name: 'CrossFit Hero: Erin',
    objective: '5 rondas — DB Split Cleans y Pull-ups',
    general_notes: '5 Rondas For Time\nEn honor al CPL Erin Wall.\n♂ 22 kg mancuernas | ♀ 16 kg',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Dumbbell Split Clean', sort_order: 1, planned_repetitions: 5, coach_notes: 'Técnica' },
        { exerciseName: 'Bar Pull Up',          sort_order: 2, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ 22 kg | ♀ 16 kg mancuernas',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Dumbbell Split Clean', sort_order: 1, planned_repetitions: 15, planned_weight_value: 22, planned_weight_unit: 'Kilogramos', suggested_scaling: '16 kg (♀)' },
          { exerciseName: 'Bar Pull Up',          sort_order: 2, planned_repetitions: 21 },
        ],
      },
    ],
  },

  // 15. MR. JOSHUA
  {
    name: 'CrossFit Hero: Mr. Joshua',
    objective: '5 rondas — carrera, abdominales y peso muerto',
    general_notes: '5 Rondas For Time\nEn honor al MSG Joshua Wheeler.\n♂ 84 kg Deadlift | ♀ 56 kg',
    estimated_duration_minutes: 30,
    sections: [
      warmup([
        { exerciseName: 'Running',          sort_order: 1, planned_distance_value: 200, planned_distance_unit: 'Metros' },
        { exerciseName: 'Bodyweight Sit Up', sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Barbell Deadlift', sort_order: 3, planned_repetitions: 5, coach_notes: 'Peso ligero' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ 84 kg DL | ♀ 56 kg',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Running',          sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Bodyweight Sit Up', sort_order: 2, planned_repetitions: 30 },
          { exerciseName: 'Barbell Deadlift', sort_order: 3, planned_repetitions: 15, planned_weight_value: 84, planned_weight_unit: 'Kilogramos', suggested_scaling: '56 kg (♀)' },
        ],
      },
    ],
  },

  // 16. DT
  {
    name: 'CrossFit Hero: DT',
    objective: '5 rondas — complejo de barra (Deadlift + Hang Power Clean + Push Jerk)',
    general_notes: '5 Rondas For Time\nEn honor al SSgt Timothy P. Davis.\n♂ 70 kg | ♀ 47 kg — misma barra todo el WOD\nNo soltar la barra entre ejercicios de la misma ronda.',
    estimated_duration_minutes: 20,
    sections: [
      warmup([
        { exerciseName: 'Barbell Deadlift',      sort_order: 1, planned_repetitions: 5, coach_notes: 'Peso ligero' },
        { exerciseName: 'Barbell Hang Power Clean', sort_order: 2, planned_repetitions: 5 },
        { exerciseName: 'Barbell Push Jerk',     sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ 70 kg | ♀ 47 kg — no soltar la barra dentro de cada ronda.',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Barbell Deadlift',       sort_order: 1, planned_repetitions: 12, planned_weight_value: 70, planned_weight_unit: 'Kilogramos', suggested_scaling: '47 kg (♀)' },
          { exerciseName: 'Barbell Hang Power Clean', sort_order: 2, planned_repetitions: 9,  planned_weight_value: 70, planned_weight_unit: 'Kilogramos', suggested_scaling: '47 kg (♀)' },
          { exerciseName: 'Barbell Push Jerk',      sort_order: 3, planned_repetitions: 6,  planned_weight_value: 70, planned_weight_unit: 'Kilogramos', suggested_scaling: '47 kg (♀)' },
        ],
      },
    ],
  },

  // 17. DANNY
  {
    name: 'CrossFit Hero: Danny',
    objective: 'AMRAP 20 minutos — box jumps, push press y pull-ups',
    general_notes: 'AMRAP 20 minutos\nEn honor al Sgt Daniel Crabtree.\n♂ 52 kg Push Press | ♀ 34 kg\nBox 24" (♂) / 20" (♀)',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Box Jump',          sort_order: 1, planned_repetitions: 10 },
        { exerciseName: 'Barbell Push Press', sort_order: 2, planned_repetitions: 10, coach_notes: 'Peso ligero' },
        { exerciseName: 'Bar Pull Up',        sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'AMRAP',
        visible_title: 'WOD — AMRAP 20 min',
        notes: '♂ 52 kg Push Press · Box 24" | ♀ 34 kg · Box 20"',
        time_cap_seconds: 1200,
        exercises: [
          { exerciseName: 'Box Jump',          sort_order: 1, planned_repetitions: 30, coach_notes: '24" (♂) / 20" (♀)' },
          { exerciseName: 'Barbell Push Press', sort_order: 2, planned_repetitions: 20, planned_weight_value: 52, planned_weight_unit: 'Kilogramos', suggested_scaling: '34 kg (♀)' },
          { exerciseName: 'Bar Pull Up',        sort_order: 3, planned_repetitions: 30 },
        ],
      },
    ],
  },

  // 18. HANSEN
  {
    name: 'CrossFit Hero: Hansen',
    objective: '5 rondas — kettlebell swings, burpees y GHD sit-ups',
    general_notes: '5 Rondas For Time\nEn honor al SSgt Daniel Hansen.\n♂ 32 kg KB | ♀ 24 kg\nSit-ups en GHD.',
    estimated_duration_minutes: 35,
    sections: [
      warmup([
        { exerciseName: 'Kettlebell Swing', sort_order: 1, planned_repetitions: 10 },
        { exerciseName: 'Bodyweight Burpee', sort_order: 2, planned_repetitions: 5  },
        { exerciseName: 'GHD Sit-Up',       sort_order: 3, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ 32 kg KB | ♀ 24 kg',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Kettlebell Swing', sort_order: 1, planned_repetitions: 30, planned_weight_value: 32, planned_weight_unit: 'Kilogramos', suggested_scaling: '24 kg (♀)' },
          { exerciseName: 'Bodyweight Burpee', sort_order: 2, planned_repetitions: 30 },
          { exerciseName: 'GHD Sit-Up',       sort_order: 3, planned_repetitions: 30 },
        ],
      },
    ],
  },

  // 19. TYLER
  {
    name: 'CrossFit Hero: Tyler',
    objective: '5 rondas — Muscle-ups y Sumo Deadlift High Pulls',
    general_notes: '5 Rondas For Time\nEn honor al Cpl Tyler Condrey.\n♂ 34 kg Sumo DL HP | ♀ 25 kg',
    estimated_duration_minutes: 25,
    sections: [
      warmup([
        { exerciseName: 'Ring Strict Muscle Up',      sort_order: 1, planned_repetitions: 2, coach_notes: 'O ring row + dip' },
        { exerciseName: 'Barbell Sumo Deadlift High Pull', sort_order: 2, planned_repetitions: 10, coach_notes: 'Técnica' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 5 Rondas For Time',
        notes: '♂ 34 kg SDHP | ♀ 25 kg',
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Ring Strict Muscle Up',       sort_order: 1, planned_repetitions: 7  },
          { exerciseName: 'Barbell Sumo Deadlift High Pull', sort_order: 2, planned_repetitions: 21, planned_weight_value: 34, planned_weight_unit: 'Kilogramos', suggested_scaling: '25 kg (♀)' },
        ],
      },
    ],
  },

  // 20. STEPHEN
  {
    name: 'CrossFit Hero: Stephen',
    objective: 'For Time — 30-25-20-15-10-5 de GHD, extensiones y K2E',
    general_notes: 'For Time\nEn honor al Sgt Stephen Sutherland.\n6 bloques: 30-25-20-15-10-5 reps de cada movimiento + 40 Deadlifts por bloque.\n♂ 84 kg DL | ♀ 56 kg',
    estimated_duration_minutes: 35,
    sections: [
      warmup([
        { exerciseName: 'GHD Sit-Up',            sort_order: 1, planned_repetitions: 10 },
        { exerciseName: 'GHD Back Extension',     sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Hanging Knees to Elbows', sort_order: 3, planned_repetitions: 10 },
        { exerciseName: 'Barbell Deadlift',       sort_order: 4, planned_repetitions: 5, coach_notes: 'Peso ligero' },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (30-25-20-15-10-5)',
        general_description: '6 bloques en orden decreciente. Completar el bloque completo antes de bajar reps.',
        notes: 'Bloques: 30→25→20→15→10→5 reps de GHD Sit-up + Back Ext + K2E + 40 Deadlifts cada bloque.\n♂ 84 kg DL | ♀ 56 kg',
        exercises: [
          { exerciseName: 'GHD Sit-Up',            sort_order: 1, planned_repetitions: 30, coach_notes: 'Primer bloque (30 reps)' },
          { exerciseName: 'GHD Back Extension',     sort_order: 2, planned_repetitions: 30 },
          { exerciseName: 'Hanging Knees to Elbows', sort_order: 3, planned_repetitions: 30 },
          { exerciseName: 'Barbell Deadlift',       sort_order: 4, planned_repetitions: 40, planned_weight_value: 84, planned_weight_unit: 'Kilogramos', suggested_scaling: '56 kg (♀)', notes: '40 deadlifts en cada bloque' },
        ],
      },
    ],
  },

  // 21. GARRETT
  {
    name: 'CrossFit Hero: Garrett',
    objective: '3 rondas — squats, ring HSPU y pull-ups',
    general_notes: '3 Rondas For Time\nEn honor al Capt Garrett Lawton.',
    estimated_duration_minutes: 30,
    sections: [
      warmup([
        { exerciseName: 'Bodyweight Squat',       sort_order: 1, planned_repetitions: 15 },
        { exerciseName: 'Ring Handstand Push-Up', sort_order: 2, planned_repetitions: 3, coach_notes: 'O piked push-up en anillas' },
        { exerciseName: 'Bar Pull Up',            sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — 3 Rondas For Time',
        total_rounds: 3,
        exercises: [
          { exerciseName: 'Bodyweight Squat',       sort_order: 1, planned_repetitions: 75 },
          { exerciseName: 'Ring Handstand Push-Up', sort_order: 2, planned_repetitions: 25 },
          { exerciseName: 'Bar Pull Up',            sort_order: 3, planned_repetitions: 25 },
        ],
      },
    ],
  },
];

// ── Lógica compartida de inicialización ──────────────────────────────────────

async function loadMaps(db: SQLiteDBConnection) {
  // Verificar que los catálogos estén inicializados
  const sectionTypeCount = await db.query('SELECT COUNT(*) as count FROM section_type');
  if ((sectionTypeCount.values?.[0]?.count ?? 0) === 0) {
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

  return {
    diff:        new Map((diffRows.values        ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    muscle:      new Map((muscleRows.values       ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    equip:       new Map((equipRows.values        ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    section:     new Map((sectionRows.values      ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    sectionType: new Map((sectionTypeRows.values  ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    workFormat:  new Map((workFmtRows.values      ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    unit:        new Map((unitRows.values         ?? []).map((r: any) => [r.name, r.id] as [string, string])),
  };
}

async function ensureExercises(db: SQLiteDBConnection, maps: Awaited<ReturnType<typeof loadMaps>>) {
  for (const def of BENCHMARK_EXERCISES) {
    await getOrCreateExercise(db, def, maps);
  }
}

// ── Puntos de entrada ─────────────────────────────────────────────────────────

/**
 * Agrega las 21 plantillas "Girls" a la base de datos.
 * Operación aditiva. Requiere haber ejecutado "Inicializar Datos" previamente.
 */
export async function addGirlsTemplates(db: SQLiteDBConnection): Promise<void> {
  console.log('[Seed4] Iniciando Girls...');
  const maps = await loadMaps(db);
  await ensureExercises(db, maps);

  for (const tpl of GIRLS_TEMPLATES) {
    await createTemplate(db, tpl, maps);
  }

  const { saveDatabase } = await import('../db/database');
  await saveDatabase();
  console.log('[Seed4] Girls completadas.');
}

/**
 * Agrega las 21 plantillas "Heroes" a la base de datos.
 * Operación aditiva. Requiere haber ejecutado "Inicializar Datos" previamente.
 */
export async function addHeroesTemplates(db: SQLiteDBConnection): Promise<void> {
  console.log('[Seed4] Iniciando Heroes...');
  const maps = await loadMaps(db);
  await ensureExercises(db, maps);

  for (const tpl of HEROES_TEMPLATES) {
    await createTemplate(db, tpl, maps);
  }

  const { saveDatabase } = await import('../db/database');
  await saveDatabase();
  console.log('[Seed4] Heroes completados.');
}
