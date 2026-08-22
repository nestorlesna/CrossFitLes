// Repositorio de ejercicios: CRUD completo con relaciones y transacciones

import { getDatabase, saveDatabase } from '../database';
import { generateUUID } from '../../utils/formatters';
import { Exercise, ExerciseFilters, ExerciseRelations, ExerciseWithRelations } from '../../models/Exercise';

// Retorna la marca de tiempo actual en formato SQLite
function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// Obtiene todos los ejercicios activos aplicando filtros dinámicos
export async function getAll(filters?: ExerciseFilters): Promise<Exercise[]> {
  const db = getDatabase();

  let query = `
    SELECT e.*,
      dl.name as difficulty_name,
      dl.color as difficulty_color,
      mg.name as primary_muscle_name,
      (SELECT COUNT(*) FROM section_exercise se WHERE se.exercise_id = e.id) as usage_count
    FROM exercise e
    LEFT JOIN difficulty_level dl ON e.difficulty_level_id = dl.id
    LEFT JOIN muscle_group mg ON e.primary_muscle_group_id = mg.id
    WHERE e.is_active = 1
  `;

  const params: unknown[] = [];

  if (filters?.search) {
    query += ` AND e.name LIKE ?`;
    params.push(`%${filters.search}%`);
  }

  if (filters?.difficulty_level_id) {
    query += ` AND e.difficulty_level_id = ?`;
    params.push(filters.difficulty_level_id);
  }

  if (filters?.muscle_group_id) {
    query += ` AND (e.primary_muscle_group_id = ? OR e.id IN (SELECT exercise_id FROM exercise_muscle_group WHERE muscle_group_id = ?))`;
    params.push(filters.muscle_group_id, filters.muscle_group_id);
  }

  if (filters?.equipment_id) {
    query += ` AND e.id IN (SELECT exercise_id FROM exercise_equipment WHERE equipment_id = ?)`;
    params.push(filters.equipment_id);
  }

  if (filters?.tag_id) {
    query += ` AND e.id IN (SELECT exercise_id FROM exercise_tag WHERE tag_id = ?)`;
    params.push(filters.tag_id);
  }

  if (filters?.section_type_id) {
    query += ` AND e.id IN (SELECT exercise_id FROM exercise_section_type WHERE section_type_id = ?)`;
    params.push(filters.section_type_id);
  }

  if (filters?.in_classes) {
    query += ` AND e.id IN (SELECT DISTINCT exercise_id FROM section_exercise)`;
  }

  query += ` ORDER BY e.name ASC`;

  const result = await db.query(query, params);
  return (result.values ?? []) as Exercise[];
}

