// Ajustes clave/valor de la app guardados en SQLite (tabla app_setting)
import { getDatabase } from '../database';

export async function getSetting(key: string): Promise<string | null> {
  const db = getDatabase();
  const result = await db.query('SELECT value FROM app_setting WHERE key = ?', [key]);
  return (result.values?.[0]?.value as string | null) ?? null;
}

// Sentencia de upsert para usar dentro de un executeSet (transacción)
export function setSettingStmt(key: string, value: string | null): { statement: string; values: unknown[] } {
  return {
    statement: `INSERT INTO app_setting (key, value, updated_at) VALUES (?, ?, datetime('now'))
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    values: [key, value],
  };
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  const db = getDatabase();
  const stmt = setSettingStmt(key, value);
  await db.run(stmt.statement, stmt.values);
}
