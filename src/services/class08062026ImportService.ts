// Servicio de importación de la Clase GOAT 08/06/2026
// Crea los ejercicios (con músculos, equipo, tags, secciones y unidades),
// la plantilla de clase y sus secciones. Idempotente: no duplica si ya existe.
import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_08_06_2026_done';
const CLASS_NAME = 'Clase GOAT 08/06/2026';
const CLASS_DATE = '2026-06-08';

export function isClass08062026ImportDone(): boolean {
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

// Incluye tanto los ejercicios nuevos (Cuban Press, Push Press Behind the Neck)
// como los ya existentes en la BD. getOrCreate los busca por nombre y solo crea
// los que falten, por lo que el servicio es autosuficiente e idempotente.
const EXERCISES: ExerciseDef[] = [
  // ── Movilidad ──
  {
    name: '90/90 Hip Rotation',
    description:
      'Sentado en el suelo con ambas piernas flexionadas a 90° (una al frente, otra al costado). Rotar el torso y la cadera hacia el lado contrario, alternando la posición de las piernas.',
    technical_notes:
      'Mantener la espalda recta. Las rodillas permanecen en 90°. Movimiento activo y controlado, sin forzar el rango.',
    difficulty: 'Básico',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Core/Abdominales', 'Isquiotibiales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/hip-90-90-rotation.svg',
    is_compound: 0,
  },
  {
    name: 'Cuban Press',
    description:
      'Con discos o mancuernas livianas, encadenar tres fases: un upright row (jalón con codos altos), una rotación externa del hombro llevando los antebrazos hacia arriba y, por último, un press por encima de la cabeza. Volver por el mismo camino.',
    technical_notes:
      'Pesos muy livianos (2,5 kg): es un ejercicio de salud y movilidad del manguito rotador. Los codos lideran el upright row; mantenerlos altos durante la rotación. Movimiento lento y sin balanceo.',
    difficulty: 'Intermedio',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Trapecio', 'Tríceps'],
    equipment: ['Disco'],
    tags: ['hombro', 'movilidad', 'activación', 'bilateral'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos', 'Kilogramos'],
    video_path: 'https://www.youtube.com/watch?v=XpcOM9Np9LQ',
    video_long_path: 'https://www.youtube.com/shorts/-H4duASwnBs',
    image_url: '/img/exercises/cuban-press.svg',
    is_compound: 1,
  },
  {
    name: 'Yoga Push-Up',
    description:
      'Desde perro boca abajo (downward dog), descender el pecho hacia el suelo en un arco pasando a cobra/upward dog y volver, combinando flexión y movilidad de hombros y columna.',
    technical_notes:
      'Movimiento fluido y continuo. Codos cerca del cuerpo al pasar por abajo. Acompañar con la respiración.',
    difficulty: 'Básico',
    primary_muscle: 'Pectorales',
    secondary_muscles: ['Deltoides', 'Tríceps', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'gimnástico', 'activación'],
    section_types: ['Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/_2aDj69aE9s',
    image_url: '/img/exercises/yoga-push-up.svg',
    is_compound: 1,
  },
  // ── Activación / Fuerza (olímpico) ──
  {
    name: 'Snatch High Pull',
    description:
      'Con agarre ancho de arrancada, traccionar la barra desde la cadera (o el suelo) hasta la altura del pecho llevando los codos altos, terminando el jalón en puntillas.',
    technical_notes:
      'La extensión de cadera inicia el movimiento. Los codos salen hacia afuera y arriba. La barra sube pegada al cuerpo.',
    difficulty: 'Intermedio',
    primary_muscle: 'Trapecio',
    secondary_muscles: ['Deltoides', 'Cuádriceps', 'Glúteos'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    section_types: ['Fuerza', 'Activación'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/barbell-snatch-high-pull.svg',
    is_compound: 1,
  },
  {
    name: 'Barbell Muscle Snatch',
    description:
      'Arranque muscular: tirón de la barra desde el suelo hasta overhead sin re-flexión de rodillas para recibir, terminando de pie con la barra bloqueada arriba.',
    technical_notes:
      'No hay sentadilla de recepción. Alta demanda de hombros y trapecio. La barra sube pegada al cuerpo y los codos terminan altos antes del giro de muñecas.',
    difficulty: 'Avanzado',
    primary_muscle: 'Trapecio',
    secondary_muscles: ['Deltoides', 'Cuádriceps', 'Glúteos', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    section_types: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/barbell-muscle-snatch.svg',
    is_compound: 1,
  },
  {
    name: 'Push Press Behind the Neck',
    description:
      'Con la barra apoyada detrás de la nuca (sobre los trapecios), realizar un breve dip de rodillas y usar el impulso de las piernas para empujar la barra por encima de la cabeza hasta el bloqueo. Bajar controlado detrás de la nuca.',
    technical_notes:
      'El dip es corto y vertical. La barra termina alineada sobre la mitad del pie con los hombros activos. Requiere buena movilidad de hombro; mantener el core firme.',
    difficulty: 'Intermedio',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Tríceps', 'Trapecio', 'Cuádriceps', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'push', 'press', 'bilateral'],
    section_types: ['Activación', 'Fuerza'],
    units: ['Kilogramos', 'Repeticiones'],
    video_path: 'https://www.youtube.com/shorts/ECQxCyXg-ik',
    video_long_path: 'https://www.youtube.com/watch?v=eAkalDSMcbo',
    image_url: '/img/exercises/push-press-behind-the-neck.svg',
    is_compound: 1,
  },
  {
    name: 'Snatch',
    description:
      'Arrancada olímpica: levantar la barra desde el suelo hasta overhead en un solo movimiento, recibiéndola en sentadilla profunda con los brazos bloqueados, y terminar de pie.',
    technical_notes:
      'Extensión explosiva de cadera. Recepción rápida bajo la barra con el torso erguido. La barra describe una trayectoria pegada al cuerpo.',
    difficulty: 'Avanzado',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Deltoides', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    section_types: ['Activación', 'Fuerza', 'WOD'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/snatch.svg',
    is_compound: 1,
  },
  // ── WOD ──
  {
    name: 'Wall Ball Shot',
    description:
      'Sostener un balón medicinal en posición frontal, hacer una sentadilla completa y, al subir, lanzar el balón a un objetivo en la pared. Recibirlo y encadenar la siguiente repetición.',
    technical_notes:
      'La sentadilla llega a profundidad. El lanzamiento aprovecha la extensión de cadera y rodillas. Recibir el balón amortiguando hacia la próxima sentadilla.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Wall ball'],
    tags: ['sentadilla', 'cardio', 'bilateral'],
    section_types: ['WOD'],
    units: ['Repeticiones', 'Kilogramos'],
    image_url: '/img/exercises/wall-ball-shot.svg',
    is_compound: 1,
  },
  {
    name: 'Bar Pull Up',
    description:
      'Colgado de una barra fija con agarre prono, traccionar el cuerpo hacia arriba hasta pasar el mentón por encima de la barra y bajar con control a la extensión completa de brazos.',
    technical_notes:
      'Escápulas activas al inicio. Evitar el balanceo excesivo (salvo kipping intencional). Extensión completa de codos abajo.',
    difficulty: 'Intermedio',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Bíceps', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Pull-up bar'],
    tags: ['gimnástico', 'pull', 'bilateral'],
    section_types: ['WOD', 'Fuerza'],
    units: ['Repeticiones'],
    image_url: '/img/exercises/pullup.svg',
    is_compound: 1,
  },
  {
    name: 'Kettlebell Front Squat',
    description:
      'Sentadilla con una o dos kettlebells en posición de rack frontal (sobre los antebrazos). Bajar a profundidad completa y subir manteniendo el torso erguido.',
    technical_notes:
      'Codos altos y muñecas neutras. Rodillas siguiendo la línea de los pies. Core firme para mantener el rack estable.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Core/Abdominales'],
    equipment: ['Kettlebell'],
    tags: ['sentadilla', 'bilateral'],
    section_types: ['WOD', 'Fuerza'],
    units: ['Kilogramos', 'Repeticiones'],
    image_url: '/img/exercises/kettlebell-front-squat.svg',
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
export async function importClass08062026(): Promise<{ exercises: number; created: boolean }> {
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
     'Día de arrancada (snatch): movilidad de hombro y cadera, complejo de activación olímpico (EMOM), escalera de fuerza en muscle snatch y WOD metabólico con barra, wall ball, pull ups y kettlebell.',
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
  await addSectionExercise(sMov, '90/90 Hip Rotation', 1, { timeSeconds: 30 });
  await addSectionExercise(sMov, 'Cuban Press', 2, { timeSeconds: 30, weight: 2.5, coachNotes: 'Discos de 2,5 kg' });
  await addSectionExercise(sMov, 'Yoga Push-Up', 3, { timeSeconds: 30 });

  // ── Sección 3: Activación (EMOM, bloques A/B) ───────────────────────────────
  const sAct = await addSection({
    sectionType: 'Activación',
    workFormat: 'EMOM',
    visibleTitle: 'Activación',
    description: '6 rondas, cada minuto (EMOM). Se alterna el bloque A (A1/A2/A3) con el ejercicio B.',
    timeCap: 360,
    rounds: 6,
  });
  await addSectionExercise(sAct, 'Snatch High Pull', 1, { reps: 5, weight: 20, coachNotes: 'A.1' });
  await addSectionExercise(sAct, 'Barbell Muscle Snatch', 2, { reps: 5, weight: 20, coachNotes: 'A.2' });
  await addSectionExercise(sAct, 'Push Press Behind the Neck', 3, { reps: 5, weight: 20, coachNotes: 'A.3' });
  await addSectionExercise(sAct, 'Snatch', 4, { reps: 10, coachNotes: 'Bloque B' });

  // ── Sección 4: Fuerza (escalera de muscle snatch, E2MOM cada 1,5 min) ───────
  const sFue = await addSection({
    sectionType: 'Fuerza',
    workFormat: 'E2MOM',
    visibleTitle: 'Fuerza',
    description: '6 rondas, una serie cada 1,5 minutos, subiendo el peso en cada ronda.',
    timeCap: 540,
    rounds: 6,
  });
  await addSectionExercise(sFue, 'Barbell Muscle Snatch', 1, { reps: 4, weight: 30, coachNotes: 'Ronda 1' });
  await addSectionExercise(sFue, 'Barbell Muscle Snatch', 2, { reps: 4, weight: 34, coachNotes: 'Ronda 2' });
  await addSectionExercise(sFue, 'Barbell Muscle Snatch', 3, { reps: 3, weight: 36, coachNotes: 'Ronda 3' });
  await addSectionExercise(sFue, 'Barbell Muscle Snatch', 4, { reps: 3, weight: 36, coachNotes: 'Ronda 4' });
  await addSectionExercise(sFue, 'Barbell Muscle Snatch', 5, { reps: 1, weight: 40, coachNotes: 'Ronda 5' });
  await addSectionExercise(sFue, 'Barbell Muscle Snatch', 6, { reps: 1, weight: 44, coachNotes: 'Ronda 6' });

  // ── Sección 5: WOD (EMOM, 4 ejercicios en 16 minutos) ───────────────────────
  const sWod = await addSection({
    sectionType: 'WOD',
    workFormat: 'EMOM',
    visibleTitle: 'WOD',
    description: '4 rondas, cada ejercicio en su minuto (16 minutos en total).',
    timeCap: 960,
    rounds: 4,
  });
  await addSectionExercise(sWod, 'Barbell Muscle Snatch', 1, { reps: 10, weight: 30 });
  await addSectionExercise(sWod, 'Wall Ball Shot', 2, { reps: 16, weight: 6 });
  await addSectionExercise(sWod, 'Bar Pull Up', 3, { reps: 10 });
  await addSectionExercise(sWod, 'Kettlebell Front Squat', 4, { reps: 16, weight: 12 });

  await saveDatabase();
  markDone();
  return { exercises: exercisesCreated, created: true };
}
