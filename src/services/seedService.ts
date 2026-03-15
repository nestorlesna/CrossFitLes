// Servicio de datos semilla para la aplicación
// Se ejecuta UNA SOLA VEZ al inicializar la BD (controlado por localStorage)

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

const SEED_FLAG = 'seed_v1_done';

// Verifica si el seed ya fue ejecutado
function isSeedDone(): boolean {
  return localStorage.getItem(SEED_FLAG) === 'true';
}

// Marca el seed como completado
function markSeedDone(): void {
  localStorage.setItem(SEED_FLAG, 'true');
}

// Inserta un registro de catálogo con manejo de errores individual
async function insertRecord(
  db: SQLiteDBConnection,
  table: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const id = generateUUID();
    const fields = { id, ...data };
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const placeholders = keys.map(() => '?').join(', ');

    await db.run(
      `INSERT OR IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
  } catch (err) {
    // Si falla un registro, loguear y continuar sin abortar el seed
    console.warn(`[Seed] Error al insertar en ${table}:`, data, err);
  }
}

// Ejecuta el seed completo si no fue ejecutado antes
export async function runSeed(db: SQLiteDBConnection): Promise<void> {
  if (isSeedDone()) return;

  console.log('[Seed] Iniciando carga de datos semilla...');

  // ─── Grupos musculares ───────────────────────────────────────────────────
  const muscleGroups = [
    { name: 'Pectorales', body_zone: 'upper_body', sort_order: 1, is_active: 1 },
    { name: 'Dorsales', body_zone: 'upper_body', sort_order: 2, is_active: 1 },
    { name: 'Deltoides', body_zone: 'upper_body', sort_order: 3, is_active: 1 },
    { name: 'Bíceps', body_zone: 'upper_body', sort_order: 4, is_active: 1 },
    { name: 'Tríceps', body_zone: 'upper_body', sort_order: 5, is_active: 1 },
    { name: 'Trapecio', body_zone: 'upper_body', sort_order: 6, is_active: 1 },
    { name: 'Antebrazos', body_zone: 'upper_body', sort_order: 7, is_active: 1 },
    { name: 'Cuádriceps', body_zone: 'lower_body', sort_order: 8, is_active: 1 },
    { name: 'Isquiotibiales', body_zone: 'lower_body', sort_order: 9, is_active: 1 },
    { name: 'Glúteos', body_zone: 'lower_body', sort_order: 10, is_active: 1 },
    { name: 'Pantorrillas', body_zone: 'lower_body', sort_order: 11, is_active: 1 },
    { name: 'Core/Abdominales', body_zone: 'core', sort_order: 12, is_active: 1 },
  ];
  for (const item of muscleGroups) {
    await insertRecord(db, 'muscle_group', item);
  }

  // ─── Equipamiento ────────────────────────────────────────────────────────
  const equipment = [
    { name: 'Barra olímpica', category: 'barbell', sort_order: 1, is_active: 1 },
    { name: 'Mancuernas', category: 'dumbbell', sort_order: 2, is_active: 1 },
    { name: 'Kettlebell', category: 'kettlebell', sort_order: 3, is_active: 1 },
    { name: 'Anillas', category: 'bodyweight', sort_order: 4, is_active: 1 },
    { name: 'Pull-up bar', category: 'bodyweight', sort_order: 5, is_active: 1 },
    { name: 'Rower', category: 'cardio', sort_order: 6, is_active: 1 },
    { name: 'Assault bike', category: 'cardio', sort_order: 7, is_active: 1 },
    { name: 'Cuerda para saltar', category: 'cardio', sort_order: 8, is_active: 1 },
    { name: 'Box de salto', category: 'other', sort_order: 9, is_active: 1 },
    { name: 'Banda elástica', category: 'other', sort_order: 10, is_active: 1 },
    { name: 'Balón medicinal', category: 'other', sort_order: 11, is_active: 1 },
    { name: 'Wall ball', category: 'other', sort_order: 12, is_active: 1 },
    { name: 'Paralelas', category: 'bodyweight', sort_order: 13, is_active: 1 },
    { name: 'GHD', category: 'machine', sort_order: 14, is_active: 1 },
    { name: 'Sled', category: 'other', sort_order: 15, is_active: 1 },
  ];
  for (const item of equipment) {
    await insertRecord(db, 'equipment', item);
  }

  // ─── Unidades de medida ──────────────────────────────────────────────────
  const measurementUnits = [
    { name: 'Kilogramos', abbreviation: 'kg', unit_type: 'weight', sort_order: 1, is_active: 1 },
    { name: 'Libras', abbreviation: 'lb', unit_type: 'weight', sort_order: 2, is_active: 1 },
    { name: 'Repeticiones', abbreviation: 'rep', unit_type: 'repetitions', sort_order: 3, is_active: 1 },
    { name: 'Calorías', abbreviation: 'cal', unit_type: 'calories', sort_order: 4, is_active: 1 },
    { name: 'Minutos', abbreviation: 'min', unit_type: 'time', sort_order: 5, is_active: 1 },
    { name: 'Segundos', abbreviation: 'seg', unit_type: 'time', sort_order: 6, is_active: 1 },
    { name: 'Metros', abbreviation: 'm', unit_type: 'distance', sort_order: 7, is_active: 1 },
    { name: 'Kilómetros', abbreviation: 'km', unit_type: 'distance', sort_order: 8, is_active: 1 },
    { name: 'Millas', abbreviation: 'mi', unit_type: 'distance', sort_order: 9, is_active: 1 },
  ];
  for (const item of measurementUnits) {
    await insertRecord(db, 'measurement_unit', item);
  }

  // ─── Niveles de dificultad ───────────────────────────────────────────────
  const difficultyLevels = [
    { name: 'Básico', color: '#22c55e', numeric_value: 1, sort_order: 1, is_active: 1 },
    { name: 'Intermedio', color: '#f59e0b', numeric_value: 2, sort_order: 2, is_active: 1 },
    { name: 'Avanzado', color: '#ef4444', numeric_value: 3, sort_order: 3, is_active: 1 },
    { name: 'Experto', color: '#8b5cf6', numeric_value: 4, sort_order: 4, is_active: 1 },
  ];
  for (const item of difficultyLevels) {
    await insertRecord(db, 'difficulty_level', item);
  }

  // ─── Tags ────────────────────────────────────────────────────────────────
  const tags = [
    { name: 'hombro', color: '#6366f1', sort_order: 1, is_active: 1 },
    { name: 'sentadilla', color: '#8b5cf6', sort_order: 2, is_active: 1 },
    { name: 'core', color: '#ec4899', sort_order: 3, is_active: 1 },
    { name: 'olímpico', color: '#f59e0b', sort_order: 4, is_active: 1 },
    { name: 'gimnástico', color: '#22c55e', sort_order: 5, is_active: 1 },
    { name: 'cardio', color: '#ef4444', sort_order: 6, is_active: 1 },
    { name: 'monoarticular', color: '#64748b', sort_order: 7, is_active: 1 },
    { name: 'press', color: '#0ea5e9', sort_order: 8, is_active: 1 },
    { name: 'pull', color: '#06b6d4', sort_order: 9, is_active: 1 },
    { name: 'push', color: '#0ea5e9', sort_order: 10, is_active: 1 },
    { name: 'bilateral', color: '#64748b', sort_order: 11, is_active: 1 },
    { name: 'unilateral', color: '#94a3b8', sort_order: 12, is_active: 1 },
    { name: 'isométrico', color: '#64748b', sort_order: 13, is_active: 1 },
    { name: 'pliométrico', color: '#f97316', sort_order: 14, is_active: 1 },
  ];
  for (const item of tags) {
    await insertRecord(db, 'tag', item);
  }

  // ─── Tipos de sección ────────────────────────────────────────────────────
  const sectionTypes = [
    // default_order y sort_order con el mismo valor (sort_order lo usa el repositorio genérico)
    { name: 'Entrada en calor', color: '#22c55e', icon: 'Flame', default_order: 1, sort_order: 1, is_active: 1 },
    { name: 'Activación', color: '#f59e0b', icon: 'Zap', default_order: 2, sort_order: 2, is_active: 1 },
    { name: 'Fuerza', color: '#ef4444', icon: 'Dumbbell', default_order: 3, sort_order: 3, is_active: 1 },
    { name: 'Habilidad', color: '#8b5cf6', icon: 'Star', default_order: 4, sort_order: 4, is_active: 1 },
    { name: 'WOD', color: '#f97316', icon: 'Timer', default_order: 5, sort_order: 5, is_active: 1 },
    { name: 'Vuelta a la calma', color: '#06b6d4', icon: 'Wind', default_order: 6, sort_order: 6, is_active: 1 },
    { name: 'Accesorio', color: '#64748b', icon: 'Plus', default_order: 7, sort_order: 7, is_active: 1 },
  ];
  for (const item of sectionTypes) {
    await insertRecord(db, 'section_type', item);
  }

  // ─── Formatos de trabajo ─────────────────────────────────────────────────
  const workFormats = [
    { name: 'Por rondas', has_time_cap: 0, has_rounds: 1, sort_order: 1, is_active: 1 },
    { name: 'EMOM', has_time_cap: 1, has_rounds: 1, sort_order: 2, is_active: 1 },
    { name: 'AMRAP', has_time_cap: 1, has_rounds: 0, sort_order: 3, is_active: 1 },
    { name: 'For Time', has_time_cap: 1, has_rounds: 0, sort_order: 4, is_active: 1 },
    { name: 'Series fijas', has_time_cap: 0, has_rounds: 1, sort_order: 5, is_active: 1 },
    { name: 'Trabajo libre', has_time_cap: 0, has_rounds: 0, sort_order: 6, is_active: 1 },
    { name: 'Intervalos', has_time_cap: 1, has_rounds: 1, sort_order: 7, is_active: 1 },
    { name: 'Tabata', has_time_cap: 1, has_rounds: 1, sort_order: 8, is_active: 1 },
    { name: 'E2MOM', has_time_cap: 1, has_rounds: 1, sort_order: 9, is_active: 1 },
    { name: 'Escalera', has_time_cap: 0, has_rounds: 0, sort_order: 10, is_active: 1 },
  ];
  for (const item of workFormats) {
    await insertRecord(db, 'work_format', item);
  }

  markSeedDone();
  console.log('[Seed] Datos semilla cargados correctamente.');
}
