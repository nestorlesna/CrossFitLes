// Repositorio de sesiones de entrenamiento: Gestión de ejecución y resultados
import { getDatabase, saveDatabase } from '../database';
import { generateUUID } from '../../utils/formatters';
import { TrainingSession, SessionExerciseResult, SessionWithRelations } from '../../models/TrainingSession';
import { SessionStatus, RecordType } from '../../types';

// Retorna la marca de tiempo actual en formato SQLite
function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Obtiene todas las sesiones de entrenamiento con filtros
 */
export async function getAll(filters?: { status?: SessionStatus; fromDate?: string; toDate?: string }): Promise<TrainingSession[]> {
  const db = getDatabase();
  let query = `
    SELECT ts.*, ct.name as template_name
    FROM training_session ts
    LEFT JOIN class_template ct ON ts.class_template_id = ct.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.status) {
    query += ` AND ts.status = ?`;
    params.push(filters.status);
  }
  if (filters?.fromDate) {
    query += ` AND ts.session_date >= ?`;
    params.push(filters.fromDate);
  }
  if (filters?.toDate) {
    query += ` AND ts.session_date <= ?`;
    params.push(filters.toDate);
  }

  query += ` ORDER BY ts.session_date DESC, ts.created_at DESC`;

  const result = await db.query(query, params);
  return (result.values ?? []) as TrainingSession[];
}

/**
 * Obtiene una sesión completa con sus resultados
 */
export async function getById(id: string): Promise<SessionWithRelations | null> {
  const db = getDatabase();

  const sessionResult = await db.query(
    `SELECT ts.*, ct.name as template_name 
     FROM training_session ts 
     LEFT JOIN class_template ct ON ts.class_template_id = ct.id 
     WHERE ts.id = ?`,
    [id]
  );
  
  if (!sessionResult.values || sessionResult.values.length === 0) return null;
  const session = sessionResult.values[0] as TrainingSession;

  const resultsQuery = `
    SELECT ser.*, e.name as exercise_name, 
           wu.abbreviation as weight_unit_abbreviation, 
           du.abbreviation as distance_unit_abbreviation
    FROM session_exercise_result ser
    JOIN exercise e ON ser.exercise_id = e.id
    LEFT JOIN measurement_unit wu ON ser.actual_weight_unit_id = wu.id
    LEFT JOIN measurement_unit du ON ser.actual_distance_unit_id = du.id
    WHERE ser.training_session_id = ?
    ORDER BY ser.sort_order ASC
  `;
  
  const resultsResult = await db.query(resultsQuery, [id]);
  const results = (resultsResult.values ?? []) as SessionExerciseResult[];

  return { ...session, results };
}

/**
 * Crea una sesión desde una plantilla
 */
export async function createFromTemplate(templateId: string, date?: string): Promise<string> {
  const db = getDatabase();
  const sessionId = generateUUID();
  const timestamp = now();
  const sessionDate = date || new Date().toISOString().split('T')[0];

  await db.beginTransaction();
  try {
    // 1. Insertar la sesión
    await db.run(
      `INSERT INTO training_session (id, class_template_id, session_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, templateId, sessionDate, 'planned', timestamp, timestamp]
    );

    // 2. Traer todos los ejercicios de la plantilla para inicializar los resultados
    const templateExercisesQuery = `
      SELECT se.*, cs.section_type_id, cs.sort_order as section_order
      FROM section_exercise se
      JOIN class_section cs ON se.class_section_id = cs.id
      WHERE cs.class_template_id = ?
      ORDER BY cs.sort_order ASC, se.sort_order ASC
    `;
    const templateExercises = await db.query(templateExercisesQuery, [templateId]);
    
    if (templateExercises.values) {
      for (let i = 0; i < templateExercises.values.length; i++) {
        const te = templateExercises.values[i];
        await db.run(
          `INSERT INTO session_exercise_result (
            id, training_session_id, section_exercise_id, exercise_id, section_type_id, sort_order,
            rx_or_scaled, is_completed, is_personal_record, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateUUID(), sessionId, te.id, te.exercise_id, te.section_type_id, i + 1,
            'rx', 0, 0, timestamp, timestamp
          ]
        );
      }
    }

    await db.commitTransaction();
    await saveDatabase();
    return sessionId;
  } catch (err) {
    await db.rollbackTransaction();
    throw err;
  }
}

/**
 * Guarda los resultados de una sesión
 */
export async function saveResults(sessionId: string, results: Partial<SessionExerciseResult>[]): Promise<void> {
  const db = getDatabase();
  const timestamp = now();

  await db.beginTransaction();
  try {
    for (const result of results) {
      if (!result.id) continue;

      const fields = { ...result, updated_at: timestamp };
      delete fields.id;
      delete fields.training_session_id;

      const keys = Object.keys(fields);
      const values = Object.values(fields);
      const setClause = keys.map(k => `${k} = ?`).join(', ');

      await db.run(
        `UPDATE session_exercise_result SET ${setClause} WHERE id = ? AND training_session_id = ?`,
        [...values, result.id, sessionId]
      );
    }
    
    // Actualizar timestamp de la sesión también
    await db.run(`UPDATE training_session SET updated_at = ? WHERE id = ?`, [timestamp, sessionId]);

    await db.commitTransaction();

    // ── Detección de PRs tras la transacción ──
    for (const result of results) {
      if (result.id && result.is_completed) {
        await checkAndSavePR(result as SessionExerciseResult);
      }
    }
    await saveDatabase();
  } catch (err) {
    await db.rollbackTransaction();
    throw err;
  }
}

/**
 * Finaliza una sesión con resumen
 */
export async function finalize(
  id: string, 
  summary: { 
    durationMinutes: number; 
    feeling: string; 
    effort: number; 
    notes?: string;
    bodyWeight?: number;
    bodyWeightUnitId?: string;
  }
): Promise<void> {
  const db = getDatabase();
  const timestamp = now();

  await db.run(
    `UPDATE training_session 
     SET status = 'completed', 
         actual_duration_minutes = ?, 
         general_feeling = ?, 
         perceived_effort = ?, 
         final_notes = ?, 
         body_weight = ?,
         body_weight_unit_id = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      summary.durationMinutes, 
      summary.feeling, 
      summary.effort, 
      summary.notes || null, 
      summary.bodyWeight || null,
      summary.bodyWeightUnitId || null,
      timestamp, id
    ]
  );
  await saveDatabase();
}

