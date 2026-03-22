// Repositorio de plantillas de clase: CRUD completo con secciones y ejercicios

import { getDatabase, saveDatabase } from '../database';
import { generateUUID } from '../../utils/formatters';
import {
  ClassTemplate,
  ClassTemplateFilters,
  ClassTemplateWithSections,
  ClassSection,
  SectionExercise,
} from '../../models/ClassTemplate';

// Retorna la marca de tiempo actual en formato SQLite
function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// Tipos internos para las operaciones de creación (sin campos generados automáticamente)
type SectionExerciseDraftForInsert = Omit<
  SectionExercise,
  'id' | 'created_at' | 'updated_at' | 'exercise_name' | 'exercise_image_path' | 'exercise_image_url' | 'weight_unit_abbreviation' | 'distance_unit_abbreviation'
>;

type SectionDraftForInsert = Omit<
  ClassSection,
  'id' | 'created_at' | 'updated_at' | 'exercises' | 'section_type_name' | 'section_type_color' | 'section_type_icon' | 'work_format_name'
> & { exercises: SectionExerciseDraftForInsert[] };

// Obtiene todas las plantillas activas con conteo de secciones y ejercicios
export async function getAll(filters?: ClassTemplateFilters): Promise<ClassTemplate[]> {
  const db = getDatabase();

  let query = `
    SELECT ct.*,
      COUNT(DISTINCT cs.id) as section_count,
      COUNT(DISTINCT se.id) as exercise_count
    FROM class_template ct
    LEFT JOIN class_section cs ON cs.class_template_id = ct.id
    LEFT JOIN section_exercise se ON se.class_section_id = cs.id
    WHERE ct.is_active = 1
  `;

  const params: unknown[] = [];

  if (filters?.search) {
    query += ` AND (ct.name LIKE ? OR ct.objective LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters?.from_date) {
    query += ` AND ct.date >= ?`;
    params.push(filters.from_date);
  }

  if (filters?.to_date) {
    query += ` AND ct.date <= ?`;
    params.push(filters.to_date);
  }

  if (filters?.is_favorite) {
    query += ` AND ct.is_favorite = 1`;
  }

  // NULLS LAST simulado en SQLite
  query += `
    GROUP BY ct.id
    ORDER BY
      CASE WHEN ct.date IS NULL THEN 1 ELSE 0 END,
      ct.date DESC,
      ct.created_at DESC
  `;

  const result = await db.query(query, params);
  return (result.values ?? []) as ClassTemplate[];
}

// Carga completa de una plantilla con todas sus secciones y ejercicios
export async function getById(id: string): Promise<ClassTemplateWithSections | null> {
  const db = getDatabase();

  // Cargar la plantilla principal
  const templateResult = await db.query(
    `SELECT * FROM class_template WHERE id = ? AND is_active = 1`,
    [id]
  );

  const templateRows = templateResult.values ?? [];
  if (templateRows.length === 0) return null;

  const template = templateRows[0] as ClassTemplate;

  // Cargar secciones con sus catálogos relacionados
  const sectionsResult = await db.query(
    `SELECT cs.*,
      st.name as section_type_name,
      st.color as section_type_color,
      st.icon as section_type_icon,
      wf.name as work_format_name
    FROM class_section cs
    LEFT JOIN section_type st ON cs.section_type_id = st.id
    LEFT JOIN work_format wf ON cs.work_format_id = wf.id
    WHERE cs.class_template_id = ?
    ORDER BY cs.sort_order`,
    [id]
  );

  const sectionRows = (sectionsResult.values ?? []) as ClassSection[];

  // Cargar ejercicios de cada sección
  const sections: ClassSection[] = [];
  for (const section of sectionRows) {
    const exercisesResult = await db.query(
      `SELECT se.*,
        e.name as exercise_name,
        e.image_path as exercise_image_path,
        e.image_url as exercise_image_url,
        wu.abbreviation as weight_unit_abbreviation,
        du.abbreviation as distance_unit_abbreviation
      FROM section_exercise se
      JOIN exercise e ON se.exercise_id = e.id
      LEFT JOIN measurement_unit wu ON se.planned_weight_unit_id = wu.id
      LEFT JOIN measurement_unit du ON se.planned_distance_unit_id = du.id
      WHERE se.class_section_id = ?
      ORDER BY se.sort_order`,
      [section.id]
    );

    sections.push({
      ...section,
      exercises: (exercisesResult.values ?? []) as SectionExercise[],
    });
  }

  return { ...template, sections };
}

// Crea una plantilla nueva con secciones y ejercicios en una transacción
export async function create(
  template: Omit<ClassTemplate, 'id' | 'created_at' | 'updated_at' | 'section_count' | 'exercise_count'>,
  sections: SectionDraftForInsert[]
): Promise<string> {
  const db = getDatabase();
  const templateId = generateUUID();
  const timestamp = now();

  await db.beginTransaction();
  try {
    // Insertar la plantilla principal
    await db.run(
      `INSERT INTO class_template
        (id, date, name, objective, general_notes, estimated_duration_minutes, is_favorite, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        templateId,
        template.date ?? null,
        template.name,
        template.objective ?? null,
        template.general_notes ?? null,
        template.estimated_duration_minutes ?? null,
        template.is_favorite,
        template.is_active,
        timestamp,
        timestamp,
      ]
    );

    // Insertar secciones y ejercicios
    for (const section of sections) {
      const sectionId = generateUUID();

      await db.run(
        `INSERT INTO class_section
          (id, class_template_id, section_type_id, work_format_id, sort_order,
           visible_title, general_description, time_cap_seconds, total_rounds,
           rest_between_rounds_seconds, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sectionId,
          templateId,
          section.section_type_id,
          section.work_format_id ?? null,
          section.sort_order,
          section.visible_title ?? null,
          section.general_description ?? null,
          section.time_cap_seconds ?? null,
          section.total_rounds ?? null,
          section.rest_between_rounds_seconds ?? null,
          section.notes ?? null,
          timestamp,
          timestamp,
        ]
      );

      // Insertar ejercicios de la sección
      for (const exercise of section.exercises) {
        await db.run(
          `INSERT INTO section_exercise
            (id, class_section_id, exercise_id, sort_order, coach_notes,
             planned_repetitions, planned_weight_value, planned_weight_unit_id,
             planned_time_seconds, planned_distance_value, planned_distance_unit_id,
             planned_calories, planned_rest_seconds, planned_rounds, rm_percentage,
             suggested_scaling, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateUUID(),
            sectionId,
            exercise.exercise_id,
            exercise.sort_order,
            exercise.coach_notes ?? null,
            exercise.planned_repetitions ?? null,
            exercise.planned_weight_value ?? null,
            exercise.planned_weight_unit_id ?? null,
            exercise.planned_time_seconds ?? null,
            exercise.planned_distance_value ?? null,
            exercise.planned_distance_unit_id ?? null,
            exercise.planned_calories ?? null,
            exercise.planned_rest_seconds ?? null,
            exercise.planned_rounds ?? null,
            exercise.rm_percentage ?? null,
            exercise.suggested_scaling ?? null,
            exercise.notes ?? null,
            timestamp,
            timestamp,
          ]
        );
      }
    }

    await db.commitTransaction();
    await saveDatabase();
    return templateId;
  } catch (err) {
    // Solo intentar rollback si hay una transacción activa
    try {
      const isTransResult = await db.isTransactionActive();
      if (isTransResult.result) {
        await db.rollbackTransaction();
      }
    } catch (rollbackErr) {
      console.error('Error al intentar rollback:', rollbackErr);
    }
    throw err;
  }
}

