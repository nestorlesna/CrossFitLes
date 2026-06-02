// Servicio de importación de la Clase GOAT 01/06/2026
// Crea los ejercicios (con músculos, equipo, tags, secciones y unidades),
// la plantilla de clase y sus secciones. Idempotente: no duplica si ya existe.
import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_01_06_2026_done';
const CLASS_NAME = 'Clase GOAT 01/06/2026';
const CLASS_DATE = '2026-06-01';

export function isClass01062026ImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

// ── Mapeo simplificado → granular (post "Cargar Datos Base") ──────────────────
const SIMPLIFIED_TO_GRANULAR: Record<string, string> = {
  'Deltoides': 'Deltoides anterior',
  'Cuádriceps': 'Recto femoral',
  'Isquiotibiales': 'Bíceps femoral',
  'Glúteos': 'Glúteo mayor',
  'Dorsales': 'Dorsal ancho',
  'Trapecio': 'Trapecio (superior)',
  'Bíceps': 'Bíceps braquial',
  'Tríceps': 'Tríceps braquial',
  'Pantorrillas': 'Gastrocnemio (gemelos)',
  'Core/Abdominales': 'Recto abdominal',
  'Antebrazos': 'Flexores antebrazo',
  'Pectorales': 'Pectoral mayor',
};

function toDbName(name: string): string {
  return SIMPLIFIED_TO_GRANULAR[name] ?? name;
}

