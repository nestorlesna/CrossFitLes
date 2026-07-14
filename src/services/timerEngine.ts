// Motor del cronómetro guiado.
// Aplana una plantilla de clase en una lista lineal de pasos que el cronómetro
// recorre solo: cuenta regresiva → trabajo → descanso → descanso de ronda →
// descanso de sección → ... → fin.
//
// Resolución de tiempos en cascada: ejercicio → sección → configuración global.
// Bucles: la sección manda (total_rounds repite el circuito completo) y dentro
// de cada vuelta el ejercicio anida sus propias series (planned_rounds).

import { ClassSection, ClassTemplateWithSections, SectionExercise } from '../models/ClassTemplate';
import { TimerConfig } from '../models/TimerConfig';

export type TimerStepKind =
  | 'lead_in'         // cuenta regresiva inicial
  | 'work'            // ejercicio
  | 'rest'            // descanso entre ejercicios (o resto de la ventana EMOM)
  | 'round_rest'      // descanso entre vueltas del circuito
  | 'section_rest';   // descanso al terminar una sección

export interface TimerStep {
  kind: TimerStepKind;
  /** Duración en segundos. 0 = paso abierto: espera a que el usuario avance. */
  durationSeconds: number;
  /** Texto principal en pantalla */
  label: string;
  /** Línea secundaria: reps, peso, distancia, calorías... */
  detail?: string;
  /** Nombre del próximo ejercicio, para anticiparlo durante el descanso */
  nextExerciseName?: string;

  sectionIndex: number;
  sectionId?: string;
  sectionTitle: string;
  sectionColor?: string;

  /** Vuelta actual del circuito y total de vueltas de la sección */
  round: number;
  totalRounds: number;
  /** Serie actual del ejercicio dentro de la vuelta y total de series */
  set: number;
  totalSets: number;

  /** Presente en los pasos de trabajo (y en el descanso que lo sigue) */
  exercise?: SectionExercise;
  /** El descanso pertenece a una ventana de intervalo (EMOM y similares) */
  isIntervalRest?: boolean;
}

// ── Resolución de tiempos ───────────────────────────────────────────────────

/** Ventana fija de la sección si el formato de trabajo es de intervalo (EMOM, Tabata...) */
export function resolveInterval(section: ClassSection, config: TimerConfig): number | null {
  if (section.interval_seconds && section.interval_seconds > 0) return section.interval_seconds;
  if (!section.work_format_is_interval) return null;
  return section.work_format_default_interval_seconds || config.default_interval_seconds;
}

/** Duración de trabajo de un ejercicio: su tiempo planificado, su sugerido, o el default global */
export function resolveWorkSeconds(exercise: SectionExercise, config: TimerConfig): number {
  if (exercise.planned_time_seconds && exercise.planned_time_seconds > 0) {
    return exercise.planned_time_seconds;
  }
  if (exercise.suggested_timer_seconds && exercise.suggested_timer_seconds > 0) {
    return exercise.suggested_timer_seconds;
  }
  // Ejercicio por repeticiones sin sugerido: usa el default, salvo que el usuario
  // prefiera avanzar a mano (paso abierto).
  return config.auto_advance_reps ? config.default_exercise_seconds : 0;
}

/** Descanso posterior a un ejercicio: el suyo, el de la sección, o el default global */
function resolveRestSeconds(
  exercise: SectionExercise,
  section: ClassSection,
  config: TimerConfig
): number {
  if (exercise.planned_rest_seconds !== undefined && exercise.planned_rest_seconds !== null) {
    return exercise.planned_rest_seconds;
  }
  if (
    section.rest_between_exercises_seconds !== undefined &&
    section.rest_between_exercises_seconds !== null
  ) {
    return section.rest_between_exercises_seconds;
  }
  return config.rest_between_exercises_seconds;
}

function resolveRoundRest(section: ClassSection, config: TimerConfig): number {
  if (
    section.rest_between_rounds_seconds !== undefined &&
    section.rest_between_rounds_seconds !== null
  ) {
    return section.rest_between_rounds_seconds;
  }
  return config.rest_between_rounds_seconds;
}

function resolveSectionRest(section: ClassSection, config: TimerConfig): number {
  if (
    section.rest_after_section_seconds !== undefined &&
    section.rest_after_section_seconds !== null
  ) {
    return section.rest_after_section_seconds;
  }
  return config.rest_between_sections_seconds;
}

/**
 * Vueltas de la sección. En formatos de intervalo con time cap y sin rondas
 * explícitas, se deduce cuántas vueltas entran en el time cap.
 */
function resolveTotalRounds(
  section: ClassSection,
  interval: number | null,
  exerciseCount: number
): number {
  if (section.total_rounds && section.total_rounds > 0) return section.total_rounds;

  if (interval && section.time_cap_seconds && exerciseCount > 0) {
    const windowsPerRound = section.exercises.reduce(
      (acc, ex) => acc + Math.max(1, ex.planned_rounds ?? 1),
      0
    );
    const rounds = Math.floor(section.time_cap_seconds / (interval * windowsPerRound));
    return Math.max(1, rounds);
  }

  return 1;
}

// ── Texto de apoyo ──────────────────────────────────────────────────────────

/** Línea de detalle del ejercicio: "12 reps · 40 kg · 3 series" */
export function buildExerciseDetail(exercise: SectionExercise): string {
  const parts: string[] = [];

  if (exercise.planned_repetitions) parts.push(`${exercise.planned_repetitions} reps`);
  if (exercise.planned_distance_value) {
    parts.push(`${exercise.planned_distance_value} ${exercise.distance_unit_abbreviation ?? 'm'}`);
  }
  if (exercise.planned_calories) parts.push(`${exercise.planned_calories} cal`);
  if (exercise.planned_weight_value) {
    parts.push(`${exercise.planned_weight_value} ${exercise.weight_unit_abbreviation ?? 'kg'}`);
  }
  if (exercise.rm_percentage) parts.push(`${exercise.rm_percentage}% RM`);

  return parts.join(' · ');
}

