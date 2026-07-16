// Importa la Clase GOAT 15/07/2026 (ejercicios + secciones + tiempos del cronómetro).
// Generada con BKP/CREO_CLASE.md. Idempotente: getOrCreate no duplica ejercicios y
// la clase se verifica por nombre antes de insertarla.
import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_15_07_2026_done';
const CLASS_NAME = 'Clase GOAT 15/07/2026';

export function isClass15072026ImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

// ── Mapeo simplificado → granular (post "Cargar Datos Base") ──────────────────
const SIMPLIFIED_TO_GRANULAR: Record<string, string> = {
  'Deltoides':        'Deltoides anterior',
  'Cuádriceps':       'Recto femoral',
  'Isquiotibiales':   'Bíceps femoral',
  'Glúteos':          'Glúteo mayor',
  'Dorsales':         'Dorsal ancho',
  'Trapecio':         'Trapecio (superior)',
  'Bíceps':           'Bíceps braquial',
  'Tríceps':          'Tríceps braquial',
  'Pantorrillas':     'Gastrocnemio (gemelos)',
  'Core/Abdominales': 'Recto abdominal',
  'Antebrazos':       'Flexores antebrazo',
  'Pectorales':       'Pectoral mayor',
};

function toDbName(name: string): string {
  return SIMPLIFIED_TO_GRANULAR[name] ?? name;
}

interface ExerciseDef {
  name: string;
  description: string;
  technical_notes: string;
  difficulty: string;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string[];
  tags: string[];
  section_types: string[];
  units: string[];
  video_path?: string | null;
  video_long_path?: string | null;
  image_url: string;
  is_compound: number;
}

