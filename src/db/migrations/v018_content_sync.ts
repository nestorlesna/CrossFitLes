// Migración v018: sincronización de contenido online (repo público CrossFitLes-content).
// - global_key: identidad estable entre dispositivos (los seeds generan UUID distintos en
//   cada instalación, así que el id local no sirve para reconocer "el mismo" ejercicio).
// - origin: 'local' (creado en este dispositivo) | 'remote' (bajado del contenido publicado).
// - remote_hash: hash del contenido remoto aplicado; si cambia en una publicación nueva, se actualiza.
// - user_modified: 1 si el usuario editó el registro; el sync no lo vuelve a pisar.
// Los catálogos no necesitan global_key: su nombre es UNIQUE y se resuelven por nombre.
import { Migration } from '../../services/migrationService';

const SYNC_TABLES = ['exercise', 'class_template', 'training_plan'] as const;

export const v018_content_sync: Migration = {
  version: 18,
  name: 'v018_content_sync',
  up: [
    ...SYNC_TABLES.flatMap((table) => [
      `ALTER TABLE ${table} ADD COLUMN global_key TEXT`,
      `ALTER TABLE ${table} ADD COLUMN origin TEXT NOT NULL DEFAULT 'local'`,
      `ALTER TABLE ${table} ADD COLUMN remote_hash TEXT`,
      `ALTER TABLE ${table} ADD COLUMN user_modified INTEGER NOT NULL DEFAULT 0`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_global_key ON ${table}(global_key) WHERE global_key IS NOT NULL`,
    ]),
    // Ajustes de la app (clave/valor): versión de contenido aplicada, última sincronización, etc.
    `CREATE TABLE IF NOT EXISTS app_setting (
      key        TEXT PRIMARY KEY,
      value      TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ],
  down: [`DROP TABLE IF EXISTS app_setting`],
};
