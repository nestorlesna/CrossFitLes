// Migración v010: quitar FK de exercise_image (la relación es indirecta via exercise.image_url)
import { Migration } from '../../services/migrationService';

export const v010_fix_exercise_image_fk: Migration = {
  version: 10,
  name: 'v010_fix_exercise_image_fk',
  up: [
    // SQLite no soporta DROP CONSTRAINT, hay que recrear la tabla
    `CREATE TABLE IF NOT EXISTS exercise_image_new (
      id TEXT PRIMARY KEY,
      exercise_id TEXT,
      data_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `INSERT OR REPLACE INTO exercise_image_new SELECT * FROM exercise_image`,
    `DROP TABLE IF EXISTS exercise_image`,
    `ALTER TABLE exercise_image_new RENAME TO exercise_image`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_image_exercise ON exercise_image(exercise_id)`,
  ],
  down: [],
};