// Obtiene un ejercicio por ID junto con todas sus relaciones
export async function getById(id: string): Promise<ExerciseWithRelations | null> {
  const db = getDatabase();

  // Cargar ejercicio principal con JOINs de catálogos
  const result = await db.query(
    `SELECT e.*,
      dl.name as difficulty_name,
      dl.color as difficulty_color,
      mg.name as primary_muscle_name
    FROM exercise e
    LEFT JOIN difficulty_level dl ON e.difficulty_level_id = dl.id
    LEFT JOIN muscle_group mg ON e.primary_muscle_group_id = mg.id
    WHERE e.id = ?`,
    [id]
  );

  const rows = result.values ?? [];
  if (rows.length === 0) return null;

  const exercise = rows[0] as Exercise;

  // Cargar grupos musculares asociados
  const mgResult = await db.query(
    `SELECT mg.id, mg.name, emg.is_primary
     FROM exercise_muscle_group emg
     JOIN muscle_group mg ON emg.muscle_group_id = mg.id
     WHERE emg.exercise_id = ?`,
    [id]
  );

  // Cargar equipamiento asociado
  const eqResult = await db.query(
    `SELECT eq.id, eq.name, ee.is_required
     FROM exercise_equipment ee
     JOIN equipment eq ON ee.equipment_id = eq.id
     WHERE ee.exercise_id = ?`,
    [id]
  );

  // Cargar tipos de sección asociados
  const stResult = await db.query(
    `SELECT st.id, st.name
     FROM exercise_section_type est
     JOIN section_type st ON est.section_type_id = st.id
     WHERE est.exercise_id = ?`,
    [id]
  );

  // Cargar unidades de medida asociadas
  const unResult = await db.query(
    `SELECT mu.id, mu.name, mu.abbreviation, eu.is_default
     FROM exercise_unit eu
     JOIN measurement_unit mu ON eu.measurement_unit_id = mu.id
     WHERE eu.exercise_id = ?`,
    [id]
  );

  // Cargar tags asociados
  const tagResult = await db.query(
    `SELECT t.id, t.name, t.color
     FROM exercise_tag et
     JOIN tag t ON et.tag_id = t.id
     WHERE et.exercise_id = ?`,
    [id]
  );

  const relations: ExerciseRelations = {
    muscleGroups: (mgResult.values ?? []) as ExerciseRelations['muscleGroups'],
    equipment: (eqResult.values ?? []) as ExerciseRelations['equipment'],
    sectionTypes: (stResult.values ?? []) as ExerciseRelations['sectionTypes'],
    units: (unResult.values ?? []) as ExerciseRelations['units'],
    tags: (tagResult.values ?? []) as ExerciseRelations['tags'],
  };

  return { ...exercise, relations };
}

// Verifica si ya existe un ejercicio activo con ese nombre (case-insensitive)
// excludeId: al editar, excluir el propio ID del chequeo
export async function existsByName(name: string, excludeId?: string): Promise<boolean> {
  const db = getDatabase();
  const cleanName = name.trim();
  
  let query = `SELECT COUNT(*) as cnt FROM exercise WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND is_active = 1`;
  const params: any[] = [cleanName];

  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }

  const result = await db.query(query, params);
  
  if (!result.values || result.values.length === 0) return false;
  
  const row = result.values[0];
  const cnt = row.cnt ?? row.CNT ?? Object.values(row)[0] ?? 0;
  
  return Number(cnt) > 0;
}