// ── Definición de ejercicios ─────────────────────────────────────────────────
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
    name: 'Kettlebell Good Morning to Squat',
    description:
      'Con una kettlebell sostenida en el pecho (goblet), realizar un good morning (bisagra de cadera con espalda recta) y, al volver, encadenar una sentadilla profunda.',
    technical_notes:
      'La bisagra es de cadera, no de espalda; mantener la columna neutra. En la sentadilla, rodillas siguiendo la línea de los pies.',
    difficulty: 'Básico',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Glúteos', 'Cuádriceps', 'Core/Abdominales'],
    equipment: ['Kettlebell'],
    tags: ['movilidad', 'bilateral'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos', 'Kilogramos'],
    video_path: 'https://www.youtube.com/watch?v=jyV_TwPdbKM',
    image_url: '/img/exercises/kettlebell-good-morning-to-squat.svg',
    is_compound: 1,
  },
  {
    name: 'Half-Kneeling Ankle Dorsiflexion Stretch',
    description:
      'En posición de medio arrodillado (una rodilla en el suelo, la otra pierna al frente con el pie apoyado), llevar la rodilla delantera hacia adelante sobre los dedos del pie para estirar el tobillo, manteniendo el talón en el suelo.',
    technical_notes:
      'El talón nunca se levanta del suelo. Movimiento controlado. Trabajar cada tobillo por separado.',
    difficulty: 'Básico',
    primary_muscle: 'Pantorrillas',
    secondary_muscles: ['Isquiotibiales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
    video_path: 'https://www.youtube.com/shorts/ODDP2EomsWs',
    video_long_path: 'https://www.youtube.com/shorts/7jOwuwNk8OM',
    image_url: '/img/exercises/half-kneeling-ankle-dorsiflexion-stretch.svg',
    is_compound: 0,
  },
  // ── Activación ──
  {
    name: 'Bird Dog Crunch',
    description:
      'Desde cuadrupedia, extender el brazo y la pierna opuestos hasta quedar alineados, luego flexionar llevando el codo a la rodilla por debajo del cuerpo (crunch) y volver a extender.',
    technical_notes:
      'Mantener la cadera nivelada y el core activo. No rotar el tronco. Movimiento lento y controlado.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Glúteos', 'Deltoides'],
    equipment: [],
    tags: ['core', 'activación', 'unilateral'],
    section_types: ['Activación'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/watch?v=A3HGdX53U0s',
    video_long_path: 'https://www.youtube.com/watch?v=hgB5ftP-JOg',
    image_url: '/img/exercises/bird-dog-crunch.svg',
    is_compound: 0,
  },
  {
    name: 'V-Up',
    description:
      'Tumbado boca arriba con los brazos extendidos sobre la cabeza, elevar simultáneamente piernas y torso para tocar los pies formando una "V", luego bajar con control.',
    technical_notes:
      'Piernas rectas. El movimiento parte del core, no del impulso. Bajar sin golpear el suelo.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Cuádriceps'],
    equipment: [],
    tags: ['core', 'gimnástico'],
    section_types: ['Activación'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/watch?v=iP2fjvG0g3w',
    video_long_path: 'https://www.youtube.com/watch?v=7UVgs18Y1P4',
    image_url: '/img/exercises/v-up.svg',
    is_compound: 0,
  },
  {
    name: 'Scapular Push-Up',
    description:
      'En posición de plancha alta, sin doblar los codos, hacer protracción y retracción escapular moviendo el torso verticalmente pocos centímetros.',
    technical_notes:
      'Los codos permanecen extendidos siempre. Es un movimiento de las escápulas, no de los brazos. Core activo.',
    difficulty: 'Básico',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Pectorales', 'Core/Abdominales'],
    equipment: [],
    tags: ['gimnástico', 'movilidad', 'activación'],
    section_types: ['Activación'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/scapular-push-up.svg',
    is_compound: 0,
  },
  {
    name: 'Toe Touch Sit-Up',
    description:
      'Tumbado boca arriba con piernas elevadas y rectas, hacer un sit-up llevando las manos a tocar la punta de los pies, luego bajar con control.',
    technical_notes:
      'Piernas lo más rectas posible. Subir con el abdomen, sin tirones de cuello. Espalda baja controlada al bajar.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Cuádriceps'],
    equipment: [],
    tags: ['core', 'gimnástico'],
    section_types: ['Activación'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/toe-touch-sit-up.svg',
    is_compound: 0,
  },
  // ── Fuerza ──
  {
    name: 'Hanging Flutter Kicks',
    description:
      'Colgado de la barra, mantener las piernas extendidas al frente y alternar pequeños movimientos verticales (aleteo) de cada pierna sin bajarlas.',
    technical_notes:
      'Core firme para evitar el balanceo. Piernas rectas. Rango pequeño y constante.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Cuádriceps', 'Antebrazos'],
    equipment: ['Pull-up bar'],
    tags: ['core', 'gimnástico'],
    section_types: ['Fuerza'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/7HX_lw25_0U',
    video_long_path: 'https://www.youtube.com/shorts/_eyZ-5dP5qU',
    image_url: '/img/exercises/hanging-flutter-kicks.svg',
    is_compound: 0,
  },
  {
    name: 'Single-Leg Pallof Press',
    description:
      'De pie sobre una sola pierna, sosteniendo una banda anclada lateralmente a la altura del pecho. Extender los brazos al frente resistiendo la rotación y volver al pecho, manteniendo el equilibrio.',
    technical_notes:
      'Ejercicio anti-rotación: el tronco no debe girar. Core y glúteo de la pierna de apoyo activos. Ejecutar de cada lado.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Glúteos', 'Deltoides'],
    equipment: ['Banda elástica'],
    tags: ['core', 'unilateral', 'isométrico'],
    section_types: ['Fuerza', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/F4b8x2vyUG8',
    video_long_path: 'https://www.youtube.com/shorts/pZPS6LeP8oc',
    image_url: '/img/exercises/single-leg-pallof-press.svg',
    is_compound: 0,
  },
  {
    name: 'Dumbbell Row',
    description:
      'Inclinado al frente con la espalda recta, sostener una mancuerna con el brazo extendido y traccionar hacia la cadera llevando el codo hacia atrás, luego bajar con control. Un brazo a la vez.',
    technical_notes:
      'Espalda neutra, sin rotar el tronco. El codo va pegado al cuerpo. Apretar la escápula al final del jalón.',
    difficulty: 'Básico',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Bíceps', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Mancuernas'],
    tags: ['pull', 'unilateral'],
    section_types: ['Fuerza'],
    units: ['Kilogramos', 'Repeticiones'],
    video_path: 'https://www.youtube.com/shorts/i9BJwVCK5VQ',
    video_long_path: 'https://www.youtube.com/shorts/H127qnBvFrM',
    image_url: '/img/exercises/dumbbell-row.svg',
    is_compound: 1,
  },
  // ── WOD ──
  {
    name: 'Barbell Thruster',
    description:
      'Con la barra en posición frontal (front rack), realizar una sentadilla completa y, al subir, usar el impulso de las piernas para empujar la barra por encima de la cabeza en un solo movimiento fluido.',
    technical_notes:
      'La sentadilla llega a profundidad completa. El empuje overhead aprovecha la extensión de cadera y rodillas. Terminar con la barra alineada sobre la cabeza.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Deltoides', 'Glúteos', 'Tríceps', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'push', 'press', 'bilateral'],
    section_types: ['WOD', 'Fuerza'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/barbell-thruster.svg',
    is_compound: 1,
  },
  {
    name: 'Power Clean',
    description:
      'Levantamiento olímpico: desde el suelo, tirar la barra con potencia y recibirla en los hombros (front rack) en una sentadilla parcial, terminando de pie.',
    technical_notes:
      'La extensión de cadera es explosiva. Recibir con los codos altos y rápidos. Espalda neutra durante todo el tirón.',
    difficulty: 'Avanzado',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Trapecio', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    section_types: ['WOD', 'Fuerza'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/power-clean.svg',
    is_compound: 1,
  },
  {
    name: 'Alternating Single-Arm DB Power Snatch',
    description:
      'Con una sola mancuerna, llevarla desde el suelo hasta overhead en un movimiento explosivo, alternando el brazo en cada repetición.',
    technical_notes:
      'La cadera impulsa el movimiento. La mancuerna sube pegada al cuerpo. Recibir con el brazo bloqueado overhead.',
    difficulty: 'Intermedio',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Cuádriceps', 'Glúteos', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Mancuernas'],
    tags: ['olímpico', 'unilateral'],
    section_types: ['WOD', 'Fuerza'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/alternating-single-arm-dumbbell-power-snatch.svg',
    is_compound: 1,
  },
  {
    name: 'Box Jump Over',
    description:
      'Saltar sobre un cajón pasando al otro lado, ya sea aterrizando arriba y bajando, o pasando por encima en un solo salto.',
    technical_notes:
      'Aterrizaje suave con rodillas flexionadas. Extensión completa de cadera arriba. Ritmo controlado para no fallar el salto.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Isquiotibiales', 'Pantorrillas'],
    equipment: ['Box de salto'],
    tags: ['cardio', 'pliométrico', 'bilateral'],
    section_types: ['WOD'],
    units: ['Repeticiones'],
    image_url: '/img/exercises/box-jump-over.svg',
    is_compound: 1,
  },
];

