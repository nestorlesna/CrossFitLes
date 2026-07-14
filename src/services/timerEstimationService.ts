// Estima los tiempos del cronómetro para las clases que ya están en la base de datos.
// No inventa clases ni ejercicios: sólo completa los campos de tiempo a partir de lo
// que cada sección y ejercicio ya tienen cargado (reps, distancia, calorías, formato
// de trabajo, tipo de sección). Reglas: BKP/CREO_CLASE.md §7.
//
// Por defecto sólo rellena lo que está vacío; con overwrite = true recalcula todo.

import { openDatabase, saveDatabase } from '../db/database';

export interface TimerEstimationResult {
  classes: number;
  sections: number;
  exercises: number;
  /** Nombres de las clases tocadas, en el orden en que se procesaron */
  classNames: string[];
}

// ── Segundos por repetición según el movimiento (§7.2) ──────────────────────
// Se evalúa por palabras clave del nombre del ejercicio, de lo más específico a
// lo más genérico: la primera regla que coincide gana.
const SECONDS_PER_REP: { keywords: string[]; seconds: number }[] = [
  // Levantamientos olímpicos y sus complejos
  { keywords: ['snatch', 'clean', 'jerk', 'muscle-up', 'muscle up'], seconds: 8 },
  // Gimnásticos avanzados
  { keywords: ['handstand', 'pistol', 'wall walk', 'chest-to-bar', 'toes-to-bar', 'knees-to-elbows', 'rope climb', 'ring dip'], seconds: 5 },
  // Fuerza con barra
  { keywords: ['barbell', 'deadlift', 'back squat', 'front squat', 'overhead squat', 'thruster', 'push press', 'push jerk', 'strict press', 'bench press', 'bent-over row'], seconds: 5 },
  // Saltos de soga
  { keywords: ['double-under', 'single-under', 'jump rope'], seconds: 1 },
  // Lunges y pasos (por paso)
  { keywords: ['lunge', 'step-over', 'step-up', 'step over'], seconds: 3 },
  // Movilidad y activación
  { keywords: ['band', 'scapular', 'rotation', 'stretch', 'mobility', 'dislocate', 'pull-apart', 'glute bridge'], seconds: 2 },
  // Mancuerna, kettlebell, gimnástico básico y todo lo demás explícito
  { keywords: ['dumbbell', 'kettlebell', 'wall ball', 'burpee', 'box jump', 'push-up', 'pushup', 'sit-up', 'situp', 'air squat', 'pull-up', 'pullup', 'ring row', 'swing', 'russian twist'], seconds: 3 },
];

const DEFAULT_SECONDS_PER_REP = 3;

// Ejercicios que se sostienen: si no traen tiempo propio, 30 s por defecto
const ISOMETRIC_KEYWORDS = ['hold', 'plank', 'hollow', 'superman', 'isometric', 'isométrico', 'wall sit', 'l-sit'];

// ── Descansos por tipo de sección (§7.4) ────────────────────────────────────
interface SectionRestRule {
  betweenExercises: number;
  afterSection: number;
  /** null = no forzar valor, deja que mande el default global */
  betweenRounds: number | null;
}

const SECTION_RESTS: Record<string, SectionRestRule> = {
  'Entrada en calor': { betweenExercises: 10, afterSection: 60, betweenRounds: 0 },
  'Activación':       { betweenExercises: 10, afterSection: 60, betweenRounds: 0 },
  'Fuerza':           { betweenExercises: 60, afterSection: 120, betweenRounds: 90 },
  'Habilidad':        { betweenExercises: 30, afterSection: 90, betweenRounds: 60 },
  'WOD':              { betweenExercises: 0, afterSection: 60, betweenRounds: 0 },
  'Accesorio':        { betweenExercises: 30, afterSection: 60, betweenRounds: 60 },
  'Vuelta a la calma': { betweenExercises: 10, afterSection: 0, betweenRounds: 0 },
};

const DEFAULT_SECTION_REST: SectionRestRule = {
  betweenExercises: 15,
  afterSection: 60,
  betweenRounds: null,
};

// Redondea a múltiplo de 5, con piso de 15 s y techo de 180 s
function roundSeconds(seconds: number): number {
  const rounded = Math.round(seconds / 5) * 5;
  return Math.min(180, Math.max(15, rounded));
}

