// Migración v013: agrega class_section_id a session_exercise_result
//
// Hasta v012 el resultado de una sesión sólo guardaba `section_type_id`, lo que
// hacía imposible saber a cuál de dos secciones del mismo tipo pertenecía. Las
// pantallas de sesión agrupaban por tipo y, cuando una plantilla tenía dos
// secciones iguales (p. ej. "Calentamiento" y "Movilidad", ambas de tipo
// "Entrada en calor"), cada bloque mostraba también los ejercicios del otro.
//
// El vínculo ya existía de forma indirecta vía `section_exercise_id`; esta
// migración lo materializa en una columna propia y rellena los registros
// históricos a partir de ese vínculo.
import { Migration } from '../../services/migrationService';

export const v013_session_result_class_section: Migration = {
  version: 13,
  name: 'v013_session_result_class_section',
  up: [
    `ALTER TABLE session_exercise_result ADD COLUMN class_section_id TEXT`,

    // Backfill desde el vínculo existente. Las sesiones antiguas creadas sin
    // section_exercise_id quedan en NULL: no hay dato del cual deducirlas.
    `UPDATE session_exercise_result
        SET class_section_id = (
          SELECT se.class_section_id
            FROM section_exercise se
           WHERE se.id = session_exercise_result.section_exercise_id
        )
      WHERE section_exercise_id IS NOT NULL
        AND class_section_id IS NULL`,

    `CREATE INDEX IF NOT EXISTS idx_ser_class_section
       ON session_exercise_result (class_section_id)`,
  ],
  down: [],
};
