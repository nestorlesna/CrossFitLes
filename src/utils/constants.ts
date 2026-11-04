// Constantes globales de la aplicación

// Nombre histórico, NO cambiar: en web (npm run dev) la BD vive en IndexedDB con este nombre
// y renombrarla dejaría la app vacía. Es interno y no lo ve el usuario.
export const DB_NAME = 'crossfit_tracker';
export const DB_VERSION = 1;
// Nombre de la app. Va en el campo `meta.app` / `app` de backups, clases compartidas y contenido
// publicado, y se valida al importar.
export const APP_NAME = 'FitLesUY Session Tracker';
export const APP_SHORT_NAME = 'FitLesUY';
// Nombres anteriores: los archivos generados con ellos se siguen aceptando al importar.
const LEGACY_APP_NAMES = ['CrossFit Session Tracker'];
export function isKnownAppName(name: unknown): boolean {
  return name === APP_NAME || LEGACY_APP_NAMES.includes(name as string);
}

// Única fuente de verdad: src/config/version.ts (la actualiza scripts/release.ps1)
export { APP_VERSION } from '../config/version';
// Carpeta de media en el filesystem nativo (Directory.Data). Los backups guardan rutas
// relativas a esta carpeta, así que un backup de la app vieja se restaura bien acá.
export const MEDIA_BASE_DIR = 'fitlesuy/media';
export const MEDIA_DIRS = {
  muscles: `${MEDIA_BASE_DIR}/muscles`,
  equipment: `${MEDIA_BASE_DIR}/equipment`,
  exercises: `${MEDIA_BASE_DIR}/exercises`,
  other: `${MEDIA_BASE_DIR}/other`,
} as const;
