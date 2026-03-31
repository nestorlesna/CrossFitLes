// Servicio para exportar e importar clases individuales (para compartir entre usuarios)
// El ZIP resultante incluye la clase, sus ejercicios, catálogos necesarios y media.
// Al importar, se hace un merge: reutiliza catálogos y ejercicios existentes por nombre,
// y siempre crea la clase como nueva (sin sobrescribir datos del destinatario).

import { Capacitor } from '@capacitor/core';
import JSZip from 'jszip';
import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';
import { APP_VERSION } from '../utils/constants';

const SHARE_TYPE = 'class-share';

interface ClassShareJson {
  meta: {
    app: string;
    type: string;
    version: string;
    exportDate: string;
    classCount: number;
  };
  catalogs: {
    muscle_group: Record<string, unknown>[];
    equipment: Record<string, unknown>[];
    measurement_unit: Record<string, unknown>[];
    difficulty_level: Record<string, unknown>[];
    tag: Record<string, unknown>[];
    section_type: Record<string, unknown>[];
    work_format: Record<string, unknown>[];
  };
  exercises: Record<string, unknown>[];
  exercise_relations: {
    exercise_muscle_group: Record<string, unknown>[];
    exercise_equipment: Record<string, unknown>[];
    exercise_section_type: Record<string, unknown>[];
    exercise_unit: Record<string, unknown>[];
    exercise_tag: Record<string, unknown>[];
  };
  classes: Record<string, unknown>[];
  class_sections: Record<string, unknown>[];
  section_exercises: Record<string, unknown>[];
}

// ─── EXPORTACIÓN ────────────────────────────────────────────────────────────

/**
 * Exporta las clases seleccionadas (con ejercicios, catálogos y media) en un ZIP.
 */
