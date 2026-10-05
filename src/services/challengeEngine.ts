// Motor de progresión de los challenges (funciones puras, sin BD).
//
// Challenges de meta: reps_de_la_serie = round(meta × factor_sesión × factor_nivel × pct_serie)
// sobre una curva única de 18 sesiones (6 semanas × 3). El redondeo es "a par"
// (6,5 → 6) para que los números coincidan con las tablas del catálogo.

import {
  ChallengeDefinition,
  ChallengeLevel,
  ChallengeSessionPlan,
} from '../models/Challenge';

export const META_WEEKS = 6;
export const SESSIONS_PER_WEEK = 3;
export const META_TOTAL_SESSIONS = META_WEEKS * SESSIONS_PER_WEEK;

/** Semanas al final de las cuales se repite el test de repeticiones máximas */
export const RETEST_WEEKS = [2, 4, 5];

/** Volumen total de cada sesión como múltiplo de la meta (null = intento final) */
const SESSION_CURVE: (number | null)[][] = [
  [0.25, 0.33, 0.42],
  [0.47, 0.53, 0.6],
  [0.64, 0.72, 0.8],
  [0.88, 0.99, 1.1],
  [1.22, 1.36, 1.5],
  [1.68, 1.85, null],
];

const WEEK_REST_SECONDS = [60, 60, 60, 45, 45, 60];
const WEEK_SET_COUNT = [5, 5, 5, 5, 7, 9];

/** Reparto del volumen entre series, según la cantidad de series */
const SET_SPLITS: Record<number, number[]> = {
  5: [0.22, 0.26, 0.16, 0.16, 0.2],
  7: [0.15, 0.17, 0.13, 0.13, 0.1, 0.1, 0.22],
  9: [0.11, 0.13, 0.09, 0.09, 0.11, 0.11, 0.08, 0.08, 0.2],
};

export const LEVEL_FACTOR: Record<ChallengeLevel, number> = {
  beginner: 0.55,
  intermediate: 1,
  advanced: 1.4,
};

export const LEVEL_LABEL: Record<ChallengeLevel, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

/** Redondeo bancario: los .5 van al par más cercano */
export function roundHalfEven(value: number): number {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (Math.abs(diff - 0.5) < 1e-9) return floor % 2 === 0 ? floor : floor + 1;
  return Math.round(value);
}

/** Nivel según el resultado del test de repeticiones máximas */
export function levelFromTest(challenge: ChallengeDefinition, maxReps: number): ChallengeLevel {
  const ranges = challenge.testRanges;
  if (!ranges) return 'intermediate';
  if (maxReps <= ranges.beginnerMax) return 'beginner';
  if (maxReps <= ranges.intermediateMax) return 'intermediate';
  return 'advanced';
}

/** Rango del test en texto, para mostrarlo en la pantalla del test */
export function testRangeLabel(challenge: ChallengeDefinition, level: ChallengeLevel): string {
  const r = challenge.testRanges;
  if (!r) return '';
  if (level === 'beginner') return `0-${r.beginnerMax}`;
  if (level === 'intermediate') return `${r.beginnerMax + 1}-${r.intermediateMax}`;
  return `${r.intermediateMax + 1}+`;
}

/** Semana (1..6) y sesión (1..3) de un índice de sesión 0-based */
export function weekAndSession(index: number): { week: number; session: number } {
  return {
    week: Math.floor(index / SESSIONS_PER_WEEK) + 1,
    session: (index % SESSIONS_PER_WEEK) + 1,
  };
}

/** Series de una sesión de un challenge de meta */
export function buildMetaSession(
  goal: number,
  level: ChallengeLevel,
  week: number,
  session: number
): ChallengeSessionPlan {
  const factor = SESSION_CURVE[week - 1][session - 1];

  if (factor === null) {
    return { week, session, sets: [goal], restSeconds: 0, isFinal: true };
  }

  const setCount = WEEK_SET_COUNT[week - 1];
  const split = SET_SPLITS[setCount];
  const volume = goal * factor * LEVEL_FACTOR[level];
  const sets = split.map((pct) => Math.max(1, roundHalfEven(volume * pct)));

  return { week, session, sets, restSeconds: WEEK_REST_SECONDS[week - 1], isFinal: false };
}

/** Las 18 sesiones de un challenge de meta */
export function buildMetaProgram(goal: number, level: ChallengeLevel): ChallengeSessionPlan[] {
  const sessions: ChallengeSessionPlan[] = [];
  for (let i = 0; i < META_TOTAL_SESSIONS; i++) {
    const { week, session } = weekAndSession(i);
    sessions.push(buildMetaSession(goal, level, week, session));
  }
  return sessions;
}

// ── Fechas ──────────────────────────────────────────────────────────────────

/** Suma días a una fecha YYYY-MM-DD sin depender de la zona horaria */
export function addDaysISO(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

/** Días entre dos fechas YYYY-MM-DD (b - a) */
export function daysBetweenISO(a: string, b: string): number {
  const ta = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const tb = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((tb - ta) / 86400000);
}

/** Fecha local de hoy en YYYY-MM-DD */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Fecha de una sesión de meta: tres sesiones por semana con un día de descanso
 * entre medio (día 0, 2 y 4 de cada semana desde la fecha de inicio).
 */
export function metaSessionDate(startDate: string, index: number): string {
  const { week, session } = weekAndSession(index);
  return addDaysISO(startDate, (week - 1) * 7 + (session - 1) * 2);
}

/** Texto de las series: "6 - 6 - 4 - 4 - 5+" */
export function formatSets(sets: number[], unit: 'reps' | 'seconds', lastToFailure: boolean): string {
  const suffix = unit === 'seconds' ? 's' : '';
  return sets
    .map((n, i) => `${n}${suffix}${lastToFailure && i === sets.length - 1 ? '+' : ''}`)
    .join(' - ');
}
