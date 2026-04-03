// Migración v009: tabla para almacenar imágenes de ejercicios en SQLite
// Esto resuelve el problema de que localStorage no se comparte entre web y Android
// Nota: No hay FK a exercise porque la relación es indirecta via exercise.image_url
import { Migration } from '../../services/migrationService';

export const v009_exercise_images: Migration = {
  version: 9,
  name: 'v009_exercise_images',
  up: [
    `CREATE TABLE IF NOT EXISTS exercise_image (
      id TEXT PRIMARY KEY,
      exercise_id TEXT,
      data_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_image_exercise ON exercise_image(exercise_id)`,
  ],
  down: [],
};