export async function exportClasses(classIds: string[]): Promise<void> {
  const db = await openDatabase();
  const zip = new JSZip();

  if (classIds.length === 0) throw new Error('No se seleccionaron clases para exportar.');

  // 1. Cargar plantillas de clase
  const classPlaceholders = classIds.map(() => '?').join(', ');
  const classResult = await db.query(
    `SELECT * FROM class_template WHERE id IN (${classPlaceholders}) AND is_active = 1`,
    classIds
  );
  const classes = (classResult.values ?? []) as Record<string, unknown>[];
  if (classes.length === 0) throw new Error('No se encontraron las clases seleccionadas.');

  // 2. Cargar secciones
  const sectionsResult = await db.query(
    `SELECT * FROM class_section WHERE class_template_id IN (${classPlaceholders})`,
    classIds
  );
  const classSections = (sectionsResult.values ?? []) as Record<string, unknown>[];

  // 3. Cargar section_exercises
  const sectionIds = classSections.map(s => s.id as string);
  let sectionExercises: Record<string, unknown>[] = [];
  if (sectionIds.length > 0) {
    const sePlaceholders = sectionIds.map(() => '?').join(', ');
    const seResult = await db.query(
      `SELECT * FROM section_exercise WHERE class_section_id IN (${sePlaceholders})`,
      sectionIds
    );
    sectionExercises = (seResult.values ?? []) as Record<string, unknown>[];
  }

  // 4. IDs únicos de ejercicios
  const exerciseIds = [...new Set(sectionExercises.map(se => se.exercise_id as string))];

  let exercises: Record<string, unknown>[] = [];
  let exMuscleGroups: Record<string, unknown>[] = [];
  let exEquipment: Record<string, unknown>[] = [];
  let exSectionTypes: Record<string, unknown>[] = [];
  let exUnits: Record<string, unknown>[] = [];
  let exTags: Record<string, unknown>[] = [];

  // Colección de IDs de catálogo necesarios
  const catalogIds = {
    muscle_group: new Set<string>(),
    equipment: new Set<string>(),
    measurement_unit: new Set<string>(),
    difficulty_level: new Set<string>(),
    tag: new Set<string>(),
    section_type: new Set<string>(),
    work_format: new Set<string>(),
  };

  if (exerciseIds.length > 0) {
    const exPlaceholders = exerciseIds.map(() => '?').join(', ');

    const exResult = await db.query(
      `SELECT * FROM exercise WHERE id IN (${exPlaceholders})`,
      exerciseIds
    );
    exercises = (exResult.values ?? []) as Record<string, unknown>[];

    // Recolectar IDs de catálogos desde ejercicios
    exercises.forEach(ex => {
      if (ex.difficulty_level_id) catalogIds.difficulty_level.add(ex.difficulty_level_id as string);
      if (ex.primary_muscle_group_id) catalogIds.muscle_group.add(ex.primary_muscle_group_id as string);
    });

    // Relaciones de ejercicios
    const emgResult = await db.query(
      `SELECT * FROM exercise_muscle_group WHERE exercise_id IN (${exPlaceholders})`,
      exerciseIds
    );
    exMuscleGroups = (emgResult.values ?? []) as Record<string, unknown>[];
    exMuscleGroups.forEach(r => catalogIds.muscle_group.add(r.muscle_group_id as string));

    const eeResult = await db.query(
      `SELECT * FROM exercise_equipment WHERE exercise_id IN (${exPlaceholders})`,
      exerciseIds
    );
    exEquipment = (eeResult.values ?? []) as Record<string, unknown>[];
    exEquipment.forEach(r => catalogIds.equipment.add(r.equipment_id as string));

    const estResult = await db.query(
      `SELECT * FROM exercise_section_type WHERE exercise_id IN (${exPlaceholders})`,
      exerciseIds
    );
    exSectionTypes = (estResult.values ?? []) as Record<string, unknown>[];
    exSectionTypes.forEach(r => catalogIds.section_type.add(r.section_type_id as string));

    const euResult = await db.query(
      `SELECT * FROM exercise_unit WHERE exercise_id IN (${exPlaceholders})`,
      exerciseIds
    );
    exUnits = (euResult.values ?? []) as Record<string, unknown>[];
    exUnits.forEach(r => catalogIds.measurement_unit.add(r.measurement_unit_id as string));

    const etResult = await db.query(
      `SELECT * FROM exercise_tag WHERE exercise_id IN (${exPlaceholders})`,
      exerciseIds
    );
    exTags = (etResult.values ?? []) as Record<string, unknown>[];
    exTags.forEach(r => catalogIds.tag.add(r.tag_id as string));
  }

  // IDs de catálogo desde secciones
  classSections.forEach(s => {
    if (s.section_type_id) catalogIds.section_type.add(s.section_type_id as string);
    if (s.work_format_id) catalogIds.work_format.add(s.work_format_id as string);
  });

  // IDs de unidades desde section_exercises
  sectionExercises.forEach(se => {
    if (se.planned_weight_unit_id) catalogIds.measurement_unit.add(se.planned_weight_unit_id as string);
    if (se.planned_distance_unit_id) catalogIds.measurement_unit.add(se.planned_distance_unit_id as string);
  });

  // 5. Cargar datos de catálogos
  async function loadCatalogItems(table: string, ids: Set<string>): Promise<Record<string, unknown>[]> {
    if (ids.size === 0) return [];
    const ph = Array.from(ids).map(() => '?').join(', ');
    const res = await db.query(`SELECT * FROM ${table} WHERE id IN (${ph})`, Array.from(ids));
    return (res.values ?? []) as Record<string, unknown>[];
  }

  const catalogs = {
    muscle_group: await loadCatalogItems('muscle_group', catalogIds.muscle_group),
    equipment: await loadCatalogItems('equipment', catalogIds.equipment),
    measurement_unit: await loadCatalogItems('measurement_unit', catalogIds.measurement_unit),
    difficulty_level: await loadCatalogItems('difficulty_level', catalogIds.difficulty_level),
    tag: await loadCatalogItems('tag', catalogIds.tag),
    section_type: await loadCatalogItems('section_type', catalogIds.section_type),
    work_format: await loadCatalogItems('work_format', catalogIds.work_format),
  };

  // 6. Construir el JSON
  const shareJson: ClassShareJson = {
    meta: {
      app: 'CrossFit Session Tracker',
      type: SHARE_TYPE,
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      classCount: classes.length,
    },
    catalogs,
    exercises,
    exercise_relations: {
      exercise_muscle_group: exMuscleGroups,
      exercise_equipment: exEquipment,
      exercise_section_type: exSectionTypes,
      exercise_unit: exUnits,
      exercise_tag: exTags,
    },
    classes,
    class_sections: classSections,
    section_exercises: sectionExercises,
  };

  zip.file('class-share.json', JSON.stringify(shareJson, null, 2));

  // 7. Incluir media de ejercicios (solo imágenes subidas por el usuario)
  const mediaFolder = zip.folder('media');

  if (Capacitor.getPlatform() === 'web') {
    const prefix = 'media_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`${prefix}exercises/`)) continue;
      const mediaPath = key.replace(prefix, '');
      const isUsed = exercises.some(
        ex => ex.image_url === mediaPath || ex.image_path === mediaPath
      );
      if (!isUsed) continue;
      const dataUrl = localStorage.getItem(key);
      if (dataUrl) {
        const base64 = dataUrl.split(',')[1];
        mediaFolder?.file(mediaPath, base64, { base64: true });
      }
    }
  } else {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    for (const ex of exercises) {
      const path = (ex.image_url as string) || (ex.image_path as string) || '';
      if (!path || path.startsWith('/img/') || path.startsWith('http') || path.startsWith('data:')) continue;
      try {
        const fileData = await Filesystem.readFile({
          path: `crossfit-tracker/media/${path}`,
          directory: Directory.Data,
        });
        mediaFolder?.file(path, fileData.data as string, { base64: true });
      } catch (e) {
        console.warn(`[ClassShare] No se pudo incluir media: ${path}`, e);
      }
    }
  }

  // 8. Generar y descargar el ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const safeNames = classes
    .map(c => c.name as string)
    .join('_')
    .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40);
  const fileName = `clase-${safeNames}-${formatDateForFile(new Date())}.zip`;

  if (Capacitor.getPlatform() === 'web') {
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const reader = new FileReader();
    const base64Promise = new Promise<string>(resolve => {
      reader.onloadend = () => {
        resolve((reader.result as string).split(',')[1]);
      };
      reader.readAsDataURL(content);
    });

    const base64Data = await base64Promise;
    const cachePath = `backups/${fileName}`;

    await Filesystem.writeFile({
      path: cachePath,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });

    const uriResult = await Filesystem.getUri({
      path: cachePath,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Clase CrossFit',
      text: `Clase${classes.length > 1 ? 's' : ''}: ${classes.map(c => c.name).join(', ')}`,
      url: uriResult.uri,
      dialogTitle: 'Compartir Clase',
    });
  }
}

