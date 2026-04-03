// Servicio de importación de la clase de Nestor del 28/03/2026
// Crea los 10 ejercicios del entrenamiento y la plantilla de clase con sus 3 secciones.
// Asume que "Cargar Datos Base" ya fue ejecutado (catálogos y ejercicios base presentes).

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_nestor_28_03_2026_done';

export function isNestorImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markImportDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

async function findExercise(db: SQLiteDBConnection, name: string): Promise<string | null> {
  const r = await db.query(`SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?)) AND is_active = 1`, [name]);
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
  units: string[]; // primera unidad = default
}

// ─── Definición de los ejercicios del entrenamiento ───────────────────────────

const EXERCISES: ExerciseInput[] = [
  {
    name: 'Toe Touch Sit-Up',
    image_url: '/img/exercises/toe-touch-sit-up.svg',
    description:
      'Acostado boca arriba con piernas estiradas y apoyadas en el piso. Se eleva el torso completo (recorrido completo, no crunch) y al llegar arriba se estiran los brazos para tocar la punta de los pies.',
    technical_notes:
      'No es un crunch (recorrido parcial) ni un V-Up (las piernas no se elevan). El toque de pies se da con el torso subiendo, no moviendo las piernas.',
    difficulty: 'Básico',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: [],
    equipment: [],
    tags: ['core'],
    sections: ['Activación', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
  },
  {
    name: 'Hollow to Superman Roll',
    image_url: '/img/exercises/hollow-to-superman-roll.svg',
    description:
      'Empezar en posición Hollow Hold (boca arriba, brazos y piernas levemente elevadas formando una "banana" invertida). Girar el cuerpo hacia un lado llegando a posición Superman Hold (boca abajo, brazos y piernas elevados). Volver girando hacia el otro lado. Repetir alternando.',
    technical_notes:
      'También llamado Hollow Body Roll o Hollow to Arch Roll. Hollow = posición cóncava; Superman/Arch = posición convexa.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 1,
    secondaryMuscles: ['Dorsales'],
    equipment: [],
    tags: ['core', 'gimnástico'],
    sections: ['Activación', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
  },
  {
    name: 'Plank to Opposite Toe Touch',
    image_url: '/img/exercises/plank-to-opposite-toe-touch.svg',
    description:
      'Desde plancha alta (high plank), elevar la cadera tipo pike y llevar una mano al pie contrario. Volver a plancha y alternar lados.',
    technical_notes:
      'Combina estabilidad de core (plank), flexión de cadera (pike) y coordinación cruzada. También llamado Alternating Plank Toe Touch o Crossbody Plank Toe Touch.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 1,
    secondaryMuscles: ['Deltoides'],
    equipment: [],
    tags: ['core', 'isométrico'],
    sections: ['Activación', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
  },
  {
    name: 'Dumbbell Front Raise',
    image_url: '/img/exercises/dumbbell-front-raise.svg',
    description:
      'De pie con una mancuerna en cada mano, brazos al costado. Elevar ambos brazos rectos hacia adelante hasta ~90° (altura de hombros). Bajar controlado.',
    technical_notes:
      'Focaliza el deltoides anterior. Mantener core activo y evitar balancear el torso. Puede hacerse alternando un brazo y el otro (Alternating Dumbbell Front Raise).',
    difficulty: 'Básico',
    primaryMuscle: 'Deltoides',
    is_compound: 0,
    secondaryMuscles: ['Pectorales'],
    equipment: ['Mancuernas'],
    tags: ['hombro', 'monoarticular', 'push'],
    sections: ['Fuerza', 'Accesorio'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Bent-Over Dumbbell Lateral Raise',
    image_url: '/img/exercises/bent-over-dumbbell-lateral-raise.svg',
    description:
      'De pie con mancuernas a los costados, tronco ligeramente inclinado hacia adelante y brazos casi rectos. Elevar los brazos hacia los lados lo más alto posible. Bajar controlado.',
    technical_notes:
      'Trabaja el deltoides posterior y la parte alta de la espalda (romboides, trapecio medio). También llamado Rear Delt Raise o Reverse Fly. Si el torso estuviera erguido sería un Dumbbell Lateral Raise (deltoides medio).',
    difficulty: 'Básico',
    primaryMuscle: 'Deltoides',
    is_compound: 0,
    secondaryMuscles: ['Trapecio'],
    equipment: ['Mancuernas'],
    tags: ['hombro', 'monoarticular', 'pull'],
    sections: ['Fuerza', 'Accesorio'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Stability Ball Plate Crunch',
    image_url: '/img/exercises/stability-ball-plate-crunch.svg',
    description:
      'Acostado sobre una pelota suiza (stability ball / swiss ball) quedando paralelo al suelo, con pies apoyados para estabilidad. Sostener un disco (plate) con ambas manos. Extender el torso hacia atrás y luego hacer crunch llevando el disco hacia adelante/arriba.',
    technical_notes:
      'La inestabilidad de la pelota aumenta la activación del core. Utilizar una Stability Ball, no un balón medicinal ni wall ball. Alternativa: Swiss Ball Plate Crunch.',
    video_long_path: 'https://www.youtube.com/watch?v=uKEYmOZMkRM',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: [],
    equipment: [],
    tags: ['core'],
    sections: ['Fuerza', 'Accesorio'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Dumbbell Bench Press',
    image_url: '/img/exercises/dumbbell-bench-press.svg',
    description:
      'Acostado (en banco plano o en el piso), una mancuerna en cada mano a la altura de los hombros. Empujar hacia arriba hasta extender los brazos perpendicular al cuerpo. Bajar controlado.',
    technical_notes:
      'Músculos principales: pectoral mayor. Secundarios: tríceps y deltoides anterior. Si se hace en el suelo se llama Dumbbell Floor Press.',
    video_long_path: 'https://www.youtube.com/watch?v=QsYre__-aro',
    difficulty: 'Intermedio',
    primaryMuscle: 'Pectorales',
    is_compound: 1,
    secondaryMuscles: ['Tríceps', 'Deltoides'],
    equipment: ['Mancuernas'],
    tags: ['press', 'push', 'bilateral'],
    sections: ['Fuerza', 'WOD'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Running',
    image_url: '/img/exercises/running.svg',
    description: 'Correr. Ejercicio cardiovascular fundamental presente en gran cantidad de WODs.',
    difficulty: 'Básico',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Isquiotibiales', 'Glúteos', 'Pantorrillas'],
    equipment: [],
    tags: ['cardio'],
    sections: ['WOD', 'Entrada en calor'],
    units: ['Metros', 'Kilómetros'],
  },
  {
    name: "Farmer's Carry",
    image_url: '/img/exercises/farmers-carry.svg',
    description:
      'De pie, sosteniendo dos kettlebells (o mancuernas) pesadas a los costados. Caminar una distancia manteniendo postura firme: espalda recta, hombros hacia atrás y core activo.',
    technical_notes:
      "También llamado Farmer's Walk. Variantes: Single-arm → Suitcase Carry; overhead → Overhead Carry; con barra en front rack → Front Rack Carry.",
    difficulty: 'Intermedio',
    primaryMuscle: 'Antebrazos',
    is_compound: 1,
    secondaryMuscles: ['Trapecio', 'Core/Abdominales', 'Cuádriceps'],
    equipment: ['Kettlebell'],
    tags: ['cardio', 'bilateral'],
    sections: ['WOD', 'Accesorio'],
    units: ['Metros', 'Kilogramos'],
  },
  {
    name: 'Kettlebell Sumo Deadlift High Pull',
    image_url: '/img/exercises/kettlebell-sumo-deadlift-high-pull.svg',
    description:
      'De pie con pies más abiertos que hombros (posición sumo), kettlebell entre los pies agarrada con ambas manos. Bajar a tocar el suelo (deadlift sumo) y luego tirar hacia arriba llevando la kettlebell hasta el pecho con los codos hacia afuera y arriba (high pull).',
    technical_notes:
      'Abreviado KB SDHP. El "high pull" es lo que lo diferencia del Sumo Deadlift: el movimiento continúa hasta el pecho. Nombre estándar en CrossFit, aparece en WODs oficiales.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Glúteos',
    is_compound: 1,
    secondaryMuscles: ['Cuádriceps', 'Isquiotibiales', 'Dorsales', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Kettlebell'],
    tags: ['pull', 'bilateral'],
    sections: ['WOD', 'Fuerza'],
    units: ['Repeticiones', 'Kilogramos'],
  },
];

// ─── Función principal de importación ────────────────────────────────────────

export async function importNestorSession(): Promise<{ exercises: number; created: boolean }> {
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

      // Músculo principal en la tabla de relación
      if (primaryMuscleId) {
        await db.run(
          'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 1)',
          [generateUUID(), exId, primaryMuscleId]
        );
      }

      // Músculos secundarios
      for (const mName of ex.secondaryMuscles) {
        const mId = muscleMap.get(mName);
        if (mId) {
          await db.run(
            'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
            [generateUUID(), exId, mId]
          );
        }
      }

      // Equipamiento
      for (const eName of ex.equipment) {
        const eId = equipmentMap.get(eName);
        if (eId) {
          await db.run(
            'INSERT INTO exercise_equipment (id, exercise_id, equipment_id) VALUES (?, ?, ?)',
            [generateUUID(), exId, eId]
          );
        }
      }

      // Tags
      for (const tName of ex.tags) {
        const tId = tagMap.get(tName);
        if (tId) {
          await db.run(
            'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?, ?, ?)',
            [generateUUID(), exId, tId]
          );
        }
      }

      // Tipos de sección
      for (const sName of ex.sections) {
        const sId = sectionMap.get(sName);
        if (sId) {
          await db.run(
            'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?, ?, ?)',
            [generateUUID(), exId, sId]
          );
        }
      }

      // Unidades (la primera es la default)
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

  // ── Paso 2: Verificar si la plantilla ya existe ──────────────────────────
  const existing = await db.query(
    `SELECT id FROM class_template WHERE name = 'Nestor - 28/03/2026' AND is_active = 1`
  );
  if ((existing.values?.length ?? 0) > 0) {
    markImportDone();
    return { exercises: exercisesCreated, created: false };
  }

  // ── Paso 3: Crear la plantilla de clase ──────────────────────────────────
  const templateId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, name, date, objective, is_favorite, template_type, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, 'generic', 1, ?, ?)`,
    [
      templateId,
      'Nestor - 28/03/2026',
      '2026-03-28',
      'Activación de core · Fuerza de hombros y pecho · WOD metabólico',
      timestamp,
      timestamp,
    ]
  );

  const entradaCalorId = sectionMap.get('Entrada en calor');
  const activacionId = sectionMap.get('Activación');
  const fuerzaId = sectionMap.get('Fuerza');
  const wodId = sectionMap.get('WOD');
  const porRondasId = formatMap.get('Por rondas');
  const kgId = unitMap.get('Kilogramos');
  const metrosId = unitMap.get('Metros');

  // ── Sección 1: Calentamiento — sin ejercicios, 6 minutos ─────────────────
  const s1Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, sort_order,
        general_description, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?, ?)`,
    [s1Id, templateId, entradaCalorId, '6 minutos de calentamiento', timestamp, timestamp]
  );

  // ── Sección 2: Activación — 3 rondas ─────────────────────────────────────
  const s2Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 2, ?, 3, ?, ?)`,
    [s2Id, templateId, activacionId, porRondasId, 'Activación', timestamp, timestamp]
  );

  const activacionExs: Array<{ name: string; time: number; rest: number }> = [
    { name: 'Toe Touch Sit-Up', time: 30, rest: 30 },
    { name: 'Hollow to Superman Roll', time: 30, rest: 30 },
    { name: 'Plank to Opposite Toe Touch', time: 40, rest: 20 },
  ];

  for (let i = 0; i < activacionExs.length; i++) {
    const { name, time, rest } = activacionExs[i];
    const exId = exerciseIdMap.get(name);
    if (!exId) continue;
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_time_seconds, planned_rest_seconds, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s2Id, exId, i + 1, time, rest, timestamp, timestamp]
    );
  }

  // ── Sección 3: Fuerza — 3 rondas (Grupo A + Grupo B) ─────────────────────
  const s3Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 3, ?, 3, ?, ?)`,
    [s3Id, templateId, fuerzaId, porRondasId, 'Grupo A: hombros · Grupo B: pecho y core', timestamp, timestamp]
  );

  const fuerzaExs: Array<{
    name: string;
    reps: number;
    kg: number;
    group: string;
  }> = [
    { name: 'Dumbbell Front Raise', reps: 10, kg: 12.5, group: 'Grupo A' },
    { name: 'Bent-Over Dumbbell Lateral Raise', reps: 12, kg: 12.5, group: 'Grupo A' },
    { name: 'Stability Ball Plate Crunch', reps: 10, kg: 5, group: 'Grupo B' },
    { name: 'Dumbbell Bench Press', reps: 10, kg: 12.5, group: 'Grupo B' },
  ];

  for (let i = 0; i < fuerzaExs.length; i++) {
    const { name, reps, kg, group } = fuerzaExs[i];
    const exId = exerciseIdMap.get(name);
    if (!exId) continue;
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_repetitions, planned_weight_value, planned_weight_unit_id,
          coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s3Id, exId, i + 1, reps, kg, kgId, group, timestamp, timestamp]
    );
  }

  // ── Sección 4: WOD — 4 rondas (Grupo A + Grupo B) ────────────────────────
  const s4Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 4, ?, 4, ?, ?)`,
    [s4Id, templateId, wodId, porRondasId, 'Grupo A: cardio · Grupo B: fuerza funcional', timestamp, timestamp]
  );

  // Running: distancia en metros
  const runId = exerciseIdMap.get('Running');
  if (runId) {
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_distance_value, planned_distance_unit_id,
          coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, 1, 200, ?, ?, ?, ?)`,
      [generateUUID(), s4Id, runId, metrosId, 'Grupo A', timestamp, timestamp]
    );
  }

  // Farmer's Carry: distancia + peso
  const farmerId = exerciseIdMap.get("Farmer's Carry");
  if (farmerId) {
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_distance_value, planned_distance_unit_id,
          planned_weight_value, planned_weight_unit_id,
          coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, 2, 20, ?, 20, ?, ?, ?, ?)`,
      [generateUUID(), s4Id, farmerId, metrosId, kgId, 'Grupo A', timestamp, timestamp]
    );
  }

  // Kettlebell Sumo Deadlift High Pull
  const kbSdhpId = exerciseIdMap.get('Kettlebell Sumo Deadlift High Pull');
  if (kbSdhpId) {
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_repetitions, planned_weight_value, planned_weight_unit_id,
          coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, 3, 12, 15, ?, ?, ?, ?)`,
      [generateUUID(), s4Id, kbSdhpId, kgId, 'Grupo B', timestamp, timestamp]
    );
  }

  // Dumbbell Bench Press (WOD): peso diferente al de Fuerza
  const dbpId = exerciseIdMap.get('Dumbbell Bench Press');
  if (dbpId) {
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_repetitions, planned_weight_value, planned_weight_unit_id,
          coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, 4, 10, 10, ?, ?, ?, ?)`,
      [generateUUID(), s4Id, dbpId, kgId, 'Grupo B', timestamp, timestamp]
    );
  }

  markImportDone();
  return { exercises: exercisesCreated, created: true };
}
