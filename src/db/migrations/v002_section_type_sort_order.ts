// Migración v002: agrega columna sort_order a section_type
// La tabla original del plan usa default_order, pero el repositorio genérico usa sort_order
import { Migration } from '../../services/migrationService';

export const v002_section_type_sort_order: Migration = {
  version: 2,
  name: 'v002_section_type_sort_order',
  up: [
    // Agregar columna sort_order con el mismo valor que default_order
    `ALTER TABLE section_type ADD COLUMN sort_order INTEGER DEFAULT 0`,
    `UPDATE section_type SET sort_order = COALESCE(default_order, 0)`,
  ],
  down: [
    // SQLite no soporta DROP COLUMN en versiones viejas; dejamos la columna
  ],
};