// ─── IMPORTACIÓN ────────────────────────────────────────────────────────────

export interface ClassImportResult {
  classesImported: number;
  exercisesCreated: number;
  exercisesReused: number;
}

/**
 * Importa clases desde un ZIP generado por exportClasses().
 * Patrón: primero todas las lecturas (queries) para construir el idMap y los
 * statements; luego un único executeSet(stmts, true) que maneja la transacción
 * internamente — mismo patrón que backupService y classTemplateRepo.
 */
export async function importClassFromZip(zipFile: Blob): Promise<ClassImportResult> {
  const zip = await JSZip.loadAsync(zipFile);

  const jsonFile = zip.file('class-share.json');
  if (!jsonFile) throw new Error('El archivo ZIP no es una exportación de clase válida (falta class-share.json).');

  const share: ClassShareJson = JSON.parse(await jsonFile.async('string'));

  if (share.meta?.app !== 'CrossFit Session Tracker' || share.meta?.type !== SHARE_TYPE) {
    throw new Error('El archivo no es una exportación de clase de CrossFit Session Tracker.');
  }

  const db = await openDatabase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // idMap: export_id → local_id (pre-calculado en la fase de lectura)
  const idMap = new Map<string, string>();
  // Statements acumulados para el executeSet final
  const stmts: { statement: string; values: unknown[] }[] = [];

  let classesImported = 0;
  let exercisesCreated = 0;
  let exercisesReused = 0;

  // ── FASE 1: LECTURAS — construir idMap y acumular INSERTs ────────────────

  // 1a. Catálogos
  const catalogTables = [
    'muscle_group', 'equipment', 'measurement_unit',
    'difficulty_level', 'tag', 'section_type', 'work_format',
  ] as const;

  for (const table of catalogTables) {
    for (const row of share.catalogs[table] ?? []) {
      const exportId = row.id as string;
      const found = await db.query(
        `SELECT id FROM ${table} WHERE LOWER(name) = LOWER(?) LIMIT 1`,
        [row.name as string]
      );
      if (found.values && found.values.length > 0) {
        idMap.set(exportId, found.values[0].id as string);
      } else {
        const newId = generateUUID();
        idMap.set(exportId, newId);
        const keys = Object.keys(row).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
        stmts.push({
          statement: `INSERT INTO ${table} (id, ${keys.join(', ')}, created_at, updated_at)
                      VALUES (?, ${keys.map(() => '?').join(', ')}, ?, ?)`,
          values: [newId, ...keys.map(k => row[k]), timestamp, timestamp],
        });
      }
    }
  }

  // 1b. Ejercicios
  for (const ex of share.exercises) {
    const exportId = ex.id as string;
    const found = await db.query(
      `SELECT id FROM exercise WHERE LOWER(name) = LOWER(?) AND is_active = 1 LIMIT 1`,
      [ex.name as string]
    );
    if (found.values && found.values.length > 0) {
      idMap.set(exportId, found.values[0].id as string);
      exercisesReused++;
    } else {
      const newId = generateUUID();
      idMap.set(exportId, newId);
      stmts.push({
        statement: `INSERT INTO exercise
          (id, name, description, technical_notes, difficulty_level_id, primary_muscle_group_id,
           image_path, image_url, video_path, video_long_path, is_compound, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        values: [
          newId, ex.name,
          ex.description ?? null, ex.technical_notes ?? null,
          ex.difficulty_level_id ? (idMap.get(ex.difficulty_level_id as string) ?? null) : null,
          ex.primary_muscle_group_id ? (idMap.get(ex.primary_muscle_group_id as string) ?? null) : null,
          ex.image_path ?? null, ex.image_url ?? null,
          ex.video_path ?? null, ex.video_long_path ?? null,
          ex.is_compound ?? 0, timestamp, timestamp,
        ],
      });
      // Relaciones
      const rels = share.exercise_relations;
      for (const r of rels.exercise_muscle_group.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.muscle_group_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_muscle_group (exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?)`, values: [newId, lid, r.is_primary ?? 0] });
      }
      for (const r of rels.exercise_equipment.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.equipment_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_equipment (exercise_id, equipment_id, is_required) VALUES (?, ?, ?)`, values: [newId, lid, r.is_required ?? 0] });
      }
      for (const r of rels.exercise_section_type.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.section_type_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_section_type (exercise_id, section_type_id) VALUES (?, ?)`, values: [newId, lid] });
      }
      for (const r of rels.exercise_unit.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.measurement_unit_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_unit (exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?)`, values: [newId, lid, r.is_default ?? 0] });
      }
      for (const r of rels.exercise_tag.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.tag_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_tag (exercise_id, tag_id) VALUES (?, ?)`, values: [newId, lid] });
      }
      exercisesCreated++;
    }
  }

  // 1c. Clases, secciones y ejercicios de sección
  for (const cls of share.classes) {
    const exportClassId = cls.id as string;
    const newClassId = generateUUID();
    idMap.set(exportClassId, newClassId);
    stmts.push({
      statement: `INSERT INTO class_template
        (id, date, name, objective, general_notes, estimated_duration_minutes, is_favorite, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`,
      values: [newClassId, cls.date ?? null, cls.name, cls.objective ?? null, cls.general_notes ?? null, cls.estimated_duration_minutes ?? null, timestamp, timestamp],
    });

    for (const section of share.class_sections.filter(s => s.class_template_id === exportClassId)) {
      const exportSectionId = section.id as string;
      const newSectionId = generateUUID();
      idMap.set(exportSectionId, newSectionId);
      stmts.push({
        statement: `INSERT INTO class_section
          (id, class_template_id, section_type_id, work_format_id, sort_order,
           visible_title, general_description, time_cap_seconds, total_rounds,
           rest_between_rounds_seconds, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [
          newSectionId, newClassId,
          section.section_type_id ? (idMap.get(section.section_type_id as string) ?? null) : null,
          section.work_format_id ? (idMap.get(section.work_format_id as string) ?? null) : null,
          section.sort_order,
          section.visible_title ?? null, section.general_description ?? null,
          section.time_cap_seconds ?? null, section.total_rounds ?? null,
          section.rest_between_rounds_seconds ?? null, section.notes ?? null,
          timestamp, timestamp,
        ],
      });

      for (const se of share.section_exercises.filter(se => se.class_section_id === exportSectionId)) {
        const localExId = idMap.get(se.exercise_id as string);
        if (!localExId) continue;
        stmts.push({
          statement: `INSERT INTO section_exercise
            (id, class_section_id, exercise_id, sort_order, coach_notes,
             planned_repetitions, planned_weight_value, planned_weight_unit_id,
             planned_time_seconds, planned_distance_value, planned_distance_unit_id,
             planned_calories, planned_rest_seconds, planned_rounds, rm_percentage,
             suggested_scaling, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values: [
            generateUUID(), newSectionId, localExId, se.sort_order,
            se.coach_notes ?? null, se.planned_repetitions ?? null,
            se.planned_weight_value ?? null,
            se.planned_weight_unit_id ? (idMap.get(se.planned_weight_unit_id as string) ?? null) : null,
            se.planned_time_seconds ?? null, se.planned_distance_value ?? null,
            se.planned_distance_unit_id ? (idMap.get(se.planned_distance_unit_id as string) ?? null) : null,
            se.planned_calories ?? null, se.planned_rest_seconds ?? null,
            se.planned_rounds ?? null, se.rm_percentage ?? null,
            se.suggested_scaling ?? null, se.notes ?? null,
            timestamp, timestamp,
          ],
        });
      }
    }
    classesImported++;
  }

  // ── FASE 2: ESCRITURA — un único executeSet atómico ──────────────────────
  if (stmts.length > 0) {
    await db.execute('PRAGMA foreign_keys = OFF;');
    try {
      await db.executeSet(stmts, true);
    } finally {
      await db.execute('PRAGMA foreign_keys = ON;');
    }
  }

  await restoreMedia(zip);
  await saveDatabase();
  return { classesImported, exercisesCreated, exercisesReused };
}