// Actualiza una plantilla reemplazando todas sus secciones y ejercicios en una transacción
export async function update(
  id: string,
  template: Partial<ClassTemplate>,
  sections: SectionDraftForInsert[]
): Promise<void> {
  const db = getDatabase();
  const timestamp = now();

  await db.beginTransaction();
  try {
    // Actualizar los campos de la plantilla principal
    const fields: Record<string, unknown> = {
      date: template.date ?? null,
      name: template.name,
      objective: template.objective ?? null,
      general_notes: template.general_notes ?? null,
      estimated_duration_minutes: template.estimated_duration_minutes ?? null,
      is_favorite: template.is_favorite,
      updated_at: timestamp,
    };

    // Remover campos undefined para no escribir null donde no aplica
    const definedFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        definedFields[key] = value;
      }
    }

    const sets = Object.keys(definedFields)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = [...Object.values(definedFields), id];

    await db.run(`UPDATE class_template SET ${sets} WHERE id = ?`, values);

    // Eliminar todos los ejercicios de todas las secciones de esta plantilla
    await db.run(
      `DELETE FROM section_exercise WHERE class_section_id IN (
        SELECT id FROM class_section WHERE class_template_id = ?
      )`,
      [id]
    );

    // Eliminar todas las secciones
    await db.run(`DELETE FROM class_section WHERE class_template_id = ?`, [id]);

    // Reinsertar secciones y ejercicios
    for (const section of sections) {
      const sectionId = generateUUID();

      await db.run(
        `INSERT INTO class_section
          (id, class_template_id, section_type_id, work_format_id, sort_order,
           visible_title, general_description, time_cap_seconds, total_rounds,
           rest_between_rounds_seconds, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sectionId,
          id,
          section.section_type_id,
          section.work_format_id ?? null,
          section.sort_order,
          section.visible_title ?? null,
          section.general_description ?? null,
          section.time_cap_seconds ?? null,
          section.total_rounds ?? null,
          section.rest_between_rounds_seconds ?? null,
          section.notes ?? null,
          timestamp,
          timestamp,
        ]
      );

      for (const exercise of section.exercises) {
        await db.run(
          `INSERT INTO section_exercise
            (id, class_section_id, exercise_id, sort_order, coach_notes,
             planned_repetitions, planned_weight_value, planned_weight_unit_id,
             planned_time_seconds, planned_distance_value, planned_distance_unit_id,
             planned_calories, planned_rest_seconds, planned_rounds, rm_percentage,
             suggested_scaling, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateUUID(),
            sectionId,
            exercise.exercise_id,
            exercise.sort_order,
            exercise.coach_notes ?? null,
            exercise.planned_repetitions ?? null,
            exercise.planned_weight_value ?? null,
            exercise.planned_weight_unit_id ?? null,
            exercise.planned_time_seconds ?? null,
            exercise.planned_distance_value ?? null,
            exercise.planned_distance_unit_id ?? null,
            exercise.planned_calories ?? null,
            exercise.planned_rest_seconds ?? null,
            exercise.planned_rounds ?? null,
            exercise.rm_percentage ?? null,
            exercise.suggested_scaling ?? null,
            exercise.notes ?? null,
            timestamp,
            timestamp,
          ]
        );
      }
    }

    await db.commitTransaction();
    await saveDatabase();
  } catch (err) {
    try {
      const isTransResult = await db.isTransactionActive();
      if (isTransResult.result) {
        await db.rollbackTransaction();
      }
    } catch (rollbackErr) {
      console.error('Error al intentar rollback:', rollbackErr);
    }
    throw err;
  }
}