// Crea un nuevo ejercicio con todas sus relaciones usando executeSet (más confiable en web)
export async function create(
  exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'difficulty_name' | 'difficulty_color' | 'primary_muscle_name'>,
  relations: ExerciseRelations
): Promise<string> {
  const db = getDatabase();

  // Verificar unicidad de nombre antes de insertar
  if (await existsByName(exercise.name)) {
    throw new Error(`Ya existe un ejercicio con el nombre "${exercise.name}"`);
  }

  const id = generateUUID();
  const timestamp = now();

  // Armar el conjunto de sentencias para executeSet (ejecuta todo en una transacción)
  const stmts: { statement: string; values: unknown[] }[] = [];

  stmts.push({
    statement: `INSERT INTO exercise (id, name, description, technical_notes, difficulty_level_id, primary_muscle_group_id, image_url, video_path, video_long_path, is_compound, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values: [id, exercise.name, exercise.description ?? null, exercise.technical_notes ?? null,
      exercise.difficulty_level_id ?? null, exercise.primary_muscle_group_id ?? null,
      exercise.image_url ?? null, exercise.video_path ?? null, exercise.video_long_path ?? null,
      exercise.is_compound, exercise.is_active, timestamp, timestamp],
  });

  for (const mg of relations.muscleGroups) {
    stmts.push({ statement: `INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, ?)`, values: [generateUUID(), id, mg.id, mg.is_primary] });
  }
  for (const eq of relations.equipment) {
    stmts.push({ statement: `INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?, ?, ?, ?)`, values: [generateUUID(), id, eq.id, eq.is_required] });
  }
  for (const st of relations.sectionTypes) {
    stmts.push({ statement: `INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?, ?, ?)`, values: [generateUUID(), id, st.id] });
  }
  for (const unit of relations.units) {
    stmts.push({ statement: `INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, ?)`, values: [generateUUID(), id, unit.id, unit.is_default] });
  }
  for (const tag of relations.tags) {
    stmts.push({ statement: `INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?, ?, ?)`, values: [generateUUID(), id, tag.id] });
  }

  await db.executeSet(stmts, true);
  await saveDatabase();
  return id;
}

// Actualiza un ejercicio y reemplaza todas sus relaciones usando executeSet
export async function update(
  id: string,
  exercise: Partial<Exercise>,
  relations: ExerciseRelations
): Promise<void> {
  const db = getDatabase();
  const timestamp = now();

  // Verificar si el nombre está cambiando para validar unicidad
  if (exercise.name) {
    const current = await db.query('SELECT name FROM exercise WHERE id = ?', [id]);
    const currentName = current.values?.[0]?.name;
    
    if (currentName && exercise.name.trim().toLowerCase() !== currentName.toLowerCase()) {
      if (await existsByName(exercise.name.trim())) {
        throw new Error(`Ya existe otro ejercicio con el nombre "${exercise.name}"`);
      }
    }
  }

  // Calcular el UPDATE del ejercicio principal
  const fields = { ...exercise, updated_at: timestamp };
  delete fields.difficulty_name;
  delete fields.difficulty_color;
  delete fields.primary_muscle_name;

  const sets = Object.keys(fields).map((k) => `${k} = ?`).join(', ');
  const updateValues = [...Object.values(fields), id];

  const stmts: { statement: string; values: unknown[] }[] = [];

  stmts.push({ statement: `UPDATE exercise SET ${sets} WHERE id = ?`, values: updateValues });

  // Eliminar y re-insertar todas las relaciones
  stmts.push({ statement: `DELETE FROM exercise_muscle_group WHERE exercise_id = ?`, values: [id] });
  for (const mg of relations.muscleGroups) {
    stmts.push({ statement: `INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, ?)`, values: [generateUUID(), id, mg.id, mg.is_primary] });
  }

  stmts.push({ statement: `DELETE FROM exercise_equipment WHERE exercise_id = ?`, values: [id] });
  for (const eq of relations.equipment) {
    stmts.push({ statement: `INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?, ?, ?, ?)`, values: [generateUUID(), id, eq.id, eq.is_required] });
  }

  stmts.push({ statement: `DELETE FROM exercise_section_type WHERE exercise_id = ?`, values: [id] });
  for (const st of relations.sectionTypes) {
    stmts.push({ statement: `INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?, ?, ?)`, values: [generateUUID(), id, st.id] });
  }

  stmts.push({ statement: `DELETE FROM exercise_unit WHERE exercise_id = ?`, values: [id] });
  for (const unit of relations.units) {
    stmts.push({ statement: `INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, ?)`, values: [generateUUID(), id, unit.id, unit.is_default] });
  }

  stmts.push({ statement: `DELETE FROM exercise_tag WHERE exercise_id = ?`, values: [id] });
  for (const tag of relations.tags) {
    stmts.push({ statement: `INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?, ?, ?)`, values: [generateUUID(), id, tag.id] });
  }

  await db.executeSet(stmts, true);
  await saveDatabase();
}

// Clona un ejercicio: copia todos sus datos y relaciones con un nuevo nombre
export async function duplicate(id: string): Promise<string> {
  const exercise = await getById(id);
  if (!exercise) throw new Error('Ejercicio no encontrado');

  // Busca un nombre único: "Nombre (copia)", luego "Nombre (copia 2)", etc.
  let name = `${exercise.name} (copia)`;
  let counter = 2;
  while (await existsByName(name)) {
    name = `${exercise.name} (copia ${counter})`;
    counter++;
  }

  return create(
    {
      name,
      description: exercise.description,
      technical_notes: exercise.technical_notes,
      difficulty_level_id: exercise.difficulty_level_id,
      primary_muscle_group_id: exercise.primary_muscle_group_id,
      image_path: exercise.image_path,
      image_url: exercise.image_url,
      video_path: exercise.video_path,
      video_long_path: exercise.video_long_path,
      is_compound: exercise.is_compound,
      is_active: 1,
    },
    exercise.relations
  );
}

// Borrado lógico: marca el ejercicio como inactivo
export async function softDelete(id: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE exercise SET is_active = 0, updated_at = ? WHERE id = ?`,
    [now(), id]
  );
  await saveDatabase();
}