function sectionTitle(section: ClassSection, index: number): string {
  return section.visible_title || section.section_type_name || `Sección ${index + 1}`;
}

// ── Construcción de la línea de tiempo ──────────────────────────────────────

/**
 * Aplana la plantilla completa en la secuencia de pasos del cronómetro.
 * Los descansos que quedarían pegados a un descanso de ronda o de sección se
 * omiten para no encadenar dos pausas seguidas.
 */
export function buildTimeline(
  template: ClassTemplateWithSections,
  config: TimerConfig
): TimerStep[] {
  const steps: TimerStep[] = [];

  if (config.lead_in_seconds > 0) {
    const firstSection = template.sections[0];
    steps.push({
      kind: 'lead_in',
      durationSeconds: config.lead_in_seconds,
      label: 'Preparados',
      detail: template.name,
      nextExerciseName: firstSection?.exercises[0]?.exercise_name,
      sectionIndex: 0,
      sectionId: firstSection?.id,
      sectionTitle: firstSection ? sectionTitle(firstSection, 0) : template.name,
      sectionColor: firstSection?.section_type_color,
      round: 1,
      totalRounds: 1,
      set: 1,
      totalSets: 1,
    });
  }

  template.sections.forEach((section, sectionIndex) => {
    const exercises = section.exercises ?? [];
    if (exercises.length === 0) return;

    const interval = resolveInterval(section, config);
    const totalRounds = resolveTotalRounds(section, interval, exercises.length);
    const title = sectionTitle(section, sectionIndex);
    const isLastSection = sectionIndex === template.sections.length - 1;

    const base = {
      sectionIndex,
      sectionId: section.id,
      sectionTitle: title,
      sectionColor: section.section_type_color,
      totalRounds,
    };

    for (let round = 1; round <= totalRounds; round++) {
      const isLastRound = round === totalRounds;

      exercises.forEach((exercise, exerciseIndex) => {
        const isLastExercise = exerciseIndex === exercises.length - 1;
        const totalSets = Math.max(1, exercise.planned_rounds ?? 1);
        const workSeconds = resolveWorkSeconds(exercise, config);
        const detail = buildExerciseDetail(exercise);
        const nextExerciseName = isLastExercise
          ? exercises[0]?.exercise_name
          : exercises[exerciseIndex + 1]?.exercise_name;

        for (let set = 1; set <= totalSets; set++) {
          const isLastSet = set === totalSets;

          // En una ventana de intervalo el trabajo nunca puede exceder la ventana.
          const cappedWork = interval ? Math.min(workSeconds || interval, interval) : workSeconds;

          steps.push({
            ...base,
            kind: 'work',
            durationSeconds: cappedWork,
            label: exercise.exercise_name ?? 'Ejercicio',
            detail,
            nextExerciseName: isLastSet ? nextExerciseName : exercise.exercise_name,
            round,
            set,
            totalSets,
            exercise,
          });

          // El descanso final de la vuelta o de la sección lo cubre round_rest /
          // section_rest, así que no se encadena otro descanso antes.
          const restIsRedundant = isLastExercise && isLastSet;

          if (interval) {
            const remaining = interval - cappedWork;
            if (remaining > 0) {
              steps.push({
                ...base,
                kind: 'rest',
                durationSeconds: remaining,
                label: 'Descanso',
                detail: `Ventana de ${interval}s`,
                nextExerciseName: isLastSet ? nextExerciseName : exercise.exercise_name,
                round,
                set,
                totalSets,
                exercise,
                isIntervalRest: true,
              });
            }
          } else if (!restIsRedundant) {
            const restSeconds = resolveRestSeconds(exercise, section, config);
            if (restSeconds > 0) {
              steps.push({
                ...base,
                kind: 'rest',
                durationSeconds: restSeconds,
                label: 'Descanso',
                nextExerciseName: isLastSet ? nextExerciseName : exercise.exercise_name,
                round,
                set,
                totalSets,
                exercise,
              });
            }
          }
        }
      });

      if (!isLastRound) {
        const roundRest = resolveRoundRest(section, config);
        if (roundRest > 0) {
          steps.push({
            ...base,
            kind: 'round_rest',
            durationSeconds: roundRest,
            label: 'Descanso de ronda',
            detail: `Vuelta ${round + 1} de ${totalRounds}`,
            nextExerciseName: exercises[0]?.exercise_name,
            round,
            set: 1,
            totalSets: 1,
          });
        }
      }
    }

    if (!isLastSection) {
      const sectionRest = resolveSectionRest(section, config);
      const nextSection = template.sections[sectionIndex + 1];
      if (sectionRest > 0) {
        steps.push({
          ...base,
          kind: 'section_rest',
          durationSeconds: sectionRest,
          label: 'Cambio de sección',
          detail: `Sigue: ${sectionTitle(nextSection, sectionIndex + 1)}`,
          nextExerciseName: nextSection.exercises?.[0]?.exercise_name,
          round: totalRounds,
          set: 1,
          totalSets: 1,
        });
      }
    }
  });

  return steps;
}

/** Duración total estimada de la línea de tiempo (los pasos abiertos no suman) */
export function timelineDuration(steps: TimerStep[]): number {
  return steps.reduce((acc, step) => acc + step.durationSeconds, 0);
}

/** Formatea segundos como mm:ss (o h:mm:ss si supera la hora) */
export function formatClock(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
