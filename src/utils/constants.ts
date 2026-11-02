// Constantes globales de la aplicación

export const DB_NAME = 'crossfit_tracker';
export const DB_VERSION = 1;
// Única fuente de verdad: src/config/version.ts (la actualiza scripts/release.ps1)
export { APP_VERSION } from '../config/version';
export const MEDIA_BASE_DIR = 'crossfit-tracker/media';
export const MEDIA_DIRS = {
  muscles: 'crossfit-tracker/media/muscles',
  equipment: 'crossfit-tracker/media/equipment',
  exercises: 'crossfit-tracker/media/exercises',
  other: 'crossfit-tracker/media/other',
} as const;