// Borrado físico completo de un ejercicio
export async function hardDelete(id: string): Promise<void> {
  const db = getDatabase();

  // Eliminar relaciones M2M
  await db.run(`DELETE FROM exercise_muscle_group WHERE exercise_id = ?`, [id]);
  await db.run(`DELETE FROM exercise_equipment WHERE exercise_id = ?`, [id]);
  await db.run(`DELETE FROM exercise_section_type WHERE exercise_id = ?`, [id]);
  await db.run(`DELETE FROM exercise_unit WHERE exercise_id = ?`, [id]);
  await db.run(`DELETE FROM exercise_tag WHERE exercise_id = ?`, [id]);

  // Eliminar imagen asociada
  await db.run(`DELETE FROM exercise_image WHERE exercise_id = ?`, [id]);

  // Eliminar referencias en section_exercise
  await db.run(`DELETE FROM section_exercise WHERE exercise_id = ?`, [id]);

  // Eliminar resultados de sesiones
  await db.run(`DELETE FROM session_exercise_result WHERE exercise_id = ?`, [id]);

  // Eliminar récords personales
  await db.run(`DELETE FROM personal_record WHERE exercise_id = ?`, [id]);

  // Eliminar el ejercicio
  await db.run(`DELETE FROM exercise WHERE id = ?`, [id]);

  await saveDatabase();
}

// Verifica si un ejercicio está siendo usado en alguna clase
export async function isExerciseInClass(exerciseId: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT COUNT(*) as cnt FROM section_exercise WHERE exercise_id = ?`,
    [exerciseId]
  );
  const row = result.values?.[0];
  const cnt = row?.cnt ?? row?.CNT ?? Object.values(row ?? {})[0] ?? 0;
  return Number(cnt) > 0;
}

// Obtiene el historial de uso del ejercicio en sesiones completadas
export async function getHistory(exerciseId: string): Promise<unknown[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT ser.*, ts.session_date, ts.status,
      mu_w.abbreviation as weight_unit, mu_d.abbreviation as distance_unit
     FROM session_exercise_result ser
     JOIN training_session ts ON ser.training_session_id = ts.id
     LEFT JOIN measurement_unit mu_w ON ser.actual_weight_unit_id = mu_w.id
     LEFT JOIN measurement_unit mu_d ON ser.actual_distance_unit_id = mu_d.id
     WHERE ser.exercise_id = ? AND ts.status = 'completed'
       AND (
         ser.actual_repetitions IS NOT NULL OR
         ser.actual_weight_value IS NOT NULL OR
         ser.actual_time_seconds IS NOT NULL OR
         ser.actual_distance_value IS NOT NULL OR
         ser.actual_calories IS NOT NULL OR
         ser.actual_rounds IS NOT NULL OR
         TRIM(COALESCE(ser.result_text, '')) <> ''
       )
     ORDER BY ts.session_date DESC
     LIMIT 50`,
    [exerciseId]
  );
  return result.values ?? [];
}

