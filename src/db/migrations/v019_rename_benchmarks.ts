// Migración v019: quita la marca "CrossFit" del nombre de las clases benchmark
//
// La app pasa a llamarse FitLesUY y "CrossFit" es marca registrada. Los nombres de los
// WODs (Fran, Murph, ...) se usan libremente; sólo se saca el prefijo de la marca:
//   "CrossFit Girl: Fran"  → "Girl: Fran"
//   "CrossFit Hero: Murph" → "Hero: Murph"
//   "CrossFit Open 26.1"   → "Open 26.1"
//
// No toca user_modified: en los dispositivos que reciben estas clases por "Actualizar
// contenido", el próximo sync trae el mismo nombre nuevo desde el repo publicado.
import { Migration } from '../../services/migrationService';

export const v019_rename_benchmarks: Migration = {
  version: 19,
  name: 'v019_rename_benchmarks',
  up: [
    `UPDATE class_template
        SET name = 'Girl: ' || substr(name, 16), updated_at = datetime('now')
      WHERE name LIKE 'CrossFit Girl: %'`,
    `UPDATE class_template
        SET name = 'Hero: ' || substr(name, 16), updated_at = datetime('now')
      WHERE name LIKE 'CrossFit Hero: %'`,
    `UPDATE class_template
        SET name = 'Open ' || substr(name, 15), updated_at = datetime('now')
      WHERE name LIKE 'CrossFit Open %'`,
  ],
  down: [
    `UPDATE class_template SET name = 'CrossFit ' || name
      WHERE name LIKE 'Girl: %' OR name LIKE 'Hero: %' OR name LIKE 'Open 26.%'`,
  ],
};
