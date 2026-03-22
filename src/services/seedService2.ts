// Inicialización unificada: borra todo e inserta catálogos + 3.242 ejercicios del Excel
// Todo ocurre en una sola sesión (sin recarga intermedia).
// Los ejercicios se cargan de /public/seed2_exercises.json (fetch lazy, ~1MB)

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';
import { resetDatabase } from './seedService';

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
    { name: 'Pectorales',       body_zone: 'upper_body', sort_order: 1,  is_active: 1 },
    { name: 'Dorsales',         body_zone: 'upper_body', sort_order: 2,  is_active: 1 },
    { name: 'Deltoides',        body_zone: 'upper_body', sort_order: 3,  is_active: 1 },
    { name: 'Bíceps',           body_zone: 'upper_body', sort_order: 4,  is_active: 1 },
    { name: 'Tríceps',          body_zone: 'upper_body', sort_order: 5,  is_active: 1 },
    { name: 'Trapecio',         body_zone: 'upper_body', sort_order: 6,  is_active: 1 },
    { name: 'Antebrazos',       body_zone: 'upper_body', sort_order: 7,  is_active: 1 },
    { name: 'Cuádriceps',       body_zone: 'lower_body', sort_order: 8,  is_active: 1 },
    { name: 'Isquiotibiales',   body_zone: 'lower_body', sort_order: 9,  is_active: 1 },
    { name: 'Glúteos',          body_zone: 'lower_body', sort_order: 10, is_active: 1 },
    { name: 'Pantorrillas',     body_zone: 'lower_body', sort_order: 11, is_active: 1 },
    { name: 'Core/Abdominales', body_zone: 'core',       sort_order: 12, is_active: 1 },
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

  const BATCH = 50;
  for (let i = 0; i < exercises.length; i += BATCH) {
    const batch = exercises.slice(i, i + BATCH);
    const stmts: { statement: string; values: unknown[] }[] = [];

    for (const ex of batch) {
      const exId = generateUUID();
      const diffId    = ex.difficulty    ? diffMap.get(ex.difficulty)    ?? null : null;
      const muscleId  = ex.primaryMuscle ? muscleMap.get(ex.primaryMuscle) ?? null : null;

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
    console.log(`[Seed] Ejercicios insertados: ${loaded} / ${exercises.length}`);
  }
}

// ── Punto de entrada unificado ────────────────────────────────────────────────

/**
 * Inicialización unificada (solo manual desde la UI):
 *  1. Borra toda la base de datos
 *  2. Re-abre la conexión (vuelve a correr las migraciones)
 *  3. Inserta los catálogos base
 *  4. Inserta los 3.242 ejercicios del JSON
 *
 * onProgress(loaded, total) se llama tras cada lote de ejercicios.
 */
export async function resetAndReSeedAll(
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  console.log('[Seed] Iniciando inicialización unificada...');

  // 1. Obtener la conexión activa y borrar todas las tablas
  const { getDatabase } = await import('../db/database');
  const db = getDatabase();
  await resetDatabase(db);
  console.log('[Seed] Tablas borradas.');

  // 2. Re-crear las tablas ejecutando las migraciones en la MISMA conexión.
  //    No cerrar/reabrir: en jeep-sqlite (web) el singleton no puede reconectar
  //    limpiamente dentro de la misma sesión.
  const { runMigrations } = await import('../services/migrationService');
  const { migrations } = await import('../db/migrations');
  await db.execute('PRAGMA foreign_keys = ON;');
  await runMigrations(db, migrations);
  console.log('[Seed] Migraciones re-ejecutadas.');

  // 3. Insertar catálogos
  console.log('[Seed] Insertando catálogos...');
  await seedCatalogs(db);
  console.log('[Seed] Catálogos insertados.');

  // 4. Cargar y insertar ejercicios
  console.log('[Seed] Cargando ejercicios del JSON...');
  const exercises = await loadExercisesJson();
  console.log(`[Seed] Insertando ${exercises.length} ejercicios...`);
  await seedExercisesFromJson(db, exercises, onProgress);

  // 5. Cerrar la conexión para que jeep-sqlite persista a IndexedDB antes del reload
  const { closeDatabase } = await import('../db/database');
  await closeDatabase();
  console.log('[Seed] Conexión cerrada — datos persistidos al store.');

  console.log('[Seed] Inicialización completada.');
}

// Exportada para uso en seedService3 (addOpenTemplates puede usarla como fallback)
export { seedCatalogs };
