// Publicación del contenido (sólo desde la PC del administrador, en `npm run dev`).
// Arma content.json + manifest.json con todos los catálogos, ejercicios (con su imagen
// embebida), clases y planes, y los escribe en el clon local de CrossFitLes-content
// a través del middleware de Vite (ver vite.config.ts). Después se hace git push a mano.
// Si el middleware no está disponible, descarga los dos archivos.

import { getDatabase, saveDatabase } from '../db/database';
import {
  CATALOG_TABLES,
  CONTENT_APP,
  CONTENT_FORMAT,
  CONTENT_PATH,
  MANIFEST_PATH,
  CatalogTable,
  ContentFile,
  ContentManifest,
  RemoteClass,
  RemoteExercise,
  RemoteImage,
  RemotePlan,
  RemotePlanDay,
  RemoteSection,
  Row,
  hashOf,
  nowSql,
  stripLocalColumns,
} from './contentFormat';

const DEV_ENDPOINT = '/__content';

export interface PublishResult {
  changed: boolean;
  contentVersion: number;
  counts: ContentManifest['counts'];
  sizeKb: number;
  writtenTo: 'repo' | 'download';
  repoDir?: string;
}

async function queryRows(sql: string, values: unknown[] = []): Promise<Row[]> {
  const res = await getDatabase().query(sql, values);
  return (res.values ?? []) as Row[];
}

function groupBy<T extends Row>(rows: T[], key: string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const k = r[key] as string;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return map;
}

// Convierte un blob en data URL base64
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Imagen del ejercicio: SVG estático de /img (se baja del propio servidor) o imagen de SQLite
async function loadImage(path: string, sqliteImages: Map<string, string>): Promise<RemoteImage | null> {
  if (!path || path.startsWith('http') || path.startsWith('data:')) return null;
  if (path.startsWith('/img/')) {
    const res = await fetch(path);
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || type.includes('text/html')) {
      console.warn(`[Publish] Imagen estática no encontrada: ${path}`);
      return null;
    }
    return { path, dataUrl: await blobToDataUrl(await res.blob()) };
  }
  const dataUrl = sqliteImages.get(path);
  return dataUrl ? { path, dataUrl } : null;
}

// Asigna global_key = id a todo lo publicable que todavía no tenga (una sola vez)
async function ensureGlobalKeys(): Promise<void> {
  const db = getDatabase();
  await db.executeSet(
    [
      { statement: `UPDATE exercise SET global_key = id WHERE global_key IS NULL`, values: [] },
      { statement: `UPDATE class_template SET global_key = id WHERE global_key IS NULL`, values: [] },
      {
        statement: `UPDATE training_plan SET global_key = id WHERE global_key IS NULL AND plan_kind = 'plan'`,
        values: [],
      },
    ],
    true
  );
  await saveDatabase();
}

// Arma secciones + ejercicios de sección de una plantilla
function buildSections(
  templateId: string,
  sectionsByTemplate: Map<string, Row[]>,
  seBySection: Map<string, Row[]>,
  exerciseKeyById: Map<string, string>
): RemoteSection[] {
  return (sectionsByTemplate.get(templateId) ?? []).map((section) => ({
    row: stripLocalColumns(section, ['class_template_id']),
    exercises: (seBySection.get(section.id as string) ?? [])
      .filter((se) => exerciseKeyById.has(se.exercise_id as string))
      .map((se) => ({
        ...stripLocalColumns(se, ['class_section_id', 'exercise_id']),
        exercise_key: exerciseKeyById.get(se.exercise_id as string)!,
      })),
  }));
}