// ─── EXPORTACIÓN DE EJERCICIOS ───────────────────────────────────────────────

const EXERCISE_SHARE_TYPE = 'exercise-share';

interface ExerciseShareJson {
  meta: {
    app: string;
    type: string;
    version: string;
    exportDate: string;
    exerciseCount: number;
  };
  catalogs: {
    muscle_group: Record<string, unknown>[];
    equipment: Record<string, unknown>[];
    measurement_unit: Record<string, unknown>[];
    difficulty_level: Record<string, unknown>[];
    tag: Record<string, unknown>[];
    section_type: Record<string, unknown>[];
  };
  exercises: Record<string, unknown>[];
  exercise_relations: {
    exercise_muscle_group: Record<string, unknown>[];
    exercise_equipment: Record<string, unknown>[];
    exercise_section_type: Record<string, unknown>[];
    exercise_unit: Record<string, unknown>[];
    exercise_tag: Record<string, unknown>[];
  };
}

/**
 * Exporta los ejercicios seleccionados con sus catálogos y media en un ZIP.
 */
export async function exportExercises(exerciseIds: string[]): Promise<void> {
  const db = await openDatabase();
  const zip = new JSZip();

  if (exerciseIds.length === 0) throw new Error('No se seleccionaron ejercicios para exportar.');

  // 1. Cargar ejercicios
  const exPlaceholders = exerciseIds.map(() => '?').join(', ');
  const exResult = await db.query(
    `SELECT * FROM exercise WHERE id IN (${exPlaceholders}) AND is_active = 1`,
    exerciseIds
  );
  const exercises = (exResult.values ?? []) as Record<string, unknown>[];
  if (exercises.length === 0) throw new Error('No se encontraron los ejercicios seleccionados.');

  // 2. Recolectar IDs de catálogo necesarios
  const catalogIds = {
    muscle_group: new Set<string>(),
    equipment: new Set<string>(),
    measurement_unit: new Set<string>(),
    difficulty_level: new Set<string>(),
    tag: new Set<string>(),
    section_type: new Set<string>(),
  };

  exercises.forEach(ex => {
    if (ex.difficulty_level_id) catalogIds.difficulty_level.add(ex.difficulty_level_id as string);
    if (ex.primary_muscle_group_id) catalogIds.muscle_group.add(ex.primary_muscle_group_id as string);
  });

  // 3. Cargar relaciones de ejercicios
  const emgResult = await db.query(`SELECT * FROM exercise_muscle_group WHERE exercise_id IN (${exPlaceholders})`, exerciseIds);
  const exMuscleGroups = (emgResult.values ?? []) as Record<string, unknown>[];
  exMuscleGroups.forEach(r => catalogIds.muscle_group.add(r.muscle_group_id as string));

  const eeResult = await db.query(`SELECT * FROM exercise_equipment WHERE exercise_id IN (${exPlaceholders})`, exerciseIds);
  const exEquipment = (eeResult.values ?? []) as Record<string, unknown>[];
  exEquipment.forEach(r => catalogIds.equipment.add(r.equipment_id as string));

  const estResult = await db.query(`SELECT * FROM exercise_section_type WHERE exercise_id IN (${exPlaceholders})`, exerciseIds);
  const exSectionTypes = (estResult.values ?? []) as Record<string, unknown>[];
  exSectionTypes.forEach(r => catalogIds.section_type.add(r.section_type_id as string));

  const euResult = await db.query(`SELECT * FROM exercise_unit WHERE exercise_id IN (${exPlaceholders})`, exerciseIds);
  const exUnits = (euResult.values ?? []) as Record<string, unknown>[];
  exUnits.forEach(r => catalogIds.measurement_unit.add(r.measurement_unit_id as string));

  const etResult = await db.query(`SELECT * FROM exercise_tag WHERE exercise_id IN (${exPlaceholders})`, exerciseIds);
  const exTags = (etResult.values ?? []) as Record<string, unknown>[];
  exTags.forEach(r => catalogIds.tag.add(r.tag_id as string));

  // 4. Cargar datos de catálogos
  async function loadItems(table: string, ids: Set<string>): Promise<Record<string, unknown>[]> {
    if (ids.size === 0) return [];
    const ph = Array.from(ids).map(() => '?').join(', ');
    const res = await db.query(`SELECT * FROM ${table} WHERE id IN (${ph})`, Array.from(ids));
    return (res.values ?? []) as Record<string, unknown>[];
  }

  const catalogs = {
    muscle_group: await loadItems('muscle_group', catalogIds.muscle_group),
    equipment: await loadItems('equipment', catalogIds.equipment),
    measurement_unit: await loadItems('measurement_unit', catalogIds.measurement_unit),
    difficulty_level: await loadItems('difficulty_level', catalogIds.difficulty_level),
    tag: await loadItems('tag', catalogIds.tag),
    section_type: await loadItems('section_type', catalogIds.section_type),
  };

  // 5. Construir JSON
  const shareJson: ExerciseShareJson = {
    meta: {
      app: 'CrossFit Session Tracker',
      type: EXERCISE_SHARE_TYPE,
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      exerciseCount: exercises.length,
    },
    catalogs,
    exercises,
    exercise_relations: {
      exercise_muscle_group: exMuscleGroups,
      exercise_equipment: exEquipment,
      exercise_section_type: exSectionTypes,
      exercise_unit: exUnits,
      exercise_tag: exTags,
    },
  };

  zip.file('exercise-share.json', JSON.stringify(shareJson, null, 2));

  // 6. Incluir media de ejercicios (solo imágenes subidas por el usuario)
  const mediaFolder = zip.folder('media');

  if (Capacitor.getPlatform() === 'web') {
    const prefix = 'media_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`${prefix}exercises/`)) continue;
      const mediaPath = key.replace(prefix, '');
      const isUsed = exercises.some(ex => ex.image_url === mediaPath || ex.image_path === mediaPath);
      if (!isUsed) continue;
      const dataUrl = localStorage.getItem(key);
      if (dataUrl) {
        const base64 = dataUrl.split(',')[1];
        mediaFolder?.file(mediaPath, base64, { base64: true });
      }
    }
  } else {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    for (const ex of exercises) {
      const path = (ex.image_url as string) || (ex.image_path as string) || '';
      if (!path || path.startsWith('/img/') || path.startsWith('http') || path.startsWith('data:')) continue;
      try {
        const fileData = await Filesystem.readFile({ path: `crossfit-tracker/media/${path}`, directory: Directory.Data });
        mediaFolder?.file(path, fileData.data as string, { base64: true });
      } catch (e) {
        console.warn(`[ExerciseShare] No se pudo incluir media: ${path}`, e);
      }
    }
  }

  // 7. Generar y descargar el ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const safeNames = exercises
    .map(e => e.name as string)
    .join('_')
    .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40);
  const fileName = `ejercicios-${safeNames}-${formatDateForFile(new Date())}.zip`;

  if (Capacitor.getPlatform() === 'web') {
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const reader = new FileReader();
    const base64Promise = new Promise<string>(resolve => {
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(content);
    });
    const base64Data = await base64Promise;
    const cachePath = `backups/${fileName}`;

    await Filesystem.writeFile({ path: cachePath, data: base64Data, directory: Directory.Cache, recursive: true });
    const uriResult = await Filesystem.getUri({ path: cachePath, directory: Directory.Cache });

    await Share.share({
      title: 'Ejercicios CrossFit',
      text: `Ejercicio${exercises.length > 1 ? 's' : ''}: ${exercises.map(e => e.name).join(', ')}`,
      url: uriResult.uri,
      dialogTitle: 'Compartir Ejercicios',
    });
  }
}

