// Migración v012: plantillas del timer libre (For Time, AMRAP, EMOM, Tabata,
// intervalos fijos/variables), independientes de las clases.
import { Migration } from '../../services/migrationService';

export const v012_free_timer_templates: Migration = {
  version: 12,
  name: 'v012_free_timer_templates',
  up: [
    `CREATE TABLE IF NOT EXISTS free_timer_template (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      preset       TEXT NOT NULL,
      config_json  TEXT NOT NULL,
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ],
  down: [
    `DROP TABLE IF EXISTS free_timer_template`,
  ],
};
