// Migración v003: agrega columna video_long_path a la tabla exercise
// para almacenar un segundo link de video (video explicativo)

import { Migration } from '../../services/migrationService';

export const v003_exercise_video_long: Migration = {
  version: 3,
  name: 'exercise_video_long',
  up: [
    `ALTER TABLE exercise ADD COLUMN video_long_path TEXT`,
  ],
  down: [
    // SQLite no soporta DROP COLUMN en versiones antiguas; se omite
  ],
};
