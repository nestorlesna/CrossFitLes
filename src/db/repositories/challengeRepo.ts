// Repositorio de challenges.
// Un challenge en curso es un training_plan (plan_kind = 'challenge') cuyos días
// apuntan a plantillas privadas (is_plan_day = 1): así se reutilizan el cronómetro,
// las sesiones, los resultados por serie, los PRs y el cierre de días del plan.
// Cada serie es un section_exercise propio, para registrar las reps reales de cada una.

import { getDatabase, saveDatabase } from '../database';
import { generateUUID } from '../../utils/formatters';
import { TrainingPlan, PlanDay } from '../../models/TrainingPlan';
import {
  ChallengeDefinition,
  ChallengeEnrollment,
  ChallengeExerciseRef,
  ChallengeLevel,
  ChallengeTest,
  ChallengeDailyDay,
} from '../../models/Challenge';
import { getChallenge } from '../../data/challenges';
import {
  buildMetaProgram,
  buildMetaSession,
  levelFromTest,
  metaSessionDate,
  addDaysISO,
  daysBetweenISO,
  todayISO,
  weekAndSession,
  RETEST_WEEKS,
  SESSIONS_PER_WEEK,
  META_WEEKS,
} from '../../services/challengeEngine';
import { getDefaultSectionTypeId, getProgress, softDelete, closePlanIfFinished } from './trainingPlanRepo';

type Stmt = { statement: string; values: unknown[] };

// Retorna la marca de tiempo actual en formato SQLite
function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejercicios
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca el ejercicio por sus nombres posibles; si no existe ninguno, lo crea
 * (con su grupo muscular principal si está en el catálogo).
 */
export async function resolveExerciseId(ref: ChallengeExerciseRef): Promise<string> {
  const db = getDatabase();
  for (const name of ref.names) {
    const result = await db.query(
      `SELECT id, image_url FROM exercise WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND is_active = 1 LIMIT 1`,
      [name]
    );
    if (result.values?.length) {
      const found = result.values[0];
      // Ejercicio creado por un challenge antes de tener su SVG: se lo asigna ahora
      if (ref.create?.imageUrl && !found.image_url && name === ref.create.name) {
        await db.run(`UPDATE exercise SET image_url = ? WHERE id = ?`, [ref.create.imageUrl, found.id]);
        await saveDatabase();
      }
      return found.id as string;
    }
  }
  if (!ref.create) throw new Error(`No se encontró el ejercicio ${ref.names[0]}`);

  const id = generateUUID();
  const timestamp = now();
  let muscleId: string | null = null;
  if (ref.create.primaryMuscle) {
    const mg = await db.query(`SELECT id FROM muscle_group WHERE name = ? LIMIT 1`, [
      ref.create.primaryMuscle,
    ]);
    muscleId = (mg.values?.[0]?.id as string) ?? null;
  }

  const stmts: Stmt[] = [
    {
      statement: `INSERT INTO exercise (id, name, description, primary_muscle_group_id, image_url, is_compound, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?)`,
      values: [id, ref.create.name, ref.create.description, muscleId, ref.create.imageUrl ?? null, timestamp, timestamp],
    },
  ];
  if (muscleId) {
    stmts.push({
      statement: `INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 1)`,
      values: [generateUUID(), id, muscleId],
    });
  }
  await db.executeSet(stmts, true);
  await saveDatabase();
  return id;
}

/**
 * Tipo de sección para las plantillas de los días. En una BD sin catálogos
 * cargados no hay ninguno: se crea (o reactiva) "WOD" para no bloquear el challenge.
 */
async function ensureSectionTypeId(): Promise<string> {
  try {
    return await getDefaultSectionTypeId();
  } catch {
    const db = getDatabase();
    await db.executeSet(
      [
        {
          statement: `INSERT OR IGNORE INTO section_type (id, name, default_order, sort_order, is_active)
                      VALUES (?, 'WOD', 1, 1, 1)`,
          values: [generateUUID()],
        },
        { statement: `UPDATE section_type SET is_active = 1 WHERE name = 'WOD'`, values: [] },
      ],
      true
    );
    await saveDatabase();
    return getDefaultSectionTypeId();
  }
}

