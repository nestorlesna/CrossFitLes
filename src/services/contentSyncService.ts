// Actualización de contenido desde el repo público CrossFitLes-content.
// Baja manifest.json y, si hay una versión nueva, content.json; lo aplica en UNA transacción.
//
// Reglas:
// - Catálogos: se resuelven por nombre (UNIQUE); sólo se agregan los que faltan.
// - Ejercicios: nuevos → se insertan; ya bajados y sin editar → se actualizan si cambió su hash;
//   editados por el usuario (user_modified) → no se tocan. Los que coinciden por nombre (seed o
//   ZIP compartido) se adoptan y actualizan.
// - Clases y planes: nuevos → se insertan. Los ya bajados se actualizan sólo si el usuario no los
//   editó y no tienen uso (clase sin sesiones / plan en borrador sin días hechos). Los que
//   coinciden por nombre se marcan como propios del usuario y no se pisan.
// - Nunca se borra nada ni se tocan sesiones, resultados, récords, challenges ni perfil.

import { Capacitor } from '@capacitor/core';
import { getDatabase, saveDatabase } from '../db/database';
import { getSetting, setSettingStmt } from '../db/repositories/appSettingRepo';
import { generateUUID } from '../utils/formatters';
import { addDaysISO, daysBetweenISO, todayISO } from './challengeEngine';
import {
  CATALOG_TABLES,
  CONTENT_APP,
  CONTENT_BASE_URL,
  CONTENT_FORMAT,
  CONTENT_PATH,
  MANIFEST_PATH,
  ContentFile,
  ContentManifest,
  RemoteExercise,
  RemotePlan,
  RemoteSection,
  Row,
  normalizeName,
  nowSql,
} from './contentFormat';

const SETTING_VERSION = 'content_version';
const SETTING_LAST_SYNC = 'content_last_sync';

type Stmt = { statement: string; values: unknown[] };

export interface ContentStatus {
  localVersion: number;
  lastSync: string | null;
}

export interface SyncSummary {
  upToDate: boolean;
  contentVersion: number;
  catalogsAdded: number;
  exercisesAdded: number;
  exercisesUpdated: number;
  exercisesSkipped: number;
  classesAdded: number;
  classesUpdated: number;
  classesSkipped: number;
  plansAdded: number;
  plansUpdated: number;
  plansSkipped: number;
}

export async function getContentStatus(): Promise<ContentStatus> {
  return {
    localVersion: Number((await getSetting(SETTING_VERSION)) ?? 0),
    lastSync: await getSetting(SETTING_LAST_SYNC),
  };
}

async function fetchJson<T>(path: string, version?: number): Promise<T> {
  const url = `${CONTENT_BASE_URL}/${path}?v=${version ?? Date.now()}`;
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch {
    throw new Error('Sin conexión a internet');
  }
  if (!res.ok) throw new Error(`No se pudo descargar ${path} (HTTP ${res.status})`);
  return (await res.json()) as T;
}

export async function fetchManifest(): Promise<ContentManifest> {
  const manifest = await fetchJson<ContentManifest>(MANIFEST_PATH);
  if (manifest.app !== CONTENT_APP) throw new Error('El contenido publicado no es válido');
  return manifest;
}

// ─── Helpers de escritura genéricos ─────────────────────────────────────────

// Columnas existentes por tabla: el contenido puede traer columnas que esta versión no tiene
const columnCache = new Map<string, Set<string>>();
async function getColumns(table: string): Promise<Set<string>> {
  if (!columnCache.has(table)) {
    const res = await getDatabase().query(`PRAGMA table_info(${table})`);
    columnCache.set(table, new Set((res.values ?? []).map((c) => c.name as string)));
  }
  return columnCache.get(table)!;
}

async function insertStmt(table: string, row: Row): Promise<Stmt> {
  const cols = await getColumns(table);
  const keys = Object.keys(row).filter((k) => cols.has(k) && row[k] !== undefined);
  return {
    statement: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    values: keys.map((k) => row[k]),
  };
}