// Obtiene los récords personales del ejercicio
export async function getPersonalRecords(exerciseId: string): Promise<unknown[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT pr.*, mu.abbreviation as unit_abbreviation
     FROM personal_record pr
     LEFT JOIN measurement_unit mu ON pr.record_unit_id = mu.id
     WHERE pr.exercise_id = ?
     ORDER BY pr.achieved_date DESC`,
    [exerciseId]
  );
  return result.values ?? [];
}

// Obtiene las clases que usan un ejercicio
export async function getClassesUsingExercise(exerciseId: string): Promise<{
  id: string;
  name: string;
  date: string | null;
  section_title: string | null;
}[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT DISTINCT ct.id, ct.name, ct.date, cs.visible_title as section_title
     FROM section_exercise se
     JOIN class_section cs ON se.class_section_id = cs.id
     JOIN class_template ct ON cs.class_template_id = ct.id
     WHERE se.exercise_id = ? AND ct.is_active = 1
     ORDER BY ct.date DESC, ct.name ASC`,
    [exerciseId]
  );
  return (result.values ?? []) as { id: string; name: string; date: string | null; section_title: string | null }[];
}

// Obtiene el conteo de uso de un ejercicio (clases, sesiones y récords) para mostrar antes de migrar/eliminar
export async function getUsageCounts(exerciseId: string): Promise<{
  sectionExerciseCount: number;
  sessionResultCount: number;
  personalRecordCount: number;
}> {
  const db = getDatabase();

  async function countRows(table: string): Promise<number> {
    const result = await db.query(`SELECT COUNT(*) as cnt FROM ${table} WHERE exercise_id = ?`, [exerciseId]);
    const row = result.values?.[0];
    return Number(row?.cnt ?? row?.CNT ?? Object.values(row ?? {})[0] ?? 0);
  }

  const [sectionExerciseCount, sessionResultCount, personalRecordCount] = await Promise.all([
    countRows('section_exercise'),
    countRows('session_exercise_result'),
    countRows('personal_record'),
  ]);

  return { sectionExerciseCount, sessionResultCount, personalRecordCount };
}

// Detecta secciones de clase y sesiones donde YA coexisten origen y destino: al migrar, esa
// sección/sesión quedaría con el ejercicio duplicado (dos filas apuntando al mismo destino).
export async function getSharedUsage(sourceId: string, targetId: string): Promise<{
  sharedSections: number;
  sharedSessions: number;
}> {
  const db = getDatabase();

  const sectionsResult = await db.query(
    `SELECT COUNT(DISTINCT cs.id) as cnt
     FROM class_section cs
     WHERE cs.id IN (SELECT class_section_id FROM section_exercise WHERE exercise_id = ?)
       AND cs.id IN (SELECT class_section_id FROM section_exercise WHERE exercise_id = ?)`,
    [sourceId, targetId]
  );
  const sessionsResult = await db.query(
    `SELECT COUNT(DISTINCT ts.id) as cnt
     FROM training_session ts
     WHERE ts.id IN (SELECT training_session_id FROM session_exercise_result WHERE exercise_id = ?)
       AND ts.id IN (SELECT training_session_id FROM session_exercise_result WHERE exercise_id = ?)`,
    [sourceId, targetId]
  );

  const sectionsRow = sectionsResult.values?.[0];
  const sessionsRow = sessionsResult.values?.[0];

  return {
    sharedSections: Number(sectionsRow?.cnt ?? sectionsRow?.CNT ?? Object.values(sectionsRow ?? {})[0] ?? 0),
    sharedSessions: Number(sessionsRow?.cnt ?? sessionsRow?.CNT ?? Object.values(sessionsRow ?? {})[0] ?? 0),
  };
}

