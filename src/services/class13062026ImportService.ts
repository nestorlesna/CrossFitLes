// Servicio de importación de la Clase GOAT 13/06/2026
// Crea los ejercicios (con músculos, equipo, tags, secciones y unidades),
// la plantilla de clase y sus secciones. Idempotente: no duplica si ya existe.
import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_13_06_2026_done';
const CLASS_NAME = 'Clase GOAT 13/06/2026';
const CLASS_DATE = '2026-06-13';

export function isClass13062026ImportDone(): boolean {
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

// Incluye ejercicios nuevos y existentes. getOrCreate busca por nombre y solo
// crea los que falten, por lo que el servicio es autosuficiente e idempotente.
const EXERCISES: ExerciseDef[] = [
  // ── Movilidad ──
  {
    name: 'Wall Lat Stretch',
    description:
      'De rodillas frente a una pared o banco, apoyar los codos a la altura de los hombros y dejar que el pecho descienda hacia el suelo para estirar los dorsales y mejorar la extensión torácica.',
    technical_notes:
      'Mantener las caderas sobre las rodillas. Respirar profundo hacia las costillas laterales. No dejar que los codos se abran más allá de la anchura de hombros.',
    difficulty: 'Básico',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Deltoides', 'Trapecio'],
    equipment: [],
    tags: ['movilidad', 'hombro', 'isométrico'],
    section_types: ['Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/wall-lat-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Kettlebell Good Morning',
    description:
      'Con una kettlebell sostenida en goblet position (contra el pecho), realizar una bisagra de cadera hacia adelante manteniendo la espalda neutra hasta sentir tensión en los isquiotibiales, luego volver a la posición inicial.',
    technical_notes:
      'El movimiento parte de la cadera, no de la columna. Rodillas ligeramente flexionadas. Mantener el pecho elevado y la columna neutral durante todo el recorrido.',
    difficulty: 'Básico',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Glúteos', 'Core/Abdominales'],
    equipment: ['Kettlebell'],
    tags: ['movilidad', 'bilateral', 'pull'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Segundos', 'Repeticiones', 'Kilogramos'],
    video_path: 'https://www.youtube.com/shorts/FkvZv75xPkw',
    video_long_path: 'https://www.youtube.com/watch?v=0lcPSo2gRoY',
    image_url: '/img/exercises/kettlebell-good-morning.svg',
    is_compound: 1,
  },
  {
    name: 'Single-Leg Calf Raise',
    description:
      'De pie sobre una pierna, elevar el talón lo más alto posible realizando una plantar flexión completa y bajar con control, idealmente por debajo del nivel del apoyo para mayor amplitud de movimiento.',
    technical_notes:
      'Mantener el core activo para el equilibrio. Subir con potencia y bajar lento (fase excéntrica). Realizar el mismo número de repeticiones en cada pierna.',
    difficulty: 'Básico',
    primary_muscle: 'Pantorrillas',
    secondary_muscles: ['Core/Abdominales'],
    equipment: [],
    tags: ['monoarticular', 'unilateral', 'movilidad'],
    section_types: ['Entrada en calor'],
    units: ['Segundos', 'Repeticiones', 'Kilogramos'],
    video_path: 'https://www.youtube.com/watch?v=qPd73snQfUs',
    video_long_path: 'https://www.youtube.com/watch?v=QEILIo9Kzlw',
    image_url: '/img/exercises/single-leg-calf-raise.svg',
    is_compound: 0,
  },
  // ── Activación ──
  {
    name: 'Hollow to Superman Roll',
    description:
      'Desde la posición de hollow body (boca arriba, brazos y piernas elevados, core comprimido), rodar sobre un costado hasta la posición de superman (boca abajo, brazos y piernas elevados) y volver.',
    technical_notes:
      'Mantener la tensión en el core durante todo el movimiento. El roll debe ser continuo y controlado. Evitar golpear el suelo con los pies o las manos.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Dorsales', 'Glúteos'],
    equipment: [],
    tags: ['core', 'gimnástico', 'activación'],
    section_types: ['Activación', 'Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/hollow-to-superman-roll.svg',
    is_compound: 0,
  },
  {
    name: 'Push-up',
    description:
      'Flexión de brazos en el suelo. Ejercicio básico de empuje horizontal.',
    technical_notes:
      'Mantener el cuerpo rígido como una tabla durante todo el movimiento. Codos a 45° del torso al bajar. Extensión completa de codos arriba.',
    difficulty: 'Básico',
    primary_muscle: 'Pectorales',
    secondary_muscles: ['Tríceps', 'Deltoides', 'Core/Abdominales'],
    equipment: [],
    tags: ['push', 'gimnástico', 'bilateral'],
    section_types: ['Activación', 'WOD'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/bodyweight-push-up.svg',
    is_compound: 1,
  },
  // ── WOD ──
  {
    name: 'Sled Push & Pull',
    description:
      'Empujar el trineo hacia adelante una distancia determinada y luego jalarlo de regreso usando las correas o el equipo de tracción.',
    technical_notes:
      'En el empuje: inclinarse hacia adelante y dar pasos cortos y potentes. En el jalón: mantener la espalda recta y jalar con los codos hacia atrás activando dorsales.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales', 'Dorsales'],
    equipment: ['Sled'],
    tags: ['cardio', 'bilateral', 'push', 'pull'],
    section_types: ['WOD'],
    units: ['Metros', 'Kilogramos'],
    image_url: '/img/exercises/sled-push-pull.svg',
    is_compound: 1,
  },
  {
    name: 'Kettlebell Jumping Lunge',
    description:
      'Con una kettlebell en cada mano, realizar una estocada explosiva con salto intercambiando la posición de las piernas en el aire antes de aterrizar en la posición opuesta.',
    technical_notes:
      'Aterrizar suavemente amortiguando con las rodillas. Las rodillas no deben colapsar hacia adentro. Core activo durante el salto para estabilizar el peso de las KBs.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: ['Kettlebell'],
    tags: ['pliométrico', 'cardio', 'unilateral'],
    section_types: ['WOD', 'Activación'],
    units: ['Repeticiones', 'Kilogramos'],
    video_path: 'https://www.youtube.com/shorts/jJu2SnYJeK4',
    video_long_path: 'https://www.youtube.com/watch?v=Sms79i9O3gU',
    image_url: '/img/exercises/kettlebell-jumping-lunge.svg',
    is_compound: 1,
  },
  {
    name: 'Running',
    description:
      'Carrera a pie. Ejercicio cardiovascular fundamental.',
    technical_notes:
      'Mantener una postura erguida con el torso ligeramente inclinado hacia adelante. Brazos relajados. Aterrizar con el pie debajo del centro de gravedad.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Isquiotibiales', 'Glúteos', 'Pantorrillas'],
    equipment: [],
    tags: ['cardio', 'bilateral'],
    section_types: ['WOD', 'Entrada en calor'],
    units: ['Metros', 'Kilómetros'],
    image_url: '/img/exercises/running.svg',
    is_compound: 1,
  },
  {
    name: 'Rowing',
    description:
      'Remo en ergómetro. Ejercicio cardiovascular de alto rendimiento que trabaja todo el cuerpo.',
    technical_notes:
      'La secuencia es: piernas → cadera → brazos (y en reversa al recuperar). Mantener la espalda recta en el drive. No curvar la espalda al alcanzar el catch.',
    difficulty: 'Básico',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Cuádriceps', 'Glúteos', 'Core/Abdominales', 'Bíceps'],
    equipment: ['Rower'],
    tags: ['cardio', 'bilateral'],
    section_types: ['WOD', 'Entrada en calor'],
    units: ['Metros', 'Segundos', 'Calorías'],
    image_url: '/img/exercises/rowing.svg',
    is_compound: 1,
  },
  {
    name: 'Assault Bike',
    description:
      'Bicicleta de aire. Uno de los dispositivos de cardio más exigentes del CrossFit.',
    technical_notes:
      'Mantener el ritmo constante usando tanto brazos como piernas. La resistencia aumenta con la velocidad. Respiración controlada.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Isquiotibiales', 'Glúteos', 'Pectorales', 'Deltoides'],
    equipment: ['Assault bike'],
    tags: ['cardio', 'bilateral'],
    section_types: ['WOD'],
    units: ['Segundos', 'Calorías', 'Metros'],
    image_url: '/img/exercises/assault-bike.svg',
    is_compound: 1,
  },
  {
    name: 'SkiErg',
    description:
      'Máquina de remo vertical que simula el esquí de fondo. Se jalan los mangos desde arriba hacia abajo de forma coordinada usando core, caderas y brazos.',
    technical_notes:
      'Iniciar el movimiento con el core y las caderas, no solo con los brazos. Los codos pasan junto a las costillas al terminar el jalón. Mantener la espalda neutral y el core activo.',
    difficulty: 'Básico',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Core/Abdominales', 'Trapecio', 'Tríceps'],
    equipment: ['SkiErg'],
    tags: ['cardio', 'bilateral'],
    section_types: ['WOD'],
    units: ['Segundos', 'Metros', 'Calorías'],
    image_url: '/img/exercises/skierg.svg',
    is_compound: 1,
  },
  {
    name: 'Burpee Broad Jump',
    description:
      'Burpee combinado con salto horizontal. Desde de pie, caer al suelo en plancha, hacer un push-up, levantarse y saltar lo más lejos posible hacia adelante.',
    technical_notes:
      'El pecho toca el suelo en la fase de push-up para un burpee completo. En el salto, aterrizar con ambos pies simultáneamente, rodillas amortiguando el impacto.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Pectorales', 'Core/Abdominales', 'Pantorrillas'],
    equipment: [],
    tags: ['cardio', 'pliométrico', 'bilateral'],
    section_types: ['WOD'],
    units: ['Metros', 'Repeticiones'],
    image_url: '/img/exercises/burpee-broad-jump.svg',
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

  if (primaryId) {
    await db.run(
      'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,1)',
      [generateUUID(), id, primaryId]
    );
  }

  for (const secName of exerciseDef.secondary_muscles) {
    const secId = maps.muscle.get(toDbName(secName));
    if (secId) {
      await db.run(
        'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,0)',
        [generateUUID(), id, secId]
      );
    }
  }

  for (const eqName of exerciseDef.equipment) {
    const eqId = maps.equipment.get(eqName);
    if (eqId) {
      await db.run(
        'INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?,?,?,1)',
        [generateUUID(), id, eqId]
      );
    }
  }

  for (const tagName of exerciseDef.tags) {
    const tagId = maps.tag.get(tagName);
    if (tagId) {
      await db.run(
        'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?,?,?)',
        [generateUUID(), id, tagId]
      );
    }
  }

  for (const stName of exerciseDef.section_types) {
    const stId = maps.sectionType.get(stName);
    if (stId) {
      await db.run(
        'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?,?,?)',
        [generateUUID(), id, stId]
      );
    }
  }

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
export async function importClass13062026(): Promise<{ exercises: number; created: boolean }> {
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
  const toMap = (arr: any[]) => new Map(arr.map((r) => [r.name as string, r.id as string]));

  const maps: Maps = {
    difficulty: toMap(await rows('SELECT id, name FROM difficulty_level WHERE is_active = 1')),
    muscle:     toMap(await rows('SELECT id, name FROM muscle_group WHERE is_active = 1')),
    equipment:  toMap(await rows('SELECT id, name FROM equipment WHERE is_active = 1')),
    tag:        toMap(await rows('SELECT id, name FROM tag WHERE is_active = 1')),
    sectionType:toMap(await rows('SELECT id, name FROM section_type WHERE is_active = 1')),
    workFormat: toMap(await rows('SELECT id, name FROM work_format WHERE is_active = 1')),
    unit:       toMap(await rows('SELECT id, name FROM measurement_unit WHERE is_active = 1')),
  };

  // Agregar SkiErg al catálogo de equipamiento si no existe
  if (!maps.equipment.has('SkiErg')) {
    const skiErgId = generateUUID();
    await db.run(
      'INSERT INTO equipment (id, name, category, sort_order, is_active) VALUES (?,?,?,?,1)',
      [skiErgId, 'SkiErg', 'cardio', 18]
    );
    maps.equipment.set('SkiErg', skiErgId);
  }

  let exercisesCreated = 0;
  const ex: Record<string, string> = {};
  for (const def of EXERCISES) {
    const { id, created } = await getOrCreate(db, def, maps);
    ex[def.name] = id;
    if (created) exercisesCreated++;
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const kgId = maps.unit.get('Kilogramos') ?? null;
  const mId  = maps.unit.get('Metros') ?? null;

  // ── Plantilla de clase ──────────────────────────────────────────────────────
  const classId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, date, name, objective, general_notes, estimated_duration_minutes,
        is_favorite, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,0,1,?,?)`,
    [classId, CLASS_DATE, CLASS_NAME,
     'Movilidad de pantorrillas y dorsales, activación con tabata de core y push-ups, WOD hirux de 24 minutos combinando sled, KB lunges y cardio.',
     null, 65, now, now]
  );

  // ── Helper secciones ────────────────────────────────────────────────────────
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
      [id, classId,
       maps.sectionType.get(opts.sectionType) ?? null,
       opts.workFormat ? (maps.workFormat.get(opts.workFormat) ?? null) : null,
       sortCounter, opts.visibleTitle, opts.description,
       opts.timeCap ?? null, opts.rounds ?? null, null, null, now, now]
    );
    return id;
  };

  // ── Helper ejercicios de sección ────────────────────────────────────────────
  const addEx = async (
    sectionId: string,
    exerciseName: string,
    sortOrder: number,
    opts: {
      reps?: number | null;
      weight?: number | null;
      timeSeconds?: number | null;
      distance?: number | null;
      distanceUnitId?: string | null;
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
       opts.coachNotes ?? null,
       opts.reps ?? null,
       opts.weight ?? null, opts.weight != null ? kgId : null,
       opts.timeSeconds ?? null,
       opts.distance ?? null, opts.distanceUnitId ?? null,
       null, null, null, null, null, null, now, now]
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
  await addEx(sMov, 'Wall Lat Stretch', 1, { timeSeconds: 30 });
  await addEx(sMov, 'Kettlebell Good Morning', 2, { timeSeconds: 30, weight: 10 });
  await addEx(sMov, 'Single-Leg Calf Raise', 3, {
    timeSeconds: 30,
    weight: 10,
    coachNotes: 'Primera ronda pie derecho, segunda ronda pie izquierdo',
  });

  // ── Sección 3: Activación (2 Tabata) ───────────────────────────────────────
  const sAct = await addSection({
    sectionType: 'Activación',
    workFormat: 'Tabata',
    visibleTitle: 'Activación',
    description: '2 tabata (20 seg trabajo / 10 seg descanso × 8 rondas cada uno)',
    timeCap: 480,
    rounds: 2,
  });
  await addEx(sAct, 'Hollow to Superman Roll', 1, {
    timeSeconds: 20,
    coachNotes: 'Tabata 1 – 8 rondas de 20/10',
  });
  await addEx(sAct, 'Push-up', 2, {
    timeSeconds: 20,
    coachNotes: 'Tabata 2 – 8 rondas de 20/10',
  });

  // ── Sección 4: WOD Bloque A (12 min EMOM) ──────────────────────────────────
  const sWodA = await addSection({
    sectionType: 'WOD',
    workFormat: 'EMOM',
    visibleTitle: 'WOD – Bloque A',
    description: '12 min EMOM. Cada minuto un ejercicio: A.1 Sled, A.2 KB Lunge, A.3 Running, A.4 descanso. 3 ciclos.',
    timeCap: 720,
    rounds: 3,
  });
  await addEx(sWodA, 'Sled Push & Pull', 1, {
    weight: 80,
    distance: 20,
    distanceUnitId: mId,
    coachNotes: 'A.1 – 20 m (Push + Pull)',
  });
  await addEx(sWodA, 'Kettlebell Jumping Lunge', 2, {
    weight: 10,
    coachNotes: 'A.2',
  });
  await addEx(sWodA, 'Running', 3, {
    distance: 200,
    distanceUnitId: mId,
    coachNotes: 'A.3 – 200 m',
  });

  // ── Sección 5: WOD Bloque B (12 min EMOM) ──────────────────────────────────
  const sWodB = await addSection({
    sectionType: 'WOD',
    workFormat: 'EMOM',
    visibleTitle: 'WOD – Bloque B',
    description: '12 min EMOM. Cada minuto 45 seg de trabajo: B.1 Rowing, B.2 Assault Bike, B.3 SkiErg, B.4 Burpee Broad Jump. 3 ciclos.',
    timeCap: 720,
    rounds: 3,
  });
  await addEx(sWodB, 'Rowing', 1, { timeSeconds: 45, coachNotes: 'B.1' });
  await addEx(sWodB, 'Assault Bike', 2, { timeSeconds: 45, coachNotes: 'B.2' });
  await addEx(sWodB, 'SkiErg', 3, { timeSeconds: 45, coachNotes: 'B.3' });
  await addEx(sWodB, 'Burpee Broad Jump', 4, {
    distance: 10,
    distanceUnitId: mId,
    coachNotes: 'B.4 – 10 m',
  });

  // ── Sección 6: Estiramiento ─────────────────────────────────────────────────
  await addSection({
    sectionType: 'Vuelta a la calma',
    workFormat: 'Trabajo libre',
    visibleTitle: 'Estiramiento',
    description: '5 minutos de estiramientos y vuelta a la calma',
    timeCap: 300,
  });

  await saveDatabase();
  markDone();
  return { exercises: exercisesCreated, created: true };
}
