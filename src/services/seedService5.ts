// WODs de Marzo 2026 — datos adicionales aditivos
// Operación aditiva, asume Inicializar Datos ya corrido.

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
  planned_calories?: number;
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
  const norm = name.trim().toUpperCase();
  const r = await db.query('SELECT id FROM exercise WHERE UPPER(TRIM(name)) = ? AND is_active = 1', [norm]);
  return (r.values?.[0]?.id as string) ?? null;
}

async function getOrCreateExercise(
  db: SQLiteDBConnection,
  def: ExerciseDef,
  maps: { diff: Map<string, string>; muscle: Map<string, string>; equip: Map<string, string>; section: Map<string, string> }
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
  console.log(`[Seed5] Ejercicio creado: "${def.name}"`);
  return id;
}

async function createTemplate(
  db: SQLiteDBConnection,
  def: TemplateDef,
  maps: {
    diff: Map<string, string>; muscle: Map<string, string>; equip: Map<string, string>;
    section: Map<string, string>; sectionType: Map<string, string>;
    workFormat: Map<string, string>; unit: Map<string, string>;
  }
): Promise<void> {
  const existing = await db.query('SELECT id FROM class_template WHERE name = ?', [def.name]);
  if ((existing.values?.length ?? 0) > 0) {
    console.log(`[Seed5] Plantilla "${def.name}" ya existe, omitiendo.`);
    return;
  }

  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const templateId = generateUUID();

  await db.run(
    `INSERT INTO class_template (id, name, objective, general_notes, estimated_duration_minutes, is_favorite, template_type, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 'generic', 1, ?, ?)`,
    [templateId, def.name, def.objective, def.general_notes, def.estimated_duration_minutes, ts, ts]
  );

  for (const sec of def.sections) {
    const sectionId = generateUUID();
    const secTypeId = maps.sectionType.get(sec.section_type) ?? null;
    const workFmtId = maps.workFormat.get(sec.work_format)   ?? null;

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
        console.warn(`[Seed5] Ejercicio no encontrado: "${ex.exerciseName}" — omitido.`);
        continue;
      }
      const weightUnitId = ex.planned_weight_unit   ? maps.unit.get(ex.planned_weight_unit)   ?? null : null;
      const distUnitId   = ex.planned_distance_unit ? maps.unit.get(ex.planned_distance_unit) ?? null : null;

      await db.run(
        `INSERT INTO section_exercise
           (id, class_section_id, exercise_id, sort_order,
            planned_repetitions, planned_weight_value, planned_weight_unit_id,
            planned_distance_value, planned_distance_unit_id,
            planned_time_seconds, planned_calories,
            coach_notes, notes, suggested_scaling,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), sectionId, exerciseId, ex.sort_order,
         ex.planned_repetitions ?? null,
         ex.planned_weight_value ?? null, weightUnitId,
         ex.planned_distance_value ?? null, distUnitId,
         ex.planned_time_seconds ?? null,
         ex.planned_calories ?? null,
         ex.coach_notes ?? null, ex.notes ?? null, ex.suggested_scaling ?? null,
         ts, ts]
      );
    }
  }
  console.log(`[Seed5] Plantilla "${def.name}" creada.`);
}

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

// ── Ejercicios nuevos ──────────────────────────────────────────────────────────

const WOD_EXERCISES: ExerciseDef[] = [
  {
    name: 'Hanging Toes to Bar',
    description: 'Colgado de la barra, subir las puntas de los pies hasta tocar la barra. Activa core completo y flexores de cadera.',
    difficulty: 'Intermedio', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: ['Pull-up bar'], sections: ['WOD', 'Accesorio'],
  },
  {
    name: 'Barbell Lunge',
    description: 'Zancada con barra en rack frontal o sobre los hombros. Paso largo hacia adelante bajando la rodilla trasera al suelo.',
    difficulty: 'Intermedio', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Single-Leg Dumbbell Romanian Deadlift',
    description: 'Peso muerto rumano con una sola pierna y mancuerna. Alta demanda de equilibrio y cadena posterior.',
    difficulty: 'Intermedio', primaryMuscle: 'Isquiotibiales', is_compound: 1,
    equipment: ['Mancuernas'], sections: ['Fuerza', 'Accesorio'],
  },
  {
    name: 'Bar Muscle-Up',
    description: 'Muscle-up en barra fija: dominada explosiva con transición a fondos sobre la barra. Requiere coordinación y fuerza gimnástica.',
    difficulty: 'Experto', primaryMuscle: 'Dorsales', is_compound: 1,
    equipment: ['Pull-up bar'], sections: ['WOD', 'Habilidad'],
  },
  {
    name: 'Barbell Hang Clean and Jerk',
    description: 'Cargada de potencia desde posición de colgado (hang) seguida de envión. Variante olímpica sin llegar al suelo.',
    difficulty: 'Avanzado', primaryMuscle: 'Trapecio', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Barbell Back Squat',
    description: 'Sentadilla con barra sobre la espalda alta o baja. Movimiento fundamental de fuerza de piernas.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Barra olímpica'], sections: ['Fuerza', 'WOD'],
  },
  {
    name: 'Kettlebell Snatch',
    description: 'Arranque con kettlebell con un solo brazo: desde el suelo (o swing) hasta posición de extensión total sobre la cabeza.',
    difficulty: 'Avanzado', primaryMuscle: 'Deltoides', is_compound: 1,
    equipment: ['Kettlebell'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Weighted Box Step-Up',
    description: 'Step-up sobre cajón cargando mancuernas o barra. Fuerza unilateral de piernas y glúteos.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 1,
    equipment: ['Box de salto', 'Mancuernas'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Russian Twist',
    description: 'Rotación de tronco sentado en el suelo con o sin carga, con pies levantados. Activa oblicuos y core rotacional.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    equipment: ['Balón medicinal'], sections: ['WOD', 'Accesorio'],
  },
  {
    name: 'Kettlebell Ground-to-Overhead',
    description: 'Levantamiento de kettlebell desde el suelo hasta extensión total sobre la cabeza en un solo movimiento explosivo.',
    difficulty: 'Intermedio', primaryMuscle: 'Deltoides', is_compound: 1,
    equipment: ['Kettlebell'], sections: ['WOD'],
  },
  {
    name: 'Kettlebell Front Squat',
    description: 'Sentadilla con kettlebell(s) en posición de rack frontal (mano o manos). Exige movilidad de muñeca, codo y cadera.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Kettlebell'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Kettlebell Push-Up',
    description: 'Flexión de brazos con manos sobre las asas de dos kettlebells. Mayor rango de movimiento que la flexión estándar.',
    difficulty: 'Básico', primaryMuscle: 'Pectorales', is_compound: 1,
    equipment: ['Kettlebell'], sections: ['WOD', 'Fuerza'],
  },
  {
    name: 'Assault Bike',
    description: 'Bicicleta de aire (fan bike) con brazos y piernas. Alta intensidad cardiovascular medida en calorías o tiempo.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    equipment: ['Assault bike'], sections: ['WOD', 'Entrada en calor'],
  },
];

// ── Templates ──────────────────────────────────────────────────────────────────

const WOD_TEMPLATES: TemplateDef[] = [

  // ── WOD 20/03/2026 — LUKE (Hero WOD) ─────────────────────────────────────
  {
    name: 'WOD 20 Mar 2026 — Luke',
    objective: 'Hero WOD — chipper con 7 carreras y 6 movimientos',
    general_notes:
      'For Time\n' +
      'Luke — WOD Hero en honor a Luke Swanson.\n' +
      '♂ C&J / Lunge: 70 kg (155 lb) | Wall Ball: 9 kg | KB Swings: 24 kg (1.5 pood)\n' +
      '♀ C&J / Lunge: 47 kg (105 lb) | Wall Ball: 6 kg | KB Swings: 16 kg (1 pood)',
    estimated_duration_minutes: 40,
    sections: [
      warmup([
        { exerciseName: 'Running',          sort_order: 1, planned_distance_value: 400, planned_distance_unit: 'Metros', coach_notes: 'Ritmo suave' },
        { exerciseName: 'Barbell Clean and Jerk', sort_order: 2, planned_repetitions: 5, coach_notes: 'Peso ligero' },
        { exerciseName: 'Kettlebell Swing', sort_order: 3, planned_repetitions: 10 },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'WOD — For Time (chipper 7 runs)',
        notes: '♂ 70 kg · 9 kg WB · 24 kg KB | ♀ 47 kg · 6 kg WB · 16 kg KB',
        exercises: [
          { exerciseName: 'Running',               sort_order: 1,  planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Barbell Clean and Jerk', sort_order: 2,  planned_repetitions: 15, planned_weight_value: 70, planned_weight_unit: 'Kilogramos', suggested_scaling: '47 kg (♀)' },
          { exerciseName: 'Running',               sort_order: 3,  planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Hanging Toes to Bar',   sort_order: 4,  planned_repetitions: 30 },
          { exerciseName: 'Running',               sort_order: 5,  planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Wall Ball Shot',         sort_order: 6,  planned_repetitions: 45, planned_weight_value: 9, planned_weight_unit: 'Kilogramos', suggested_scaling: '6 kg (♀)' },
          { exerciseName: 'Running',               sort_order: 7,  planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Kettlebell Swing',       sort_order: 8,  planned_repetitions: 45, planned_weight_value: 24, planned_weight_unit: 'Kilogramos', suggested_scaling: '16 kg (♀)' },
          { exerciseName: 'Running',               sort_order: 9,  planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Ring Dip',               sort_order: 10, planned_repetitions: 30 },
          { exerciseName: 'Running',               sort_order: 11, planned_distance_value: 400, planned_distance_unit: 'Metros' },
          { exerciseName: 'Barbell Lunge',          sort_order: 12, planned_repetitions: 15, planned_weight_value: 70, planned_weight_unit: 'Kilogramos', suggested_scaling: '47 kg (♀)', coach_notes: 'Zancadas cargadas (cada pierna cuenta como 1 rep)' },
          { exerciseName: 'Running',               sort_order: 13, planned_distance_value: 400, planned_distance_unit: 'Metros' },
        ],
      },
    ],
  },

  // ── WOD 19/03/2026 — GRAVITY SHIFT ───────────────────────────────────────
  {
    name: 'WOD 19 Mar 2026 — Gravity Shift',
    objective: 'Strength pairing E2MOM + MetCon 5 rondas',
    general_notes:
      'A) Strength Pairing — E2MOM 12 minutos (6 sets alternando)\n' +
      'B) "GRAVITY SHIFT" — 5 Rondas For Time (cap 22 min)\n' +
      '♂ DB Snatch: 22.5 kg | ♀: 15 kg',
    estimated_duration_minutes: 45,
    sections: [
      {
        sort_order: 1,
        section_type: 'Fuerza',
        work_format: 'E2MOM',
        visible_title: 'A) Strength Pairing — E2MOM 12 min',
        general_description: '6 sets alternando. Sets impares: Sprint 100m + 2 Back Squats. Sets pares: 40 DU + 8/8 SL RDL.',
        notes: 'Construir peso en el Back Squat cada set impar. SL RDL: 8 reps por pierna.',
        time_cap_seconds: 720,
        exercises: [
          { exerciseName: 'Running',                              sort_order: 1, planned_distance_value: 100, planned_distance_unit: 'Metros', coach_notes: 'Sets impares (1/3/5): Sprint máxima velocidad' },
          { exerciseName: 'Barbell Back Squat',                   sort_order: 2, planned_repetitions: 2, coach_notes: 'Sets impares — construir peso' },
          { exerciseName: 'Double Under',                         sort_order: 3, planned_repetitions: 40, coach_notes: 'Sets pares (2/4/6)' },
          { exerciseName: 'Single-Leg Dumbbell Romanian Deadlift', sort_order: 4, planned_repetitions: 8, coach_notes: 'Sets pares — 8 reps c/pierna. Peso moderado.' },
        ],
      },
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'B) GRAVITY SHIFT — 5 Rondas For Time (cap 22 min)',
        notes: '♂ 22.5 kg | ♀ 15 kg DB Snatch\nScale Bar MU → 12 Chest-to-Bar Pull-Ups',
        time_cap_seconds: 1320,
        total_rounds: 5,
        exercises: [
          { exerciseName: 'Bodyweight Burpee',                             sort_order: 1, planned_repetitions: 15 },
          { exerciseName: 'Alternating Single Arm Dumbbell Power Snatch',  sort_order: 2, planned_repetitions: 12, planned_weight_value: 22.5, planned_weight_unit: 'Kilogramos', suggested_scaling: '15 kg (♀)' },
          { exerciseName: 'Bar Muscle-Up',                                 sort_order: 3, planned_repetitions: 9, suggested_scaling: '12 Chest-to-Bar Pull-Ups' },
        ],
      },
    ],
  },

  // ── WOD 18/03/2026 — C&J LADDER ──────────────────────────────────────────
  {
    name: 'WOD 18 Mar 2026 — C&J Ladder',
    objective: 'Escalera de intensidad en C&J + Build Squat Clean',
    general_notes:
      'A) C&J Ladder — 2 Rounds × 4 Sets (2 min ON / 1 min OFF)\n' +
      '  SET 1 (70%): 12 Cal + 8 HPC&J + Max T2B\n' +
      '  SET 2 (75%): 12 Cal + 6 HPC&J + Max T2B\n' +
      '  SET 3 (80%): 12 Cal + 4 HPC&J + Max T2B\n' +
      '  SET 4 (85%): 12 Cal + 2 HPC&J + Max T2B\n' +
      'B) EMOM 8 min — Construir a Clean pesado (1 Squat Clean/min)',
    estimated_duration_minutes: 45,
    sections: [
      {
        sort_order: 1,
        section_type: 'Fuerza',
        work_format: 'Intervalos',
        visible_title: 'A) C&J Ladder — 2 Rondas × 4 Sets (2 ON / 1 OFF)',
        general_description: 'Escalera de intensidad 70→75→80→85%. Completar 2 vueltas completas al ladder.',
        notes:
          'SET 1 (70%): 12 Cal + 8 HPC&J + Max T2B\n' +
          'SET 2 (75%): 12 Cal + 6 HPC&J + Max T2B\n' +
          'SET 3 (80%): 12 Cal + 4 HPC&J + Max T2B\n' +
          'SET 4 (85%): 12 Cal + 2 HPC&J + Max T2B\n' +
          '2 min trabajo / 1 min descanso entre sets.',
        total_rounds: 2,
        exercises: [
          { exerciseName: 'Rowing',                      sort_order: 1, planned_calories: 12, coach_notes: 'O Assault Bike / Ski — 12 calorías' },
          { exerciseName: 'Barbell Hang Clean and Jerk', sort_order: 2, coach_notes: 'Set 1: 8 reps 70% | Set 2: 6 reps 75% | Set 3: 4 reps 80% | Set 4: 2 reps 85%' },
          { exerciseName: 'Hanging Toes to Bar',         sort_order: 3, coach_notes: 'Máximas reps en tiempo restante del intervalo' },
        ],
      },
      {
        sort_order: 2,
        section_type: 'Fuerza',
        work_format: 'EMOM',
        visible_title: 'B) Build Squat Clean — EMOM 8 min',
        notes: '1 Squat Clean por minuto. Agregar peso en cada minuto. Objetivo: llegar a RPE 9/10 al minuto 8.',
        time_cap_seconds: 480,
        exercises: [
          { exerciseName: 'Barbell Squat Clean', sort_order: 1, planned_repetitions: 1, coach_notes: 'Construir peso progresivamente cada minuto' },
        ],
      },
    ],
  },

  // ── WOD 17/03/2026 ────────────────────────────────────────────────────────
  {
    name: 'WOD 17 Mar 2026',
    objective: 'EMOM de KB + MetCon 4 rondas + Core finisher',
    general_notes:
      'A) EMOM 10 min — KB Swings y Rope Climb alternados\n' +
      'B) 4 Rondas For Time (cap 22 min) — KB Snatches + Box\n' +
      'C) Core Finisher For Time — Russian Twists y Sit-Ups\n' +
      '♂ KB A: 32 kg | KB B: 24 kg | Box: 60 cm | DB Step-Up: 2×22.5 kg\n' +
      '♀ KB A: 24 kg | KB B: 16 kg | Box: 50 cm | DB Step-Up: 2×15 kg',
    estimated_duration_minutes: 55,
    sections: [
      {
        sort_order: 1,
        section_type: 'Activación',
        work_format: 'EMOM',
        visible_title: 'A) EMOM 10 min — KB / Rope Climb',
        notes: 'Minutos impares (1/3/5/7/9): 15 KB Swings Rusos (32/24 kg)\nMinutos pares (2/4/6/8/10): 1 Rope Climb (4.5 m)',
        time_cap_seconds: 600,
        exercises: [
          { exerciseName: 'Kettlebell Swing', sort_order: 1, planned_repetitions: 15, planned_weight_value: 32, planned_weight_unit: 'Kilogramos', suggested_scaling: '24 kg (♀)', coach_notes: 'Minutos IMPARES — Russian swing (hasta hombros)' },
          { exerciseName: 'Rope Climb',       sort_order: 2, planned_repetitions: 1, coach_notes: 'Minutos PARES — 4.5 metros' },
        ],
      },
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'B) 4 Rondas For Time (cap 22 min)',
        notes:
          '♂ KB Snatch: 24 kg · Box: 60 cm · DB Step-Up: 2×22.5 kg\n' +
          '♀ KB Snatch: 16 kg · Box: 50 cm · DB Step-Up: 2×15 kg',
        time_cap_seconds: 1320,
        total_rounds: 4,
        exercises: [
          { exerciseName: 'Kettlebell Snatch',    sort_order: 1, planned_repetitions: 12, planned_weight_value: 24, planned_weight_unit: 'Kilogramos', suggested_scaling: '16 kg (♀)', coach_notes: 'Brazo IZQUIERDO' },
          { exerciseName: 'Weighted Box Step-Up', sort_order: 2, planned_repetitions: 8,  planned_weight_value: 22.5, planned_weight_unit: 'Kilogramos', suggested_scaling: '15 kg (♀)', coach_notes: '2 mancuernas · caja 60 cm (♂) / 50 cm (♀)' },
          { exerciseName: 'Kettlebell Snatch',    sort_order: 3, planned_repetitions: 12, planned_weight_value: 24, planned_weight_unit: 'Kilogramos', suggested_scaling: '16 kg (♀)', coach_notes: 'Brazo DERECHO' },
          { exerciseName: 'Box Jump',             sort_order: 4, planned_repetitions: 8,  coach_notes: '60 cm (♂) / 50 cm (♀)' },
        ],
      },
      {
        sort_order: 3,
        section_type: 'Accesorio',
        work_format: 'For Time',
        visible_title: 'C) Core Finisher — For Time',
        general_description: '250 reps totales de core — patrón 50+50+50+50+50',
        notes: '♂ 9 kg med ball | ♀ 6 kg\n50 Russian Twists · 50 Sit-Ups · 50 Russian Twists · 50 Sit-Ups · 50 Russian Twists',
        exercises: [
          { exerciseName: 'Russian Twist',    sort_order: 1, planned_repetitions: 50, planned_weight_value: 9, planned_weight_unit: 'Kilogramos', suggested_scaling: '6 kg (♀)' },
          { exerciseName: 'Bodyweight Sit Up', sort_order: 2, planned_repetitions: 50 },
          { exerciseName: 'Russian Twist',    sort_order: 3, planned_repetitions: 50, planned_weight_value: 9, planned_weight_unit: 'Kilogramos', suggested_scaling: '6 kg (♀)' },
          { exerciseName: 'Bodyweight Sit Up', sort_order: 4, planned_repetitions: 50 },
          { exerciseName: 'Russian Twist',    sort_order: 5, planned_repetitions: 50, planned_weight_value: 9, planned_weight_unit: 'Kilogramos', suggested_scaling: '6 kg (♀)' },
        ],
      },
    ],
  },

  // ── WOD 16/03/2026 — OPEN 26.3 + Strength ────────────────────────────────
  {
    name: 'WOD 16 Mar 2026 — Open 26.3',
    objective: 'Build Squat Clean + Open 26.3 For Time',
    general_notes:
      'A) Every 90" For 9 min (6 sets) — 10 Push-Ups + 1 Squat Clean (construir)\n' +
      'B) Open 26.3 — For Time (cap 16 min)\n' +
      '   6 rondas escalando peso cada 2 rondas: 43/30 → 52/34 → 61/38 kg',
    estimated_duration_minutes: 40,
    sections: [
      {
        sort_order: 1,
        section_type: 'Fuerza',
        work_format: 'Intervalos',
        visible_title: 'A) Every 90" For 9 min — Build Squat Clean',
        notes: '6 sets · 10 Push-Ups + 1 Squat Clean · Construir a RPE 9/10',
        time_cap_seconds: 540,
        total_rounds: 6,
        exercises: [
          { exerciseName: 'Bodyweight Push Up', sort_order: 1, planned_repetitions: 10 },
          { exerciseName: 'Barbell Squat Clean', sort_order: 2, planned_repetitions: 1, coach_notes: 'Construir peso — RPE 9/10 al set 6' },
        ],
      },
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'For Time',
        visible_title: 'B) Open 26.3 — For Time (cap 16 min)',
        general_description: '6 rondas · cambiar peso cada 2 rondas · mismo barbell para Cleans y Thrusters',
        notes:
          '♂ R1-2: 43 kg → R3-4: 52 kg → R5-6: 61 kg\n' +
          '♀ R1-2: 30 kg → R3-4: 34 kg → R5-6: 38 kg',
        time_cap_seconds: 960,
        total_rounds: 6,
        exercises: [
          { exerciseName: 'Burpee Over the Bar', sort_order: 1, planned_repetitions: 12, coach_notes: 'Lateral sobre la barra' },
          { exerciseName: 'Barbell Power Clean',  sort_order: 2, planned_repetitions: 12, planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '30 kg (♀)', coach_notes: 'R1-2: 43(♂)/30(♀)kg · R3-4: +9/+4 kg · R5-6: +9/+4 kg' },
          { exerciseName: 'Burpee Over the Bar', sort_order: 3, planned_repetitions: 12 },
          { exerciseName: 'Barbell Thruster',     sort_order: 4, planned_repetitions: 12, planned_weight_value: 43, planned_weight_unit: 'Kilogramos', suggested_scaling: '30 kg (♀)', coach_notes: 'Mismo peso que los cleans de esa ronda' },
        ],
      },
    ],
  },

  // ── WOD 13/03/2026 — MOGADISHU MILE ──────────────────────────────────────
  {
    name: 'WOD 13 Mar 2026 — Mogadishu Mile',
    objective: '4 rondas — KB Ground-to-Overhead, Front Squats, Push-Ups y carrera',
    general_notes:
      'For Time — 4 Rondas\n' +
      '⚠ REGLA: Si perdés contacto físico con tu Kettlebell, reiniciás ESA RONDA desde cero.\n' +
      '♂ 24 kg (53 lb) | ♀ 16 kg (35 lb)\n' +
      'En la carrera llevás el KB (farmer carry o como puedas).',
    estimated_duration_minutes: 35,
    sections: [
      warmup([
        { exerciseName: 'Running',                    sort_order: 1, planned_distance_value: 200, planned_distance_unit: 'Metros', coach_notes: 'Con KB en mano' },
        { exerciseName: 'Kettlebell Swing',            sort_order: 2, planned_repetitions: 10 },
        { exerciseName: 'Kettlebell Front Squat',      sort_order: 3, planned_repetitions: 5  },
      ]),
      {
        sort_order: 2,
        section_type: 'WOD',
        work_format: 'Por rondas',
        visible_title: 'WOD — For Time (4 Rondas)',
        notes:
          '♂ 24 kg | ♀ 16 kg — mismo KB todo el WOD\n' +
          '⚠ Perder contacto = reiniciar la ronda completa\n' +
          'KB Push-Ups: manos sobre las asas del KB (cada rep con cada mano = 1 rep)',
        total_rounds: 4,
        exercises: [
          { exerciseName: 'Kettlebell Ground-to-Overhead', sort_order: 1, planned_repetitions: 19, planned_weight_value: 24, planned_weight_unit: 'Kilogramos', suggested_scaling: '16 kg (♀)' },
          { exerciseName: 'Kettlebell Front Squat',        sort_order: 2, planned_repetitions: 19, planned_weight_value: 24, planned_weight_unit: 'Kilogramos', suggested_scaling: '16 kg (♀)' },
          { exerciseName: 'Kettlebell Push-Up',            sort_order: 3, planned_repetitions: 19, coach_notes: '19 reps por mano (38 total) — manos sobre las asas', suggested_scaling: '16 kg (♀)' },
          { exerciseName: 'Running',                       sort_order: 4, planned_distance_value: 400, planned_distance_unit: 'Metros', coach_notes: 'Llevar el KB durante toda la carrera (farmer carry)' },
        ],
      },
    ],
  },
];

// ── Punto de entrada ──────────────────────────────────────────────────────────

/**
 * Agrega los WODs de Marzo 2026 (6 sesiones diarias).
 * Operación aditiva. Requiere haber ejecutado "Inicializar Datos" previamente.
 */
export async function addDailyWodsMarch2026(db: SQLiteDBConnection): Promise<void> {
  console.log('[Seed5] Iniciando WODs Marzo 2026...');

  // Verificar catálogos
  const check = await db.query('SELECT COUNT(*) as count FROM section_type');
  if ((check.values?.[0]?.count ?? 0) === 0) {
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

  const maps = {
    diff:        new Map((diffRows.values        ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    muscle:      new Map((muscleRows.values       ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    equip:       new Map((equipRows.values        ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    section:     new Map((sectionRows.values      ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    sectionType: new Map((sectionTypeRows.values  ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    workFormat:  new Map((workFmtRows.values      ?? []).map((r: any) => [r.name, r.id] as [string, string])),
    unit:        new Map((unitRows.values         ?? []).map((r: any) => [r.name, r.id] as [string, string])),
  };

  // Crear ejercicios nuevos si no existen
  console.log('[Seed5] Verificando ejercicios...');
  for (const def of WOD_EXERCISES) {
    await getOrCreateExercise(db, def, maps);
  }

  // Crear plantillas
  console.log('[Seed5] Creando plantillas...');
  for (const tpl of WOD_TEMPLATES) {
    await createTemplate(db, tpl, maps);
  }

  const { saveDatabase } = await import('../db/database');
  await saveDatabase();
  console.log('[Seed5] WODs Marzo 2026 completados.');
}