function secondsPerRep(exerciseName: string): number {
  const name = exerciseName.toLowerCase();
  for (const rule of SECONDS_PER_REP) {
    if (rule.keywords.some((k) => name.includes(k))) return rule.seconds;
  }
  return DEFAULT_SECONDS_PER_REP;
}

interface ExerciseRow {
  id: string;
  class_section_id: string;
  exercise_name: string;
  coach_notes: string | null;
  planned_repetitions: number | null;
  planned_time_seconds: number | null;
  planned_distance_value: number | null;
  distance_unit: string | null;
  planned_calories: number | null;
  suggested_timer_seconds: number | null;
  rm_percentage: number | null;
}

/**
 * Duración de trabajo estimada de un ejercicio, en segundos.
 * Devuelve null si el ejercicio ya tiene tiempo propio (no hay nada que estimar).
 */
export function estimateExerciseSeconds(exercise: ExerciseRow): number | null {
  if (exercise.planned_time_seconds != null) return null;

  const name = exercise.exercise_name ?? '';
  let seconds: number;

  if (exercise.planned_distance_value) {
    // 25 s cada 100 m (los km se pasan a metros primero)
    const meters =
      exercise.distance_unit === 'km'
        ? exercise.planned_distance_value * 1000
        : exercise.planned_distance_value;
    seconds = (meters / 100) * 25;
  } else if (exercise.planned_calories) {
    seconds = exercise.planned_calories * 4;
  } else if (exercise.planned_repetitions) {
    seconds = exercise.planned_repetitions * secondsPerRep(name);
  } else if (ISOMETRIC_KEYWORDS.some((k) => name.toLowerCase().includes(k))) {
    seconds = 30;
  } else {
    // Sin reps, sin distancia, sin calorías: no hay de dónde estimar
    return null;
  }

  // Cargas altas cuestan más: +30 % desde 85 % de RM
  if (exercise.rm_percentage && exercise.rm_percentage >= 85) seconds *= 1.3;

  // "Cada lado" / "por lado" duplica el trabajo
  const notes = (exercise.coach_notes ?? '').toLowerCase();
  if (notes.includes('cada lado') || notes.includes('por lado')) seconds *= 2;

  return roundSeconds(seconds);
}

// Prioridad de procesamiento: primero el plan isométrico, después las GOAT, después el resto
function classPriority(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('isom')) return 0;
  if (lower.includes('goat')) return 1;
  return 2;
}

interface SectionRow {
  id: string;
  class_template_id: string;
  class_name: string;
  section_type_name: string | null;
  total_rounds: number | null;
  is_interval: number | null;
  wf_default_interval: number | null;
  rest_between_exercises_seconds: number | null;
  rest_after_section_seconds: number | null;
  rest_between_rounds_seconds: number | null;
  interval_seconds: number | null;
  sort_order: number;
}

