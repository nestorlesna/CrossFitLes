// Servicio de importación de la clase del 30/03/2026
// Crea los ejercicios nuevos del entrenamiento y la plantilla con sus 5 secciones:
// Calentamiento · Movilidad (2 rondas/30s) · Activación (3 rondas/30s) · Fuerza (E2MOM) · WOD (10 min)

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_30_03_2026_done';

export function isClass30032026ImportDone(): boolean {
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
  units: string[]; // primera unidad = default
}

// ─── Ejercicios a crear (si no existen) ──────────────────────────────────────

const EXERCISES: ExerciseInput[] = [
  {
    name: 'Cossack Squat',
    image_url: '/img/exercises/cossack-squat.svg',
    description:
      'Desde posición de pie con pies bien abiertos (más que el ancho de hombros), bajar el peso del cuerpo hacia un lado flexionando esa rodilla hasta llegar lo más abajo posible, mientras la otra pierna queda completamente extendida en el suelo. Los brazos se extienden al frente como contrapeso. Alternar lados.',
    technical_notes:
      'También llamado "sentadilla cosaca". Mantener el pie del lado extendido completamente apoyado (o la punta si la movilidad no lo permite aún). La rodilla del lado que trabaja no debe sobrepasar demasiado la punta del pie. Es un excelente ejercicio de movilidad de cadera y tobillo.',
    video_long_path: 'https://www.youtube.com/shorts/nFVTuC1jC_I',
    difficulty: 'Intermedio',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Isquiotibiales'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Movilidad', 'Activación', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
  },
  {
    name: 'Kettlebell Ankle Mobility Drill',
    image_url: '/img/exercises/kettlebell-ankle-mobility-drill.svg',
    description:
      'En posición de medio-arrodillado (half kneeling) con una rodilla en el suelo y el pie contrario plano adelante. Colocar una kettlebell frente al pie adelantado como referencia. Empujar la rodilla delantera hacia adelante, sobre la punta del pie, lo más lejos posible sin que el talón se despegue del suelo. Volver y repetir.',
    technical_notes:
      'El objetivo es mejorar la dorsiflexión del tobillo. El talón del pie del frente NO debe levantarse. La kettlebell sirve como guía de distancia objetivo y tope. Realizar en ambas piernas. También se puede hacer contra una pared.',
    video_long_path: 'https://www.youtube.com/shorts/t0dW_gbaQG0',
    difficulty: 'Básico',
    primaryMuscle: 'Pantorrillas',
    is_compound: 0,
    secondaryMuscles: ['Cuádriceps'],
    equipment: ['Kettlebell'],
    tags: ['movilidad'],
    sections: ['Movilidad', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
  },
  {
    name: 'Side Plank con carga',
    image_url: '/img/exercises/side-plank-weighted.svg',
    description:
      'En posición de plancha lateral (side plank), apoyado sobre un antebrazo y el costado del pie inferior, con el cuerpo en línea recta. Sostener una pesa o disco con la mano libre (brazo superior) extendida hacia arriba. Mantener la posición el tiempo indicado.',
    technical_notes:
      'La carga adicional aumenta la demanda sobre los oblicuos y el core lateral. Mantener caderas elevadas en línea con el tronco (sin dejar caer). Puede usarse un disco, mancuerna o kettlebell. Realizar en ambos lados.',
    video_long_path: 'https://www.youtube.com/shorts/GIDLif1n0bM',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: ['Deltoides', 'Glúteos'],
    equipment: [],
    tags: ['core', 'isométrico'],
    sections: ['Activación', 'Accesorio'],
    units: ['Segundos', 'Kilogramos'],
  },
  {
    name: 'Counterbalance Squat',
    image_url: '/img/exercises/counterbalance-squat.svg',
    description:
      'Sentadilla con los pies al ancho de hombros sosteniendo un contrapeso (disco, mancuerna o kettlebell liviana) frente al pecho con los brazos extendidos. Al descender, los brazos se mantienen extendidos hacia adelante sirviendo como contrapeso para facilitar llegar a mayor profundidad con el torso más vertical.',
    technical_notes:
      'Es una herramienta didáctica para enseñar la sentadilla profunda. El contrapeso permite que la cadera baje más sin que el torso caiga hacia adelante. Ideal para trabajar movilidad de tobillo, cadera y torácica simultáneamente.',
    video_long_path: 'https://www.youtube.com/shorts/vCYFgvG2Pck',
    difficulty: 'Básico',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    sections: ['Activación', 'Movilidad', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
  },
  {
    name: 'Hollow Body Rock',
    image_url: '/img/exercises/hollow-rock.svg',
    description:
      'Acostado boca arriba, comprimir el core para que la espalda baja esté en contacto con el suelo. Con piernas estiradas levemente elevadas y brazos extendidos sobre la cabeza, balancear el cuerpo hacia adelante y hacia atrás manteniendo la forma de "banana" (hollow body). El movimiento de balanceo es continuo, controlado y sin soltar la tensión del core.',
    technical_notes:
      'La posición hollow (cóncava) debe mantenerse durante todo el movimiento. Si se pierde la forma, reducir el rango de balanceo. También llamado Hollow Rock o Hollow Body Roll.',
    video_long_path: 'https://www.youtube.com/shorts/tWZBamV2tjc',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 0,
    secondaryMuscles: [],
    equipment: [],
    tags: ['core', 'gimnástico'],
    sections: ['Activación', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
  },
  {
    name: 'Back Squat',
    image_url: '/img/exercises/back-squat.svg',
    description:
      'Con la barra apoyada sobre la parte alta de la espalda (trapecio), pies al ancho de hombros. Descender flexionando rodillas y cadera hasta que los muslos queden paralelos al suelo o por debajo (sentadilla profunda), manteniendo la espalda recta y los talones apoyados. Subir extendiendo piernas y cadera.',
    technical_notes:
      'Es uno de los movimientos fundamentales de la halterofilia y el CrossFit. Mantener el torso lo más vertical posible. Las rodillas siguen la dirección de los pies. El cinturón se recomienda para cargas altas.',
    difficulty: 'Intermedio',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['fuerza', 'bilateral'],
    sections: ['Fuerza'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Shuttle Run',
    image_url: '/img/exercises/shuttle-run.svg',
    description:
      'Correr ida y vuelta entre dos puntos separados una distancia fija (generalmente 5 o 10 metros) el número de veces indicado. Cada toque del extremo y regreso cuenta como una repetición. Se caracteriza por los cambios de dirección y aceleraciones.',
    technical_notes:
      'Las repeticiones en el WOD suelen ser por "largo" (un trayecto) o por "vuelta" (ida y vuelta). En esta clase se realizan 10 shuttles. Énfasis en los cambios de dirección rápidos y bajar el centro de gravedad al girar.',
    video_long_path: 'https://www.youtube.com/shorts/8xEPRtiG7yk',
    difficulty: 'Básico',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Isquiotibiales', 'Glúteos', 'Pantorrillas'],
    equipment: [],
    tags: ['cardio'],
    sections: ['WOD', 'Entrada en calor'],
    units: ['Repeticiones', 'Metros'],
  },
  {
    name: 'Overhead Squat',
    image_url: '/img/exercises/overhead-squat.svg',
    description:
      'Sentadilla completa con la barra sostenida sobre la cabeza con los brazos completamente extendidos y bloqueados (agarre de snatch / amplio). Los codos deben mantenerse extendidos durante todo el movimiento. Descender hasta profundidad completa manteniendo la barra estable y el torso vertical.',
    technical_notes:
      'Es el movimiento de mayor demanda técnica en CrossFit. Requiere excelente movilidad de hombros, torácica, cadera y tobillos. Los hombros activos (empujar hacia arriba) son clave para la estabilidad de la barra. El agarre debe ser bien abierto.',
    video_long_path: 'https://www.youtube.com/watch?v=F1smC539je4',
    difficulty: 'Avanzado',
    primaryMuscle: 'Cuádriceps',
    is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['fuerza', 'gimnástico', 'bilateral'],
    sections: ['WOD', 'Fuerza'],
    units: ['Repeticiones', 'Kilogramos'],
  },
  {
    name: 'Burpee Over The Bar',
    image_url: '/img/exercises/burpee-over-the-bar.svg',
    description:
      'Burpee estándar realizado al costado de una barra en el suelo. Desde de pie, caer al suelo al costado de la barra haciendo un burpee (pecho al suelo), levantarse y saltar sobre la barra aterrizando del otro lado. Repetir desde el nuevo lado.',
    technical_notes:
      'El salto debe ser lateral sobre la barra, aterrizando con ambos pies al mismo tiempo del otro lado. También puede hacerse saltando longitudinalmente sobre la barra. Controlar el aterrizaje para cuidar las rodillas.',
    video_long_path: 'https://www.youtube.com/shorts/KcBPSYkmF08',
    difficulty: 'Intermedio',
    primaryMuscle: 'Core/Abdominales',
    is_compound: 1,
    secondaryMuscles: ['Cuádriceps', 'Pectorales', 'Deltoides'],
    equipment: ['Barra olímpica'],
    tags: ['cardio', 'gimnástico'],
    sections: ['WOD'],
    units: ['Repeticiones'],
  },
];

// ─── Función principal de importación ────────────────────────────────────────

export async function importClass30032026(): Promise<{ exercises: number; created: boolean }> {
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
    `SELECT id FROM class_template WHERE name = 'Nestor - 30/03/2026' AND is_active = 1`
  );
  if ((existing.values?.length ?? 0) > 0) {
    markImportDone();
    return { exercises: exercisesCreated, created: false };
  }

  // ── Paso 3: Crear la plantilla de clase ──────────────────────────────────
  const templateId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, name, date, objective, is_favorite, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, 1, ?, ?)`,
    [
      templateId,
      'Nestor - 30/03/2026',
      '2026-03-30',
      'Movilidad de cadera y tobillo · Activación de core · Fuerza: Back Squat E2MOM · WOD For Time',
      timestamp,
      timestamp,
    ]
  );

  const entradaCalorId = sectionMap.get('Entrada en calor');
  const activacionId = sectionMap.get('Activación');
  const habilidadId = sectionMap.get('Habilidad'); // usamos Habilidad para Movilidad
  const fuerzaId = sectionMap.get('Fuerza');
  const wodId = sectionMap.get('WOD');
  const porRondasId = formatMap.get('Por rondas');
  const e2momId = formatMap.get('E2MOM');
  const forTimeId = formatMap.get('For Time');
  const kgId = unitMap.get('Kilogramos');

  // ── Sección 1: Calentamiento — 6 minutos libre ───────────────────────────
  const s1Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, sort_order,
        general_description, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?, ?)`,
    [s1Id, templateId, entradaCalorId, '6 minutos de calentamiento general', timestamp, timestamp]
  );

  // ── Sección 2: Movilidad — 2 rondas, 30 seg c/ejercicio ─────────────────
  const s2Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 2, ?, 2, ?, ?)`,
    [s2Id, templateId, habilidadId, porRondasId, 'Movilidad — 2 rondas × 30 seg c/ejercicio', timestamp, timestamp]
  );

  const movilidadExs: Array<{ name: string; notes: string }> = [
    { name: 'Cossack Squat', notes: '' },
    { name: 'Kettlebell Ankle Mobility Drill', notes: 'Lado derecho' },
    { name: 'Kettlebell Ankle Mobility Drill', notes: 'Lado izquierdo' },
  ];

  for (let i = 0; i < movilidadExs.length; i++) {
    const { name, notes } = movilidadExs[i];
    const exId = exerciseIdMap.get(name);
    if (!exId) continue;
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_time_seconds, planned_rest_seconds, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 30, 0, ?, ?, ?)`,
      [generateUUID(), s2Id, exId, i + 1, notes || null, timestamp, timestamp]
    );
  }

  // ── Sección 3: Activación — 3 rondas, 30 seg c/ejercicio ────────────────
  const s3Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 3, ?, 3, ?, ?)`,
    [s3Id, templateId, activacionId, porRondasId, 'Activación — 3 rondas × 30 seg c/ejercicio', timestamp, timestamp]
  );

  const activacionExs: Array<{ name: string; notes: string }> = [
    { name: 'Side Plank con carga', notes: 'Lado izquierdo' },
    { name: 'Side Plank con carga', notes: 'Lado derecho' },
    { name: 'Hollow Body Rock', notes: '' },
    { name: 'Counterbalance Squat', notes: '' },
  ];

  for (let i = 0; i < activacionExs.length; i++) {
    const { name, notes } = activacionExs[i];
    const exId = exerciseIdMap.get(name);
    if (!exId) continue;
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_time_seconds, planned_rest_seconds, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 30, 0, ?, ?, ?)`,
      [generateUUID(), s3Id, exId, i + 1, notes || null, timestamp, timestamp]
    );
  }

  // ── Sección 4: Fuerza — Back Squat E2MOM (5 series) ─────────────────────
  const s4Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        general_description, total_rounds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 4, ?, 5, ?, ?)`,
    [s4Id, templateId, fuerzaId, e2momId, 'Back Squat — E2MOM · 5 series de fuerza progresiva', timestamp, timestamp]
  );

  const backSquatId = exerciseIdMap.get('Back Squat');
  const fuerzaSeries: Array<{ reps: number; kg: number; notes: string }> = [
    { reps: 3, kg: 80, notes: '80% — 80 kg' },
    { reps: 3, kg: 80, notes: '80% — 80 kg' },
    { reps: 3, kg: 80, notes: '80% — 80 kg' },
    { reps: 2, kg: 90, notes: '90% — 90 kg' },
    { reps: 1, kg: 100, notes: '95% — 100 kg' },
  ];

  if (backSquatId) {
    for (let i = 0; i < fuerzaSeries.length; i++) {
      const { reps, kg, notes } = fuerzaSeries[i];
      await db.run(
        `INSERT INTO section_exercise
           (id, class_section_id, exercise_id, sort_order,
            planned_repetitions, planned_weight_value, planned_weight_unit_id,
            coach_notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), s4Id, backSquatId, i + 1, reps, kg, kgId, notes, timestamp, timestamp]
      );
    }
  }

  // ── Sección 5: WOD — For Time, 10 min cap ────────────────────────────────
  const s5Id = generateUUID();
  await db.run(
    `INSERT INTO class_section
       (id, class_template_id, section_type_id, work_format_id, sort_order,
        general_description, time_cap_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, 5, ?, 600, ?, ?)`,
    [
      s5Id,
      templateId,
      wodId,
      forTimeId,
      'WOD For Time — 10 min cap · Secuencia pirámide: 10 Shuttle Run → 15 OHS → 20 Burpee Bar / 1 min descanso / 20 Burpee Bar → 15 OHS → 10 Shuttle Run',
      timestamp,
      timestamp,
    ]
  );

  // WOD: secuencia pirámide (primera mitad)
  const wodExs: Array<{ name: string; reps: number; notes: string }> = [
    { name: 'Shuttle Run', reps: 10, notes: 'Parte 1 de 2' },
    { name: 'Overhead Squat', reps: 15, notes: 'Parte 1 de 2' },
    { name: 'Burpee Over The Bar', reps: 20, notes: '1 min descanso al finalizar la primera mitad' },
    { name: 'Burpee Over The Bar', reps: 20, notes: 'Parte 2 de 2 (orden inverso)' },
    { name: 'Overhead Squat', reps: 15, notes: 'Parte 2 de 2' },
    { name: 'Shuttle Run', reps: 10, notes: 'Parte 2 de 2' },
  ];

  for (let i = 0; i < wodExs.length; i++) {
    const { name, reps, notes } = wodExs[i];
    const exId = exerciseIdMap.get(name);
    if (!exId) continue;
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order,
          planned_repetitions, coach_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s5Id, exId, i + 1, reps, notes, timestamp, timestamp]
    );
  }

  markImportDone();
  return { exercises: exercisesCreated, created: true };
}