// Migra todo el uso de un ejercicio origen hacia un ejercicio destino y elimina el origen.
// Reasigna section_exercise (clases), session_exercise_result (sesiones) y personal_record (récords),
// y borra las relaciones propias del origen (músculos, equipamiento, tags, etc.) antes de eliminarlo.
export async function migrateExercise(sourceId: string, targetId: string): Promise<{
  sectionExerciseCount: number;
  sessionResultCount: number;
  personalRecordCount: number;
}> {
  if (sourceId === targetId) {
    throw new Error('El ejercicio de origen y destino no pueden ser el mismo');
  }

  const db = getDatabase();

  const [sourceResult, targetResult] = await Promise.all([
    db.query('SELECT id FROM exercise WHERE id = ?', [sourceId]),
    db.query('SELECT id FROM exercise WHERE id = ?', [targetId]),
  ]);
  if (!sourceResult.values?.length) throw new Error('El ejercicio de origen no existe');
  if (!targetResult.values?.length) throw new Error('El ejercicio de destino no existe');

  const usage = await getUsageCounts(sourceId);
  const timestamp = now();

  const stmts: { statement: string; values: unknown[] }[] = [
    { statement: `UPDATE section_exercise SET exercise_id = ?, updated_at = ? WHERE exercise_id = ?`, values: [targetId, timestamp, sourceId] },
    { statement: `UPDATE session_exercise_result SET exercise_id = ?, updated_at = ? WHERE exercise_id = ?`, values: [targetId, timestamp, sourceId] },
    { statement: `UPDATE personal_record SET exercise_id = ?, updated_at = ? WHERE exercise_id = ?`, values: [targetId, timestamp, sourceId] },
    { statement: `DELETE FROM exercise_muscle_group WHERE exercise_id = ?`, values: [sourceId] },
    { statement: `DELETE FROM exercise_equipment WHERE exercise_id = ?`, values: [sourceId] },
    { statement: `DELETE FROM exercise_section_type WHERE exercise_id = ?`, values: [sourceId] },
    { statement: `DELETE FROM exercise_unit WHERE exercise_id = ?`, values: [sourceId] },
    { statement: `DELETE FROM exercise_tag WHERE exercise_id = ?`, values: [sourceId] },
    { statement: `DELETE FROM exercise_image WHERE exercise_id = ?`, values: [sourceId] },
    { statement: `DELETE FROM exercise WHERE id = ?`, values: [sourceId] },
  ];

  await db.executeSet(stmts, true);
  await saveDatabase();

  return usage;
}

// Obtiene ejercicios duplicados (mismo nombre normalizado con LOWER(TRIM(name)))
export async function getDuplicateExercises(): Promise<{
  normalized_name: string;
  count: number;
  exercises: { id: string; name: string; is_active: number; created_at: string }[];
}[]> {
  const db = getDatabase();

  // Primero obtener los nombres duplicados
  const dupResult = await db.query(
    `SELECT LOWER(TRIM(name)) as normalized_name, COUNT(*) as cnt
     FROM exercise
     GROUP BY LOWER(TRIM(name))
     HAVING COUNT(*) > 1
     ORDER BY cnt DESC, normalized_name ASC`
  );

  const duplicates = (dupResult.values ?? []) as { normalized_name: string; cnt: number }[];

  // Para cada nombre duplicado, obtener los ejercicios
  const result: { normalized_name: string; count: number; exercises: { id: string; name: string; is_active: number; created_at: string }[] }[] = [];

  for (const dup of duplicates) {
    const exResult = await db.query(
      `SELECT id, name, is_active, created_at
       FROM exercise
       WHERE LOWER(TRIM(name)) = ?
       ORDER BY is_active DESC, created_at ASC`,
      [dup.normalized_name]
    );
    result.push({
      normalized_name: dup.normalized_name,
      count: dup.cnt,
      exercises: (exResult.values ?? []) as { id: string; name: string; is_active: number; created_at: string }[],
    });
  }

  return result;
}

// Ejercicios sin uso: no aparecen en ninguna clase (section_exercise), ni en resultados
// de sesión (session_exercise_result), ni en récords personales (personal_record).
// Incluye los inactivos (is_active = 0), que también son candidatos a limpieza.
// Con `ignoreInactiveClasses` las clases dadas de baja (class_template.is_active = 0) no
// cuentan como uso: un ejercicio que sólo figura ahí también se considera sin uso.
export interface UnusedExerciseRow {
  id: string;
  name: string;
  image_url: string | null;
  is_active: number;
  created_at: string;
  /** Cuántas veces figura en clases inactivas (0 si no está en ninguna) */
  inactive_class_count: number;
}

