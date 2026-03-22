import { Migration } from '../../services/migrationService';

/**
 * Migración v005: Limpieza de imágenes
 * 1. Mueve cualquier dato de image_path a image_url si image_url está vacío.
 * 2. Prepara la estructura para usar únicamente image_url en el futuro.
 * NOTA: SQLite no permite DROP COLUMN fácilmente en todas las versiones, 
 * por lo que simplemente dejaremos de usar la columna o la renombraremos si es posible.
 * En esta versión, vamos a unificar los datos.
 */
export const v005_clean_images: Migration = {
  version: 5,
  name: 'v005_clean_images',
  up: [
    // Asegurar que image_url tenga los datos de image_path si image_path no es nulo y url sí lo es
    `UPDATE exercise SET image_url = image_path WHERE (image_url IS NULL OR image_url = '') AND (image_path IS NOT NULL AND image_path != '')`,
    // Opcional: limpiar image_path para evitar duplicidad en backups
    `UPDATE exercise SET image_path = NULL`
  ],
  down: [
    // Revertir (estimado)
    `UPDATE exercise SET image_path = image_url WHERE image_path IS NULL`
  ],
};