/** Ejercicio principal del challenge (o su regresión si se eligió la versión fácil) */
function mainExerciseRef(def: ChallengeDefinition, easy: boolean): ChallengeExerciseRef {
  return easy && def.regression?.exercise ? def.regression.exercise : def.exercise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contenido de un día → plantilla privada
// ─────────────────────────────────────────────────────────────────────────────

interface DaySet {
  exerciseId: string;
  reps?: number;
  seconds?: number;
  rest?: number;
  note?: string;
}

interface DayContent {
  sets: DaySet[];
  rounds?: number;
  restBetweenExercises?: number;
  restBetweenRounds?: number;
}

/** Sentencias que crean una plantilla privada con una sección y sus series */
function templateStmts(
  templateId: string,
  title: string,
  date: string,
  sectionTypeId: string,
  content: DayContent,
  timestamp: string
): Stmt[] {
  const sectionId = generateUUID();
  const stmts: Stmt[] = [
    {
      statement: `INSERT INTO class_template
        (id, date, name, objective, general_notes, estimated_duration_minutes,
         is_favorite, template_type, is_active, is_plan_day, created_at, updated_at)
        VALUES (?, ?, ?, NULL, NULL, NULL, 0, 'my_classes', 1, 1, ?, ?)`,
      values: [templateId, date, title, timestamp, timestamp],
    },
    {
      statement: `INSERT INTO class_section
        (id, class_template_id, section_type_id, sort_order, visible_title, total_rounds,
         rest_between_rounds_seconds, rest_between_exercises_seconds, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
      values: [
        sectionId,
        templateId,
        sectionTypeId,
        title,
        content.rounds ?? null,
        content.restBetweenRounds ?? null,
        content.restBetweenExercises ?? null,
        timestamp,
        timestamp,
      ],
    },
  ];

  content.sets.forEach((set, i) => {
    stmts.push({
      statement: `INSERT INTO section_exercise
        (id, class_section_id, exercise_id, sort_order, planned_repetitions,
         planned_time_seconds, planned_rest_seconds, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        generateUUID(),
        sectionId,
        set.exerciseId,
        i + 1,
        set.reps ?? null,
        set.seconds ?? null,
        set.rest ?? null,
        set.note ?? null,
        timestamp,
        timestamp,
      ],
    });
  });

  return stmts;
}

/** Series de una sesión de meta como contenido de plantilla */
function metaDayContent(
  goal: number,
  level: ChallengeLevel,
  index: number,
  exerciseId: string
): { title: string; content: DayContent } {
  const { week, session } = weekAndSession(index);
  const plan = buildMetaSession(goal, level, week, session);

  if (plan.isFinal) {
    return {
      title: 'Intento final',
      content: { sets: [{ exerciseId, reps: goal, note: `Intento final: ${goal} seguidas` }] },
    };
  }

  const last = plan.sets.length - 1;
  return {
    title: `Semana ${week} · Sesión ${session}`,
    content: {
      sets: plan.sets.map((reps, i) => ({
        exerciseId,
        reps,
        rest: i < last ? plan.restSeconds : undefined,
        note: i === last ? `Al fallo: mínimo ${reps}` : `Serie ${i + 1}`,
      })),
    },
  };
}