// Condición de "no está en ninguna clase", según se cuenten o no las clases inactivas
function noClassUsage(ignoreInactiveClasses: boolean): string {
  return ignoreInactiveClasses
    ? `NOT EXISTS (
         SELECT 1 FROM section_exercise se
         JOIN class_section cs ON cs.id = se.class_section_id
         JOIN class_template ct ON ct.id = cs.class_template_id
         WHERE se.exercise_id = {ref} AND ct.is_active = 1)`
    : `NOT EXISTS (SELECT 1 FROM section_exercise se WHERE se.exercise_id = {ref})`;
}

export async function getUnusedExercises(
  ignoreInactiveClasses = false
): Promise<UnusedExerciseRow[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT e.id, e.name, e.image_url, e.is_active, e.created_at,
            (SELECT COUNT(*) FROM section_exercise se
             JOIN class_section cs ON cs.id = se.class_section_id
             JOIN class_template ct ON ct.id = cs.class_template_id
             WHERE se.exercise_id = e.id AND ct.is_active = 0) AS inactive_class_count
     FROM exercise e
     WHERE ${noClassUsage(ignoreInactiveClasses).replace(/\{ref\}/g, 'e.id')}
       AND NOT EXISTS (SELECT 1 FROM session_exercise_result sr WHERE sr.exercise_id = e.id)
       AND NOT EXISTS (SELECT 1 FROM personal_record pr WHERE pr.exercise_id = e.id)
     ORDER BY e.is_active DESC, e.name COLLATE NOCASE ASC`
  );
  return (result.values ?? []).map((row) => ({
    ...(row as UnusedExerciseRow),
    inactive_class_count: Number((row as { inactive_class_count?: number }).inactive_class_count ?? 0),
  }));
}

// Borra físicamente los ejercicios indicados, siempre que sigan sin uso.
// El chequeo de uso se repite dentro del DELETE para no borrar nada que se haya
// empezado a usar entre el análisis y la confirmación. Devuelve cuántos se borraron.
// Con `ignoreInactiveClasses` también borra las filas de section_exercise que esos
// ejercicios tengan en clases inactivas (si no, la FK impediría eliminarlos).
export async function deleteUnusedExercises(
  ids: string[],
  ignoreInactiveClasses = false
): Promise<number> {
  if (ids.length === 0) return 0;

  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  const unusedFilter = `
    id IN (${placeholders})
    AND ${noClassUsage(ignoreInactiveClasses).replace(/\{ref\}/g, 'exercise.id')}
    AND NOT EXISTS (SELECT 1 FROM session_exercise_result sr WHERE sr.exercise_id = exercise.id)
    AND NOT EXISTS (SELECT 1 FROM personal_record pr WHERE pr.exercise_id = exercise.id)`;

  // Los que realmente se van a borrar (los que siguen sin uso)
  const target = await db.query(`SELECT id FROM exercise WHERE ${unusedFilter}`, ids);
  const targetIds = (target.values ?? []).map((row) => (row as { id: string }).id);
  if (targetIds.length === 0) return 0;

  const inList = targetIds.map(() => '?').join(', ');
  const stmts = [
    'exercise_muscle_group', 'exercise_equipment', 'exercise_section_type',
    'exercise_unit', 'exercise_tag', 'exercise_image',
  ].map((table) => ({
    statement: `DELETE FROM ${table} WHERE exercise_id IN (${inList})`,
    values: targetIds,
  }));

  // Sus apariciones en clases inactivas (o huérfanas): sin esto la FK bloquea el borrado
  if (ignoreInactiveClasses) {
    stmts.push({
      statement: `DELETE FROM section_exercise WHERE exercise_id IN (${inList})`,
      values: targetIds,
    });
  }

  stmts.push({ statement: `DELETE FROM exercise WHERE id IN (${inList})`, values: targetIds });

  await db.executeSet(stmts, true);
  await saveDatabase();

  return targetIds.length;
}