export async function buildContent(): Promise<Omit<ContentFile, 'contentVersion' | 'publishedAt'>> {
  await ensureGlobalKeys();

  // Catálogos completos (son pocos registros)
  const catalogs = {} as Record<CatalogTable, Row[]>;
  for (const table of CATALOG_TABLES) {
    // Los catálogos se resuelven por nombre: el id sólo sirve como referencia interna del archivo
    catalogs[table] = (await queryRows(`SELECT * FROM ${table} ORDER BY name`)).map((r) => ({
      id: r.id,
      ...stripLocalColumns(r, ['image_path']),
    }));
  }

  // Clases publicables y plantillas privadas de los planes
  const classes = await queryRows(
    `SELECT * FROM class_template WHERE is_active = 1 AND is_plan_day = 0 ORDER BY name, id`
  );
  const plans = await queryRows(
    `SELECT * FROM training_plan WHERE is_active = 1 AND plan_kind = 'plan' ORDER BY name, id`
  );
  const planIds = plans.map((p) => p.id as string);
  const planDays = planIds.length
    ? await queryRows(
        `SELECT * FROM plan_day WHERE training_plan_id IN (${planIds.map(() => '?').join(',')})
         ORDER BY training_plan_id, day_index`,
        planIds
      )
    : [];
  const privateTemplateIds = new Set(
    (await queryRows(`SELECT id FROM class_template WHERE is_plan_day = 1`)).map((r) => r.id as string)
  );

  const sections = await queryRows(`SELECT * FROM class_section ORDER BY class_template_id, sort_order, id`);
  const sectionExercises = await queryRows(
    `SELECT * FROM section_exercise ORDER BY class_section_id, sort_order, id`
  );
  const sectionsByTemplate = groupBy(sections, 'class_template_id');
  const seBySection = groupBy(sectionExercises, 'class_section_id');

  // Ejercicios: todos los activos + los inactivos que usen las clases publicadas
  const usedTemplateIds = new Set<string>([
    ...classes.map((c) => c.id as string),
    ...planDays.map((d) => d.class_template_id as string).filter((id) => privateTemplateIds.has(id)),
  ]);
  const usedExerciseIds = new Set<string>();
  for (const tid of usedTemplateIds) {
    for (const s of sectionsByTemplate.get(tid) ?? []) {
      for (const se of seBySection.get(s.id as string) ?? []) usedExerciseIds.add(se.exercise_id as string);
    }
  }
  const exercises = (await queryRows(`SELECT * FROM exercise ORDER BY name, id`)).filter(
    (e) => Number(e.is_active) === 1 || usedExerciseIds.has(e.id as string)
  );
  const exerciseKeyById = new Map(exercises.map((e) => [e.id as string, e.global_key as string]));

  const rel = {
    mg: groupBy(await queryRows(`SELECT * FROM exercise_muscle_group ORDER BY muscle_group_id`), 'exercise_id'),
    eq: groupBy(await queryRows(`SELECT * FROM exercise_equipment ORDER BY equipment_id`), 'exercise_id'),
    st: groupBy(await queryRows(`SELECT * FROM exercise_section_type ORDER BY section_type_id`), 'exercise_id'),
    un: groupBy(await queryRows(`SELECT * FROM exercise_unit ORDER BY measurement_unit_id`), 'exercise_id'),
    tg: groupBy(await queryRows(`SELECT * FROM exercise_tag ORDER BY tag_id`), 'exercise_id'),
  };
  const sqliteImages = new Map(
    (await queryRows(`SELECT id, data_url FROM exercise_image`)).map((r) => [r.id as string, r.data_url as string])
  );

  const remoteExercises: RemoteExercise[] = [];
  for (const ex of exercises) {
    const id = ex.id as string;
    const imagePath = ((ex.image_url as string) || (ex.image_path as string) || '').trim();
    const body = {
      row: stripLocalColumns(ex, ['image_path']),
      relations: {
        muscle_groups: (rel.mg.get(id) ?? []).map((r) => ({
          muscle_group_id: r.muscle_group_id as string,
          is_primary: Number(r.is_primary ?? 0),
        })),
        equipment: (rel.eq.get(id) ?? []).map((r) => ({
          equipment_id: r.equipment_id as string,
          is_required: Number(r.is_required ?? 0),
        })),
        section_types: (rel.st.get(id) ?? []).map((r) => ({ section_type_id: r.section_type_id as string })),
        units: (rel.un.get(id) ?? []).map((r) => ({
          measurement_unit_id: r.measurement_unit_id as string,
          is_default: Number(r.is_default ?? 0),
        })),
        tags: (rel.tg.get(id) ?? []).map((r) => ({ tag_id: r.tag_id as string })),
      },
      image: await loadImage(imagePath, sqliteImages),
    };
    remoteExercises.push({ key: ex.global_key as string, hash: hashOf(body), ...body });
  }

  const remoteClasses: RemoteClass[] = classes.map((cls) => {
    const body = {
      row: stripLocalColumns(cls, ['is_favorite']),
      sections: buildSections(cls.id as string, sectionsByTemplate, seBySection, exerciseKeyById),
    };
    return { key: cls.global_key as string, hash: hashOf(body), ...body };
  });

  const classKeyById = new Map(classes.map((c) => [c.id as string, c.global_key as string]));
  const templateById = new Map(
    (await queryRows(`SELECT * FROM class_template WHERE is_plan_day = 1`)).map((t) => [t.id as string, t])
  );
  const daysByPlan = groupBy(planDays, 'training_plan_id');

  const remotePlans: RemotePlan[] = plans.map((plan) => {
    const days: RemotePlanDay[] = (daysByPlan.get(plan.id as string) ?? []).map((d) => {
      const templateId = d.class_template_id as string | null;
      const privateTemplate = templateId ? templateById.get(templateId) : undefined;
      return {
        row: {
          day_index: d.day_index,
          scheduled_date: d.scheduled_date ?? null,
          day_type: d.day_type,
          title: d.title ?? null,
          notes: d.notes ?? null,
        },
        class_key: templateId && !privateTemplate ? (classKeyById.get(templateId) ?? null) : null,
        template: privateTemplate
          ? {
              row: stripLocalColumns(privateTemplate, ['is_favorite']),
              sections: buildSections(templateId!, sectionsByTemplate, seBySection, exerciseKeyById),
            }
          : null,
      };
    });
    const body = {
      // Estado y progreso son personales: no se publican
      row: stripLocalColumns(plan, ['status', 'plan_kind', 'challenge_code', 'challenge_level', 'challenge_easy']),
      days,
    };
    return { key: plan.global_key as string, hash: hashOf(body), ...body };
  });

  return {
    app: CONTENT_APP,
    format: CONTENT_FORMAT,
    catalogs,
    exercises: remoteExercises,
    classes: remoteClasses,
    plans: remotePlans,
  };
}

