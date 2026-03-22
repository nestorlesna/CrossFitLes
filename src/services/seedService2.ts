// Inicialización unificada: borra todo e inserta catálogos + 3.242 ejercicios del Excel
// Todo ocurre en una sola sesión (sin recarga intermedia).
// Los ejercicios se cargan de /public/seed2_exercises.json (fetch lazy, ~1MB)

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';
import { resetDatabase } from './seedService';

// ── Helper ────────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Seed2Exercise {
  name: string;
  video_path: string | null;
  video_long_path: string | null;
  difficulty: string;
  primaryMuscle: string | null;
  is_compound: number;
  equipment: string[];
  tags: string[];
  sections: string[];
  units: string[];
}

// ── Carga JSON desde /public ───────────────────────────────────────────────────

async function loadExercisesJson(): Promise<Seed2Exercise[]> {
  const res = await fetch('/seed2_exercises.json');
  if (!res.ok) throw new Error(`No se pudo cargar seed2_exercises.json: ${res.status}`);
  return res.json();
}

// ── Catálogos ─────────────────────────────────────────────────────────────────
// Idénticos a los de Inicialización 1; INSERT OR IGNORE por si ya existen.

async function seedCatalogs(db: SQLiteDBConnection): Promise<void> {
  const esc = (val: string | number | null): string => {
    if (val === null) return 'NULL';
    if (typeof val === 'number') return val.toString();
    return `'${val.toString().replace(/'/g, "''")}'`;
  };
  const seedCatalog = async (table: string, items: Record<string, unknown>[]): Promise<void> => {
    const parts: string[] = [];
    for (const item of items) {
      const fields = { id: generateUUID(), ...item };
      const keys = Object.keys(fields);
      const vals = Object.values(fields).map(v => esc(v as string | number | null));
      parts.push(`INSERT OR IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${vals.join(', ')})`);
    }
    if (parts.length) await db.execute(parts.join(';\n') + ';');
  };

  await seedCatalog('muscle_group', [
    // --- Vista FRONTAL (Anterior) ---
    { name: 'Cabeza y cuello',           body_zone: 'anterior', sort_order: 1,  is_active: 1 },
    { name: 'Esternocleidomastoideo',   body_zone: 'anterior', sort_order: 2,  is_active: 1 },
    { name: 'Pectoral mayor',            body_zone: 'anterior', sort_order: 3,  is_active: 1 },
    { name: 'Pectoral menor',            body_zone: 'anterior', sort_order: 4,  is_active: 1 },
    { name: 'Deltoides anterior',        body_zone: 'anterior', sort_order: 5,  is_active: 1 },
    { name: 'Deltoides lateral',         body_zone: 'anterior', sort_order: 6,  is_active: 1 },
    { name: 'Bíceps braquial',           body_zone: 'anterior', sort_order: 7,  is_active: 1 },
    { name: 'Braquial anterior',         body_zone: 'anterior', sort_order: 8,  is_active: 1 },
    { name: 'Braquiorradial',            body_zone: 'anterior', sort_order: 9,  is_active: 1 },
    { name: 'Flexores antebrazo',        body_zone: 'anterior', sort_order: 10, is_active: 1 },
    { name: 'Recto abdominal',           body_zone: 'anterior', sort_order: 11, is_active: 1 },
    { name: 'Oblicuo externo',           body_zone: 'anterior', sort_order: 12, is_active: 1 },
    { name: 'Oblicuo interno',           body_zone: 'anterior', sort_order: 13, is_active: 1 },
    { name: 'Recto femoral',             body_zone: 'anterior', sort_order: 14, is_active: 1 },
    { name: 'Vasto lateral',             body_zone: 'anterior', sort_order: 15, is_active: 1 },
    { name: 'Vasto medial',              body_zone: 'anterior', sort_order: 16, is_active: 1 },
    { name: 'Vasto intermedio',          body_zone: 'anterior', sort_order: 17, is_active: 1 },
    { name: 'Aductores',                 body_zone: 'anterior', sort_order: 18, is_active: 1 },
    { name: 'Tibial anterior',           body_zone: 'anterior', sort_order: 19, is_active: 1 },

    // --- Vista POSTERIOR (Trasera) ---
    { name: 'Trapecio (superior)',       body_zone: 'posterior', sort_order: 20, is_active: 1 },
    { name: 'Trapecio (medio)',          body_zone: 'posterior', sort_order: 21, is_active: 1 },
    { name: 'Trapecio (inferior)',       body_zone: 'posterior', sort_order: 22, is_active: 1 },
    { name: 'Dorsal ancho',              body_zone: 'posterior', sort_order: 23, is_active: 1 },
    { name: 'Romboides',                 body_zone: 'posterior', sort_order: 24, is_active: 1 },
    { name: 'Erectores espinales',       body_zone: 'posterior', sort_order: 25, is_active: 1 },
    { name: 'Deltoides posterior',       body_zone: 'posterior', sort_order: 26, is_active: 1 },
    { name: 'Tríceps braquial',          body_zone: 'posterior', sort_order: 27, is_active: 1 },
    { name: 'Extensores antebrazo',      body_zone: 'posterior', sort_order: 28, is_active: 1 },
    { name: 'Glúteo mayor',             body_zone: 'posterior', sort_order: 29, is_active: 1 },
    { name: 'Glúteo medio',              body_zone: 'posterior', sort_order: 30, is_active: 1 },
    { name: 'Bíceps femoral',            body_zone: 'posterior', sort_order: 31, is_active: 1 },
    { name: 'Semitendinoso',             body_zone: 'posterior', sort_order: 32, is_active: 1 },
    { name: 'Semimembranoso',            body_zone: 'posterior', sort_order: 33, is_active: 1 },
    { name: 'Gastrocnemio (gemelos)',    body_zone: 'posterior', sort_order: 34, is_active: 1 },
    { name: 'Sóleo',                     body_zone: 'posterior', sort_order: 35, is_active: 1 },
  ]);

  await seedCatalog('equipment', [
    { name: 'Barra olímpica',     category: 'barbell',    sort_order: 1,  is_active: 1 },
    { name: 'Mancuernas',         category: 'dumbbell',   sort_order: 2,  is_active: 1 },
    { name: 'Kettlebell',         category: 'kettlebell', sort_order: 3,  is_active: 1 },
    { name: 'Anillas',            category: 'bodyweight', sort_order: 4,  is_active: 1 },
    { name: 'Pull-up bar',        category: 'bodyweight', sort_order: 5,  is_active: 1 },
    { name: 'Rower',              category: 'cardio',     sort_order: 6,  is_active: 1 },
    { name: 'Assault bike',       category: 'cardio',     sort_order: 7,  is_active: 1 },
    { name: 'Cuerda para saltar', category: 'cardio',     sort_order: 8,  is_active: 1 },
    { name: 'Box de salto',       category: 'other',      sort_order: 9,  is_active: 1 },
    { name: 'Banda elástica',     category: 'other',      sort_order: 10, is_active: 1 },
    { name: 'Balón medicinal',    category: 'other',      sort_order: 11, is_active: 1 },
    { name: 'Wall ball',          category: 'other',      sort_order: 12, is_active: 1 },
    { name: 'Paralelas',          category: 'bodyweight', sort_order: 13, is_active: 1 },
    { name: 'GHD',                category: 'machine',    sort_order: 14, is_active: 1 },
    { name: 'Sled',               category: 'other',      sort_order: 15, is_active: 1 },
  ]);

  await seedCatalog('measurement_unit', [
    { name: 'Kilogramos',   abbreviation: 'kg',  unit_type: 'weight',      sort_order: 1, is_active: 1 },
    { name: 'Libras',       abbreviation: 'lb',  unit_type: 'weight',      sort_order: 2, is_active: 1 },
    { name: 'Repeticiones', abbreviation: 'rep', unit_type: 'repetitions', sort_order: 3, is_active: 1 },
    { name: 'Calorías',     abbreviation: 'cal', unit_type: 'calories',    sort_order: 4, is_active: 1 },
    { name: 'Minutos',      abbreviation: 'min', unit_type: 'time',        sort_order: 5, is_active: 1 },
    { name: 'Segundos',     abbreviation: 'seg', unit_type: 'time',        sort_order: 6, is_active: 1 },
    { name: 'Metros',       abbreviation: 'm',   unit_type: 'distance',    sort_order: 7, is_active: 1 },
    { name: 'Kilómetros',   abbreviation: 'km',  unit_type: 'distance',    sort_order: 8, is_active: 1 },
    { name: 'Millas',       abbreviation: 'mi',  unit_type: 'distance',    sort_order: 9, is_active: 1 },
  ]);

  await seedCatalog('difficulty_level', [
    { name: 'Básico',     color: '#22c55e', numeric_value: 1, sort_order: 1, is_active: 1 },
    { name: 'Intermedio', color: '#f59e0b', numeric_value: 2, sort_order: 2, is_active: 1 },
    { name: 'Avanzado',   color: '#ef4444', numeric_value: 3, sort_order: 3, is_active: 1 },
    { name: 'Experto',    color: '#8b5cf6', numeric_value: 4, sort_order: 4, is_active: 1 },
  ]);

  await seedCatalog('tag', [
    { name: 'hombro',        color: '#6366f1', sort_order: 1,  is_active: 1 },
    { name: 'sentadilla',    color: '#8b5cf6', sort_order: 2,  is_active: 1 },
    { name: 'core',          color: '#ec4899', sort_order: 3,  is_active: 1 },
    { name: 'olímpico',      color: '#f59e0b', sort_order: 4,  is_active: 1 },
    { name: 'gimnástico',    color: '#22c55e', sort_order: 5,  is_active: 1 },
    { name: 'cardio',        color: '#ef4444', sort_order: 6,  is_active: 1 },
    { name: 'monoarticular', color: '#64748b', sort_order: 7,  is_active: 1 },
    { name: 'press',         color: '#0ea5e9', sort_order: 8,  is_active: 1 },
    { name: 'pull',          color: '#06b6d4', sort_order: 9,  is_active: 1 },
    { name: 'push',          color: '#0ea5e9', sort_order: 10, is_active: 1 },
    { name: 'bilateral',     color: '#64748b', sort_order: 11, is_active: 1 },
    { name: 'unilateral',    color: '#94a3b8', sort_order: 12, is_active: 1 },
    { name: 'isométrico',    color: '#64748b', sort_order: 13, is_active: 1 },
    { name: 'pliométrico',   color: '#f97316', sort_order: 14, is_active: 1 },
  ]);

  await seedCatalog('section_type', [
    { name: 'Entrada en calor', color: '#22c55e', icon: 'Flame',    default_order: 1, sort_order: 1, is_active: 1 },
    { name: 'Activación',       color: '#f59e0b', icon: 'Zap',      default_order: 2, sort_order: 2, is_active: 1 },
    { name: 'Fuerza',           color: '#ef4444', icon: 'Dumbbell', default_order: 3, sort_order: 3, is_active: 1 },
    { name: 'Habilidad',        color: '#8b5cf6', icon: 'Star',     default_order: 4, sort_order: 4, is_active: 1 },
    { name: 'WOD',              color: '#f97316', icon: 'Timer',    default_order: 5, sort_order: 5, is_active: 1 },
    { name: 'Vuelta a la calma',color: '#06b6d4', icon: 'Wind',     default_order: 6, sort_order: 6, is_active: 1 },
    { name: 'Accesorio',        color: '#64748b', icon: 'Plus',     default_order: 7, sort_order: 7, is_active: 1 },
  ]);

  await seedCatalog('work_format', [
    { name: 'Por rondas',    has_time_cap: 0, has_rounds: 1, sort_order: 1,  is_active: 1 },
    { name: 'EMOM',          has_time_cap: 1, has_rounds: 1, sort_order: 2,  is_active: 1 },
    { name: 'AMRAP',         has_time_cap: 1, has_rounds: 0, sort_order: 3,  is_active: 1 },
    { name: 'For Time',      has_time_cap: 1, has_rounds: 0, sort_order: 4,  is_active: 1 },
    { name: 'Series fijas',  has_time_cap: 0, has_rounds: 1, sort_order: 5,  is_active: 1 },
    { name: 'Trabajo libre', has_time_cap: 0, has_rounds: 0, sort_order: 6,  is_active: 1 },
    { name: 'Intervalos',    has_time_cap: 1, has_rounds: 1, sort_order: 7,  is_active: 1 },
    { name: 'Tabata',        has_time_cap: 1, has_rounds: 1, sort_order: 8,  is_active: 1 },
    { name: 'E2MOM',         has_time_cap: 1, has_rounds: 1, sort_order: 9,  is_active: 1 },
    { name: 'Escalera',      has_time_cap: 0, has_rounds: 0, sort_order: 10, is_active: 1 },
  ]);
}