// ── Helper: crear ejercicio si no existe ───────────────────────────────────────
interface Maps {
  difficulty: Map<string, string>;
  muscle: Map<string, string>;
  equipment: Map<string, string>;
  tag: Map<string, string>;
  sectionType: Map<string, string>;
  workFormat: Map<string, string>;
  unit: Map<string, string>;
}

async function getOrCreate(
  db: any,
  exerciseDef: ExerciseDef,
  maps: Maps
): Promise<{ id: string; created: boolean }> {
  const existing = await db.query(
    'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?)) AND is_active = 1',
    [exerciseDef.name]
  );
  if (existing.values?.length) {
    return { id: existing.values[0].id, created: false };
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const id = generateUUID();
  const diffId = maps.difficulty.get(exerciseDef.difficulty) ?? null;
  const primaryId = maps.muscle.get(toDbName(exerciseDef.primary_muscle)) ?? null;

  await db.run(
    `INSERT INTO exercise
       (id, name, description, technical_notes, difficulty_level_id,
        primary_muscle_group_id, image_url, video_path, video_long_path,
        is_compound, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [id, exerciseDef.name, exerciseDef.description, exerciseDef.technical_notes,
     diffId, primaryId, exerciseDef.image_url,
     exerciseDef.video_path ?? null, exerciseDef.video_long_path ?? null,
     exerciseDef.is_compound, now, now]
  );

  // Músculo primario
  if (primaryId) {
    await db.run(
      'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,1)',
      [generateUUID(), id, primaryId]
    );
  }

  // Músculos secundarios
  for (const secName of exerciseDef.secondary_muscles) {
    const secId = maps.muscle.get(toDbName(secName));
    if (secId) {
      await db.run(
        'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,0)',
        [generateUUID(), id, secId]
      );
    }
  }

  // Equipamiento
  for (const eqName of exerciseDef.equipment) {
    const eqId = maps.equipment.get(eqName);
    if (eqId) {
      await db.run(
        'INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?,?,?,1)',
        [generateUUID(), id, eqId]
      );
    }
  }

  // Tags
  for (const tagName of exerciseDef.tags) {
    const tagId = maps.tag.get(tagName);
    if (tagId) {
      await db.run(
        'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?,?,?)',
        [generateUUID(), id, tagId]
      );
    }
  }

  // Tipos de sección
  for (const stName of exerciseDef.section_types) {
    const stId = maps.sectionType.get(stName);
    if (stId) {
      await db.run(
        'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?,?,?)',
        [generateUUID(), id, stId]
      );
    }
  }

  // Unidades (primera = default)
  for (let i = 0; i < exerciseDef.units.length; i++) {
    const uId = maps.unit.get(exerciseDef.units[i]);
    if (uId) {
      await db.run(
        'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?,?,?,?)',
        [generateUUID(), id, uId, i === 0 ? 1 : 0]
      );
    }
  }

  return { id, created: true };
}

// ── Función principal ───────────────────────────────────────────────────────
export async function importClass01062026(): Promise<{ exercises: number; created: boolean }> {
  const db = await openDatabase();

  // Guardia: clase ya importada
  const existing = await db.query(
    'SELECT id FROM class_template WHERE name = ? AND is_active = 1',
    [CLASS_NAME]
  );
  if (existing.values?.length) {
    markDone();
    return { exercises: 0, created: false };
  }

  // Cargar mapas de catálogos
  const rows = async (sql: string) => (await db.query(sql)).values ?? [];
  const toMap = (arr: any[]) => new Map(arr.map((r) => [r.name as string, r.id as string]));

  const maps: Maps = {
    difficulty: toMap(await rows('SELECT id, name FROM difficulty_level WHERE is_active = 1')),
    muscle: toMap(await rows('SELECT id, name FROM muscle_group WHERE is_active = 1')),
    equipment: toMap(await rows('SELECT id, name FROM equipment WHERE is_active = 1')),
    tag: toMap(await rows('SELECT id, name FROM tag WHERE is_active = 1')),
    sectionType: toMap(await rows('SELECT id, name FROM section_type WHERE is_active = 1')),
    workFormat: toMap(await rows('SELECT id, name FROM work_format WHERE is_active = 1')),
    unit: toMap(await rows('SELECT id, name FROM measurement_unit WHERE is_active = 1')),
  };

  // Crear ejercicios (idempotente)
  let exercisesCreated = 0;
  const ex: Record<string, string> = {};
  for (const def of EXERCISES) {
    const { id, created } = await getOrCreate(db, def, maps);
    ex[def.name] = id;
    if (created) exercisesCreated++;
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const kgId = maps.unit.get('Kilogramos') ?? null;

  // ── Plantilla de clase ──────────────────────────────────────────────────────
  const classId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, date, name, objective, general_notes, estimated_duration_minutes,
        is_favorite, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,0,1,?,?)`,
    [classId, CLASS_DATE, CLASS_NAME,
     'Core y movilidad de tobillo, fuerza en intervalos (flutter kicks, Pallof press y remo) y doble AMRAP metabólico con barra, mancuerna y cajón.',
     null, 60, now, now]
  );

  // ── Helper para crear secciones ─────────────────────────────────────────────
  let sortCounter = 0;
  const addSection = async (opts: {
    sectionType: string;
    workFormat: string | null;
    visibleTitle: string;
    description: string;
    timeCap?: number | null;
    rounds?: number | null;
  }): Promise<string> => {
    sortCounter += 1;
    const id = generateUUID();
    await db.run(
      `INSERT INTO class_section
         (id, class_template_id, section_type_id, work_format_id, sort_order,
          visible_title, general_description, time_cap_seconds, total_rounds,
          rest_between_rounds_seconds, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, classId, maps.sectionType.get(opts.sectionType) ?? null,
       opts.workFormat ? (maps.workFormat.get(opts.workFormat) ?? null) : null,
       sortCounter, opts.visibleTitle, opts.description,
       opts.timeCap ?? null, opts.rounds ?? null, null, null, now, now]
    );
    return id;
  };

  // ── Helper para crear ejercicios de sección ─────────────────────────────────
  const addSectionExercise = async (
    sectionId: string,
    exerciseName: string,
    sortOrder: number,
    opts: {
      reps?: number | null;
      weight?: number | null;
      timeSeconds?: number | null;
      coachNotes?: string | null;
    } = {}
  ): Promise<void> => {
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, coach_notes,
          planned_repetitions, planned_weight_value, planned_weight_unit_id,
          planned_time_seconds, planned_distance_value, planned_distance_unit_id,
          planned_calories, planned_rest_seconds, planned_rounds,
          rm_percentage, suggested_scaling, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [generateUUID(), sectionId, ex[exerciseName], sortOrder,
       opts.coachNotes ?? null, opts.reps ?? null,
       opts.weight ?? null, opts.weight != null ? kgId : null,
       opts.timeSeconds ?? null, null, null, null, null, null,
       null, null, null, now, now]
    );
  };

  // ── Sección 1: Calentamiento ────────────────────────────────────────────────
  await addSection({
    sectionType: 'Entrada en calor',
    workFormat: 'Trabajo libre',
    visibleTitle: 'Calentamiento',
    description: '6 minutos de calentamiento general',
    timeCap: 360,
  });

  // ── Sección 2: Movilidad ────────────────────────────────────────────────────
  const sMov = await addSection({
    sectionType: 'Entrada en calor',
    workFormat: 'Por rondas',
    visibleTitle: 'Movilidad',
    description: '2 rondas, todo 30 segundos',
    rounds: 2,
  });
  await addSectionExercise(sMov, 'Kettlebell Good Morning to Squat', 1, { timeSeconds: 30, weight: 16 });
  await addSectionExercise(sMov, 'Half-Kneeling Ankle Dorsiflexion Stretch', 2, { timeSeconds: 30, coachNotes: 'Pie derecho' });
  await addSectionExercise(sMov, 'Half-Kneeling Ankle Dorsiflexion Stretch', 3, { timeSeconds: 30, coachNotes: 'Pie izquierdo' });

  // ── Sección 3: Activación ───────────────────────────────────────────────────
  const sAct = await addSection({
    sectionType: 'Activación',
    workFormat: 'AMRAP',
    visibleTitle: 'Activación',
    description: '6 minutos, la mayor cantidad de vueltas',
    timeCap: 360,
  });
  await addSectionExercise(sAct, 'Bird Dog Crunch', 1, { reps: 10 });
  await addSectionExercise(sAct, 'V-Up', 2, { reps: 10 });
  await addSectionExercise(sAct, 'Scapular Push-Up', 3, { reps: 8 });
  await addSectionExercise(sAct, 'Toe Touch Sit-Up', 4, { reps: 10 });

  // ── Sección 4: Fuerza (intervalos) ──────────────────────────────────────────
  const sFue = await addSection({
    sectionType: 'Fuerza',
    workFormat: 'Intervalos',
    visibleTitle: 'Fuerza',
    description: '6 rondas de 2 minutos: en el minuto par, los 2 ejercicios de core; en el minuto impar, el remo.',
    timeCap: 720,
    rounds: 6,
  });
  await addSectionExercise(sFue, 'Hanging Flutter Kicks', 1, { reps: 24, coachNotes: 'Minuto par' });
  await addSectionExercise(sFue, 'Single-Leg Pallof Press', 2, { reps: 10, coachNotes: 'Minuto par · 10 de cada lado' });
  await addSectionExercise(sFue, 'Dumbbell Row', 3, { reps: 10, weight: 20, coachNotes: 'Minuto impar · 10 con cada brazo' });

  // ── Sección 5: WOD (doble AMRAP) ────────────────────────────────────────────
  const sWod = await addSection({
    sectionType: 'WOD',
    workFormat: 'AMRAP',
    visibleTitle: 'WOD',
    description: '7 minutos AMRAP, 2 minutos de descanso y otros 7 minutos AMRAP. Thruster y Power Clean alternan reps entre rondas (1 y 3 / 2).',
    timeCap: 420,
  });
  await addSectionExercise(sWod, 'Barbell Thruster', 1, { reps: 8, coachNotes: '1ª y 3ª ronda; 2 en la 2ª ronda' });
  await addSectionExercise(sWod, 'Power Clean', 2, { reps: 8, coachNotes: '2ª ronda; 1 y 3 en la 1ª y 3ª ronda' });
  await addSectionExercise(sWod, 'Alternating Single-Arm DB Power Snatch', 3, { reps: 12 });
  await addSectionExercise(sWod, 'Box Jump Over', 4, { reps: 15 });

  await saveDatabase();
  markDone();
  return { exercises: exercisesCreated, created: true };
}
