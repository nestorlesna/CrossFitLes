// Migración v014: reasigna las secciones de movilidad a su propio tipo
//
// Hasta ahora el catálogo no tenía un tipo "Movilidad", así que esos bloques se
// cargaban como "Entrada en calor" y se distinguían sólo por el título visible.
// Eso dejaba dos secciones del mismo tipo por clase (Calentamiento + Movilidad),
// que es lo que destapó el bug de agrupación corregido en v013.
//
// Creado ya el tipo "Movilidad" desde Configuración, esta migración reasigna:
//   1. las secciones de plantilla tituladas "Movilidad"
//   2. los resultados de sesión asociados, que guardan su propio section_type_id
//      y alimentan el gráfico de distribución en Estadísticas (statsRepo)
//
// Se dejan intactas las secciones tituladas "Calentamiento", "Entrada en calor"
// y las que no tienen título: su contenido es calentamiento general, no movilidad.
//
// Todo va condicionado a que el tipo "Movilidad" exista. Si no está creado, la
// migración no hace nada en lugar de dejar los registros apuntando a NULL.
import { Migration } from '../../services/migrationService';

export const v014_movilidad_section_type: Migration = {
  version: 14,
  name: 'v014_movilidad_section_type',
  up: [
    // 1. Secciones de plantilla tituladas "Movilidad"
    `UPDATE class_section
        SET section_type_id = (SELECT id FROM section_type WHERE UPPER(TRIM(name)) = 'MOVILIDAD'),
            updated_at = datetime('now')
      WHERE UPPER(TRIM(COALESCE(visible_title, ''))) = 'MOVILIDAD'
        AND section_type_id = (SELECT id FROM section_type WHERE UPPER(TRIM(name)) = 'ENTRADA EN CALOR')
        AND EXISTS (SELECT 1 FROM section_type WHERE UPPER(TRIM(name)) = 'MOVILIDAD')`,

    // 2. Resultados de sesión que cuelgan de esas secciones
    `UPDATE session_exercise_result
        SET section_type_id = (SELECT id FROM section_type WHERE UPPER(TRIM(name)) = 'MOVILIDAD'),
            updated_at = datetime('now')
      WHERE EXISTS (SELECT 1 FROM section_type WHERE UPPER(TRIM(name)) = 'MOVILIDAD')
        AND section_exercise_id IN (
          SELECT se.id
            FROM section_exercise se
            JOIN class_section cs ON se.class_section_id = cs.id
           WHERE cs.section_type_id = (SELECT id FROM section_type WHERE UPPER(TRIM(name)) = 'MOVILIDAD')
        )`,
  ],
  down: [],
};