// Alterna el estado de favorita de una plantilla
export async function toggleFavorite(id: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE class_template SET is_favorite = (1 - is_favorite), updated_at = ? WHERE id = ?`,
    [now(), id]
  );
}

// Duplica una plantilla completa con nuevos UUIDs y agrega "(copia)" al nombre
export async function duplicate(id: string): Promise<string> {
  const original = await getById(id);
  if (!original) throw new Error('Plantilla no encontrada');

  const db = getDatabase();
  const newTemplateId = generateUUID();
  const timestamp = now();

  await db.beginTransaction();
  try {
    // Insertar copia de la plantilla con nombre modificado
    await db.run(
      `INSERT INTO class_template
        (id, date, name, objective, general_notes, estimated_duration_minutes, is_favorite, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTemplateId,
        original.date ?? null,
        `${original.name} (copia)`,
        original.objective ?? null,
        original.general_notes ?? null,
        original.estimated_duration_minutes ?? null,
        0,  // la copia no hereda el estado de favorita
        1,
        timestamp,
        timestamp,
      ]
    );

    // Duplicar secciones con nuevos UUIDs
    for (const section of original.sections) {
      const newSectionId = generateUUID();

      await db.run(
        `INSERT INTO class_section
          (id, class_template_id, section_type_id, work_format_id, sort_order,
           visible_title, general_description, time_cap_seconds, total_rounds,
           rest_between_rounds_seconds, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newSectionId,
          newTemplateId,
          section.section_type_id,
          section.work_format_id ?? null,
          section.sort_order,
          section.visible_title ?? null,
          section.general_description ?? null,
          section.time_cap_seconds ?? null,
          section.total_rounds ?? null,
          section.rest_between_rounds_seconds ?? null,
          section.notes ?? null,
          timestamp,
          timestamp,
        ]
      );

      // Duplicar ejercicios de la sección
      for (const exercise of section.exercises) {
        await db.run(
          `INSERT INTO section_exercise
            (id, class_section_id, exercise_id, sort_order, coach_notes,
             planned_repetitions, planned_weight_value, planned_weight_unit_id,
             planned_time_seconds, planned_distance_value, planned_distance_unit_id,
             planned_calories, planned_rest_seconds, planned_rounds, rm_percentage,
             suggested_scaling, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateUUID(),
            newSectionId,
            exercise.exercise_id,
            exercise.sort_order,
            exercise.coach_notes ?? null,
            exercise.planned_repetitions ?? null,
            exercise.planned_weight_value ?? null,
            exercise.planned_weight_unit_id ?? null,
            exercise.planned_time_seconds ?? null,
            exercise.planned_distance_value ?? null,
            exercise.planned_distance_unit_id ?? null,
            exercise.planned_calories ?? null,
            exercise.planned_rest_seconds ?? null,
            exercise.planned_rounds ?? null,
            exercise.rm_percentage ?? null,
            exercise.suggested_scaling ?? null,
            exercise.notes ?? null,
            timestamp,
            timestamp,
          ]
        );
      }
    }

    await db.commitTransaction();
    await saveDatabase();
    return newTemplateId;
  } catch (err) {
    try {
      const isTransResult = await db.isTransactionActive();
      if (isTransResult.result) {
        await db.rollbackTransaction();
      }
    } catch (rollbackErr) {
      console.error('Error al intentar rollback:', rollbackErr);
    }
    throw err;
  }
}

// Borrado lógico: marca la plantilla como inactiva
export async function softDelete(id: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE class_template SET is_active = 0, updated_at = ? WHERE id = ?`,
    [now(), id]
  );
  await saveDatabase();
}

// Obtiene plantillas dentro de un rango de fechas (para vista calendario)
export async function getByDateRange(from: string, to: string): Promise<ClassTemplate[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT ct.*,
      COUNT(DISTINCT cs.id) as section_count,
      COUNT(DISTINCT se.id) as exercise_count
    FROM class_template ct
    LEFT JOIN class_section cs ON cs.class_template_id = ct.id
    LEFT JOIN section_exercise se ON se.class_section_id = cs.id
    WHERE ct.is_active = 1
      AND ct.date >= ?
      AND ct.date <= ?
    GROUP BY ct.id
    ORDER BY ct.date ASC`,
    [from, to]
  );
  return (result.values ?? []) as ClassTemplate[];
}