async function updateStmt(table: string, row: Row, id: string): Promise<Stmt> {
  const cols = await getColumns(table);
  const keys = Object.keys(row).filter((k) => k !== 'id' && cols.has(k) && row[k] !== undefined);
  return {
    statement: `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    values: [...keys.map((k) => row[k]), id],
  };
}

async function queryRows(sql: string, values: unknown[] = []): Promise<Row[]> {
  const res = await getDatabase().query(sql, values);
  return (res.values ?? []) as Row[];
}

// Clave de la imagen bajada: incluye el hash para no reutilizar copias viejas en caché/filesystem
function remoteImageKey(ex: RemoteExercise): string {
  return `remote/${ex.hash.slice(0, 8)}/${ex.image!.path.replace(/^\/+/, '')}`;
}

// ─── Sincronización ─────────────────────────────────────────────────────────

export async function syncContent(force = false): Promise<SyncSummary> {
  const manifest = await fetchManifest();
  if (manifest.format > CONTENT_FORMAT) {
    throw new Error('Hay contenido nuevo que necesita una versión más nueva de la app. Actualizá la app.');
  }

  const status = await getContentStatus();
  const summary: SyncSummary = {
    upToDate: false,
    contentVersion: manifest.contentVersion,
    catalogsAdded: 0,
    exercisesAdded: 0,
    exercisesUpdated: 0,
    exercisesSkipped: 0,
    classesAdded: 0,
    classesUpdated: 0,
    classesSkipped: 0,
    plansAdded: 0,
    plansUpdated: 0,
    plansSkipped: 0,
  };
  if (!force && manifest.contentVersion <= status.localVersion) {
    return { ...summary, upToDate: true };
  }

  const content = await fetchJson<ContentFile>(CONTENT_PATH, manifest.contentVersion);
  if (content.app !== CONTENT_APP || content.format > CONTENT_FORMAT) {
    throw new Error('El contenido descargado no es compatible con esta versión de la app');
  }

  const ts = nowSql();
  const stmts: Stmt[] = [];
  const imagesToWrite: { key: string; dataUrl: string }[] = [];

  // ── 1. Catálogos: id remoto → id local, por nombre ────────────────────────
  const catalogMap = new Map<string, string>();
  for (const table of CATALOG_TABLES) {
    const local = await queryRows(`SELECT id, name FROM ${table}`);
    const byName = new Map(local.map((r) => [normalizeName(r.name), r.id as string]));
    for (const row of content.catalogs[table] ?? []) {
      const found = byName.get(normalizeName(row.name));
      if (found) {
        catalogMap.set(row.id as string, found);
        continue;
      }
      const newId = generateUUID();
      catalogMap.set(row.id as string, newId);
      byName.set(normalizeName(row.name), newId);
      stmts.push(await insertStmt(table, { ...row, id: newId, created_at: ts, updated_at: ts }));
      summary.catalogsAdded++;
    }
  }
  const cat = (id: unknown): string | null => (id ? (catalogMap.get(id as string) ?? null) : null);

  // ── 2. Ejercicios ─────────────────────────────────────────────────────────
  const localExercises = await queryRows(
    `SELECT id, name, is_active, global_key, origin, remote_hash, user_modified, image_url FROM exercise`
  );
  const exByKey = new Map(localExercises.filter((e) => e.global_key).map((e) => [e.global_key as string, e]));
  const exByName = new Map<string, Row>();
  // Prioriza los activos al resolver por nombre
  for (const e of [...localExercises].sort((a, b) => Number(a.is_active) - Number(b.is_active))) {
    exByName.set(normalizeName(e.name), e);
  }
  const exerciseIdByKey = new Map<string, string>();

  const exerciseRelationStmts = (exId: string, ex: RemoteExercise): Stmt[] => {
    const out: Stmt[] = [];
    const r = ex.relations;
    const push = (table: string, col: string, items: { id: string | null; extra: Row }[]) => {
      out.push({ statement: `DELETE FROM ${table} WHERE exercise_id = ?`, values: [exId] });
      for (const { id, extra } of items) {
        if (!id) continue;
        const extraKeys = Object.keys(extra);
        out.push({
          statement: `INSERT OR IGNORE INTO ${table} (id, exercise_id, ${col}${extraKeys.map((k) => `, ${k}`).join('')})
                      VALUES (?, ?, ?${extraKeys.map(() => ', ?').join('')})`,
          values: [generateUUID(), exId, id, ...extraKeys.map((k) => extra[k])],
        });
      }
    };
    push('exercise_muscle_group', 'muscle_group_id', r.muscle_groups.map((x) => ({ id: cat(x.muscle_group_id), extra: { is_primary: x.is_primary } })));
    push('exercise_equipment', 'equipment_id', r.equipment.map((x) => ({ id: cat(x.equipment_id), extra: { is_required: x.is_required } })));
    push('exercise_section_type', 'section_type_id', r.section_types.map((x) => ({ id: cat(x.section_type_id), extra: {} })));
    push('exercise_unit', 'measurement_unit_id', r.units.map((x) => ({ id: cat(x.measurement_unit_id), extra: { is_default: x.is_default } })));
    push('exercise_tag', 'tag_id', r.tags.map((x) => ({ id: cat(x.tag_id), extra: {} })));
    return out;
  };

  // Fila del ejercicio con catálogos e imagen ya resueltos al dispositivo
  const exerciseRow = (ex: RemoteExercise, exId: string, previousImage: unknown): Row => {
    const row: Row = {
      ...ex.row,
      difficulty_level_id: cat(ex.row.difficulty_level_id),
      primary_muscle_group_id: cat(ex.row.primary_muscle_group_id),
      remote_hash: ex.hash,
      updated_at: ts,
    };
    if (ex.image) {
      const key = remoteImageKey(ex);
      row.image_url = key;
      stmts.push({
        statement: `INSERT OR REPLACE INTO exercise_image (id, exercise_id, data_url) VALUES (?, ?, ?)`,
        values: [key, exId, ex.image.dataUrl],
      });
      imagesToWrite.push({ key, dataUrl: ex.image.dataUrl });
      // La imagen bajada anterior queda huérfana: se elimina
      const prev = String(previousImage ?? '');
      if (prev.startsWith('remote/') && prev !== key) {
        stmts.push({ statement: `DELETE FROM exercise_image WHERE id = ?`, values: [prev] });
      }
    }
    return row;
  };

  for (const ex of content.exercises) {
    let local = exByKey.get(ex.key);
    let adopting = false;
    if (!local) {
      const byName = exByName.get(normalizeName(ex.row.name));
      if (byName && !byName.global_key) {
        local = byName;
        adopting = true;
      } else if (byName) {
        // Mismo nombre que otro ejercicio ya vinculado: se reutiliza sin tocarlo
        exerciseIdByKey.set(ex.key, byName.id as string);
        continue;
      }
    }

    if (!local) {
      const newId = generateUUID();
      exerciseIdByKey.set(ex.key, newId);
      const row = exerciseRow(ex, newId, null);
      stmts.push(
        await insertStmt('exercise', {
          ...row,
          id: newId,
          global_key: ex.key,
          origin: 'remote',
          user_modified: 0,
          created_at: ts,
        })
      );
      stmts.push(...exerciseRelationStmts(newId, ex));
      summary.exercisesAdded++;
      continue;
    }

    const localId = local.id as string;
    exerciseIdByKey.set(ex.key, localId);
    if (!adopting) {
      if (local.origin === 'local') continue; // contenido propio (dispositivo publicador)
      if (Number(local.user_modified) === 1) {
        summary.exercisesSkipped++;
        continue;
      }
      if (local.remote_hash === ex.hash) continue;
    }

    const row = exerciseRow(ex, localId, local.image_url);
    delete row.is_active; // si el usuario lo desactivó, sigue desactivado
    stmts.push(await updateStmt('exercise', { ...row, global_key: ex.key, origin: 'remote' }, localId));
    stmts.push(...exerciseRelationStmts(localId, ex));
    summary.exercisesUpdated++;
  }

  // ── 3. Clases ─────────────────────────────────────────────────────────────
  const templateStmts = async (templateId: string, sections: RemoteSection[]): Promise<Stmt[]> => {
    const out: Stmt[] = [];
    for (const section of sections) {
      const sectionId = generateUUID();
      out.push(
        await insertStmt('class_section', {
          ...section.row,
          id: sectionId,
          class_template_id: templateId,
          section_type_id: cat(section.row.section_type_id),
          work_format_id: cat(section.row.work_format_id),
          created_at: ts,
          updated_at: ts,
        })
      );
      for (const se of section.exercises) {
        const exerciseId = exerciseIdByKey.get(se.exercise_key);
        if (!exerciseId) continue;
        const seRow: Row = { ...se };
        delete seRow.exercise_key;
        out.push(
          await insertStmt('section_exercise', {
            ...seRow,
            id: generateUUID(),
            class_section_id: sectionId,
            exercise_id: exerciseId,
            planned_weight_unit_id: cat(se.planned_weight_unit_id),
            planned_distance_unit_id: cat(se.planned_distance_unit_id),
            created_at: ts,
            updated_at: ts,
          })
        );
      }
    }
    return out;
  };

  const deleteSectionsStmts = (templateIds: string, values: unknown[]): Stmt[] => [
    {
      statement: `DELETE FROM section_exercise WHERE class_section_id IN (
                    SELECT id FROM class_section WHERE class_template_id IN (${templateIds}))`,
      values,
    },
    { statement: `DELETE FROM class_section WHERE class_template_id IN (${templateIds})`, values },
  ];

  const localClasses = await queryRows(
    `SELECT id, name, is_active, is_plan_day, global_key, origin, remote_hash, user_modified FROM class_template`
  );
  const clsByKey = new Map(localClasses.filter((c) => c.global_key).map((c) => [c.global_key as string, c]));
  const clsByName = new Map(
    localClasses.filter((c) => Number(c.is_plan_day) === 0).map((c) => [normalizeName(c.name), c])
  );
  const classesInUse = new Set(
    (await queryRows(`SELECT DISTINCT class_template_id FROM training_session WHERE class_template_id IS NOT NULL`)).map(
      (r) => r.class_template_id as string
    )
  );
  const classIdByKey = new Map<string, string>();

  for (const cls of content.classes) {
    const local = clsByKey.get(cls.key);
    if (local) {
      const localId = local.id as string;
      classIdByKey.set(cls.key, localId);
      if (local.origin === 'local' || local.remote_hash === cls.hash) continue;
      if (Number(local.user_modified) === 1 || Number(local.is_active) === 0 || classesInUse.has(localId)) {
        summary.classesSkipped++;
        continue;
      }
      stmts.push(await updateStmt('class_template', { ...cls.row, remote_hash: cls.hash, updated_at: ts }, localId));
      stmts.push(...deleteSectionsStmts('?', [localId]));
      stmts.push(...(await templateStmts(localId, cls.sections)));
      summary.classesUpdated++;
      continue;
    }

    const byName = clsByName.get(normalizeName(cls.row.name));
    if (byName && !byName.global_key) {
      // Ya tiene una clase con ese nombre (propia o importada por ZIP): se vincula y se protege
      classIdByKey.set(cls.key, byName.id as string);
      stmts.push({
        statement: `UPDATE class_template SET global_key = ?, origin = 'remote', user_modified = 1 WHERE id = ?`,
        values: [cls.key, byName.id],
      });
      continue;
    }

    const newId = generateUUID();
    classIdByKey.set(cls.key, newId);
    stmts.push(
      await insertStmt('class_template', {
        ...cls.row,
        id: newId,
        is_favorite: 0,
        is_active: 1,
        global_key: cls.key,
        origin: 'remote',
        remote_hash: cls.hash,
        user_modified: 0,
        created_at: ts,
        updated_at: ts,
      })
    );
    stmts.push(...(await templateStmts(newId, cls.sections)));
    summary.classesAdded++;
  }

  // ── 4. Planes ─────────────────────────────────────────────────────────────
  const localPlans = await queryRows(
    `SELECT id, name, status, global_key, origin, remote_hash, user_modified FROM training_plan WHERE plan_kind = 'plan'`
  );
  const planByKey = new Map(localPlans.filter((p) => p.global_key).map((p) => [p.global_key as string, p]));
  const planByName = new Map(localPlans.map((p) => [normalizeName(p.name), p]));
  const startedPlans = new Set(
    (
      await queryRows(
        `SELECT DISTINCT training_plan_id FROM plan_day WHERE training_session_id IS NOT NULL OR status <> 'pending'`
      )
    ).map((r) => r.training_plan_id as string)
  );
  const today = todayISO();

  // Días del plan (con sus plantillas privadas), corridos para que el plan empiece hoy
  const planDaysStmts = async (planId: string, plan: RemotePlan): Promise<Stmt[]> => {
    const out: Stmt[] = [];
    const start = plan.row.start_date as string | null;
    const offset = start ? daysBetweenISO(start.slice(0, 10), today) : 0;
    for (const day of plan.days) {
      let templateId: string | null = null;
      if (day.template) {
        templateId = generateUUID();
        out.push(
          await insertStmt('class_template', {
            ...day.template.row,
            id: templateId,
            is_plan_day: 1,
            is_favorite: 0,
            is_active: 1,
            origin: 'remote',
            created_at: ts,
            updated_at: ts,
          })
        );
        out.push(...(await templateStmts(templateId, day.template.sections)));
      } else if (day.class_key) {
        templateId = classIdByKey.get(day.class_key) ?? null;
      }
      const date = day.row.scheduled_date as string | null;
      out.push(
        await insertStmt('plan_day', {
          ...day.row,
          id: generateUUID(),
          training_plan_id: planId,
          scheduled_date: date ? addDaysISO(date.slice(0, 10), offset) : null,
          class_template_id: templateId,
          status: 'pending',
          created_at: ts,
          updated_at: ts,
        })
      );
    }
    return out;
  };

  const planRow = (plan: RemotePlan): Row => ({
    ...plan.row,
    start_date: plan.row.start_date ? today : null,
    status: 'draft',
    plan_kind: 'plan',
    is_active: 1,
    remote_hash: plan.hash,
    updated_at: ts,
  });

  for (const plan of content.plans) {
    const local = planByKey.get(plan.key);
    if (local) {
      const localId = local.id as string;
      if (local.origin === 'local' || local.remote_hash === plan.hash) continue;
      if (Number(local.user_modified) === 1 || local.status !== 'draft' || startedPlans.has(localId)) {
        summary.plansSkipped++;
        continue;
      }
      // Rearmar los días: borrar los anteriores y sus plantillas privadas
      const privateIds = `SELECT class_template_id FROM plan_day WHERE training_plan_id = ? AND class_template_id IN (
                            SELECT id FROM class_template WHERE is_plan_day = 1)`;
      const oldTemplates = (await queryRows(privateIds, [localId])).map((r) => r.class_template_id as string);
      stmts.push(await updateStmt('training_plan', planRow(plan), localId));
      stmts.push({ statement: `DELETE FROM plan_day WHERE training_plan_id = ?`, values: [localId] });
      if (oldTemplates.length) {
        const ph = oldTemplates.map(() => '?').join(', ');
        stmts.push(...deleteSectionsStmts(ph, oldTemplates));
        stmts.push({ statement: `DELETE FROM class_template WHERE id IN (${ph})`, values: oldTemplates });
      }
      stmts.push(...(await planDaysStmts(localId, plan)));
      summary.plansUpdated++;
      continue;
    }

    const byName = planByName.get(normalizeName(plan.row.name));
    if (byName && !byName.global_key) {
      stmts.push({
        statement: `UPDATE training_plan SET global_key = ?, origin = 'remote', user_modified = 1 WHERE id = ?`,
        values: [plan.key, byName.id],
      });
      continue;
    }

    const newId = generateUUID();
    stmts.push(
      await insertStmt('training_plan', {
        ...planRow(plan),
        id: newId,
        global_key: plan.key,
        origin: 'remote',
        user_modified: 0,
        created_at: ts,
      })
    );
    stmts.push(...(await planDaysStmts(newId, plan)));
    summary.plansAdded++;
  }

  // ── 5. Escritura atómica ──────────────────────────────────────────────────
  stmts.push(setSettingStmt(SETTING_VERSION, String(manifest.contentVersion)));
  stmts.push(setSettingStmt(SETTING_LAST_SYNC, ts));

  const db = getDatabase();
  await db.executeSet(stmts, true);
  await saveDatabase();

  // En Android las imágenes se leen primero del filesystem: copiarlas ahí también
  if (Capacitor.getPlatform() !== 'web' && imagesToWrite.length > 0) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    for (const { key, dataUrl } of imagesToWrite) {
      const base64 = dataUrl.split(',')[1];
      if (!base64) continue;
      try {
        await Filesystem.writeFile({
          path: `crossfit-tracker/media/${key}`,
          data: base64,
          directory: Directory.Data,
          recursive: true,
        });
      } catch (e) {
        console.warn(`[ContentSync] No se pudo guardar la imagen en el filesystem: ${key}`, e);
      }
    }
  }

  return summary;
}
