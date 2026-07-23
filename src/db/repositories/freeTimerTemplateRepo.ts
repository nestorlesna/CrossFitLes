// Repositorio de plantillas del timer libre (For Time, AMRAP, EMOM, Tabata, intervalos)

import { getDatabase, saveDatabase } from '../database';
import { generateUUID } from '../../utils/formatters';
import { FreeTimerConfig, FreeTimerTemplate } from '../../models/FreeTimer';

function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export async function getAll(): Promise<FreeTimerTemplate[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM free_timer_template WHERE is_active = 1 ORDER BY updated_at DESC`
  );
  return (result.values ?? []) as FreeTimerTemplate[];
}

export async function getById(id: string): Promise<FreeTimerTemplate | null> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM free_timer_template WHERE id = ? AND is_active = 1 LIMIT 1`,
    [id]
  );
  return (result.values?.[0] as FreeTimerTemplate | undefined) ?? null;
}

export async function create(config: FreeTimerConfig): Promise<string> {
  const db = getDatabase();
  const timestamp = now();

  await db.run(
    `INSERT INTO free_timer_template (id, name, preset, config_json, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [config.id, config.name, config.preset, JSON.stringify(config), timestamp, timestamp]
  );
  await saveDatabase();
  return config.id;
}

export async function update(id: string, config: FreeTimerConfig): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE free_timer_template SET name = ?, preset = ?, config_json = ?, updated_at = ? WHERE id = ?`,
    [config.name, config.preset, JSON.stringify(config), now(), id]
  );
  await saveDatabase();
}

export async function remove(id: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `UPDATE free_timer_template SET is_active = 0, updated_at = ? WHERE id = ?`,
    [now(), id]
  );
  await saveDatabase();
}

export async function duplicate(id: string): Promise<string | null> {
  const template = await getById(id);
  if (!template) return null;

  const config: FreeTimerConfig = JSON.parse(template.config_json);
  const timestamp = new Date().toISOString();
  const newConfig: FreeTimerConfig = {
    ...config,
    id: generateUUID(),
    name: `${config.name} (copia)`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return create(newConfig);
}