/**
 * Lógica interna para detectar y guardar un PR
 */
async function checkAndSavePR(result: SessionExerciseResult): Promise<void> {
  const db = getDatabase();
  
  // 1. Identificar tipos de récords potenciales según los datos ingresados
  const potentialPRs: { type: RecordType; value: number; unit?: string }[] = [];
  
  if (result.actual_weight_value) {
    potentialPRs.push({ type: 'max_weight', value: result.actual_weight_value, unit: result.actual_weight_unit_id });
  }
  if (result.actual_repetitions) {
    potentialPRs.push({ type: 'max_reps', value: result.actual_repetitions });
  }
  if (result.actual_time_seconds) {
    potentialPRs.push({ type: 'min_time', value: result.actual_time_seconds });
  }
  if (result.actual_distance_value) {
    potentialPRs.push({ type: 'max_distance', value: result.actual_distance_value, unit: result.actual_distance_unit_id });
  }
  if (result.actual_calories) {
    potentialPRs.push({ type: 'max_calories', value: result.actual_calories });
  }

  for (const p of potentialPRs) {
    // Buscar récord actual para este ejercicio y tipo
    const currentPRResult = await db.query(
      `SELECT * FROM personal_record WHERE exercise_id = ? AND record_type = ?`,
      [result.exercise_id, p.type]
    );
    const currentPR = currentPRResult.values?.[0];

    let isNewPR = false;
    if (!currentPR) {
      isNewPR = true;
    } else {
      // Comparar: min_time es menor es mejor, el resto mayor es mejor
      if (p.type === 'min_time') {
        if (p.value < (currentPR.record_value as number)) isNewPR = true;
      } else {
        if (p.value > (currentPR.record_value as number)) isNewPR = true;
      }
    }

    if (isNewPR) {
      const timestamp = now();
      const achievedDate = new Date().toISOString().split('T')[0];
      
      if (!currentPR) {
        // Nuevo registro de PR
        await db.run(
          `INSERT INTO personal_record (id, exercise_id, record_type, record_value, record_unit_id, session_exercise_result_id, achieved_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [generateUUID(), result.exercise_id, p.type, p.value, p.unit || null, result.id, achievedDate, timestamp, timestamp]
        );
      } else {
        // Actualizar PR existente
        await db.run(
          `UPDATE personal_record 
           SET record_value = ?, record_unit_id = ?, session_exercise_result_id = ?, achieved_date = ?, updated_at = ?
           WHERE id = ?`,
          [p.value, p.unit || null, result.id, achievedDate, timestamp, currentPR.id]
        );
      }

      // Marcar el resultado como PR
      await db.run(
        `UPDATE session_exercise_result SET is_personal_record = 1 WHERE id = ?`,
        [result.id]
      );
      await saveDatabase();
    }
  }
}

/**
 * Borrado lógico de sesión
 */
export async function softDelete(id: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE training_session SET status = 'cancelled', updated_at = ? WHERE id = ?`,
    [now(), id]
  );
  await saveDatabase();
}
