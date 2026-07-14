// Importa la Clase GOAT 13/07/2026 (ejercicios + secciones + tiempos del cronómetro).
// Generada con BKP/CREO_CLASE.md. Idempotente: getOrCreate no duplica ejercicios y
// la clase se verifica por nombre antes de insertarla.
import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_13_07_2026_done';
const CLASS_NAME = 'Clase GOAT 13/07/2026';

export function isClass13072026ImportDone(): boolean {
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
  // ── Movilidad ──
  {
    name: 'Cossack Squat',
    description: 'Sentadilla lateral profunda: se flexiona una pierna mientras la otra queda extendida al costado, alternando lados.',
    technical_notes: 'Talón de la pierna que trabaja siempre apoyado. Torso lo más erguido posible. Rango controlado, sin rebotes.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'sentadilla', 'unilateral'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/cossack-squat.svg',
    is_compound: 1,
  },
  {
    name: '90/90 Hip Rotation',
    description: 'Sentado con ambas piernas en 90° (una adelante, una al costado), rotar el torso y la cadera hacia el lado contrario.',
    technical_notes: 'Espalda recta. Las rodillas se mantienen en 90°. Movimiento activo, sin forzar el rango.',
    difficulty: 'Básico',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/hip-90-90-rotation.svg',
    is_compound: 0,
  },
  {
    name: 'Band Pass-Through',
    description: 'De pie con una banda elástica tomada con agarre ancho, pasar los brazos extendidos desde adelante, por encima de la cabeza, hasta la espalda, y volver.',
    technical_notes: 'Codos siempre extendidos. Si el hombro se cierra, ampliar el agarre. Movimiento lento, sin tirones.',
    difficulty: 'Básico',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Trapecio', 'Pectorales'],
    equipment: ['Banda elástica'],
    tags: ['hombro', 'movilidad', 'bilateral'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/07lFW_Ulz6E',
    video_long_path: 'https://www.youtube.com/shorts/ErTGd0_Mpzo',
    image_url: '/img/exercises/band-pass-through.svg',
    is_compound: 0,
  },

  // ── Activación ──
  {
    name: 'Hollow Hold',
    description: 'Boca arriba, con la zona lumbar pegada al piso, elevar hombros y piernas formando una banana y sostener la posición.',
    technical_notes: 'La lumbar no se despega del suelo: si lo hace, subir las piernas. Respirar sin perder la tensión.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Cuádriceps', 'Deltoides'],
    equipment: [],
    tags: ['core', 'isométrico', 'gimnástico'],
    section_types: ['Activación', 'Accesorio'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/hollow-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Dynamic Hollow Hold',
    description: 'Desde la posición de hollow, abrir y cerrar el ángulo llevando brazos y piernas hacia afuera y hacia adentro sin perder la banana.',
    technical_notes: 'La lumbar sigue pegada al piso durante todo el recorrido. Si se despega, reducir el rango de apertura.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Cuádriceps', 'Deltoides'],
    equipment: [],
    tags: ['core', 'gimnástico', 'activación'],
    section_types: ['Activación', 'Accesorio'],
    units: ['Segundos', 'Repeticiones'],
    video_path: 'https://www.youtube.com/watch?v=h-beMdJ1CVo',
    video_long_path: 'https://www.youtube.com/shorts/vhru5daVb6M',
    image_url: '/img/exercises/hollow-rock.svg',
    is_compound: 0,
  },
  {
    name: 'Kettlebell Deadlift',
    description: 'Peso muerto con una kettlebell entre los pies: bisagra de cadera para bajar y extensión completa para subir.',
    technical_notes: 'Espalda neutra, pecho arriba. El movimiento nace de la cadera, no de la espalda baja. La campana viaja pegada a las piernas.',
    difficulty: 'Básico',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Glúteos', 'Cuádriceps', 'Core/Abdominales'],
    equipment: ['Kettlebell'],
    tags: ['pull', 'bilateral', 'activación'],
    section_types: ['Activación', 'Fuerza'],
    units: ['Repeticiones', 'Kilogramos', 'Segundos'],
    video_path: 'https://www.youtube.com/watch?v=l6gDwf3xC6s',
    video_long_path: 'https://www.youtube.com/shorts/1KY_4fs1yns',
    image_url: '/img/exercises/kettlebell-deadlift.svg',
    is_compound: 1,
  },
  {
    name: 'Kettlebell Swing',
    description: 'Balanceo de la kettlebell desde entre las piernas hasta la altura del pecho, impulsado por la extensión explosiva de la cadera.',
    technical_notes: 'Es una bisagra de cadera, no una sentadilla. Los brazos sólo acompañan. Glúteos y abdomen apretados arriba.',
    difficulty: 'Intermedio',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Isquiotibiales', 'Core/Abdominales', 'Deltoides'],
    equipment: ['Kettlebell'],
    tags: ['cardio', 'pull', 'bilateral'],
    section_types: ['Activación', 'WOD'],
    units: ['Repeticiones', 'Kilogramos', 'Segundos'],
    image_url: '/img/exercises/kettlebell-swing.svg',
    is_compound: 1,
  },

  // ── Fuerza: complex de cargadas desde hang ──
  {
    name: 'Barbell High Hang Power Clean',
    description: 'Cargada de potencia desde el hang alto: la barra arranca en el pliegue de la cadera y se recibe en front rack por encima del paralelo.',
    technical_notes: 'Recorrido corto: todo depende de la extensión explosiva de cadera. Codos rápidos al recibir. Hombros por encima de la barra al iniciar.',
    difficulty: 'Avanzado',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Trapecio', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    section_types: ['Fuerza', 'Habilidad'],
    units: ['Kilogramos', 'Repeticiones'],
    video_path: 'https://www.youtube.com/watch?v=g3fj757-XSA',
    video_long_path: 'https://www.youtube.com/shorts/SLtiLAexbTc',
    image_url: '/img/exercises/barbell-high-hang-power-clean.svg',
    is_compound: 1,
  },
  {
    name: 'Barbell Hang Power Clean',
    description: 'Cargada de potencia desde el hang: la barra arranca a la altura de la rodilla o el muslo y se recibe en front rack sin sentadilla completa.',
    technical_notes: 'Extensión de cadera antes de tirar con los brazos. La barra roza el muslo. Recepción con los codos altos.',
    difficulty: 'Avanzado',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Trapecio', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    section_types: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/barbell-hang-power-clean.svg',
    is_compound: 1,
  },
  {
    name: 'Barbell Low Hang Power Clean',
    description: 'Cargada de potencia desde el hang bajo: la barra arranca por debajo de la rodilla, con el torso inclinado, y se recibe en front rack.',
    technical_notes: 'Posición más exigente para la espalda: mantenerla neutra y los hombros delante de la barra. Paciencia en el primer tirón.',
    difficulty: 'Avanzado',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Isquiotibiales', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    section_types: ['Fuerza', 'Habilidad'],
    units: ['Kilogramos', 'Repeticiones'],
    video_path: 'https://www.youtube.com/shorts/7jfezrErG1Q',
    video_long_path: 'https://www.youtube.com/shorts/pxUhO2kZM38',
    image_url: '/img/exercises/barbell-low-hang-power-clean.svg',
    is_compound: 1,
  },

  // ── WOD ──
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
  {
    name: 'Barbell Deadlift',
    description: 'Peso muerto con barra desde el suelo hasta la extensión completa de cadera y rodillas.',
    technical_notes: 'Espalda neutra durante todo el recorrido. La barra roza las piernas. Se termina con glúteos apretados, sin hiperextender.',
    difficulty: 'Intermedio',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Glúteos', 'Cuádriceps', 'Dorsales', 'Trapecio'],
    equipment: ['Barra olímpica'],
    tags: ['pull', 'bilateral'],
    section_types: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/barbell-deadlift.svg',
    is_compound: 1,
  },
  {
    name: 'Shoulder Press',
    description: 'Press estricto de hombros: desde el front rack se empuja la barra hasta overhead sin ayuda de las piernas.',
    technical_notes: 'Abdomen y glúteos apretados para no arquear la espalda. La cabeza se retrae apenas para dejar pasar la barra.',
    difficulty: 'Intermedio',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Tríceps', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['press', 'push', 'bilateral'],
    section_types: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Repeticiones'],
    video_path: 'https://www.youtube.com/shorts/Xur1K3Z8q0U',
    video_long_path: 'https://www.youtube.com/watch?v=5yWaNOvgFCM',
    image_url: '/img/exercises/shoulder-press.svg',
    is_compound: 1,
  },
  {
    name: 'Burpee Over the Bar',
    description: 'Burpee completo seguido de un salto lateral por encima de la barra.',
    technical_notes: 'Pecho y muslos al piso en cada repetición. El salto puede ser con dos pies o pasando de a uno según la escala.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Pectorales', 'Tríceps', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['cardio', 'pliométrico', 'bilateral'],
    section_types: ['WOD'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/burpee-over-the-bar.svg',
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
export async function importClass13072026(): Promise<{ exercises: number; created: boolean }> {
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
    [classId, '2026-07-13', CLASS_NAME,
     'Complex de cargada de potencia desde las tres posiciones de hang (alto, medio y bajo) + AMRAP de 10 minutos con barra y carrera',
     null, 60, now, now]
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

  // ── 1. Calentamiento ──
  // El MD no detalla movimientos, pero una sección sin ejercicios el cronómetro la
  // saltea (CREO_CLASE.md §7.5): se carga la carrera suave que cubre los 6 minutos.
  const warmup = await addSection(
    1, 'Entrada en calor', 'Trabajo libre', 'Calentamiento',
    '6 minutos de calentamiento general', 360, null,
    { restAfterSection: 60 }
  );
  await addExercise(warmup, 'Running', 1, {
    timeSeconds: 360,
    coachNotes: 'Calentamiento general a ritmo suave',
  });

  // ── 2. Movilidad ──
  const mobility = await addSection(
    2, 'Entrada en calor', 'Por rondas', 'Movilidad',
    '2 rondas, todo 30 segundos', null, 2,
    { restBetweenExercises: 10, restBetweenRounds: 0, restAfterSection: 60 }
  );
  await addExercise(mobility, 'Cossack Squat', 1, { timeSeconds: 30 });
  await addExercise(mobility, '90/90 Hip Rotation', 2, { timeSeconds: 30 });
  await addExercise(mobility, 'Band Pass-Through', 3, { timeSeconds: 30 });

  // ── 3. Activación ──
  const activation = await addSection(
    3, 'Activación', 'Por rondas', 'Activación',
    '3 rondas, todo 30 segundos', null, 3,
    { restBetweenExercises: 10, restBetweenRounds: 30, restAfterSection: 90 }
  );
  await addExercise(activation, 'Hollow Hold', 1, { timeSeconds: 30 });
  await addExercise(activation, 'Dynamic Hollow Hold', 2, { timeSeconds: 30 });
  await addExercise(activation, 'Kettlebell Deadlift', 3, { timeSeconds: 30, weight: 12.5 });
  await addExercise(activation, 'Kettlebell Swing', 4, { timeSeconds: 30, weight: 12.5 });

  // ── 4. Fuerza: complex de cargadas ──
  // El MD dice "6 rondas cada 1.5 minutos" con el complex de los 3 ejercicios dentro de
  // cada ronda. No se usa un formato de intervalo porque el cronómetro le daría una
  // ventana a CADA ejercicio: se arma la ronda con trabajo + descanso de vuelta para
  // que cierre en los 90 segundos (3 x 20s de trabajo + 30s de descanso).
  const strength = await addSection(
    4, 'Fuerza', 'Por rondas', 'Fuerza - Complex de cargadas',
    '6 rondas cada 1.5 minutos, complex de los 3 ejercicios. Pesos por ronda: 30, 40, 40, 50, 50, 40 kg',
    540, 6,
    { restBetweenExercises: 0, restBetweenRounds: 30, restAfterSection: 120 }
  );
  await addExercise(strength, 'Barbell High Hang Power Clean', 1, {
    reps: 1, weight: 30, suggestedTimer: 20, coachNotes: 'a — hang alto (pliegue de cadera)',
  });
  await addExercise(strength, 'Barbell Hang Power Clean', 2, {
    reps: 1, weight: 30, suggestedTimer: 20, coachNotes: 'b — hang medio (rodilla)',
  });
  await addExercise(strength, 'Barbell Low Hang Power Clean', 3, {
    reps: 1, weight: 30, suggestedTimer: 20, coachNotes: 'c — hang bajo (debajo de la rodilla)',
  });

  // ── 5. WOD ──
  const wod = await addSection(
    5, 'WOD', 'AMRAP', 'WOD',
    'AMRAP 10 minutos (aprox. 3 rondas)', 600, 3,
    { restBetweenExercises: 0, restBetweenRounds: 0, restAfterSection: 60 }
  );
  await addExercise(wod, 'Running', 1, { distance: 200, suggestedTimer: 50 });
  await addExercise(wod, 'Barbell Deadlift', 2, {
    reps: 3, weight: 40, rounds: 3, suggestedTimer: 15,
    coachNotes: '3 vueltas del complex: 3 deadlift + 2 hang power clean + 1 shoulder press',
  });
  await addExercise(wod, 'Barbell Hang Power Clean', 3, {
    reps: 2, weight: 40, rounds: 3, suggestedTimer: 15,
  });
  await addExercise(wod, 'Shoulder Press', 4, {
    reps: 1, weight: 40, rounds: 3, suggestedTimer: 15,
  });
  await addExercise(wod, 'Burpee Over the Bar', 5, { reps: 5, suggestedTimer: 15 });

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