// ── Inserción de ejercicios en lotes ──────────────────────────────────────────

async function seedExercisesFromJson(
  db: SQLiteDBConnection,
  exercises: Seed2Exercise[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  // Cargar mapas de IDs de los catálogos recién insertados
  const [diffRows, muscleRows, equipRows, tagRows, sectionRows, unitRows] = await Promise.all([
    db.query('SELECT id, name FROM difficulty_level'),
    db.query('SELECT id, name FROM muscle_group'),
    db.query('SELECT id, name FROM equipment'),
    db.query('SELECT id, name FROM tag'),
    db.query('SELECT id, name FROM section_type'),
    db.query('SELECT id, name FROM measurement_unit'),
  ]);

  const diffMap    = new Map((diffRows.values    ?? []).map((r: any) => [r.name, r.id] as [string, string]));
  const muscleMap  = new Map((muscleRows.values  ?? []).map((r: any) => [r.name, r.id] as [string, string]));
  const equipMap   = new Map((equipRows.values   ?? []).map((r: any) => [r.name, r.id] as [string, string]));
  const tagMap     = new Map((tagRows.values     ?? []).map((r: any) => [r.name, r.id] as [string, string]));
  const sectionMap = new Map((sectionRows.values ?? []).map((r: any) => [r.name, r.id] as [string, string]));
  const unitMap    = new Map((unitRows.values    ?? []).map((r: any) => [r.name, r.id] as [string, string]));

  const BATCH = 1000;
  for (let i = 0; i < exercises.length; i += BATCH) {
    const batch = exercises.slice(i, i + BATCH);
    const stmts: { statement: string; values: unknown[] }[] = [];

    for (const ex of batch) {
      const exId = generateUUID();
      const diffId    = ex.difficulty    ? diffMap.get(ex.difficulty)    ?? null : null;
      
      // Mapeo de compatibilidad para grupos musculares antiguos
      let muscleName = ex.primaryMuscle;
      if (muscleName === 'Pectorales') muscleName = 'Pectoral mayor';
      else if (muscleName === 'Dorsales') muscleName = 'Dorsal ancho';
      else if (muscleName === 'Deltoides') muscleName = 'Deltoides anterior';
      else if (muscleName === 'Bíceps') muscleName = 'Bíceps braquial';
      else if (muscleName === 'Tríceps') muscleName = 'Tríceps braquial';
      else if (muscleName === 'Trapecio') muscleName = 'Trapecio (superior)';
      else if (muscleName === 'Antebrazos') muscleName = 'Flexores antebrazo';
      else if (muscleName === 'Cuádriceps') muscleName = 'Recto femoral';
      else if (muscleName === 'Isquiotibiales') muscleName = 'Bíceps femoral';
      else if (muscleName === 'Glúteos') muscleName = 'Glúteo mayor';
      else if (muscleName === 'Pantorrillas') muscleName = 'Gastrocnemio (gemelos)';
      else if (muscleName === 'Core/Abdominales') muscleName = 'Recto abdominal';

      const muscleId  = muscleName ? muscleMap.get(muscleName) ?? null : null;

      stmts.push({
        statement: `INSERT OR IGNORE INTO exercise
          (id, name, video_path, video_long_path, difficulty_level_id, primary_muscle_group_id, is_compound, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        values: [exId, ex.name, ex.video_path, ex.video_long_path, diffId, muscleId, ex.is_compound],
      });

      for (const eqName of ex.equipment) {
        const eqId = equipMap.get(eqName);
        if (eqId) stmts.push({
          statement: 'INSERT OR IGNORE INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?, ?, ?, 1)',
          values: [generateUUID(), exId, eqId],
        });
      }

      for (const tagName of ex.tags) {
        const tagId = tagMap.get(tagName);
        if (tagId) stmts.push({
          statement: 'INSERT OR IGNORE INTO exercise_tag (id, exercise_id, tag_id) VALUES (?, ?, ?)',
          values: [generateUUID(), exId, tagId],
        });
      }

      for (const secName of ex.sections) {
        const secId = sectionMap.get(secName);
        if (secId) stmts.push({
          statement: 'INSERT OR IGNORE INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?, ?, ?)',
          values: [generateUUID(), exId, secId],
        });
      }

      for (let ui = 0; ui < ex.units.length; ui++) {
        const unitId = unitMap.get(ex.units[ui]);
        if (unitId) stmts.push({
          statement: 'INSERT OR IGNORE INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, ?)',
          values: [generateUUID(), exId, unitId, ui === 0 ? 1 : 0],
        });
      }
    }

    await db.executeSet(stmts, true);
    const loaded = Math.min(i + BATCH, exercises.length);
    onProgress?.(loaded, exercises.length);
    console.log(`[Seed] Batch insertado (${loaded} / ${exercises.length}).`);
  }

  // Persistir cambios intermedios para asegurar que los ejercicios estén "visibles" para las plantillas
  const { saveDatabase } = await import('../db/database');
  await saveDatabase();
  console.log('[Seed] Flush intermedio completado. Ejercicios persistidos.');
}

// ── Punto de entrada unificado ────────────────────────────────────────────────

export interface SeedResult {
  exercises: number;
  updatedImages: number;
  mappedMuscles: number;
  finished: boolean;
}

/**
 * Borra absolutamente todas las tablas y persiste el cambio.
 */
export async function cleanDatabase(): Promise<void> {
  console.log('[Seed] Iniciando borrado total...');
  const { getDatabase, closeDatabase } = await import('../db/database');
  const db = getDatabase();
  await resetDatabase(db);
  await delay(1000);
  await closeDatabase();
  console.log('[Seed] Base de datos limpia y conexión cerrada.');
}

/**
 * Inicialización unificada (solo manual desde la UI):
 * 1. Re-ejecuta las migraciones (crea tablas si no existen tras un clean)
 * 2. Inserta catálogos base
 * 3. Inserta los 3.242 ejercicios del JSON
 * ...
 */
export async function reSeedAll(
  onProgress?: (loaded: number, total: number) => void
): Promise<SeedResult> {
  console.log('[Seed] Iniciando carga masiva de datos...');

  const result: SeedResult = {
    exercises: 0,
    updatedImages: 0,
    mappedMuscles: 0,
    finished: false
  };

  const { openDatabase } = await import('../db/database');
  const db = await openDatabase();

  // 1. Re-crear las tablas ejecutando las migraciones
  const { runMigrations } = await import('../services/migrationService');
  const { migrations } = await import('../db/migrations');
  await db.execute('PRAGMA foreign_keys = ON;');
  await runMigrations(db, migrations);
  console.log('[Seed] Esquema de base de datos verificado/creado.');

  // 2. Insertar catálogos
  await delay(500);
  await seedCatalogs(db);
  console.log('[Seed] Catálogos insertados.');

  // 3. Cargar e insertar ejercicios
  await delay(500);
  const exercises = await loadExercisesJson();
  result.exercises = exercises.length;
  console.log(`[Seed] Insertando ${exercises.length} ejercicios...`);
  await seedExercisesFromJson(db, exercises, onProgress);

  // 4. Plantillas del Open 26, Girls, Heroes, WODs
  await delay(500);
  const { addOpenTemplates } = await import('./seedService3');
  await addOpenTemplates(db);

  await delay(200);
  const { addGirlsTemplates, addHeroesTemplates } = await import('./seedService4');
  await addGirlsTemplates(db);
  await addHeroesTemplates(db);

  await delay(200);
  const { addDailyWodsMarch2026 } = await import('./seedService5');
  await addDailyWodsMarch2026(db);

  await delay(200);
  const { addDailyWodsFebMar2026 } = await import('./seedService6');
  await addDailyWodsFebMar2026(db);

  // 10. Asignar imágenes SVG
  await delay(500);
  const { updateExerciseImages } = await import('./imageUpdateService');
  result.updatedImages = await updateExerciseImages(db);

  // 11. Asignar grupos musculares detallados (Mapa Corporal)
  await delay(500);
  const { seedExerciseMuscleGroups } = await import('./muscleSeedService');
  result.mappedMuscles = await seedExerciseMuscleGroups(db);

  // 12. Cerrar la conexión para persistir
  await delay(500);
  const { closeDatabase } = await import('../db/database');
  await closeDatabase();
  console.log('[Seed] Datos persistidos y conexión cerrada.');

  result.finished = true;
  return result;
}

// Exportada para uso en seedService3 (addOpenTemplates puede usarla como fallback)
export { seedCatalogs };
