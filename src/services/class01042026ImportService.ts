// Servicio de importación de la Clase GOAT 01/04/2026
// Crea los ejercicios nuevos y la plantilla con sus 6 secciones:
// Calentamiento · Movilidad (2 rondas/30s) · Activación (EMOM 5 min)
// · Fuerza A – Complejo Snatch (E2MOM 3 rondas)
// · Fuerza B – Snatch con Pausa (E2MOM 6 rondas)
// · WOD (10 rondas, 16 min, en parejas)

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_01_04_2026_done';

export function isClass01042026ImportDone(): boolean {
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
    name: 'Band Pull-Apart',
    image_url: '/img/exercises/band-pull-apart.svg',
    description:
      'De pie, sostener una banda elástica con ambas manos al frente a la altura de los hombros. Separar los brazos horizontalmente hasta que la banda toque el pecho, luego volver controlado.',
    technical_notes:
      'Mantener los codos extendidos durante todo el movimiento. No elevar los hombros. Las escápulas se juntan al final del recorrido. Ideal para activar el manguito rotador.',
    video_long_path: 'https://www.youtube.com/shorts/SuvO4TBwSu4',
    difficulty: 'Básico',
    primaryMuscle: 'Deltoides',
    is_compound: 0,
    secondaryMuscles: ['Trapecio', 'Dorsales'],
    equipment: ['Banda elástica'],
    tags: ['hombro', 'pull', 'movilidad'],
    sections: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
  },
  {
    name: 'Band External Rotation',
    image_url: '/img/exercises/band-external-rotation.svg',
    description:
      'De pie junto a un ancla a la altura de la cintura, codo pegado al cuerpo a 90°. Rotar el antebrazo hacia afuera contra la resistencia de la banda y volver. Ejecutar cada lado por separado.',
    technical_notes:
      'El codo NO debe separarse del cuerpo en ningún momento. Rango de movimiento controlado, sin tirones. Trabaja el manguito rotador externo. Fundamental para la salud del hombro en los movimientos de arrancada.',
    video_long_path: 'https://www.youtube.com/watch?v=wQdfeB80fqo',
    difficulty: 'Básico',
    primaryMuscle: 'Deltoides',
    is_compound: 0,
    secondaryMuscles: ['Trapecio'],
    equipment: ['Banda elástica'],
    tags: ['hombro', 'movilidad', 'unilateral'],
    sections: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
  },
  {
    name: '90/90 Hip Rotation',
    image_url: '/img/exercises/hip-90-90-rotation.svg',
    description:
      'Sentado en el suelo con ambas piernas en 90°, una adelante y una al costado. Rotar activamente el torso y la cadera hacia el lado contrario, cambiando la posición de las piernas.',
    technical_notes:
      'Mantener la espalda recta durante toda la rotación. Las rodillas permanecen en 90°. El movimiento es activo (musculado), no se fuerza. Excelente para mejorar la movilidad de cadera necesaria para la sentadilla profunda.',
    video_long_path: 'https://www.youtube.com/watch?v=f_7qIPxw6nE',
    difficulty: 'Básico',
    primaryMuscle: 'Glúteos',
    is_compound: 0,
    secondaryMuscles: ['Core/Abdominales', 'Isquiotibiales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    sections: ['Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
  },
  {
    name: 'Lateral Raise to Overhead',
    image_url: '/img/exercises/lateral-raise-to-overhead.svg',
    description:
      'De pie con discos muy livianos (2.5 kg). Elevar los brazos lateralmente hasta la horizontal (lateral raise) y continuar el arco hasta overhead. Bajar por el mismo camino.',
    technical_notes:
      'Usar pesos muy livianos. El movimiento es continuo y fluido, sin pausa. Core activo. No encogerse de hombros durante el lateral raise. Activa los deltoides y prepara el hombro para los movimientos de arrancada.',
    video_long_path: 'https://www.youtube.com/watch?v=7mUqxKfg6zo',
    difficulty: 'Básico',
    primaryMuscle: 'Deltoides',
    is_compound: 0,
    secondaryMuscles: ['Trapecio'],
    equipment: ['Disco'],
    tags: ['hombro', 'monoarticular', 'bilateral'],
    sections: ['Activación'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Scapular Push-Up',
    image_url: '/img/exercises/scapular-push-up.svg',
    description:
      'En posición de plancha alta, sin doblar los codos, hacer protracción (separar escápulas, torso sube) y retracción (juntar escápulas, torso baja) escapular. El movimiento es de pocos centímetros.',
    technical_notes:
      'Los codos permanecen completamente extendidos en todo momento. Es un movimiento puro de escápulas, no de brazos. Core activo. Desarrolla el control serrátil anterior y la estabilidad escapular necesaria para los movimientos overhead.',
    video_long_path: 'https://www.youtube.com/watch?v=huGj4aBk9C4',
    difficulty: 'Básico',
    primaryMuscle: 'Dorsales',
    is_compound: 0,
    secondaryMuscles: ['Pectorales', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Activación', 'Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
  },
  {
    name: 'High Pull + External Rotation',
    image_url: '/img/exercises/high-pull-external-rotation.svg',
    description:
      'Con discos livianos (2.5 kg), realizar un high pull tirando los codos hacia arriba y afuera, y en el punto alto rotar los antebrazos hacia arriba (como posición inicial del snatch recibido).',
    technical_notes:
      'Es un ejercicio de preparación para la arrancada. Los codos lideran el tirón. La rotación final simula la recepción del snatch. Usar pesos muy livianos para enfocarse en la técnica y la movilidad del hombro.',
    video_long_path: 'https://www.youtube.com/watch?v=-EZP2ynZchc',
    difficulty: 'Intermedio',
    primaryMuscle: 'Deltoides',
    is_compound: 1,
    secondaryMuscles: ['Trapecio', 'Bíceps'],
    equipment: ['Disco'],
    tags: ['hombro', 'olímpico', 'bilateral'],
    sections: ['Activación', 'Fuerza'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Snatch Grip Deadlift',
    image_url: '/img/exercises/barbell-snatch-grip-deadlift.svg',
    description:
      'Peso muerto con agarre amplio de arrancada (snatch grip). Desde el suelo, elevar la barra con los brazos extendidos y la espalda neutra hasta estar completamente de pie con la cadera extendida.',
    technical_notes:
      'El agarre es significativamente más ancho que el deadlift convencional. Al inicio, los hombros deben estar por delante de la barra. Mantener la espalda plana y la barra pegada al cuerpo durante todo el jalón.',
    video_long_path: 'https://www.youtube.com/watch?v=E42_MZOKktU',
    difficulty: 'Intermedio',
    primaryMuscle: 'Isquiotibiales',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Cuádriceps', 'Dorsales', 'Trapecio'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    sections: ['Fuerza'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Snatch High Pull',
    image_url: '/img/exercises/barbell-snatch-high-pull.svg',
    description:
      'Con agarre de arrancada desde la cadera o el suelo, extender violentamente la cadera y luego tirar con los codos hacia arriba y afuera hasta que la barra llegue al nivel del pecho o la barbilla. Termina en puntillas.',
    technical_notes:
      'La extensión de cadera es la fuente principal de potencia. Los codos salen hacia afuera y hacia arriba (nunca hacia atrás). La barra sube pegada al cuerpo. Es la antesala del pull de la arrancada completa.',
    video_long_path: 'https://www.youtube.com/watch?v=33jE3S5IMMo',
    difficulty: 'Intermedio',
    primaryMuscle: 'Trapecio',
    is_compound: 1,
    secondaryMuscles: ['Deltoides', 'Cuádriceps', 'Glúteos'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    sections: ['Fuerza', 'Habilidad'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Barbell Muscle Snatch',
    image_url: '/img/exercises/barbell-muscle-snatch.svg',
    description:
      'Arrancada muscular: desde la cadera, tirar la barra hacia arriba con codos altos y en el punto máximo rotar los antebrazos para llevar la barra overhead sin sentadilla de recepción. Bloqueo con brazos extendidos.',
    technical_notes:
      'A diferencia del snatch olímpico, no hay squat de recepción. Los codos suben alto primero y luego el antebrazo rota hacia afuera y arriba. La barra no debe alejarse del cuerpo. Trabaja la coordinación del jalón y la recepción.',
    video_long_path: 'https://www.youtube.com/watch?v=hFb3l16PI4U',
    difficulty: 'Intermedio',
    primaryMuscle: 'Deltoides',
    is_compound: 1,
    secondaryMuscles: ['Trapecio', 'Cuádriceps', 'Glúteos', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'push', 'bilateral'],
    sections: ['Fuerza', 'Habilidad'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Snatch with Pause at Knee',
    image_url: '/img/exercises/barbell-snatch-pause-at-knee.svg',
    description:
      'Arrancada completa con una pausa de 2 segundos cuando la barra pasa la altura de las rodillas. Se trabaja la posición crítica de la primera y segunda tracción antes de la extensión final.',
    technical_notes:
      'Durante la pausa: espalda plana, hombros delante de la barra, peso en el mediopié. Reanudar con potencia explosiva. Usar menos peso que el snatch normal. La pausa enseña a "sentir" la posición correcta antes de la extensión.',
    video_long_path: 'https://www.youtube.com/watch?v=EOrFQ9O1Ng4',
    difficulty: 'Avanzado',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Deltoides', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'bilateral'],
    sections: ['Fuerza', 'Habilidad'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Dumbbell Deadlift',
    image_url: '/img/exercises/dumbbell-deadlift.svg',
    description:
      'Peso muerto con mancuernas. Desde el suelo con mancuernas al costado del cuerpo, flexionar caderas y rodillas para descender y luego extender para subir manteniendo la espalda neutra.',
    technical_notes:
      'Igual al deadlift con barra pero las mancuernas quedan a los costados del cuerpo. Mantener el core activo y la columna neutra en todo momento. El movimiento lo inicia la cadera, no los brazos.',
    video_long_path: 'https://www.youtube.com/shorts/ElCIiU1FWxg',
    difficulty: 'Básico',
    primaryMuscle: 'Isquiotibiales',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Cuádriceps', 'Core/Abdominales'],
    equipment: ['Mancuernas'],
    tags: ['pull', 'bilateral'],
    sections: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Repeticiones'],
  },
  {
    name: 'DB Lateral Step-Over',
    image_url: '/img/exercises/dumbbell-lateral-step-over.svg',
    description:
      'Con una mancuerna en cada mano, pasar lateralmente por encima de un objeto en el suelo (barra, cono) dando un paso lateral con cada pierna. Al llegar al otro lado, repetir en sentido contrario.',
    technical_notes:
      'Mantener el torso erguido durante todo el movimiento. El desplazamiento es lateral. Core activo. Las mancuernas no se apoyan en el objeto. También llamado DB Crossover.',
    video_long_path: 'https://www.youtube.com/shorts/vs1813G1Q00',
    difficulty: 'Básico',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Core/Abdominales'],
    equipment: ['Mancuernas'],
    tags: ['cardio', 'unilateral', 'pliométrico'],
    sections: ['WOD'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Dumbbell Push Press',
    image_url: '/img/exercises/dumbbell-push-press.svg',
    description:
      'Con mancuernas en rack position (a la altura de los hombros), hacer un pequeño dip de rodillas y usar el impulso de la extensión de piernas para empujar las mancuernas hasta overhead.',
    technical_notes:
      'El dip es pequeño y controlado (10-15 cm). La extensión de rodillas genera el impulso inicial. Terminar con brazos completamente extendidos y bíceps junto a las orejas. No inclinarse hacia atrás.',
    video_long_path: 'https://www.youtube.com/shorts/cQ67XoqcItE',
    difficulty: 'Intermedio',
    primaryMuscle: 'Deltoides',
    is_compound: 1,
    secondaryMuscles: ['Tríceps', 'Cuádriceps', 'Core/Abdominales'],
    equipment: ['Mancuernas'],
    tags: ['push', 'press', 'bilateral'],
    sections: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Repeticiones'],
  },
];

// ─── Función principal de importación ────────────────────────────────────────

export async function importClass01042026(): Promise<{ exercises: number; created: boolean }> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Verificar si la plantilla ya existe
  const existing = await db.query(
    `SELECT id FROM class_template WHERE name = 'Clase GOAT 01/04/2026' AND is_active = 1`
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

  // ── Paso 2: Crear la plantilla ────────────────────────────────────────────
  const templateId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, name, date, objective, estimated_duration_minutes, is_favorite, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 60, 0, 1, ?, ?)`,
    [
      templateId,
      'Clase GOAT 01/04/2026',
      '2026-04-01',
      'Progresión técnica de arrancada: complejo Snatch Grip DL + High Pull + Muscle Snatch en EMOM, Snatch con pausa + WOD en parejas con mancuernas',
      timestamp, timestamp,
    ]
  );

  const warmupTypeId  = sectionMap.get('Entrada en calor');
  const activTypeId   = sectionMap.get('Activación');
  const fuerzaTypeId  = sectionMap.get('Fuerza');
  const wodTypeId     = sectionMap.get('WOD');
  const porRondasId   = formatMap.get('Por rondas');
  const e2momId       = formatMap.get('E2MOM');
  const trabLibreId   = formatMap.get('Trabajo libre');
  const emomId        = formatMap.get('EMOM');
  const kgId          = unitMap.get('Kilogramos');

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
    { name: 'Band Pull-Apart', notes: null },
    { name: 'Band External Rotation', notes: 'Cada lado' },
    { name: '90/90 Hip Rotation', notes: null },
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
        visible_title, general_description, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 3, 'Activación', 'todo 10 repeticiones en 5 minutos', 300, ?, ?)`,
    [s3, templateId, activTypeId, emomId, timestamp, timestamp]
  );
  const activExs = [
    { name: 'Lateral Raise to Overhead', reps: 10, kg: 2.5, notes: '2 discos de 2.5 kg' },
    { name: 'Scapular Push-Up', reps: 10, kg: null, notes: null },
    { name: 'High Pull + External Rotation', reps: 10, kg: 2.5, notes: '2 discos de 2.5 kg' },
  ];
  for (let i = 0; i < activExs.length; i++) {
    const { name, reps, kg, notes } = activExs[i];
    const id = exId(name);
    if (id) await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, planned_repetitions,
          planned_weight_value, planned_weight_unit_id, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s3, id, i + 1, reps, kg, kg ? kgId : null, notes, timestamp, timestamp]
    );
  }

  // ── Sección 4: Fuerza A – Complejo Snatch ────────────────────────────────
  const s4 = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, total_rounds, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 4, 'Fuerza - Complejo', '3 rondas, 5 repeticiones por 1 minuto', 3, 180, ?, ?)`,
    [s4, templateId, fuerzaTypeId, e2momId, timestamp, timestamp]
  );
  const complejoExs = [
    { name: 'Snatch Grip Deadlift', reps: 5, notes: 'a' },
    { name: 'Snatch High Pull', reps: 5, notes: 'b' },
    { name: 'Barbell Muscle Snatch', reps: 5, notes: 'c' },
  ];
  for (let i = 0; i < complejoExs.length; i++) {
    const { name, reps, notes } = complejoExs[i];
    const id = exId(name);
    if (id) await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, planned_repetitions,
          planned_weight_value, planned_weight_unit_id, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 20, ?, ?, ?, ?)`,
      [generateUUID(), s4, id, i + 1, reps, kgId, notes, timestamp, timestamp]
    );
  }

  // ── Sección 5: Fuerza B – Snatch con Pausa ───────────────────────────────
  const s5 = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, total_rounds, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 5, 'Fuerza - Snatch', '6 rondas, 3 repeticiones por 1.5 minutos', 6, 540, ?, ?)`,
    [s5, templateId, fuerzaTypeId, e2momId, timestamp, timestamp]
  );
  const snatPauseId = exId('Snatch with Pause at Knee');
  if (snatPauseId) await db.run(
    `INSERT INTO section_exercise
       (id, class_section_id, exercise_id, sort_order, planned_repetitions,
        coach_notes, created_at, updated_at)
     VALUES (?, ?, ?, 1, 3, '2 segundos de pausa en rodilla', ?, ?)`,
    [generateUUID(), s5, snatPauseId, timestamp, timestamp]
  );

  // ── Sección 6: WOD ────────────────────────────────────────────────────────
  const s6 = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        visible_title, general_description, total_rounds, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 6, 'WOD', '10 rondas máximo 16 minutos — en parejas: uno trabaja el otro descansa', 10, 960, ?, ?)`,
    [s6, templateId, wodTypeId, porRondasId, timestamp, timestamp]
  );
  const wodExs = [
    { name: 'Dumbbell Deadlift', reps: 6, kg: 10 },
    { name: 'DB Lateral Step-Over', reps: 4, kg: 10 },
    { name: 'Dumbbell Push Press', reps: 2, kg: null },
  ];
  for (let i = 0; i < wodExs.length; i++) {
    const { name, reps, kg } = wodExs[i];
    const id = exId(name);
    if (id) await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, planned_repetitions,
          planned_weight_value, planned_weight_unit_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s6, id, i + 1, reps, kg, kg ? kgId : null, timestamp, timestamp]
    );
  }

  markImportDone();
  return { exercises: exercisesCreated, created: true };
}
