// Repositorio de la configuración global del cronómetro (singleton)

import { getDatabase, saveDatabase } from '../database';
import { TimerConfig, TIMER_CONFIG_ID, DEFAULT_TIMER_CONFIG } from '../../models/TimerConfig';

function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// Columnas editables desde la UI
const EDITABLE_COLUMNS: (keyof TimerConfig)[] = [
  'default_exercise_seconds',
  'rest_between_exercises_seconds',
  'rest_between_rounds_seconds',
  'rest_between_sections_seconds',
  'default_interval_seconds',
  'lead_in_seconds',
  'warning_seconds',
  'sound_enabled',
  'vibration_enabled',
  'keep_awake',
  'auto_advance_reps',
];

// Obtiene la configuración; si la fila no existe la crea con los valores por defecto
export async function get(): Promise<TimerConfig> {
  const db = getDatabase();
  const result = await db.query(`SELECT * FROM timer_config LIMIT 1`);
  const row = result.values?.[0] as TimerConfig | undefined;

  if (row) return row;

  const timestamp = now();
  await db.run(
    `INSERT INTO timer_config (id, created_at, updated_at) VALUES (?, ?, ?)`,
    [TIMER_CONFIG_ID, timestamp, timestamp]
  );
  await saveDatabase();
  return { ...DEFAULT_TIMER_CONFIG, created_at: timestamp, updated_at: timestamp };
}

// Actualiza los campos editables de la configuración
export async function update(changes: Partial<TimerConfig>): Promise<void> {
  const db = getDatabase();
  const current = await get();

  const fields: Record<string, unknown> = {};
  for (const column of EDITABLE_COLUMNS) {
    if (changes[column] !== undefined) fields[column] = changes[column];
  }
  if (Object.keys(fields).length === 0) return;

  fields.updated_at = now();
  const sets = Object.keys(fields).map((k) => `${k} = ?`).join(', ');

  await db.run(
    `UPDATE timer_config SET ${sets} WHERE id = ?`,
    [...Object.values(fields), current.id]
  );
  await saveDatabase();
}