const EXERCISES: ExerciseDef[] = [
  // ── Activación ──
  {
    name: 'Scapular Push-Up',
    description: 'En plancha alta con codos extendidos, hacer protracción y retracción escapular moviendo el torso verticalmente pocos centímetros.',
    technical_notes: 'Los codos permanecen bloqueados: el movimiento nace de las escápulas, no de los brazos. Core firme para no hundir la cadera.',
    difficulty: 'Básico',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Pectorales', 'Core/Abdominales'],
    equipment: [],
    tags: ['gimnástico', 'movilidad', 'activación'],
    section_types: ['Activación', 'Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/scapular-push-up.svg',
    is_compound: 0,
  },
  {
    name: 'Cuban Press',
    description: 'Con discos o mancuernas livianas, remar hasta llevar los codos altos, rotar los antebrazos hacia arriba (rotación externa) y finalizar con un press por encima de la cabeza. Bajar por el mismo camino.',
    technical_notes: 'Pesos muy livianos. Los codos lideran el remo alto antes de la rotación. Movimiento lento y controlado en las tres fases.',
    difficulty: 'Intermedio',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Trapecio', 'Tríceps'],
    equipment: ['Disco'],
    tags: ['hombro', 'movilidad', 'activación', 'bilateral'],
    section_types: ['Activación', 'Entrada en calor'],
    units: ['Repeticiones', 'Kilogramos'],
    image_url: '/img/exercises/cuban-press.svg',
    is_compound: 1,
  },
  {
    name: 'Yoga Push-Up',
    description: 'Desde perro boca abajo (pica), bajar el cuerpo en un arco pasando cerca del piso y llevar el pecho al frente y arriba (cobra), luego revertir el recorrido.',
    technical_notes: 'Movimiento continuo y fluido. Hombros activos. El pecho roza cerca del suelo en la transición. Cadera baja al pasar a cobra.',
    difficulty: 'Básico',
    primary_muscle: 'Pectorales',
    secondary_muscles: ['Deltoides', 'Tríceps', 'Core/Abdominales'],
    equipment: [],
    tags: ['gimnástico', 'movilidad', 'push'],
    section_types: ['Activación', 'Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/_2aDj69aE9s',
    image_url: '/img/exercises/yoga-push-up.svg',
    is_compound: 1,
  },
  {
    name: 'Banded Triceps Extensions',
    description: 'De pie con una banda elástica anclada arriba, extender los codos empujando hacia abajo hasta bloquear los brazos, luego volver de forma controlada.',
    technical_notes: 'Los codos quedan pegados al cuerpo y fijos: sólo se mueve el antebrazo. Apretar el tríceps en la extensión final.',
    difficulty: 'Básico',
    primary_muscle: 'Tríceps',
    secondary_muscles: [],
    equipment: ['Banda elástica'],
    tags: ['monoarticular', 'push', 'activación'],
    section_types: ['Activación', 'Accesorio'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/banded-triceps-extensions.svg',
    is_compound: 0,
  },

  // ── Fuerza: core colgado ──
  {
    name: 'Hanging Leg Raise with Rotation Over Box',
    description: 'Colgado de la barra, elevar las piernas extendidas hasta la horizontal y rotar la cadera para llevar los pies por encima de un cajón ubicado al costado, alternando lados.',
    technical_notes: 'Piernas rectas durante la elevación. La rotación nace del control del core, no de balanceo. Evitar el impulso de kip: es un movimiento estricto.',
    difficulty: 'Avanzado',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Antebrazos', 'Dorsales', 'Cuádriceps'],
    equipment: ['Pull-up bar', 'Box de salto'],
    tags: ['core', 'gimnástico', 'unilateral'],
    section_types: ['Fuerza', 'Accesorio'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/rDtBVY3DBNg',
    video_long_path: 'https://www.youtube.com/watch?v=5RHbtTO2aWM',
    image_url: '/img/exercises/hanging-leg-raise-rotation-over-box.svg',
    is_compound: 1,
  },
  {
    name: 'Strict Knees to Elbows',
    description: 'Colgado de la barra sin impulso, flexionar la cadera para llevar las rodillas hasta tocar los codos, luego bajar de forma controlada.',
    technical_notes: 'Sin kip ni balanceo: el movimiento es estricto y controlado. Retracción escapular activa. Las rodillas se cierran hasta contactar los codos.',
    difficulty: 'Avanzado',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Antebrazos', 'Dorsales'],
    equipment: ['Pull-up bar'],
    tags: ['core', 'gimnástico', 'isométrico'],
    section_types: ['Fuerza', 'Accesorio'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/watch?v=_DUlB4YpZRw',
    video_long_path: 'https://www.youtube.com/watch?v=GjngdQYQhj8',
    image_url: '/img/exercises/strict-knees-to-elbows.svg',
    is_compound: 1,
  },
  {
    name: 'Hanging Toes to Bar',
    description: 'Colgado de la barra, llevar las puntas de los pies a tocar la barra por encima de las manos, luego bajar controlado.',
    technical_notes: 'Se puede usar kip para encadenar repeticiones. Los brazos quedan largos y el core dirige el movimiento. Evitar el balanceo excesivo.',
    difficulty: 'Avanzado',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Antebrazos', 'Dorsales', 'Cuádriceps'],
    equipment: ['Pull-up bar'],
    tags: ['core', 'gimnástico'],
    section_types: ['Fuerza', 'WOD'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/hanging-toes-to-bar.svg',
    is_compound: 1,
  },

  // ── WOD: en parejas ──
  {
    name: 'Alternating Single Arm Dumbbell Power Snatch',
    description: 'Arrancada de potencia con una sola mancuerna desde el piso hasta overhead, alternando el brazo en cada repetición.',
    technical_notes: 'La cadera impulsa el movimiento; el brazo sólo guía la mancuerna pegada al cuerpo. Recepción con el brazo bloqueado y el core firme.',
    difficulty: 'Intermedio',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Cuádriceps', 'Glúteos', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Mancuernas'],
    tags: ['olímpico', 'unilateral', 'pull'],
    section_types: ['WOD', 'Fuerza'],
    units: ['Repeticiones', 'Kilogramos'],
    image_url: '/img/exercises/alternating-single-arm-dumbbell-power-snatch.svg',
    is_compound: 1,
  },
  {
    name: 'Dumbbell Overhead Hold',
    description: 'Sostener una o dos mancuernas por encima de la cabeza con los brazos extendidos, manteniendo la posición estática.',
    technical_notes: 'Brazos bloqueados y bíceps cerca de las orejas. Abdomen y glúteos apretados para no arquear la espalda. Mirada al frente.',
    difficulty: 'Intermedio',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Tríceps', 'Core/Abdominales', 'Trapecio'],
    equipment: ['Mancuernas'],
    tags: ['hombro', 'isométrico', 'core'],
    section_types: ['WOD', 'Activación'],
    units: ['Segundos', 'Kilogramos'],
    image_url: '/img/exercises/dumbbell-overhead-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Wall Sit',
    description: 'Con la espalda apoyada en la pared, deslizar hasta que los muslos queden paralelos al piso (rodillas y cadera a 90°) y sostener la posición.',
    technical_notes: 'Rodillas alineadas con los tobillos, sin pasar la punta del pie. Espalda completa pegada a la pared. Peso repartido en los talones.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Core/Abdominales'],
    equipment: [],
    tags: ['sentadilla', 'isométrico', 'bilateral'],
    section_types: ['WOD', 'Activación'],
    units: ['Segundos'],
    image_url: '/img/exercises/wall-sit.svg',
    is_compound: 0,
  },
  {
    name: 'Bar Kip Swing',
    description: 'Balanceo (bamboleo) colgado de la barra alternando la posición hollow (cuerpo hacia adelante) y arch/superman (cuerpo hacia atrás), generando ritmo con hombros y core.',
    technical_notes: 'El balanceo nace del empuje de hombros contra la barra, no de doblar los brazos. Mantener el cuerpo tenso y el ritmo constante. Base del kipping.',
    difficulty: 'Intermedio',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Core/Abdominales', 'Deltoides', 'Antebrazos'],
    equipment: ['Pull-up bar'],
    tags: ['gimnástico', 'core', 'bilateral'],
    section_types: ['WOD', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/bar-kip-swing.svg',
    is_compound: 1,
  },
  {
    name: 'Running',
    description: 'Carrera continua a ritmo sostenido.',
    technical_notes: 'Zancada corta y cadencia alta. Respiración controlada.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Isquiotibiales', 'Glúteos', 'Pantorrillas'],
    equipment: [],
    tags: ['cardio', 'bilateral'],
    section_types: ['Entrada en calor', 'WOD'],
    units: ['Metros', 'Segundos'],
    image_url: '/img/exercises/running.svg',
    is_compound: 1,
  },

  // ── Vuelta a la calma ──
  {
    name: 'General Stretching',
    description: 'Serie libre de estiramientos de las cadenas trabajadas en la clase, sosteniendo cada posición sin rebotes.',
    technical_notes: 'Sostener entre 20 y 30 segundos por posición. Respirar hondo y aflojar en cada exhalación. Nunca llegar al dolor.',
    difficulty: 'Básico',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Glúteos', 'Cuádriceps', 'Dorsales'],
    equipment: [],
    tags: ['movilidad'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    image_url: '/img/exercises/general-stretching.svg',
    is_compound: 0,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
type Db = Awaited<ReturnType<typeof openDatabase>>;

interface CatalogMaps {
  difficulty: Map<string, string>;
  muscle: Map<string, string>;
  equipment: Map<string, string>;
  tag: Map<string, string>;
  sectionType: Map<string, string>;
  workFormat: Map<string, string>;
  unit: Map<string, string>;
}

async function getOrCreate(
  db: Db,
  def: ExerciseDef,
  maps: CatalogMaps
): Promise<{ id: string; created: boolean }> {
  const existing = await db.query(
    'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?)) AND is_active = 1',
    [def.name]
  );
  if (existing.values?.length) {
    return { id: existing.values[0].id as string, created: false };
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const id = generateUUID();
  const diffId = maps.difficulty.get(def.difficulty) ?? null;
  const primaryId = maps.muscle.get(toDbName(def.primary_muscle)) ?? null;

  await db.run(
    `INSERT INTO exercise
       (id, name, description, technical_notes, difficulty_level_id,
        primary_muscle_group_id, image_url, video_path, video_long_path,
        is_compound, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [id, def.name, def.description, def.technical_notes, diffId, primaryId,
     def.image_url, def.video_path ?? null, def.video_long_path ?? null,
     def.is_compound, now, now]
  );

  if (primaryId) {
    await db.run(
      'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,1)',
      [generateUUID(), id, primaryId]
    );
  }

  for (const secName of def.secondary_muscles) {
    const secId = maps.muscle.get(toDbName(secName));
    if (secId) {
      await db.run(
        'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,0)',
        [generateUUID(), id, secId]
      );
    }
  }

  for (const eqName of def.equipment) {
    const eqId = maps.equipment.get(eqName);
    if (eqId) {
      await db.run(
        'INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?,?,?,1)',
        [generateUUID(), id, eqId]
      );
    }
  }

  for (const tagName of def.tags) {
    const tagId = maps.tag.get(tagName);
    if (tagId) {
      await db.run(
        'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?,?,?)',
        [generateUUID(), id, tagId]
      );
    }
  }

  for (const stName of def.section_types) {
    const stId = maps.sectionType.get(stName);
    if (stId) {
      await db.run(
        'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?,?,?)',
        [generateUUID(), id, stId]
      );
    }
  }

  for (let i = 0; i < def.units.length; i++) {
    const uId = maps.unit.get(def.units[i]);
    if (uId) {
      await db.run(
        'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?,?,?,?)',
        [generateUUID(), id, uId, i === 0 ? 1 : 0]
      );
    }
  }

  return { id, created: true };
}

// ── Función principal ────────────────────────────────────────────────────────
export async function importClass15072026(): Promise<{ exercises: number; created: boolean }> {
  const db = await openDatabase();

  const existing = await db.query(
    'SELECT id FROM class_template WHERE name = ? AND is_active = 1',
    [CLASS_NAME]
  );
  if (existing.values?.length) {
    markDone();
    return { exercises: 0, created: false };
  }

  const rows = async (sql: string) => (await db.query(sql)).values ?? [];
  const toMap = (arr: Record<string, unknown>[]) =>
    new Map(arr.map((r) => [r.name as string, r.id as string]));

  const maps: CatalogMaps = {
    difficulty:  toMap(await rows('SELECT id, name FROM difficulty_level WHERE is_active = 1')),
    muscle:      toMap(await rows('SELECT id, name FROM muscle_group WHERE is_active = 1')),
    equipment:   toMap(await rows('SELECT id, name FROM equipment WHERE is_active = 1')),
    tag:         toMap(await rows('SELECT id, name FROM tag WHERE is_active = 1')),
    sectionType: toMap(await rows('SELECT id, name FROM section_type WHERE is_active = 1')),
    workFormat:  toMap(await rows('SELECT id, name FROM work_format WHERE is_active = 1')),
    unit:        toMap(await rows('SELECT id, name FROM measurement_unit WHERE is_active = 1')),
  };

  let exercisesCreated = 0;
  const ids: Record<string, string> = {};
  for (const def of EXERCISES) {
    const { id, created } = await getOrCreate(db, def, maps);
    ids[def.name] = id;
    if (created) exercisesCreated++;
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const kg = maps.unit.get('Kilogramos') ?? null;
  const meters = maps.unit.get('Metros') ?? null;

  const classId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, date, name, objective, general_notes, estimated_duration_minutes,
        is_favorite, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,0,1,?,?)`,
    [classId, '2026-07-15', CLASS_NAME,
     'Core colgado de la barra (leg raise con rotación, knees to elbows y toes to bar) + WOD en parejas de 15 minutos con snatch de mancuerna, sostenes isométricos, bamboleo y carrera',
     null, 40, now, now]
  );

  // Inserta una sección con sus tiempos de cronómetro
  async function addSection(
    sortOrder: number,
    sectionType: string,
    workFormat: string,
    visibleTitle: string,
    description: string,
    timeCap: number | null,
    totalRounds: number | null,
    timers: {
      restBetweenExercises?: number | null;
      restBetweenRounds?: number | null;
      restAfterSection?: number | null;
      intervalSeconds?: number | null;
    }
  ): Promise<string> {
    const sectionId = generateUUID();
    await db.run(
      `INSERT INTO class_section
         (id, class_template_id, section_type_id, work_format_id, sort_order,
          visible_title, general_description, time_cap_seconds, total_rounds,
          rest_between_rounds_seconds, notes, rest_between_exercises_seconds,
          rest_after_section_seconds, interval_seconds, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [sectionId, classId, maps.sectionType.get(sectionType) ?? null,
       maps.workFormat.get(workFormat) ?? null, sortOrder,
       visibleTitle, description, timeCap, totalRounds,
       timers.restBetweenRounds ?? null, null,
       timers.restBetweenExercises ?? null,
       timers.restAfterSection ?? null,
       timers.intervalSeconds ?? null,
       now, now]
    );
    return sectionId;
  }

  // Inserta un ejercicio de sección con su duración para el cronómetro
  async function addExercise(
    sectionId: string,
    exerciseName: string,
    sortOrder: number,
    data: {
      reps?: number | null;
      weight?: number | null;
      timeSeconds?: number | null;
      distance?: number | null;
      rounds?: number | null;
      suggestedTimer?: number | null;
      coachNotes?: string | null;
    }
  ): Promise<void> {
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, coach_notes,
          planned_repetitions, planned_weight_value, planned_weight_unit_id,
          planned_time_seconds, planned_distance_value, planned_distance_unit_id,
          planned_calories, planned_rest_seconds, planned_rounds, suggested_timer_seconds,
          rm_percentage, suggested_scaling, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [generateUUID(), sectionId, ids[exerciseName], sortOrder,
       data.coachNotes ?? null,
       data.reps ?? null,
       data.weight ?? null, data.weight != null ? kg : null,
       data.timeSeconds ?? null,
       data.distance ?? null, data.distance != null ? meters : null,
       null, null, data.rounds ?? null, data.suggestedTimer ?? null,
       null, null, null, now, now]
    );
  }

  // ── 1. Activación ── AMRAP 5' (mayor cantidad de vueltas)
  const activation = await addSection(
    1, 'Activación', 'AMRAP', 'Activación',
    'AMRAP 5 minutos: mayor cantidad de vueltas', 300, null,
    { restBetweenExercises: 0, restAfterSection: 90 }
  );
  await addExercise(activation, 'Scapular Push-Up', 1, { reps: 10, suggestedTimer: 20 });
  await addExercise(activation, 'Cuban Press', 2, { reps: 8, suggestedTimer: 25 });
  await addExercise(activation, 'Yoga Push-Up', 3, { reps: 6, suggestedTimer: 20 });
  await addExercise(activation, 'Banded Triceps Extensions', 4, { reps: 10, suggestedTimer: 20 });

  // ── 2. Fuerza A ── EMOM 3' (min 1-3): 30s trabajo / 30s descanso
  const strengthA = await addSection(
    2, 'Fuerza', 'EMOM', 'Fuerza A - Leg Raise',
    'Por minuto x 3 min: 30 s de trabajo y 30 s de descanso', 180, 3,
    { restAfterSection: 0 }
  );
  await addExercise(strengthA, 'Hanging Leg Raise with Rotation Over Box', 1, {
    timeSeconds: 30, coachNotes: 'Pasar los pies por encima del cajón, alternando lados',
  });

  // ── 3. Fuerza B ── EMOM 3' (min 4-6): 30s trabajo / 30s descanso
  const strengthB = await addSection(
    3, 'Fuerza', 'EMOM', 'Fuerza B - Knees to Elbows',
    'Por minuto x 3 min: 30 s de trabajo y 30 s de descanso', 180, 3,
    { restAfterSection: 0 }
  );
  await addExercise(strengthB, 'Strict Knees to Elbows', 1, {
    timeSeconds: 30, coachNotes: 'Estricto, sin kip',
  });

  // ── 4. Fuerza C ── (min 7-9): 10s de trabajo, 2 veces por minuto → ventana de 30s x 6
  const strengthC = await addSection(
    4, 'Fuerza', 'EMOM', 'Fuerza C - Toes to Bar',
    'Últimos 3 min: 10 s de trabajo, 2 veces por minuto (descanso el resto)', 180, 6,
    { intervalSeconds: 30, restAfterSection: 90 }
  );
  await addExercise(strengthC, 'Hanging Toes to Bar', 1, {
    timeSeconds: 10, coachNotes: 'Máximas reps en 10 s; 2 tandas por minuto',
  });

  // ── 5. WOD ── For Time 15' en parejas (chipper: uno trabaja, el otro sostiene)
  const wod = await addSection(
    5, 'WOD', 'For Time', 'WOD',
    'Máximo 15 minutos en parejas: uno trabaja y el otro sostiene la posición isométrica; el bamboleo y la carrera se hacen juntos',
    900, null,
    { restBetweenExercises: 0, restBetweenRounds: 0, restAfterSection: 60 }
  );
  await addExercise(wod, 'Alternating Single Arm Dumbbell Power Snatch', 1, {
    reps: 15, suggestedTimer: 45,
    coachNotes: 'En parejas se alternan (2 turnos c/u): uno hace 15 mientras el otro sostiene DB overhead',
  });
  await addExercise(wod, 'Dumbbell Overhead Hold', 2, {
    timeSeconds: 45, coachNotes: 'Sostener mientras el compañero hace el snatch',
  });
  await addExercise(wod, 'Hanging Toes to Bar', 3, {
    reps: 10, suggestedTimer: 50,
    coachNotes: 'En parejas se alternan (2 turnos c/u): uno hace 10 mientras el otro está en Wall Sit',
  });
  await addExercise(wod, 'Wall Sit', 4, {
    timeSeconds: 45, coachNotes: 'Sostener mientras el compañero hace Toes to Bar',
  });
  await addExercise(wod, 'Bar Kip Swing', 5, {
    reps: 30, suggestedTimer: 30, coachNotes: 'Bamboleo — ambos juntos',
  });
  await addExercise(wod, 'Running', 6, {
    distance: 400, suggestedTimer: 100, coachNotes: 'Ambos juntos',
  });
  await addExercise(wod, 'Bar Kip Swing', 7, {
    reps: 30, suggestedTimer: 30, coachNotes: 'Bamboleo — ambos juntos',
  });
  await addExercise(wod, 'Hanging Toes to Bar', 8, {
    reps: 10, suggestedTimer: 50,
    coachNotes: 'En parejas se alternan (2 turnos c/u); el otro en Wall Sit',
  });
  await addExercise(wod, 'Wall Sit', 9, {
    timeSeconds: 45, coachNotes: 'Sostener mientras el compañero hace Toes to Bar',
  });
  await addExercise(wod, 'Alternating Single Arm Dumbbell Power Snatch', 10, {
    reps: 15, suggestedTimer: 45,
    coachNotes: 'En parejas se alternan (2 turnos c/u); el otro sostiene DB overhead',
  });
  await addExercise(wod, 'Dumbbell Overhead Hold', 11, {
    timeSeconds: 45, coachNotes: 'Sostener mientras el compañero hace el snatch',
  });

  // ── 6. Estiramiento ──
  const cooldown = await addSection(
    6, 'Vuelta a la calma', 'Trabajo libre', 'Estiramiento',
    '5 minutos de estiramientos y vuelta a la calma', 300, null,
    {}
  );
  await addExercise(cooldown, 'General Stretching', 1, { timeSeconds: 300 });

  await saveDatabase();
  markDone();
  return { exercises: exercisesCreated, created: true };
}