export async function estimateTimersForAllClasses(
  overwrite = false
): Promise<TimerEstimationResult> {
  const db = await openDatabase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const sectionsResult = await db.query(`
    SELECT cs.id, cs.class_template_id, ct.name as class_name,
           st.name as section_type_name,
           cs.total_rounds, cs.sort_order,
           wf.is_interval, wf.default_interval_seconds as wf_default_interval,
           cs.rest_between_exercises_seconds, cs.rest_after_section_seconds,
           cs.rest_between_rounds_seconds, cs.interval_seconds
    FROM class_section cs
    JOIN class_template ct ON ct.id = cs.class_template_id AND ct.is_active = 1
    LEFT JOIN section_type st ON st.id = cs.section_type_id
    LEFT JOIN work_format wf ON wf.id = cs.work_format_id
    ORDER BY cs.sort_order ASC
  `);
  const sections = (sectionsResult.values ?? []) as SectionRow[];
  if (sections.length === 0) {
    return { classes: 0, sections: 0, exercises: 0, classNames: [] };
  }

  const exercisesResult = await db.query(`
    SELECT se.id, se.class_section_id, e.name as exercise_name, se.coach_notes,
           se.planned_repetitions, se.planned_time_seconds, se.planned_distance_value,
           se.planned_calories, se.suggested_timer_seconds, se.rm_percentage,
           mu.abbreviation as distance_unit
    FROM section_exercise se
    JOIN exercise e ON e.id = se.exercise_id
    LEFT JOIN measurement_unit mu ON mu.id = se.planned_distance_unit_id
  `);
  const exercises = (exercisesResult.values ?? []) as ExerciseRow[];

  const exercisesBySection = new Map<string, ExerciseRow[]>();
  for (const exercise of exercises) {
    const list = exercisesBySection.get(exercise.class_section_id) ?? [];
    list.push(exercise);
    exercisesBySection.set(exercise.class_section_id, list);
  }

  // Agrupar secciones por clase y ordenar las clases: isométrico → GOAT → resto
  const sectionsByClass = new Map<string, SectionRow[]>();
  for (const section of sections) {
    const list = sectionsByClass.get(section.class_template_id) ?? [];
    list.push(section);
    sectionsByClass.set(section.class_template_id, list);
  }

  const classIds = Array.from(sectionsByClass.keys()).sort((a, b) => {
    const nameA = sectionsByClass.get(a)![0].class_name;
    const nameB = sectionsByClass.get(b)![0].class_name;
    const diff = classPriority(nameA) - classPriority(nameB);
    return diff !== 0 ? diff : nameA.localeCompare(nameB);
  });

  const statements: { statement: string; values: unknown[] }[] = [];
  const touchedClasses: string[] = [];
  let sectionsTouched = 0;
  let exercisesTouched = 0;

  for (const classId of classIds) {
    const classSections = sectionsByClass
      .get(classId)!
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);
    let classTouched = false;

    classSections.forEach((section, index) => {
      const isLast = index === classSections.length - 1;
      const isInterval = Number(section.is_interval) === 1 || !!section.interval_seconds;
      const rule = SECTION_RESTS[section.section_type_name ?? ''] ?? DEFAULT_SECTION_REST;
      const window = section.interval_seconds || section.wf_default_interval || 60;

      // ── Tiempos de la sección ──
      const sectionFields: Record<string, number | null> = {};

      // En intervalos el descanso lo define la ventana: el motor ignora este campo.
      if (!isInterval && (overwrite || section.rest_between_exercises_seconds == null)) {
        sectionFields.rest_between_exercises_seconds = rule.betweenExercises;
      }
      if (
        !isLast &&
        (overwrite || section.rest_after_section_seconds == null)
      ) {
        sectionFields.rest_after_section_seconds = rule.afterSection;
      }
      if (
        rule.betweenRounds != null &&
        (section.total_rounds ?? 1) > 1 &&
        (overwrite || section.rest_between_rounds_seconds == null)
      ) {
        sectionFields.rest_between_rounds_seconds = rule.betweenRounds;
      }

      if (Object.keys(sectionFields).length > 0) {
        const keys = Object.keys(sectionFields);
        statements.push({
          statement: `UPDATE class_section SET ${keys
            .map((k) => `${k} = ?`)
            .join(', ')}, updated_at = ? WHERE id = ?`,
          values: [...keys.map((k) => sectionFields[k]), timestamp, section.id],
        });
        sectionsTouched++;
        classTouched = true;
      }

      // ── Duración de cada ejercicio ──
      for (const exercise of exercisesBySection.get(section.id) ?? []) {
        if (!overwrite && exercise.suggested_timer_seconds != null) continue;

        const estimated = estimateExerciseSeconds(exercise);
        if (estimated == null) continue;

        // En una sección de intervalo el trabajo tiene que entrar en la ventana,
        // dejando aire para el descanso.
        const seconds = isInterval ? Math.min(estimated, Math.max(15, window - 10)) : estimated;

        statements.push({
          statement: `UPDATE section_exercise SET suggested_timer_seconds = ?, updated_at = ? WHERE id = ?`,
          values: [seconds, timestamp, exercise.id],
        });
        exercisesTouched++;
        classTouched = true;
      }
    });

    if (classTouched) touchedClasses.push(classSections[0].class_name);
  }

  if (statements.length > 0) {
    await db.executeSet(statements, true);
    await saveDatabase();
  }

  return {
    classes: touchedClasses.length,
    sections: sectionsTouched,
    exercises: exercisesTouched,
    classNames: touchedClasses,
  };
}