// ─── IMPORTACIÓN DE EJERCICIOS ────────────────────────────────────────────────

export interface ExerciseImportResult {
  exercisesCreated: number;
  exercisesReused: number;
}

/**
 * Importa ejercicios desde un ZIP generado por exportExercises().
 * Mismo patrón que importClassFromZip: leer todo primero, luego executeSet atómico.
 */
export async function importExercisesFromZip(zipFile: Blob): Promise<ExerciseImportResult> {
  const zip = await JSZip.loadAsync(zipFile);

  const jsonFile = zip.file('exercise-share.json');
  if (!jsonFile) throw new Error('El archivo ZIP no es una exportación de ejercicios válida (falta exercise-share.json).');

  const share: ExerciseShareJson = JSON.parse(await jsonFile.async('string'));

  if (share.meta?.app !== 'CrossFit Session Tracker' || share.meta?.type !== EXERCISE_SHARE_TYPE) {
    throw new Error('El archivo no es una exportación de ejercicios de CrossFit Session Tracker.');
  }

  const db = await openDatabase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const idMap = new Map<string, string>();
  const stmts: { statement: string; values: unknown[] }[] = [];

  let exercisesCreated = 0;
  let exercisesReused = 0;

  // ── FASE 1: LECTURAS ─────────────────────────────────────────────────────

  // Catálogos
  const catalogTables = ['muscle_group', 'equipment', 'measurement_unit', 'difficulty_level', 'tag', 'section_type'] as const;
  for (const table of catalogTables) {
    for (const row of share.catalogs[table] ?? []) {
      const exportId = row.id as string;
      const found = await db.query(`SELECT id FROM ${table} WHERE LOWER(name) = LOWER(?) LIMIT 1`, [row.name as string]);
      if (found.values && found.values.length > 0) {
        idMap.set(exportId, found.values[0].id as string);
      } else {
        const newId = generateUUID();
        idMap.set(exportId, newId);
        const keys = Object.keys(row).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
        stmts.push({
          statement: `INSERT INTO ${table} (id, ${keys.join(', ')}, created_at, updated_at) VALUES (?, ${keys.map(() => '?').join(', ')}, ?, ?)`,
          values: [newId, ...keys.map(k => row[k]), timestamp, timestamp],
        });
      }
    }
  }

  // Ejercicios
  for (const ex of share.exercises) {
    const exportId = ex.id as string;
    const found = await db.query(
      `SELECT id FROM exercise WHERE LOWER(name) = LOWER(?) AND is_active = 1 LIMIT 1`,
      [ex.name as string]
    );
    if (found.values && found.values.length > 0) {
      idMap.set(exportId, found.values[0].id as string);
      exercisesReused++;
    } else {
      const newId = generateUUID();
      idMap.set(exportId, newId);
      stmts.push({
        statement: `INSERT INTO exercise
          (id, name, description, technical_notes, difficulty_level_id, primary_muscle_group_id,
           image_path, image_url, video_path, video_long_path, is_compound, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        values: [
          newId, ex.name, ex.description ?? null, ex.technical_notes ?? null,
          ex.difficulty_level_id ? (idMap.get(ex.difficulty_level_id as string) ?? null) : null,
          ex.primary_muscle_group_id ? (idMap.get(ex.primary_muscle_group_id as string) ?? null) : null,
          ex.image_path ?? null, ex.image_url ?? null,
          ex.video_path ?? null, ex.video_long_path ?? null,
          ex.is_compound ?? 0, timestamp, timestamp,
        ],
      });
      const rels = share.exercise_relations;
      for (const r of rels.exercise_muscle_group.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.muscle_group_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_muscle_group (exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?)`, values: [newId, lid, r.is_primary ?? 0] });
      }
      for (const r of rels.exercise_equipment.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.equipment_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_equipment (exercise_id, equipment_id, is_required) VALUES (?, ?, ?)`, values: [newId, lid, r.is_required ?? 0] });
      }
      for (const r of rels.exercise_section_type.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.section_type_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_section_type (exercise_id, section_type_id) VALUES (?, ?)`, values: [newId, lid] });
      }
      for (const r of rels.exercise_unit.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.measurement_unit_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_unit (exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?)`, values: [newId, lid, r.is_default ?? 0] });
      }
      for (const r of rels.exercise_tag.filter(r => r.exercise_id === exportId)) {
        const lid = idMap.get(r.tag_id as string);
        if (lid) stmts.push({ statement: `INSERT OR IGNORE INTO exercise_tag (exercise_id, tag_id) VALUES (?, ?)`, values: [newId, lid] });
      }
      exercisesCreated++;
    }
  }

  // ── FASE 2: ESCRITURA ────────────────────────────────────────────────────
  if (stmts.length > 0) {
    await db.execute('PRAGMA foreign_keys = OFF;');
    try {
      await db.executeSet(stmts, true);
    } finally {
      await db.execute('PRAGMA foreign_keys = ON;');
    }
  }

  await restoreMedia(zip);
  await saveDatabase();
  return { exercisesCreated, exercisesReused };
}

// ─── IMPORTACIÓN UNIFICADA (auto-detecta clase o ejercicio) ─────────────────

export type ImportFromZipResult =
  | { type: 'class'; result: ClassImportResult }
  | { type: 'exercise'; result: ExerciseImportResult };

/**
 * Detecta automáticamente si el ZIP es una exportación de clase o de ejercicios
 * y llama al importador correspondiente.
 */
export async function importFromZip(zipFile: Blob): Promise<ImportFromZipResult> {
  const zip = await JSZip.loadAsync(zipFile);

  if (zip.file('class-share.json')) {
    const result = await importClassFromZip(zipFile);
    return { type: 'class', result };
  }

  if (zip.file('exercise-share.json')) {
    const result = await importExercisesFromZip(zipFile);
    return { type: 'exercise', result };
  }

  throw new Error(
    'El archivo no es una exportación válida de CrossFit Session Tracker.\n' +
    'Asegurate de usar un ZIP generado con "Exportar Clase(s)" o "Exportar Ejercicio(s)".'
  );
}

// ─── Auxiliares ─────────────────────────────────────────────────────────────

/** Restaura media del ZIP sin sobrescribir archivos ya existentes en el dispositivo. */
async function restoreMedia(zip: JSZip): Promise<void> {
  const mediaFolder = zip.folder('media');
  if (!mediaFolder) return;

  const mediaFiles: string[] = [];
  mediaFolder.forEach((relativePath) => {
    if (!mediaFolder.file(relativePath)?.dir) mediaFiles.push(relativePath);
  });

  if (Capacitor.getPlatform() === 'web') {
    for (const relativePath of mediaFiles) {
      const localKey = `media_${relativePath}`;
      if (localStorage.getItem(localKey)) continue;
      const file = mediaFolder.file(relativePath);
      if (file) {
        const base64 = await file.async('base64');
        const ext = relativePath.split('.').pop() ?? 'jpeg';
        localStorage.setItem(localKey, `data:image/${ext};base64,${base64}`);
      }
    }
  } else {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    for (const relativePath of mediaFiles) {
      const fullPath = `crossfit-tracker/media/${relativePath}`;
      try {
        await Filesystem.stat({ path: fullPath, directory: Directory.Data });
      } catch {
        const file = mediaFolder.file(relativePath);
        if (file) {
          const base64 = await file.async('base64');
          await Filesystem.writeFile({ path: fullPath, data: base64, directory: Directory.Data, recursive: true });
        }
      }
    }
  }
}

function formatDateForFile(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