/** Contenido de un día de un challenge diario (null si es descanso) */
async function dailyDayContent(
  def: ChallengeDefinition,
  day: ChallengeDailyDay,
  mainExerciseId: string,
  resolve: (ref: ChallengeExerciseRef) => Promise<string>
): Promise<DayContent | null> {
  if (day.rest) return null;

  if (day.circuit) {
    const sets: DaySet[] = [];
    for (const item of day.circuit.items) {
      sets.push({
        exerciseId: await resolve(item.exercise),
        reps: item.reps,
        seconds: item.seconds,
        note: item.note,
      });
    }
    return {
      sets,
      rounds: day.circuit.rounds,
      restBetweenExercises: day.circuit.restBetweenExercises,
      restBetweenRounds: day.circuit.restBetweenRounds,
    };
  }

  const values = day.sets ?? [];
  const last = values.length - 1;
  return {
    sets: values.map((v, i) => ({
      exerciseId: mainExerciseId,
      reps: def.unit === 'reps' ? v : undefined,
      seconds: def.unit === 'seconds' ? v : undefined,
      rest: i < last ? day.restSeconds : undefined,
      note: `Serie ${i + 1}`,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Consultas
// ─────────────────────────────────────────────────────────────────────────────

const DAYS_QUERY = `
  SELECT pd.*,
    ct.name as template_name,
    (SELECT COUNT(*) FROM section_exercise se
      JOIN class_section cs ON se.class_section_id = cs.id
      WHERE cs.class_template_id = ct.id) as exercise_count,
    ts.actual_duration_minutes as session_duration_minutes,
    ts.general_feeling as session_feeling
  FROM plan_day pd
  LEFT JOIN class_template ct ON pd.class_template_id = ct.id
  LEFT JOIN training_session ts ON pd.training_session_id = ts.id
`;

/** Challenges del usuario (en curso primero) con su avance */
export async function getEnrollments(): Promise<TrainingPlan[]> {
  const db = getDatabase();
  const result = await db.query(`
    SELECT tp.*,
      COUNT(pd.id) as total_days,
      SUM(CASE WHEN pd.status = 'completed' THEN 1 ELSE 0 END) as completed_days,
      SUM(CASE WHEN pd.day_type <> 'rest' THEN 1 ELSE 0 END) as training_days
    FROM training_plan tp
    LEFT JOIN plan_day pd ON pd.training_plan_id = tp.id
    WHERE tp.is_active = 1 AND tp.plan_kind = 'challenge'
    GROUP BY tp.id
    ORDER BY CASE tp.status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END,
             tp.updated_at DESC
  `);
  return (result.values ?? []) as TrainingPlan[];
}

/** Challenge completo: plan, días, avance y tests */
export async function getEnrollment(planId: string): Promise<ChallengeEnrollment | null> {
  const db = getDatabase();
  const planResult = await db.query(
    `SELECT * FROM training_plan WHERE id = ? AND plan_kind = 'challenge'`,
    [planId]
  );
  const plan = planResult.values?.[0] as TrainingPlan | undefined;
  if (!plan) return null;

  const [daysResult, testsResult, progress] = await Promise.all([
    db.query(`${DAYS_QUERY} WHERE pd.training_plan_id = ? ORDER BY pd.day_index ASC`, [planId]),
    db.query(`SELECT * FROM challenge_test WHERE training_plan_id = ? ORDER BY week ASC, created_at ASC`, [
      planId,
    ]),
    getProgress(planId),
  ]);

  return {
    plan,
    days: (daysResult.values ?? []) as PlanDay[],
    progress,
    tests: (testsResult.values ?? []) as ChallengeTest[],
  };
}

/** Serie planificada de un día, para mostrar el detalle del challenge */
export interface ChallengeDaySet {
  plan_day_id: string;
  exercise_name: string;
  planned_repetitions?: number;
  planned_time_seconds?: number;
  total_rounds?: number;
  notes?: string;
}

/** Series planificadas de todos los días del challenge, agrupadas por día */
export async function getDaySets(planId: string): Promise<Record<string, ChallengeDaySet[]>> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT pd.id as plan_day_id, e.name as exercise_name, se.planned_repetitions,
            se.planned_time_seconds, cs.total_rounds, se.notes
     FROM plan_day pd
     JOIN class_section cs ON cs.class_template_id = pd.class_template_id
     JOIN section_exercise se ON se.class_section_id = cs.id
     JOIN exercise e ON e.id = se.exercise_id
     WHERE pd.training_plan_id = ?
     ORDER BY pd.day_index, cs.sort_order, se.sort_order`,
    [planId]
  );
  const grouped: Record<string, ChallengeDaySet[]> = {};
  for (const row of (result.values ?? []) as ChallengeDaySet[]) {
    if (!grouped[row.plan_day_id]) grouped[row.plan_day_id] = [];
    grouped[row.plan_day_id].push(row);
  }
  return grouped;
}

/** Volumen de una sesión completada del challenge (para el gráfico de progreso) */
export interface ChallengeVolumePoint {
  day_index: number;
  title: string;
  actual_reps: number;
  planned_reps: number;
  actual_seconds: number;
  planned_seconds: number;
}

/**
 * Volumen real vs. planificado de cada día completado. En circuitos se
 * multiplica por las vueltas (cada ejercicio se registra una sola vez).
 */
export async function getVolumeSeries(planId: string): Promise<ChallengeVolumePoint[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT pd.day_index, pd.title,
       SUM(COALESCE(ser.actual_repetitions, 0) * COALESCE(ser.actual_rounds, 1)) as actual_reps,
       SUM(COALESCE(se.planned_repetitions, 0) * COALESCE(cs.total_rounds, 1)) as planned_reps,
       SUM(COALESCE(ser.actual_time_seconds, 0) * COALESCE(ser.actual_rounds, 1)) as actual_seconds,
       SUM(COALESCE(se.planned_time_seconds, 0) * COALESCE(cs.total_rounds, 1)) as planned_seconds
     FROM plan_day pd
     JOIN session_exercise_result ser ON ser.training_session_id = pd.training_session_id
     LEFT JOIN section_exercise se ON se.id = ser.section_exercise_id
     LEFT JOIN class_section cs ON cs.id = se.class_section_id
     WHERE pd.training_plan_id = ? AND pd.status = 'completed'
     GROUP BY pd.id
     ORDER BY pd.day_index ASC`,
    [planId]
  );
  return (result.values ?? []) as ChallengeVolumePoint[];
}

/** Challenge en curso de un código del catálogo (si lo hay) */
export async function getActiveByCode(code: string): Promise<TrainingPlan | null> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM training_plan
     WHERE plan_kind = 'challenge' AND challenge_code = ? AND status = 'active' AND is_active = 1
     ORDER BY created_at DESC LIMIT 1`,
    [code]
  );
  return (result.values?.[0] as TrainingPlan) ?? null;
}

/** Último challenge (cualquier estado) de un código: para ver el historial */
export async function getHistoryByCode(code: string): Promise<TrainingPlan[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM training_plan
     WHERE plan_kind = 'challenge' AND challenge_code = ? AND is_active = 1
     ORDER BY created_at DESC`,
    [code]
  );
  return (result.values ?? []) as TrainingPlan[];
}

/**
 * Lo que toca hoy en cada challenge en curso: el día de hoy (puede ser descanso)
 * o el pendiente vencido más antiguo.
 */
export async function getTodayChallenges(): Promise<{ plan: TrainingPlan; day: PlanDay }[]> {
  const db = getDatabase();
  const today = todayISO();
  const plansResult = await db.query(
    `SELECT * FROM training_plan
     WHERE plan_kind = 'challenge' AND status = 'active' AND is_active = 1
     ORDER BY created_at ASC`
  );
  const plans = (plansResult.values ?? []) as TrainingPlan[];
  const out: { plan: TrainingPlan; day: PlanDay }[] = [];

  for (const plan of plans) {
    const overdue = await db.query(
      `${DAYS_QUERY} WHERE pd.training_plan_id = ? AND pd.status = 'pending'
         AND pd.day_type <> 'rest' AND pd.scheduled_date <= ?
       ORDER BY pd.day_index ASC LIMIT 1`,
      [plan.id, today]
    );
    if (overdue.values?.length) {
      out.push({ plan, day: overdue.values[0] as PlanDay });
      continue;
    }
    const exact = await db.query(
      `${DAYS_QUERY} WHERE pd.training_plan_id = ? AND pd.scheduled_date = ?
       ORDER BY pd.day_index ASC LIMIT 1`,
      [plan.id, today]
    );
    if (exact.values?.length) out.push({ plan, day: exact.values[0] as PlanDay });
  }
  return out;
}

/**
 * Semana cuyo retest está pendiente: la semana 2, 4 o 5 ya terminó, no tiene
 * test cargado y todavía no se empezó la semana siguiente.
 */
export function pendingRetestWeek(enrollment: ChallengeEnrollment): number | null {
  const def = getChallenge(enrollment.plan.challenge_code);
  if (!def || def.kind !== 'meta_reps' || enrollment.plan.status !== 'active') return null;

  for (const week of RETEST_WEEKS) {
    const weekDays = enrollment.days.filter(
      (d) => Math.ceil(d.day_index / SESSIONS_PER_WEEK) === week
    );
    const nextWeekDays = enrollment.days.filter(
      (d) => Math.ceil(d.day_index / SESSIONS_PER_WEEK) === week + 1
    );
    const weekDone = weekDays.length > 0 && weekDays.every((d) => d.status === 'completed');
    const nextStarted = nextWeekDays.some((d) => d.status !== 'pending');
    const hasTest = enrollment.tests.some((t) => t.week === week);
    if (weekDone && !nextStarted && !hasTest) return week;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Escrituras
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrollOptions {
  startDate: string;      // YYYY-MM-DD
  /** Resultado del test inicial (challenges de meta) */
  maxReps?: number;
  /** Usar la versión fácil del ejercicio */
  easy?: boolean;
}

/**
 * Inscribe al usuario en un challenge: crea el plan, los días y las plantillas
 * de cada día en una sola transacción. Si ya había uno en curso del mismo
 * challenge, queda archivado.
 */
export async function enroll(code: string, options: EnrollOptions): Promise<string> {
  const def = getChallenge(code);
  if (!def) throw new Error('Challenge no encontrado');

  const db = getDatabase();
  const timestamp = now();
  const planId = generateUUID();
  const easy = !!options.easy;
  const sectionTypeId = await ensureSectionTypeId();

  // Los ejercicios se resuelven antes de armar la transacción (pueden crearse)
  const cache = new Map<ChallengeExerciseRef, string>();
  const resolve = async (ref: ChallengeExerciseRef) => {
    if (!cache.has(ref)) cache.set(ref, await resolveExerciseId(ref));
    return cache.get(ref)!;
  };
  const mainExerciseId = await resolve(mainExerciseRef(def, easy));

  const level: ChallengeLevel | null =
    def.kind === 'meta_reps' ? levelFromTest(def, options.maxReps ?? 0) : null;

  const stmts: Stmt[] = [
    {
      statement: `UPDATE training_plan SET status = 'archived', updated_at = ?
                  WHERE plan_kind = 'challenge' AND challenge_code = ? AND status = 'active'`,
      values: [timestamp, code],
    },
    {
      statement: `INSERT INTO training_plan
        (id, name, description, goal, start_date, schedule_mode, status, color, is_active,
         plan_kind, challenge_code, challenge_level, challenge_easy, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'dates', 'active', ?, 1, 'challenge', ?, ?, ?, ?, ?)`,
      values: [
        planId,
        def.name,
        def.summary,
        def.goal ? String(def.goal) : null,
        options.startDate,
        def.color,
        code,
        level,
        easy ? 1 : 0,
        timestamp,
        timestamp,
      ],
    },
  ];

  const pushDay = (
    index: number,
    date: string,
    title: string,
    content: DayContent | null,
    notes?: string
  ) => {
    let templateId: string | null = null;
    if (content) {
      templateId = generateUUID();
      stmts.push(...templateStmts(templateId, `${def.name} · ${title}`, date, sectionTypeId, content, timestamp));
    }
    stmts.push({
      statement: `INSERT INTO plan_day
        (id, training_plan_id, day_index, scheduled_date, day_type, class_template_id,
         title, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      values: [
        generateUUID(),
        planId,
        index + 1,
        date,
        content ? 'custom' : 'rest',
        templateId,
        title,
        notes ?? null,
        timestamp,
        timestamp,
      ],
    });
  };

  if (def.kind === 'meta_reps' && def.goal && level) {
    const program = buildMetaProgram(def.goal, level);
    program.forEach((_, i) => {
      const { title, content } = metaDayContent(def.goal!, level, i, mainExerciseId);
      pushDay(i, metaSessionDate(options.startDate, i), title, content);
    });
    stmts.push({
      statement: `INSERT INTO challenge_test (id, training_plan_id, week, max_reps, level, created_at)
                  VALUES (?, ?, 0, ?, ?, ?)`,
      values: [generateUUID(), planId, options.maxReps ?? 0, level, timestamp],
    });
  } else {
    const days = def.days ?? [];
    for (let i = 0; i < days.length; i++) {
      const content = await dailyDayContent(def, days[i], mainExerciseId, resolve);
      const title = content ? `Día ${i + 1}` : `Día ${i + 1} · Descanso`;
      pushDay(i, addDaysISO(options.startDate, i), title, content, days[i].restNote);
    }
  }

  await db.executeSet(stmts, true);
  await saveDatabase();
  return planId;
}

/**
 * Guarda un retest (maxReps null = se omitió y se mantiene el nivel).
 * Si el nivel cambia, regenera las sesiones pendientes con el nivel nuevo:
 * cada día recibe una plantilla nueva y la anterior queda dada de baja, así el
 * historial de sesiones ya hechas no se toca.
 */
export async function saveRetest(
  planId: string,
  week: number,
  maxReps: number | null
): Promise<{ level: ChallengeLevel; changed: boolean }> {
  const enrollment = await getEnrollment(planId);
  if (!enrollment) throw new Error('Challenge no encontrado');
  const def = getChallenge(enrollment.plan.challenge_code);
  if (!def || def.kind !== 'meta_reps' || !def.goal) throw new Error('El challenge no admite retest');

  const currentLevel = (enrollment.plan.challenge_level as ChallengeLevel) ?? 'intermediate';
  const level = maxReps === null ? currentLevel : levelFromTest(def, maxReps);
  const changed = level !== currentLevel;

  const db = getDatabase();
  const timestamp = now();
  const stmts: Stmt[] = [
    {
      statement: `INSERT INTO challenge_test (id, training_plan_id, week, max_reps, level, created_at)
                  VALUES (?, ?, ?, ?, ?, ?)`,
      values: [generateUUID(), planId, week, maxReps, level, timestamp],
    },
  ];

  if (changed) {
    stmts.push({
      statement: `UPDATE training_plan SET challenge_level = ?, updated_at = ? WHERE id = ?`,
      values: [level, timestamp, planId],
    });

    const sectionTypeId = await ensureSectionTypeId();
    const exerciseId = await resolveExerciseId(mainExerciseRef(def, enrollment.plan.challenge_easy === 1));

    for (const day of enrollment.days) {
      const index = day.day_index - 1;
      const { week: dayWeek, session } = weekAndSession(index);
      const isFinal = dayWeek === META_WEEKS && session === SESSIONS_PER_WEEK;
      if (day.status !== 'pending' || isFinal || day.training_session_id) continue;

      const { title, content } = metaDayContent(def.goal, level, index, exerciseId);
      const templateId = generateUUID();
      stmts.push(
        ...templateStmts(
          templateId,
          `${def.name} · ${title}`,
          day.scheduled_date ?? todayISO(),
          sectionTypeId,
          content,
          timestamp
        )
      );
      if (day.class_template_id) {
        stmts.push({
          statement: `UPDATE class_template SET is_active = 0, updated_at = ? WHERE id = ? AND is_plan_day = 1`,
          values: [timestamp, day.class_template_id],
        });
      }
      stmts.push({
        statement: `UPDATE plan_day SET class_template_id = ?, updated_at = ? WHERE id = ?`,
        values: [templateId, timestamp, day.id],
      });
    }
  }

  await db.executeSet(stmts, true);
  await saveDatabase();
  return { level, changed };
}

/** Corre las fechas de los días desde `fromIndex` (inclusive) para que ese día caiga en `newDate` */
function shiftFromStmts(days: PlanDay[], fromIndex: number, newDate: string, timestamp: string): Stmt[] {
  const first = days.find((d) => d.day_index === fromIndex);
  if (!first?.scheduled_date) return [];
  const offset = daysBetweenISO(first.scheduled_date, newDate);
  if (offset === 0) return [];
  return days
    .filter((d) => d.day_index >= fromIndex && d.scheduled_date)
    .map((d) => ({
      statement: `UPDATE plan_day SET scheduled_date = ?, updated_at = ? WHERE id = ?`,
      values: [addDaysISO(d.scheduled_date!, offset), timestamp, d.id],
    }));
}

/**
 * "No pude completar": la semana entera vuelve a pendiente y se reprograma
 * dejando un día de descanso desde la última sesión hecha. Las sesiones ya
 * realizadas quedan en el historial.
 */
export async function repeatWeek(planId: string, week: number): Promise<void> {
  const enrollment = await getEnrollment(planId);
  if (!enrollment) throw new Error('Challenge no encontrado');

  const firstIndex = (week - 1) * SESSIONS_PER_WEEK + 1;
  const weekDays = enrollment.days.filter(
    (d) => d.day_index >= firstIndex && d.day_index < firstIndex + SESSIONS_PER_WEEK
  );
  if (weekDays.length === 0) return;

  // Nueva fecha: mañana, o dos días después de la última sesión completada
  const today = todayISO();
  // completed_at está en UTC: se pasa a fecha local para compararla con hoy
  const lastDone = enrollment.days
    .filter((d) => !!d.completed_at)
    .map((d) => {
      const local = new Date(`${d.completed_at!.replace(' ', 'T')}Z`);
      const mm = String(local.getMonth() + 1).padStart(2, '0');
      const dd = String(local.getDate()).padStart(2, '0');
      return `${local.getFullYear()}-${mm}-${dd}`;
    })
    .sort()
    .pop();
  let newDate = addDaysISO(today, 1);
  if (lastDone && addDaysISO(lastDone, 2) > newDate) newDate = addDaysISO(lastDone, 2);

  const timestamp = now();
  const stmts: Stmt[] = weekDays.map((d) => ({
    statement: `UPDATE plan_day SET status = 'pending', completed_at = NULL,
                training_session_id = NULL, updated_at = ? WHERE id = ?`,
    values: [timestamp, d.id],
  }));
  stmts.push(...shiftFromStmts(enrollment.days, firstIndex, newDate, timestamp));
  // El retest de esa semana (si existía) se vuelve a pedir al terminarla
  stmts.push({
    statement: `DELETE FROM challenge_test WHERE training_plan_id = ? AND week >= ?`,
    values: [planId, week],
  });
  stmts.push({
    statement: `UPDATE training_plan SET status = 'active', updated_at = ? WHERE id = ?`,
    values: [timestamp, planId],
  });

  const db = getDatabase();
  await db.executeSet(stmts, true);
  await saveDatabase();
}

/** Reprograma desde el primer día pendiente para que caiga hoy (tras saltear días) */
export async function rescheduleFromToday(planId: string): Promise<void> {
  const enrollment = await getEnrollment(planId);
  if (!enrollment) throw new Error('Challenge no encontrado');
  const firstPending = enrollment.days.find((d) => d.status === 'pending');
  if (!firstPending) return;

  const stmts = shiftFromStmts(enrollment.days, firstPending.day_index, todayISO(), now());
  if (stmts.length === 0) return;
  const db = getDatabase();
  await db.executeSet(stmts, true);
  await saveDatabase();
}

/** Inicia (o retoma) el día del challenge: crea la sesión con fecha de hoy */
export async function startDay(dayId: string): Promise<string> {
  const db = getDatabase();
  const dayResult = await db.query(
    `SELECT id, class_template_id, training_session_id FROM plan_day WHERE id = ?`,
    [dayId]
  );
  const day = dayResult.values?.[0];
  if (!day) throw new Error('Día no encontrado');
  if (!day.class_template_id) throw new Error('El día no tiene ejercicios');

  if (day.training_session_id) {
    const existing = await db.query(`SELECT id, status FROM training_session WHERE id = ?`, [
      day.training_session_id,
    ]);
    const session = existing.values?.[0];
    if (session && session.status !== 'completed' && session.status !== 'cancelled') {
      return session.id as string;
    }
  }

  // Import diferido para evitar el ciclo entre repositorios
  const { createFromTemplate } = await import('./trainingSessionRepo');
  const sessionId = await createFromTemplate(day.class_template_id as string, todayISO());
  await db.run(`UPDATE plan_day SET training_session_id = ?, updated_at = ? WHERE id = ?`, [
    sessionId,
    now(),
    dayId,
  ]);
  await saveDatabase();
  return sessionId;
}

/** Tras finalizar la sesión: cierra el challenge si era el último día */
export async function afterSessionFinished(planId: string): Promise<boolean> {
  const finished = await closePlanIfFinished(planId);
  if (finished) await saveDatabase();
  return finished;
}

/** Abandona el challenge: baja lógica del plan y sus plantillas (las sesiones quedan) */
export async function abandon(planId: string): Promise<void> {
  await softDelete(planId);
}

/** Día del challenge y plan al que pertenece una sesión */
export async function getDayBySession(
  sessionId: string
): Promise<{ plan: TrainingPlan; day: PlanDay } | null> {
  const db = getDatabase();
  const result = await db.query(`${DAYS_QUERY} WHERE pd.training_session_id = ? LIMIT 1`, [sessionId]);
  const day = result.values?.[0] as PlanDay | undefined;
  if (!day) return null;
  const planResult = await db.query(
    `SELECT * FROM training_plan WHERE id = ? AND plan_kind = 'challenge'`,
    [day.training_plan_id]
  );
  const plan = planResult.values?.[0] as TrainingPlan | undefined;
  return plan ? { plan, day } : null;
}
