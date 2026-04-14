// Servicio de importación: Clase GOAT 13/04/2026
// Secciones: Calentamiento · Movilidad · Activación · Fuerza · WOD · Estiramiento
// Crea los ejercicios nuevos y la plantilla de clase con sus 6 secciones.
// Asume que "Cargar Datos Base" ya fue ejecutado (catálogos presentes).

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_13_04_2026_done';

export function isClass13042026ImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markImportDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

async function findExercise(db: SQLiteDBConnection, name: string): Promise<string | null> {
  const r = await db.query(
    `SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?)) AND is_active = 1`,
    [name]
  );
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

// ─── Ejercicios NUEVOS de esta clase ─────────────────────────────────────────

const EXERCISES: ExerciseInput[] = [
  // ── Movilidad ──────────────────────────────────────────────────────────────
  {
    name: 'Half Kneeling Thoracic Rotation',
    image_url: '/img/exercises/half-kneeling-thoracic-rotation.svg',
    video_long_path: 'https://www.youtube.com/shorts/NuDipJO6uck',
    description:
      'En posición media-arrodillada (un pie adelante en 90°, rodilla trasera en el suelo), apoyar las manos en la nuca o extenderlas. Rotar el torso hacia el lado de la pierna delantera lo máximo posible, luego volver. Repetir del otro lado.',
    technical_notes:
      'Mantener la cadera estable durante la rotación. La rodilla trasera no debe despegarse del suelo. El movimiento viene de la columna torácica, no de la lumbar.',
    difficulty: 'Básico',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: ['Dorsales'],
    equipment: [],
    tags: ['movilidad', 'unilateral', 'isométrico'],
    sections: ['Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
  },
  // ── Activación ─────────────────────────────────────────────────────────────
  {
    name: 'Squat Press-Out',
    image_url: '/img/exercises/squat-press-out.svg',
    video_long_path: 'https://www.youtube.com/watch?v=_2qxnNd4M4g',
    description:
      'Con un disco o mancuerna liviana sostenida con ambas manos a la altura del pecho, descender a la posición de sentadilla. Durante el descenso, presionar el implemento hacia adelante extendiendo los brazos. Volver a la posición inicial.',
    technical_notes:
      'El peso presionado hacia afuera actúa como contrapeso ayudando a mantener el torso erguido. Ideal para mejorar la mecánica de la sentadilla. Mantener los talones en el suelo.',
    difficulty: 'Básico',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Disco'],
    tags: ['sentadilla', 'activación', 'bilateral'],
    sections: ['Activación', 'Entrada en calor'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Weighted Hollow Rock',
    image_url: '/img/exercises/weighted-hollow-rock.svg',
    video_long_path: 'https://www.youtube.com/shorts/pPIndrMEdDo',
    description:
      'Acostado boca arriba en posición hollow body (hombros y piernas levantados del suelo, cuerpo en forma de banana), sosteniendo un disco o mancuerna con los brazos extendidos sobre la cabeza. Mecer el cuerpo hacia adelante y atrás manteniendo la tensión del core.',
    technical_notes:
      'El peso añade dificultad al hollow hold. Mantener la zona lumbar pegada al suelo en todo momento. Si el peso compromete la posición, reducirlo o quitarlo.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: [],
    equipment: ['Disco'],
    tags: ['core', 'gimnástico', 'isométrico'],
    sections: ['Activación', 'Fuerza'],
    units: ['Repeticiones', 'Kilogramos', 'Segundos'],
  },
  {
    name: 'Weighted Lunge',
    image_url: '/img/exercises/weighted-lunge.svg',
    video_long_path: 'https://www.youtube.com/shorts/mJilHWIBWO8',
    description:
      'De pie con un disco u objeto de peso sostenido con ambas manos (o con discos en cada mano). Dar un paso al frente con una pierna y descender hasta que la rodilla trasera casi toque el suelo. Volver y alternar piernas.',
    technical_notes:
      'El torso debe mantenerse erguido durante todo el movimiento. La rodilla delantera no debe sobrepasar la punta del pie. Controlar el descenso.',
    difficulty: 'Básico',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: ['Disco'],
    tags: ['sentadilla', 'unilateral', 'activación'],
    sections: ['Activación', 'WOD'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Plank Up-Down',
    image_url: '/img/exercises/plank-up-down.svg',
    video_long_path: 'https://www.youtube.com/watch?v=jF3wvzUUw7s',
    description:
      'Desde plancha alta (manos apoyadas), descender un brazo a la vez a la posición de plancha baja (antebrazos) y volver a la posición alta. Alternar el brazo que lidera el movimiento.',
    technical_notes:
      'Mantener las caderas estables durante todo el movimiento, sin rotar. El core debe estar siempre activo. Alternar el brazo de inicio para trabajar equitativamente ambos lados.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 1,
    secondaryMuscles: ['Deltoides', 'Tríceps', 'Pectorales'],
    equipment: [],
    tags: ['core', 'isométrico', 'bilateral'],
    sections: ['Activación', 'WOD'],
    units: ['Repeticiones', 'Segundos'],
  },
  // ── WOD ────────────────────────────────────────────────────────────────────
  {
    name: 'American Kettlebell Swing',
    image_url: '/img/exercises/american-kettlebell-swing.svg',
    video_long_path: 'https://www.youtube.com/watch?v=d94xX-AQZ0A',
    description:
      'Igual que el swing ruso de kettlebell pero el recorrido continúa hasta llevar la kettlebell completamente overhead (por encima de la cabeza), con los brazos extendidos al final. La cadera genera toda la potencia.',
    technical_notes:
      'A diferencia del swing ruso (que termina a altura de pecho), el americano termina overhead. Los brazos no deben tirar de la KB: es la extensión explosiva de cadera la que genera la elevación. Mantener el core activo en la posición overhead.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Glúteos',
    is_compound: 1,
    secondaryMuscles: ['Isquiotibiales', 'Deltoides', 'Core/Abdominales', 'Trapecio'],
    equipment: ['Kettlebell'],
    tags: ['cardio', 'bilateral', 'olímpico'],
    sections: ['WOD', 'Fuerza'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Kettlebell Box Step-Over',
    image_url: '/img/exercises/kettlebell-box-step-over.svg',
    video_long_path: 'https://www.youtube.com/shorts/wSnG4pwBNyE',
    description:
      'Con una kettlebell sostenida por el asa con ambas manos (o en farmer carry), subir un pie al box, luego el otro para quedar encima, y descender del lado opuesto. Repetir alternando el lado de inicio.',
    technical_notes:
      'Mantener el torso erguido y la mirada al frente. El movimiento es controlado tanto al subir como al bajar. La kettlebell se sostiene al costado del cuerpo (farmer) o con las dos manos al frente.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: ['Kettlebell', 'Box de salto'],
    tags: ['cardio', 'unilateral', 'pliométrico'],
    sections: ['WOD'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  // ── Estiramiento ───────────────────────────────────────────────────────────
  {
    name: 'Supine Spinal Twist',
    image_url: '/img/exercises/supine-spinal-twist.svg',
    video_long_path: 'https://www.youtube.com/shorts/ElKoMMaTPCM',
    description:
      'Acostado boca arriba con los brazos en T (perpendiculares al cuerpo), llevar las rodillas dobladas hacia un lado hasta donde sea posible sin despegar los hombros del suelo. Mantener el estiramiento y cambiar de lado.',
    technical_notes:
      'Los hombros deben permanecer pegados al suelo durante toda la rotación. La cabeza puede rotar hacia el lado opuesto para aumentar el estiramiento. Respirar profundamente en la posición de estiramiento.',
    difficulty: 'Básico',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: ['Dorsales', 'Glúteos'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    sections: ['Vuelta a la calma', 'Entrada en calor'],
    units: ['Segundos'],
  },
  {
    name: 'Seated Forward Fold',
    image_url: '/img/exercises/seated-forward-fold.svg',
    video_long_path: 'https://www.youtube.com/shorts/5njnlgYYdD4',
    description:
      'Sentado en el suelo con las piernas extendidas y juntas, inclinar el torso hacia adelante intentando alcanzar los pies con las manos. Mantener la espalda lo más recta posible al inicio y permitir que se curve al profundizar el estiramiento.',
    technical_notes:
      'No forzar el estiramiento bruscamente. La respiración profunda en la exhalación permite profundizar. Mantener las rodillas sin doblar. Si no se llega a los pies, agarrar los tobillos o las pantorrillas.',
    difficulty: 'Básico',
    primaryMuscle: 'Isquiotibiales',
    is_compound: 0,
    secondaryMuscles: ['Pantorrillas', 'Dorsales'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
  {
    name: 'Seated Quad Stretch',
    image_url: '/img/exercises/seated-quad-stretch.svg',
    video_long_path: 'https://www.youtube.com/watch?v=aZnXCfGyvl8',
    description:
      'Sentado en el suelo, doblar una pierna hacia atrás (como en posición de héroe unilateral) mientras la otra permanece extendida. Mantener la postura erguida o inclinarse ligeramente hacia atrás para aumentar el estiramiento del cuádriceps.',
    technical_notes:
      'Si hay incomodidad en la rodilla, colocar una almohada o toalla doblada debajo. No forzar el estiramiento hacia atrás sin control. Trabajar de a una pierna por vez.',
    difficulty: 'Básico',
    primaryMuscle: 'Cuádriceps',
    is_compound: 0,
    secondaryMuscles: ['Isquiotibiales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
  {
    name: 'Pigeon Pose',
    image_url: '/img/exercises/pigeon-pose.svg',
    video_long_path: 'https://www.youtube.com/shorts/pjmR5Kacu1w',
    description:
      'Desde la posición de cuadrupedia, traer una rodilla hacia adelante y colocarla detrás de la muñeca del mismo lado, con el pie cerca de la cadera opuesta. La pierna trasera queda extendida. Bajar el torso sobre la pierna delantera para profundizar el estiramiento de cadera.',
    technical_notes:
      'El estiramiento principal es en el glúteo y el rotador externo de cadera del lado de la pierna delantera. Mantener las caderas a nivel (no dejar que caiga un lado más que el otro). Modificación: con el pie del lado doblado más cerca del cuerpo reduce la intensidad.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Glúteos',
    is_compound: 0,
    secondaryMuscles: ['Cuádriceps', 'Isquiotibiales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
  {
    name: 'Supine Abdominal Stretch',
    image_url: '/img/exercises/supine-abdominal-stretch.svg',
    video_long_path: 'https://www.youtube.com/shorts/tQwHhKnJ1KU',
    description:
      'Acostado boca arriba, extender los brazos por encima de la cabeza y estirar el cuerpo completamente, sintiendo el alargamiento desde los dedos de los pies hasta las puntas de los dedos de las manos. Permitir una ligera extensión lumbar.',
    technical_notes:
      'Este es un estiramiento general de la cadena anterior. Respirar profundamente. Puede acompañarse de una leve retroversión pélvica para proteger la zona lumbar.',
    difficulty: 'Básico',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: ['Pectorales', 'Bíceps'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
  {
    name: 'Cobra Pose',
    image_url: '/img/exercises/cobra-pose.svg',
    video_long_path: 'https://www.youtube.com/shorts/dRAibO71JCM',
    description:
      'Acostado boca abajo con las manos apoyadas bajo los hombros, empujar contra el suelo para elevar el pecho mientras los codos permanecen semi-extendidos o completamente extendidos. Las caderas y piernas permanecen en el suelo.',
    technical_notes:
      'No contraer los glúteos durante el movimiento. Alejar los hombros de las orejas. El nivel de extensión depende de la flexibilidad individual: es válido quedarse con los codos doblados (Baby Cobra) si no hay extensión completa.',
    difficulty: 'Básico',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: ['Dorsales', 'Pectorales'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
  {
    name: "Child's Pose",
    image_url: '/img/exercises/childs-pose.svg',
    video_long_path: 'https://www.youtube.com/watch?v=kH12QrSGedM',
    description:
      'Desde posición arrodillada, bajar las caderas hacia los talones y extender los brazos al frente sobre el suelo, dejando la frente apoyada en el piso. Mantener la posición respirando profundamente.',
    technical_notes:
      'Excelente postura de recuperación. Para mayor profundidad, separar ligeramente las rodillas. Si las caderas no llegan a los talones, colocar una manta doblada entre los muslos y las pantorrillas.',
    difficulty: 'Básico',
    primaryMuscle: 'Dorsales',
    is_compound: 0,
    secondaryMuscles: ['Glúteos', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
  {
    name: 'Half Kneeling Hip Flexor Stretch',
    image_url: '/img/exercises/half-kneeling-hip-flexor-stretch.svg',
    video_long_path: 'https://www.youtube.com/watch?v=VYItAZ1sLhA',
    description:
      'En posición media-arrodillada (un pie adelante en 90°, rodilla trasera en el suelo), empujar suavemente la cadera hacia adelante mientras se mantiene el torso erguido. Opcionalmente elevar el brazo del lado de la rodilla trasera para aumentar el estiramiento.',
    technical_notes:
      'El estiramiento se siente en el flexor de cadera (psoas/ilíaco) del lado de la rodilla en el suelo. Evitar que la espalda se arquee excesivamente. La rodilla delantera debe estar directamente sobre el tobillo.',
    difficulty: 'Básico',
    primaryMuscle: 'Cuádriceps',
    is_compound: 0,
    secondaryMuscles: ['Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    sections: ['Vuelta a la calma', 'Entrada en calor'],
    units: ['Segundos'],
  },
  {
    name: 'Standing Biceps Stretch',
    image_url: '/img/exercises/standing-biceps-stretch.svg',
    video_long_path: 'https://www.youtube.com/shorts/j0rdJpN4B8Y',
    description:
      'De pie, llevar ambos brazos hacia atrás y entrelazar los dedos (o simplemente llevar los brazos hacia atrás con las palmas mirando hacia adelante). Elevar levemente los brazos hacia arriba y hacia atrás, abriendo el pecho y estirando los bíceps.',
    technical_notes:
      'Mantener el torso erguido y los hombros relajados (no elevarlos). La tensión se siente en la parte anterior del brazo y el pecho. Respirar profundamente durante el estiramiento.',
    difficulty: 'Básico',
    primaryMuscle: 'Bíceps',
    is_compound: 0,
    secondaryMuscles: ['Pectorales', 'Deltoides'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
  {
    name: 'Overhead Triceps Stretch',
    image_url: '/img/exercises/overhead-triceps-stretch.svg',
    video_long_path: 'https://www.youtube.com/watch?v=zzvDO56B0HE',
    description:
      'De pie, llevar un brazo hacia arriba y doblar el codo llevando la mano detrás de la cabeza (como si fuera a rascarse la espalda). Con la mano contraria, empujar suavemente el codo hacia abajo para profundizar el estiramiento del tríceps. Repetir del otro lado.',
    technical_notes:
      'Mantener el torso erguido sin inclinar el cuerpo hacia el lado que se estira. El codo estirado apunta hacia el techo. La mano opuesta actúa solo como guía, sin forzar.',
    difficulty: 'Básico',
    primaryMuscle: 'Tríceps',
    is_compound: 0,
    secondaryMuscles: ['Deltoides'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
  {
    name: 'Wrist Extensor Stretch',
    image_url: '/img/exercises/wrist-extensor-stretch.svg',
    video_long_path: 'https://www.youtube.com/watch?v=cnuBSIWReSc',
    description:
      'Extender un brazo al frente con la palma mirando hacia abajo. Doblar la muñeca hacia abajo (flexión) apuntando los dedos hacia el suelo. Con la mano libre, empujar suavemente los dedos hacia abajo para intensificar el estiramiento del antebrazo. Repetir del otro lado.',
    technical_notes:
      'Esencial para prevenir lesiones en muñeca y antebrazo, especialmente útil después de ejercicios con kettlebell o barra. Mantener el codo extendido durante el estiramiento para mayor efectividad.',
    difficulty: 'Básico',
    primaryMuscle: 'Antebrazos',
    is_compound: 0,
    secondaryMuscles: [],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    sections: ['Vuelta a la calma'],
    units: ['Segundos'],
  },
];

// ─── Función principal ────────────────────────────────────────────────────────

export async function importClass13042026(): Promise<{ exercises: number; created: boolean }> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

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

  // ── Paso 1: Crear ejercicios nuevos si no existen ─────────────────────────
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
          exId,
          ex.name,
          ex.description,
          ex.technical_notes ?? null,
          ex.video_long_path ?? null,
          ex.image_url ?? null,
          diffId,
          primaryMuscleId,
          ex.is_compound,
          timestamp,
          timestamp,
        ]
      );

      if (primaryMuscleId) {
        await db.run(
          'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 1)',
          [generateUUID(), exId, primaryMuscleId]
        );
      }

      for (const mName of ex.secondaryMuscles) {
        const mId = muscleMap.get(mName);
        if (mId) {
          await db.run(
            'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
            [generateUUID(), exId, mId]
          );
        }
      }

      for (const eName of ex.equipment) {
        const eId = equipmentMap.get(eName);
        if (eId) {
          await db.run(
            'INSERT INTO exercise_equipment (id, exercise_id, equipment_id) VALUES (?, ?, ?)',
            [generateUUID(), exId, eId]
          );
        }
      }

      for (const tName of ex.tags) {
        const tId = tagMap.get(tName);
        if (tId) {
          await db.run(
            'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?, ?, ?)',
            [generateUUID(), exId, tId]
          );
        }
      }

      for (const sName of ex.sections) {
        const sId = sectionMap.get(sName);
        if (sId) {
          await db.run(
            'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?, ?, ?)',
            [generateUUID(), exId, sId]
          );
        }
      }

      for (let i = 0; i < ex.units.length; i++) {
        const uId = unitMap.get(ex.units[i]);
        if (uId) {
          await db.run(
            'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, ?)',
            [generateUUID(), exId, uId, i === 0 ? 1 : 0]
          );
        }
      }

      exercisesCreated++;
    }

    exerciseIdMap.set(ex.name, exId);
  }

  // ── Paso 2: Cargar también los ejercicios existentes que usa la clase ──────
  const existingNames = [
    'Scapular Push-Up',
    'Back Squat',
    'Running',
    'Hanging Toes-to-Bar',
  ];
  for (const name of existingNames) {
    if (!exerciseIdMap.has(name)) {
      const exId = await findExercise(db, name);
      if (exId) exerciseIdMap.set(name, exId);
    }
  }

  // ── Paso 3: Verificar si la clase ya existe ───────────────────────────────
  const existing = await db.query(
    `SELECT id FROM class_template WHERE name = 'Clase GOAT 13/04/2026' AND is_active = 1`
  );
  if ((existing.values?.length ?? 0) > 0) {
    if (exercisesCreated > 0) await saveDatabase();
    markImportDone();
    return { exercises: exercisesCreated, created: false };
  }

  // ── Paso 4: Crear la plantilla de clase ───────────────────────────────────
  const templateId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, name, date, objective, is_favorite, template_type, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, 'generic', 1, ?, ?)`,
    [
      templateId,
      'Clase GOAT 13/04/2026',
      '2026-04-13',
      'Movilidad torácica · Fuerza de piernas (Back Squat) · WOD metabólico con kettlebell · Estiramiento completo',
      timestamp,
      timestamp,
    ]
  );

  const entradaCalorId = sectionMap.get('Entrada en calor');
  const activacionId = sectionMap.get('Activación');
  const fuerzaId = sectionMap.get('Fuerza');
  const wodId = sectionMap.get('WOD');
  const vueltaCalmaId = sectionMap.get('Vuelta a la calma');

  const trabajoLibreId = formatMap.get('Trabajo libre');
  const porRondasId = formatMap.get('Por rondas');
  const seriesFijasId = formatMap.get('Series fijas');
  const amrapId = formatMap.get('AMRAP');

  const kgId = unitMap.get('Kilogramos');
  const metrosId = unitMap.get('Metros');
  const segId = unitMap.get('Segundos');

  // ── Sección 1: Calentamiento (sin ejercicios específicos) ─────────────────
  const s1Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, 360, ?, ?)`,
    [s1Id, templateId, entradaCalorId, trabajoLibreId, 'Calentamiento', '6 minutos de calentamiento general', timestamp, timestamp]
  );

  // ── Sección 2: Movilidad (2 rondas, 30 seg cada ejercicio) ───────────────
  const s2Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 2, ?, ?, 2, ?, ?)`,
    [s2Id, templateId, entradaCalorId, porRondasId, 'Movilidad', '2 rondas · 30 segundos por ejercicio', timestamp, timestamp]
  );

  const movilidadExs: Array<{ name: string; notes?: string }> = [
    { name: 'Scapular Push-Up' },
    { name: 'Scapular Push-Up', notes: 'Variante dinámica' },
    { name: 'Half Kneeling Thoracic Rotation', notes: 'Cada lado' },
  ];

  for (let i = 0; i < movilidadExs.length; i++) {
    const { name, notes } = movilidadExs[i];
    const exId = exerciseIdMap.get(name);
    if (!exId) continue;
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_time_seconds, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 30, ?, ?, ?)`,
      [generateUUID(), s2Id, exId, i + 1, notes ?? null, timestamp, timestamp]
    );
  }

  // ── Sección 3: Activación (todo seguido, máximo 5 minutos) ───────────────
  const s3Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 3, ?, ?, 300, ?, ?)`,
    [s3Id, templateId, activacionId, trabajoLibreId, 'Activación', 'Todo seguido · máximo 5 minutos', timestamp, timestamp]
  );

  const activacionExs: Array<{ name: string; reps: number; kg?: number; notes?: string }> = [
    { name: 'Squat Press-Out', reps: 10, kg: 5 },
    { name: 'Weighted Hollow Rock', reps: 12, kg: 5 },
    { name: 'Weighted Lunge', reps: 12, kg: 5 },
    { name: 'Plank Up-Down', reps: 12 },
  ];

  for (let i = 0; i < activacionExs.length; i++) {
    const { name, reps, kg } = activacionExs[i];
    const exId = exerciseIdMap.get(name);
    if (!exId) continue;
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_repetitions, planned_weight_value, planned_weight_unit_id,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s3Id, exId, i + 1, reps, kg ?? null, kg ? kgId : null, timestamp, timestamp]
    );
  }

  // ── Sección 4: Fuerza – Back Squat (Series fijas, progresión de peso) ─────
  const s4Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, created_at, updated_at)
     VALUES (?, ?, ?, ?, 4, ?, ?, ?, ?)`,
    [s4Id, templateId, fuerzaId, seriesFijasId, 'Fuerza', 'Series con incremento progresivo de carga · descanso entre series', timestamp, timestamp]
  );

  const backSquatId = exerciseIdMap.get('Back Squat');
  const fuerzaSeries: Array<{ reps: number; kg: number; pct: number }> = [
    { reps: 5, kg: 70, pct: 75 },
    { reps: 5, kg: 70, pct: 75 },
    { reps: 4, kg: 80, pct: 80 },
    { reps: 4, kg: 80, pct: 80 },
    { reps: 3, kg: 90, pct: 85 },
  ];

  if (backSquatId) {
    for (let i = 0; i < fuerzaSeries.length; i++) {
      const { reps, kg, pct } = fuerzaSeries[i];
      await db.run(
        `INSERT INTO section_exercise
           (id, class_section_id, exercise_id, sort_order,
            planned_repetitions, planned_weight_value, planned_weight_unit_id,
            rm_percentage, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), s4Id, backSquatId, i + 1, reps, kg, kgId, pct, timestamp, timestamp]
      );
    }
  }

  // ── Sección 5: WOD – AMRAP 12 minutos ────────────────────────────────────
  const s5Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 5, ?, ?, 720, ?, ?)`,
    [s5Id, templateId, wodId, amrapId, 'WOD', 'AMRAP · 12 minutos · máximo de rondas', timestamp, timestamp]
  );

  const wodExs: Array<{ name: string; reps?: number; distancia?: number; kg?: number }> = [
    { name: 'Running', distancia: 200 },
    { name: 'American Kettlebell Swing', reps: 12, kg: 15 },
    { name: 'Hanging Toes-to-Bar', reps: 12 },
    { name: 'Kettlebell Box Step-Over', reps: 12, kg: 15 },
  ];

  for (let i = 0; i < wodExs.length; i++) {
    const { name, reps, distancia, kg } = wodExs[i];
    const exId = exerciseIdMap.get(name);
    if (!exId) continue;

    if (distancia) {
      await db.run(
        `INSERT INTO section_exercise
           (id, class_section_id, exercise_id, sort_order,
            planned_distance_value, planned_distance_unit_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), s5Id, exId, i + 1, distancia, metrosId, timestamp, timestamp]
      );
    } else {
      await db.run(
        `INSERT INTO section_exercise
           (id, class_section_id, exercise_id, sort_order,
            planned_repetitions, planned_weight_value, planned_weight_unit_id,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), s5Id, exId, i + 1, reps, kg ?? null, kg ? kgId : null, timestamp, timestamp]
      );
    }
  }

  // ── Sección 6: Estiramiento (Vuelta a la calma, 20-30 seg cada uno) ───────
  const s6Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, created_at, updated_at)
     VALUES (?, ?, ?, ?, 6, ?, ?, ?, ?)`,
    [s6Id, templateId, vueltaCalmaId, trabajoLibreId, 'Estiramiento', 'Cada ejercicio 20-30 segundos', timestamp, timestamp]
  );

  const estiramientoNames = [
    'Supine Spinal Twist',
    'Seated Forward Fold',
    'Seated Quad Stretch',
    'Pigeon Pose',
    'Supine Abdominal Stretch',
    'Cobra Pose',
    "Child's Pose",
    'Half Kneeling Hip Flexor Stretch',
    'Standing Biceps Stretch',
    'Overhead Triceps Stretch',
    'Wrist Extensor Stretch',
  ];

  for (let i = 0; i < estiramientoNames.length; i++) {
    const exId = exerciseIdMap.get(estiramientoNames[i]);
    if (!exId) continue;
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_time_seconds, created_at, updated_at)
       VALUES (?, ?, ?, ?, 30, ?, ?)`,
      [generateUUID(), s6Id, exId, i + 1, timestamp, timestamp]
    );
  }

  await saveDatabase();
  markImportDone();
  return { exercises: exercisesCreated, created: true };
}