// Lee el manifest publicado anteriormente (desde el clon local del repo de contenido)
async function readPreviousManifest(): Promise<{ manifest: ContentManifest | null; available: boolean }> {
  try {
    const res = await fetch(`${DEV_ENDPOINT}/manifest`);
    if (res.status === 404) return { manifest: null, available: true };
    if (!res.ok) return { manifest: null, available: false };
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('application/json')) return { manifest: null, available: false };
    const data = await res.json();
    return { manifest: data.manifest ?? null, available: true };
  } catch {
    return { manifest: null, available: false };
  }
}

function downloadJson(fileName: string, json: string): void {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera y publica el contenido. Si nada cambió desde la última publicación, no sube la versión.
 * @param force publica aunque el contenido no haya cambiado
 */
export async function publishContent(force = false): Promise<PublishResult> {
  const base = await buildContent();
  const contentHash = hashOf(base);
  const counts = { exercises: base.exercises.length, classes: base.classes.length, plans: base.plans.length };

  const previous = await readPreviousManifest();
  const prevVersion = previous.manifest?.contentVersion ?? 0;
  const changed = force || previous.manifest?.contentHash !== contentHash;
  const contentVersion = changed ? prevVersion + 1 : prevVersion;

  if (!changed && previous.available) {
    return { changed: false, contentVersion, counts, sizeKb: 0, writtenTo: 'repo' };
  }

  const publishedAt = nowSql();
  const content: ContentFile = {
    app: base.app,
    format: base.format,
    contentVersion,
    publishedAt,
    catalogs: base.catalogs,
    exercises: base.exercises,
    classes: base.classes,
    plans: base.plans,
  };
  const contentJson = JSON.stringify(content, null, 2);

  const manifest: ContentManifest = {
    app: CONTENT_APP,
    format: CONTENT_FORMAT,
    contentVersion,
    publishedAt,
    contentHash,
    counts,
    files: [{ path: CONTENT_PATH, size: contentJson.length }],
  };
  const manifestJson = JSON.stringify(manifest, null, 2);
  const sizeKb = Math.round(contentJson.length / 1024);

  if (previous.available) {
    const res = await fetch(`${DEV_ENDPOINT}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [
          { path: MANIFEST_PATH, content: manifestJson },
          { path: CONTENT_PATH, content: contentJson },
        ],
      }),
    });
    if (!res.ok) throw new Error(`No se pudo escribir en el repo de contenido: ${await res.text()}`);
    const data = await res.json();
    return { changed: true, contentVersion, counts, sizeKb, writtenTo: 'repo', repoDir: data.dir };
  }

  // Sin middleware (build de producción): descargar los archivos para copiarlos a mano
  downloadJson('manifest.json', manifestJson);
  downloadJson('content.json', contentJson);
  return { changed: true, contentVersion, counts, sizeKb, writtenTo: 'download' };
}
