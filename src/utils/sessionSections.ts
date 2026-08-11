// Utilidades para relacionar los resultados de una sesión con las secciones de su plantilla.

import type { ClassSection } from '../models/ClassTemplate';
import type { SessionExerciseResult } from '../models/TrainingSession';

/**
 * Devuelve los resultados de la sesión que pertenecen a una sección concreta.
 *
 * Agrupar por `section_type_id` es incorrecto cuando la plantilla tiene dos
 * secciones del mismo tipo — por ejemplo "Calentamiento" y "Movilidad", ambas
 * de tipo "Entrada en calor". En ese caso las dos secciones hacen match con
 * todos los resultados del tipo y cada bloque termina mostrando también los
 * ejercicios de la otra, sin datos planificados.
 *
 * El vínculo correcto es `section_exercise_id`, que apunta al ejercicio exacto
 * de la sección. Las sesiones creadas antes de que ese campo se guardara lo
 * tienen en NULL; para ésas se mantiene el filtro por tipo de sección.
 */
export function getSectionResults(
  results: SessionExerciseResult[],
  section: Pick<ClassSection, 'id' | 'section_type_id' | 'exercises'>
): SessionExerciseResult[] {
  // 1. Vínculo directo (sesiones creadas desde v013 en adelante).
  if (results.some((r) => r.class_section_id)) {
    return results.filter((r) => r.class_section_id === section.id);
  }

  // 2. Vínculo indirecto vía el ejercicio de sección. Cubre las sesiones
  //    anteriores a v013 cuya migración de backfill no llegó a correr.
  if (results.some((r) => r.section_exercise_id)) {
    const sectionExerciseIds = new Set(section.exercises.map((e) => e.id));
    return results.filter(
      (r) => r.section_exercise_id && sectionExerciseIds.has(r.section_exercise_id)
    );
  }

  // 3. Sesiones antiguas sin ningún vínculo: no hay forma de saber a qué
  //    sección va cada resultado, se cae al comportamiento anterior.
  return results.filter((r) => r.section_type_id === section.section_type_id);
}
