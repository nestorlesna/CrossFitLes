// Modelos de los challenges de ejercicios.
// El catálogo es fijo (src/data/challenges.ts); lo que el usuario hace con un
// challenge se guarda como training_plan (plan_kind = 'challenge') + challenge_test.

import { TrainingPlan, PlanDay, PlanProgress } from './TrainingPlan';

/**
 * 'meta_reps': 6 semanas, 3 sesiones por semana, termina en un intento final.
 * 'daily': 30 días con una tarea por día y descansos intercalados.
 */
export type ChallengeKind = 'meta_reps' | 'daily';

export type ChallengeLevel = 'beginner' | 'intermediate' | 'advanced';

/** Ejercicio del catálogo referenciado por nombre (con alias) */
export interface ChallengeExerciseRef {
  /** Nombres posibles en la BD, en orden de preferencia */
  names: string[];
  /** Si no existe ninguno, se crea con estos datos */
  create?: {
    name: string;
    description: string;
    primaryMuscle?: string;
  };
}

/** Ejercicio dentro de un día: reps o segundos */
export interface ChallengeDayItem {
  exercise: ChallengeExerciseRef;
  reps?: number;
  seconds?: number;
  note?: string;
}

/** Un día de un challenge diario */
export interface ChallengeDailyDay {
  /** Día de descanso (con nota opcional, p. ej. descanso activo) */
  rest?: boolean;
  restNote?: string;
  /** Series del ejercicio principal: reps o segundos según `unit` */
  sets?: number[];
  /** Descanso entre series en segundos */
  restSeconds?: number;
  /** Circuito: varios ejercicios por vuelta */
  circuit?: {
    rounds: number;
    items: ChallengeDayItem[];
    restBetweenExercises: number;
    restBetweenRounds: number;
  };
}

export interface ChallengeDefinition {
  code: string;
  name: string;
  /** Descripción corta para la tarjeta */
  summary: string;
  kind: ChallengeKind;
  /** Color de acento (hex) */
  color: string;
  /** Equipamiento necesario, en texto */
  equipment: string;
  /** Unidad del objetivo: repeticiones o segundos */
  unit: 'reps' | 'seconds';
  exercise: ChallengeExerciseRef;
  /** Versión fácil: otro ejercicio y/o una indicación */
  regression?: { exercise?: ChallengeExerciseRef; hint: string };
  notes?: string;

  // ── Challenges de meta ──
  goal?: number;
  /** Máximo de reps del test para principiante y para intermedio (avanzado = más) */
  testRanges?: { beginnerMax: number; intermediateMax: number };

  // ── Challenges diarios ──
  days?: ChallengeDailyDay[];
}

/** Serie calculada de una sesión de meta */
export interface ChallengeSessionPlan {
  week: number;          // 1..6
  session: number;       // 1..3
  sets: number[];
  restSeconds: number;
  isFinal: boolean;
}

export interface ChallengeTest {
  id: string;
  training_plan_id: string;
  /** 0 = test inicial; 2, 4, 5 = retest al terminar esa semana */
  week: number;
  max_reps?: number;
  level: ChallengeLevel;
  created_at: string;
}

/** Challenge en curso (o terminado) con su avance */
export interface ChallengeEnrollment {
  plan: TrainingPlan;
  days: PlanDay[];
  progress: PlanProgress;
  tests: ChallengeTest[];
}
