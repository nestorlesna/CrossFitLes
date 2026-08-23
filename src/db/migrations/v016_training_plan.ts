// Migración v016: planes de entrenamiento con días programados en calendario.
// Un plan es una lista ordenada de días; cada día apunta a una class_template
// (una clase existente o una plantilla privada armada a mano para ese día).
import { Migration } from '../../services/migrationService';

export const v016_training_plan: Migration = {
  version: 16,
  name: 'v016_training_plan',
  up: [
    `CREATE TABLE IF NOT EXISTS training_plan (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT,
      goal          TEXT,
      start_date    TEXT,
      schedule_mode TEXT NOT NULL DEFAULT 'dates',
      status        TEXT NOT NULL DEFAULT 'active',
      color         TEXT,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS plan_day (
      id                  TEXT PRIMARY KEY,
      training_plan_id    TEXT NOT NULL,
      day_index           INTEGER NOT NULL,
      scheduled_date      TEXT,
      day_type            TEXT NOT NULL DEFAULT 'class',
      class_template_id   TEXT,
      title               TEXT,
      notes               TEXT,
      status              TEXT NOT NULL DEFAULT 'pending',
      training_session_id TEXT,
      completed_at        TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (training_plan_id) REFERENCES training_plan(id) ON DELETE CASCADE,
      FOREIGN KEY (class_template_id) REFERENCES class_template(id) ON DELETE SET NULL,
      FOREIGN KEY (training_session_id) REFERENCES training_session(id) ON DELETE SET NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_plan_day_plan ON plan_day(training_plan_id, day_index)`,
    `CREATE INDEX IF NOT EXISTS idx_plan_day_date ON plan_day(scheduled_date)`,
    `CREATE INDEX IF NOT EXISTS idx_plan_day_session ON plan_day(training_session_id)`,
    // Marca las plantillas privadas de un día del plan: no aparecen en /clases
    `ALTER TABLE class_template ADD COLUMN is_plan_day INTEGER NOT NULL DEFAULT 0`,
  ],
  down: [
    `DROP TABLE IF EXISTS plan_day`,
    `DROP TABLE IF EXISTS training_plan`,
  ],
};
