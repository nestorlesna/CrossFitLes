// Repositorio de planes de entrenamiento: plan, días programados y su enlace
// con las sesiones reales. Los días armados a mano se materializan como
// class_template privadas (is_plan_day = 1) para reutilizar todo el ejecutor.

import { getDatabase, saveDatabase } from '../database';
import { generateUUID } from '../../utils/formatters';
import {
  TrainingPlan,
  PlanDay,
  PlanWithDays,
  PlanProgress,
  PlanStatus,
  PlanFilters,
  PlanDayExerciseDraft,
} from '../../models/TrainingPlan';

// Retorna la marca de tiempo actual en formato SQLite
function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// Fecha de hoy en formato YYYY-MM-DD
function today(): string {
  return new Date().toISOString().split('T')[0];
}

// Suma días a una fecha ISO (YYYY-MM-DD) sin depender de la zona horaria
function addDaysISO(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

/** Datos de un día al crear o editar un plan */
export type PlanDayDraft = Pick<PlanDay, 'day_index' | 'day_type'> &
  Partial<Pick<PlanDay, 'scheduled_date' | 'class_template_id' | 'title' | 'notes'>>;

// ─────────────────────────────────────────────────────────────────────────────
// Consultas
// ─────────────────────────────────────────────────────────────────────────────

// Lista los planes con el conteo de días y de días completados
export async function getAll(filters?: PlanFilters): Promise<TrainingPlan[]> {
  const db = getDatabase();
  let query = `
    SELECT tp.*,
      COUNT(pd.id) as total_days,
      SUM(CASE WHEN pd.status = 'completed' THEN 1 ELSE 0 END) as completed_days,
      SUM(CASE WHEN pd.day_type <> 'rest' THEN 1 ELSE 0 END) as training_days
    FROM training_plan tp
    LEFT JOIN plan_day pd ON pd.training_plan_id = tp.id
    WHERE tp.is_active = 1
  `;
  const params: unknown[] = [];

  if (filters?.search) {
    query += ` AND (tp.name LIKE ? OR tp.goal LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters?.status) {
    query += ` AND tp.status = ?`;
    params.push(filters.status);
  }

  query += `
    GROUP BY tp.id
    ORDER BY
      CASE tp.status WHEN 'active' THEN 0 WHEN 'draft' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
      tp.start_date DESC,
      tp.created_at DESC
  `;

  const result = await db.query(query, params);
  return (result.values ?? []) as TrainingPlan[];
}

// Devuelve el único plan activo (la app trabaja con uno a la vez)
export async function getActivePlan(): Promise<TrainingPlan | null> {
  const plans = await getAll({ status: 'active' });
  return plans[0] ?? null;
}

// Consulta base de los días con los datos de la plantilla y de la sesión asociada
const DAYS_QUERY = `
  SELECT pd.*,
    ct.name as template_name,
    ct.estimated_duration_minutes as template_duration_minutes,
    ct.video_url as template_video_url,
    (SELECT COUNT(*) FROM section_exercise se
      JOIN class_section cs ON se.class_section_id = cs.id
      WHERE cs.class_template_id = ct.id) as exercise_count,
    ts.actual_duration_minutes as session_duration_minutes,
    ts.general_feeling as session_feeling
  FROM plan_day pd
  LEFT JOIN class_template ct ON pd.class_template_id = ct.id
  LEFT JOIN training_session ts ON pd.training_session_id = ts.id
`;

// Carga un plan completo con todos sus días ordenados
export async function getById(id: string): Promise<PlanWithDays | null> {
  const db = getDatabase();
  const planResult = await db.query(`SELECT * FROM training_plan WHERE id = ?`, [id]);
  const rows = planResult.values ?? [];
  if (rows.length === 0) return null;
  const plan = rows[0] as TrainingPlan;

  const daysResult = await db.query(
    `${DAYS_QUERY} WHERE pd.training_plan_id = ? ORDER BY pd.day_index ASC`,
    [id]
  );
  return { ...plan, days: (daysResult.values ?? []) as PlanDay[] };
}

// Días de cualquier plan dentro de un rango de fechas (alimenta el calendario)
export async function getDaysByRange(from: string, to: string): Promise<PlanDay[]> {
  const db = getDatabase();
  const result = await db.query(
    `${DAYS_QUERY}
     JOIN training_plan tp ON pd.training_plan_id = tp.id
     WHERE tp.is_active = 1 AND pd.scheduled_date BETWEEN ? AND ?
     ORDER BY pd.scheduled_date ASC, pd.day_index ASC`,
    [from, to]
  );
  return (result.values ?? []) as PlanDay[];
}

// Día que corresponde entrenar hoy en el plan activo.
// En modo 'dates' busca el día de hoy y, si no hay, el pendiente vencido más antiguo.
// En modo 'sequence' devuelve el primer día pendiente.
export async function getTodayDay(): Promise<{ plan: TrainingPlan; day: PlanDay } | null> {
  const plan = await getActivePlan();
  if (!plan) return null;
  const db = getDatabase();

  if (plan.schedule_mode === 'sequence') {
    const result = await db.query(
      `${DAYS_QUERY} WHERE pd.training_plan_id = ? AND pd.status = 'pending'
       ORDER BY pd.day_index ASC LIMIT 1`,
      [plan.id]
    );
    const day = result.values?.[0] as PlanDay | undefined;
    return day ? { plan, day } : null;
  }

  const todayStr = today();
  const exact = await db.query(
    `${DAYS_QUERY} WHERE pd.training_plan_id = ? AND pd.scheduled_date = ?
     ORDER BY pd.day_index ASC LIMIT 1`,
    [plan.id, todayStr]
  );
  if (exact.values?.length) return { plan, day: exact.values[0] as PlanDay };

  const overdue = await db.query(
    `${DAYS_QUERY} WHERE pd.training_plan_id = ? AND pd.status = 'pending'
       AND pd.day_type <> 'rest' AND pd.scheduled_date < ?
     ORDER BY pd.scheduled_date ASC LIMIT 1`,
    [plan.id, todayStr]
  );
  if (overdue.values?.length) return { plan, day: overdue.values[0] as PlanDay };

  // Si no hay nada vencido, se muestra el próximo día programado
  const upcoming = await db.query(
    `${DAYS_QUERY} WHERE pd.training_plan_id = ? AND pd.status = 'pending'
       AND pd.scheduled_date > ?
     ORDER BY pd.scheduled_date ASC LIMIT 1`,
    [plan.id, todayStr]
  );
  if (upcoming.values?.length) return { plan, day: upcoming.values[0] as PlanDay };

  return null;
}

// Métricas de avance del plan
export async function getProgress(planId: string): Promise<PlanProgress> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT day_index, day_type, status, scheduled_date, completed_at
     FROM plan_day WHERE training_plan_id = ? ORDER BY day_index ASC`,
    [planId]
  );
  const days = (result.values ?? []) as PlanDay[];
  const todayStr = today();

  const trainingDays = days.filter((d) => d.day_type !== 'rest');
  const completed = trainingDays.filter((d) => d.status === 'completed').length;
  const skipped = trainingDays.filter((d) => d.status === 'skipped').length;
  const pending = trainingDays.filter((d) => d.status === 'pending').length;
  const overdue = trainingDays.filter(
    (d) => d.status === 'pending' && d.scheduled_date && d.scheduled_date < todayStr
  ).length;

  // Adherencia: solo sobre los días que ya vencieron o que ya fueron resueltos
  const due = trainingDays.filter(
    (d) => d.status !== 'pending' || (d.scheduled_date ? d.scheduled_date <= todayStr : false)
  ).length;
  const adherence = due > 0 ? Math.round((completed / due) * 100) : 0;

  // Racha: días de entrenamiento consecutivos completados desde el último resuelto
  let streak = 0;
  for (let i = trainingDays.length - 1; i >= 0; i--) {
    const d = trainingDays[i];
    if (d.status === 'pending') continue;
    if (d.status === 'completed') streak++;
    else break;
  }

  const currentIndex = completed + skipped;

  return {
    total: days.length,
    trainingDays: trainingDays.length,
    completed,
    skipped,
    pending,
    overdue,
    adherence,
    streak,
    currentIndex,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Escrituras del plan
// ─────────────────────────────────────────────────────────────────────────────

// Arma la sentencia de inserción de un día
function insertDayStmt(planId: string, day: PlanDayDraft, timestamp: string) {
  return {
    statement: `INSERT INTO plan_day
      (id, training_plan_id, day_index, scheduled_date, day_type, class_template_id,
       title, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    values: [
      generateUUID(),
      planId,
      day.day_index,
      day.scheduled_date ?? null,
      day.day_type,
      day.class_template_id ?? null,
      day.title ?? null,
      day.notes ?? null,
      timestamp,
      timestamp,
    ],
  };
}

// Crea un plan con sus días en una sola transacción
export async function create(
  plan: Omit<
    TrainingPlan,
    'id' | 'created_at' | 'updated_at' | 'total_days' | 'completed_days' | 'training_days'
  >,
  days: PlanDayDraft[]
): Promise<string> {
  const db = getDatabase();
  const planId = generateUUID();
  const timestamp = now();
  const stmts: { statement: string; values: unknown[] }[] = [];

  stmts.push({
    statement: `INSERT INTO training_plan
      (id, name, description, goal, start_date, schedule_mode, status, color, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values: [
      planId,
      plan.name,
      plan.description ?? null,
      plan.goal ?? null,
      plan.start_date ?? null,
      plan.schedule_mode,
      plan.status,
      plan.color ?? null,
      plan.is_active,
      timestamp,
      timestamp,
    ],
  });

  for (const day of days) {
    stmts.push(insertDayStmt(planId, day, timestamp));
  }

  // Solo puede haber un plan activo: el resto pasa a archivado
  if (plan.status === 'active') {
    stmts.push({
      statement: `UPDATE training_plan SET status = 'archived', updated_at = ?
                  WHERE status = 'active' AND id <> ?`,
      values: [timestamp, planId],
    });
  }

  await db.executeSet(stmts, true);
  await saveDatabase();
  return planId;
}

// Actualiza los datos generales del plan (no toca los días)
export async function update(id: string, plan: Partial<TrainingPlan>): Promise<void> {
  const db = getDatabase();
  const timestamp = now();
  await db.run(
    `UPDATE training_plan
     SET name = COALESCE(?, name),
         description = ?,
         goal = ?,
         start_date = ?,
         schedule_mode = COALESCE(?, schedule_mode),
         status = COALESCE(?, status),
         color = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      plan.name ?? null,
      plan.description ?? null,
      plan.goal ?? null,
      plan.start_date ?? null,
      plan.schedule_mode ?? null,
      plan.status ?? null,
      plan.color ?? null,
      timestamp,
      id,
    ]
  );
  await saveDatabase();
}

// Cambia el estado del plan; al activarlo, archiva cualquier otro plan activo
export async function setStatus(id: string, status: PlanStatus): Promise<void> {
  const db = getDatabase();
  const timestamp = now();
  const stmts: { statement: string; values: unknown[] }[] = [
    {
      statement: `UPDATE training_plan SET status = ?, updated_at = ? WHERE id = ?`,
      values: [status, timestamp, id],
    },
  ];
  if (status === 'active') {
    stmts.push({
      statement: `UPDATE training_plan SET status = 'archived', updated_at = ?
                  WHERE status = 'active' AND id <> ?`,
      values: [timestamp, id],
    });
  }
  await db.executeSet(stmts, true);
  await saveDatabase();
}

// Baja lógica del plan y de las plantillas privadas de sus días armados a mano
export async function softDelete(id: string): Promise<void> {
  const db = getDatabase();
  const timestamp = now();
  await db.executeSet(
    [
      {
        statement: `UPDATE class_template SET is_active = 0, updated_at = ?
                    WHERE is_plan_day = 1 AND id IN (
                      SELECT class_template_id FROM plan_day
                      WHERE training_plan_id = ? AND class_template_id IS NOT NULL
                    )`,
        values: [timestamp, id],
      },
      {
        statement: `UPDATE training_plan SET is_active = 0, status = 'archived', updated_at = ? WHERE id = ?`,
        values: [timestamp, id],
      },
    ],
    true
  );
  await saveDatabase();
}

// Duplica un plan completo con una nueva fecha de inicio (mesociclos repetibles)
export async function duplicatePlan(id: string, newStartDate?: string): Promise<string> {
  const source = await getById(id);
  if (!source) throw new Error('Plan no encontrado');

  // Desplazamiento respecto de la fecha de inicio original
  let offset = 0;
  if (newStartDate && source.start_date) {
    const a = new Date(`${source.start_date}T00:00:00Z`).getTime();
    const b = new Date(`${newStartDate}T00:00:00Z`).getTime();
    offset = Math.round((b - a) / 86400000);
  }

  const days: PlanDayDraft[] = source.days.map((d) => ({
    day_index: d.day_index,
    day_type: d.day_type,
    scheduled_date: d.scheduled_date ? addDaysISO(d.scheduled_date, offset) : undefined,
    class_template_id: d.class_template_id,
    title: d.title,
    notes: d.notes,
  }));

  return create(
    {
      name: `${source.name} (copia)`,
      description: source.description,
      goal: source.goal,
      start_date: newStartDate ?? source.start_date,
      schedule_mode: source.schedule_mode,
      status: 'draft',
      color: source.color,
      is_active: 1,
    },
    days
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Escrituras de días
// ─────────────────────────────────────────────────────────────────────────────

// Agrega un día al final del plan y devuelve su id
export async function addDay(
  planId: string,
  day: Omit<PlanDayDraft, 'day_index'>
): Promise<void> {
  const db = getDatabase();
  const maxResult = await db.query(
    `SELECT COALESCE(MAX(day_index), 0) as max_index FROM plan_day WHERE training_plan_id = ?`,
    [planId]
  );
  const nextIndex = ((maxResult.values?.[0]?.max_index as number) ?? 0) + 1;
  const stmt = insertDayStmt(planId, { ...day, day_index: nextIndex }, now());
  await db.run(stmt.statement, stmt.values);
  await saveDatabase();
}

// Actualiza campos sueltos de un día
export async function updateDay(
  dayId: string,
  patch: Partial<
    Pick<PlanDay, 'scheduled_date' | 'day_type' | 'class_template_id' | 'title' | 'notes' | 'status'>
  >
): Promise<void> {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  const editable = [
    'scheduled_date',
    'day_type',
    'class_template_id',
    'title',
    'notes',
    'status',
  ] as const;

  for (const key of editable) {
    if (key in patch) {
      fields.push(`${key} = ?`);
      values.push(patch[key] ?? null);
    }
  }
  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now(), dayId);

  await db.run(`UPDATE plan_day SET ${fields.join(', ')} WHERE id = ?`, values);
  await saveDatabase();
}

// Elimina un día y da de baja su plantilla privada si la tenía
export async function removeDay(dayId: string): Promise<void> {
  const db = getDatabase();
  const dayResult = await db.query(
    `SELECT pd.id, pd.class_template_id, ct.is_plan_day FROM plan_day pd
     LEFT JOIN class_template ct ON pd.class_template_id = ct.id
     WHERE pd.id = ?`,
    [dayId]
  );
  const day = dayResult.values?.[0];
  if (!day) return;

  const stmts: { statement: string; values: unknown[] }[] = [
    { statement: `DELETE FROM plan_day WHERE id = ?`, values: [dayId] },
  ];
  if (day.is_plan_day === 1 && day.class_template_id) {
    stmts.push({
      statement: `UPDATE class_template SET is_active = 0, updated_at = ? WHERE id = ?`,
      values: [now(), day.class_template_id],
    });
  }
  await db.executeSet(stmts, true);
  await saveDatabase();
}

// Reordena los días según el array de ids recibido y reasigna day_index
export async function reorderDays(planId: string, orderedIds: string[]): Promise<void> {
  const db = getDatabase();
  const timestamp = now();
  const stmts = orderedIds.map((dayId, i) => ({
    statement: `UPDATE plan_day SET day_index = ?, updated_at = ? WHERE id = ? AND training_plan_id = ?`,
    values: [i + 1, timestamp, dayId, planId],
  }));
  await db.executeSet(stmts, true);
  await saveDatabase();
}

// Corre N días las fechas pendientes del plan (reprogramar tras una pausa)
export async function shiftPlan(planId: string, days: number): Promise<number> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT id, scheduled_date FROM plan_day
     WHERE training_plan_id = ? AND status = 'pending' AND scheduled_date IS NOT NULL`,
    [planId]
  );
  const rows = (result.values ?? []) as { id: string; scheduled_date: string }[];
  if (rows.length === 0) return 0;

  const timestamp = now();
  const stmts = rows.map((r) => ({
    statement: `UPDATE plan_day SET scheduled_date = ?, updated_at = ? WHERE id = ?`,
    values: [addDaysISO(r.scheduled_date, days), timestamp, r.id],
  }));
  await db.executeSet(stmts, true);
  await saveDatabase();
  return rows.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Día armado a mano: se materializa como class_template privada
// ─────────────────────────────────────────────────────────────────────────────

// Tipo de sección por defecto para los días sueltos (preferimos "WOD")
async function getDefaultSectionTypeId(): Promise<string> {
  const db = getDatabase();
  const preferred = await db.query(
    `SELECT id FROM section_type WHERE name = 'WOD' AND is_active = 1 LIMIT 1`
  );
  if (preferred.values?.length) return preferred.values[0].id as string;

  const fallback = await db.query(
    `SELECT id FROM section_type WHERE is_active = 1 ORDER BY default_order LIMIT 1`
  );
  if (fallback.values?.length) return fallback.values[0].id as string;
  throw new Error('No hay tipos de sección configurados');
}

/**
 * Guarda un día armado a mano: crea (o reemplaza) la plantilla privada del día
 * con una única sección y la lista plana de ejercicios.
 */
export async function saveCustomDay(
  dayId: string,
  title: string,
  exercises: PlanDayExerciseDraft[]
): Promise<string> {
  const db = getDatabase();
  const timestamp = now();

  const dayResult = await db.query(
    `SELECT pd.id, pd.scheduled_date, pd.class_template_id, ct.is_plan_day
     FROM plan_day pd
     LEFT JOIN class_template ct ON pd.class_template_id = ct.id
     WHERE pd.id = ?`,
    [dayId]
  );
  const day = dayResult.values?.[0];
  if (!day) throw new Error('Día no encontrado');

  const sectionTypeId = await getDefaultSectionTypeId();
  const reuseTemplate = day.is_plan_day === 1 && !!day.class_template_id;
  const templateId = reuseTemplate ? (day.class_template_id as string) : generateUUID();
  const sectionId = generateUUID();

  const stmts: { statement: string; values: unknown[] }[] = [];

  if (reuseTemplate) {
    stmts.push({
      statement: `UPDATE class_template SET name = ?, date = ?, is_active = 1, updated_at = ? WHERE id = ?`,
      values: [title, day.scheduled_date ?? null, timestamp, templateId],
    });
    // Reemplazo total del contenido: borra la sección anterior (cascade a ejercicios)
    stmts.push({
      statement: `DELETE FROM class_section WHERE class_template_id = ?`,
      values: [templateId],
    });
  } else {
    stmts.push({
      statement: `INSERT INTO class_template
        (id, date, name, objective, general_notes, estimated_duration_minutes,
         is_favorite, template_type, is_active, is_plan_day, created_at, updated_at)
        VALUES (?, ?, ?, NULL, NULL, NULL, 0, 'my_classes', 1, 1, ?, ?)`,
      values: [templateId, day.scheduled_date ?? null, title, timestamp, timestamp],
    });
  }

  stmts.push({
    statement: `INSERT INTO class_section
      (id, class_template_id, section_type_id, sort_order, visible_title, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)`,
    values: [sectionId, templateId, sectionTypeId, title, timestamp, timestamp],
  });

  exercises.forEach((ex, i) => {
    stmts.push({
      statement: `INSERT INTO section_exercise
        (id, class_section_id, exercise_id, sort_order, planned_repetitions,
         planned_weight_value, planned_time_seconds, planned_rounds, planned_rest_seconds,
         notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        generateUUID(),
        sectionId,
        ex.exercise_id,
        i + 1,
        ex.planned_repetitions ?? null,
        ex.planned_weight_value ?? null,
        ex.planned_time_seconds ?? null,
        ex.planned_rounds ?? null,
        ex.planned_rest_seconds ?? null,
        ex.notes ?? null,
        timestamp,
        timestamp,
      ],
    });
  });

  stmts.push({
    statement: `UPDATE plan_day SET day_type = 'custom', class_template_id = ?, title = ?, updated_at = ?
                WHERE id = ?`,
    values: [templateId, title, timestamp, dayId],
  });

  await db.executeSet(stmts, true);
  await saveDatabase();
  return templateId;
}

// Carga los ejercicios de la plantilla de un día armado a mano
export async function getCustomDayExercises(
  templateId: string
): Promise<PlanDayExerciseDraft[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT se.exercise_id, se.planned_repetitions, se.planned_weight_value,
            se.planned_time_seconds, se.planned_rounds, se.planned_rest_seconds,
            se.notes, e.name as exercise_name,
            e.image_url as exercise_image_url, e.image_path as exercise_image_path
     FROM section_exercise se
     JOIN class_section cs ON se.class_section_id = cs.id
     JOIN exercise e ON se.exercise_id = e.id
     WHERE cs.class_template_id = ?
     ORDER BY cs.sort_order, se.sort_order`,
    [templateId]
  );
  return (result.values ?? []) as PlanDayExerciseDraft[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejecución
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inicia el día del plan: crea la sesión desde la plantilla y la deja enlazada.
 * Devuelve el id de la sesión y si la plantilla tiene video de cabecera.
 */
export async function startDay(
  dayId: string
): Promise<{ sessionId: string; hasVideo: boolean }> {
  const db = getDatabase();
  const dayResult = await db.query(
    `SELECT pd.id, pd.scheduled_date, pd.class_template_id, pd.training_session_id, ct.video_url
     FROM plan_day pd
     LEFT JOIN class_template ct ON pd.class_template_id = ct.id
     WHERE pd.id = ?`,
    [dayId]
  );
  const day = dayResult.values?.[0];
  if (!day) throw new Error('Día no encontrado');
  if (!day.class_template_id) throw new Error('El día no tiene una clase asignada');

  // Si ya se había arrancado y la sesión sigue abierta, se retoma
  if (day.training_session_id) {
    const existing = await db.query(`SELECT id, status FROM training_session WHERE id = ?`, [
      day.training_session_id,
    ]);
    const session = existing.values?.[0];
    if (session && session.status !== 'completed' && session.status !== 'cancelled') {
      return { sessionId: session.id as string, hasVideo: !!day.video_url };
    }
  }

  // Import diferido para evitar el ciclo entre repositorios
  const { createFromTemplate } = await import('./trainingSessionRepo');
  const sessionId = await createFromTemplate(
    day.class_template_id as string,
    (day.scheduled_date as string) || undefined
  );

  await db.run(`UPDATE plan_day SET training_session_id = ?, updated_at = ? WHERE id = ?`, [
    sessionId,
    now(),
    dayId,
  ]);
  await saveDatabase();

  return { sessionId, hasVideo: !!day.video_url };
}

// Marca un día como salteado
export async function markSkipped(dayId: string): Promise<void> {
  await updateDay(dayId, { status: 'skipped' });
}

// Vuelve un día a pendiente (deshace completado o salteado)
export async function resetDay(dayId: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE plan_day SET status = 'pending', completed_at = NULL, updated_at = ? WHERE id = ?`,
    [now(), dayId]
  );
  await saveDatabase();
}

// Enlaza manualmente una sesión ya realizada con un día del plan y lo completa
export async function linkSession(dayId: string, sessionId: string): Promise<void> {
  const db = getDatabase();
  const timestamp = now();
  await db.run(
    `UPDATE plan_day
     SET training_session_id = ?, status = 'completed', completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [sessionId, timestamp, timestamp, dayId]
  );
  await saveDatabase();
}

/**
 * Marca como completado el día del plan enlazado a una sesión.
 * Lo invoca trainingSessionRepo al finalizar cualquier tipo de sesión.
 */
export async function completeDayBySession(sessionId: string): Promise<void> {
  const db = getDatabase();
  const timestamp = now();
  await db.run(
    `UPDATE plan_day SET status = 'completed', completed_at = ?, updated_at = ?
     WHERE training_session_id = ? AND status <> 'completed'`,
    [timestamp, timestamp, sessionId]
  );
}

/** Cierra el plan automáticamente cuando ya no quedan días pendientes */
export async function closePlanIfFinished(planId: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT COUNT(*) as pending FROM plan_day
     WHERE training_plan_id = ? AND status = 'pending' AND day_type <> 'rest'`,
    [planId]
  );
  const pending = (result.values?.[0]?.pending as number) ?? 0;
  if (pending > 0) return false;
  await setStatus(planId, 'completed');
  return true;
}

/** Busca el día del plan (si existe) al que pertenece una sesión */
export async function getDayBySession(sessionId: string): Promise<PlanDay | null> {
  const db = getDatabase();
  const result = await db.query(`${DAYS_QUERY} WHERE pd.training_session_id = ? LIMIT 1`, [
    sessionId,
  ]);
  return (result.values?.[0] as PlanDay) ?? null;
}
