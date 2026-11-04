// Migración v020: corrige los tiempos de las clases no-GOAT (Girls, Heroes, WODs feb–mar 2026)
//
// Revisión de la Fase 2 de PLAN_FITLESUY.md sobre el contenido publicado v7:
// - Secciones de intervalo sin `interval_seconds`: el motor caía en la ventana por defecto del
//   formato (60 s en "Intervalos", 120 s en E2MOM) aunque el título diga "Every 90"" o
//   "Every 2'30"". En los complejos ("Every 2 min: A + B + C") la ventana se reparte entre los
//   ejercicios, porque el motor da una ventana a cada uno.
// - Secciones de intervalo sin `rest_between_rounds_seconds`: el motor sumaba 60 s por vuelta
//   (default global) a un EMOM, que no tiene descanso entre vueltas.
// - 8 ejercicios de "máximas reps" sin objetivo ni tiempo sugerido.
// - "Voltage Shift" (2 ON / 2 OFF) y "C&J Ladder" (2 ON / 1 OFF) no son ventanas iguales por
//   ejercicio: pasan a "Por rondas" con descansos explícitos.
// - "N Rondas For Time" estaba como "Por rondas": pasa a "For Time", como dice el título.
//
// Las filas se identifican por nombre de clase + orden de sección/ejercicio (los ids son locales
// de cada dispositivo) y nunca se tocan clases editadas por el usuario (user_modified = 1).
// Los catálogos se resuelven por nombre por el mismo motivo.
import { Migration } from '../../services/migrationService';

const sqlStr = (s: string) => `'${s.replace(/'/g, "''")}'`;

const classIds = (className: string) =>
  `SELECT id FROM class_template WHERE name = ${sqlStr(className)} AND COALESCE(user_modified, 0) = 0`;

const sectionIds = (className: string, sectionOrder: number) =>
  `SELECT id FROM class_section WHERE sort_order = ${sectionOrder} AND class_template_id IN (${classIds(className)})`;

const workFormat = (name: string) => `(SELECT id FROM work_format WHERE name = ${sqlStr(name)} LIMIT 1)`;

function section(className: string, sectionOrder: number, set: string): string {
  return `UPDATE class_section SET ${set}, updated_at = datetime('now')
           WHERE id IN (${sectionIds(className, sectionOrder)})`;
}

function exercise(className: string, sectionOrder: number, exerciseOrder: number, set: string): string {
  return `UPDATE section_exercise SET ${set}, updated_at = datetime('now')
           WHERE sort_order = ${exerciseOrder} AND class_section_id IN (${sectionIds(className, sectionOrder)})`;
}

// Marca la clase como actualizada para que "Publicar contenido" la vuelva a mandar
function touch(className: string): string {
  return `UPDATE class_template SET updated_at = datetime('now') WHERE id IN (${classIds(className)})`;
}

// [clase, sección, interval_seconds, total_rounds | null] — siempre sin descanso entre vueltas
const INTERVALS: [string, number, number, number | null][] = [
  ['WOD 04 Mar 2026 A — Ground Assault', 1, 120, null], // Every 2 min × 5
  ['WOD 04 Mar 2026 A — Ground Assault', 2, 40, null], // E2MOM 16 min, 3 ejercicios
  ['WOD 04 Mar 2026 B — Dark Pulse', 1, 50, null], // Every 3'30" × 4, 4 ejercicios (+10 s de vuelta)
  ['WOD 09 Mar 2026 — Open 26.2', 1, 90, null], // Every 90" × 6
  ['WOD 10 Feb 2026', 1, 90, null], // Every 90" × 8
  ['WOD 12 Feb 2026', 2, 50, null], // Every 2'30" × 6, 3 ejercicios
  ['WOD 12 Mar 2026 — Siege Protocol', 1, 50, null], // Every 3'30" × 4, 4 ejercicios (+10 s de vuelta)
  ['WOD 16 Feb 2026 — Fran\'s Revenge', 1, 40, null], // Every 2 min × 6, complejo de 3
  ['WOD 16 Mar 2026 — Open 26.3', 1, 45, null], // Every 90" × 6, 2 ejercicios
  ['WOD 18 Feb 2026 — Row & Snatch', 1, 60, null], // Every 2 min × 5, 2 ejercicios
  ['WOD 19 Feb 2026 — Legs & Lungs', 1, 30, null], // Every 90" × 8, complejo de 3
  ['WOD 19 Feb 2026 — Legs & Lungs', 2, 40, null], // E2MOM 14 min, 3 ejercicios
  ['WOD 19 Mar 2026 — Gravity Shift', 1, 60, 3], // E2MOM 12 min: set impar 2 ej. + set par 2 ej.
  ['WOD 24 Feb 2026 — Cold Fusion', 1, 150, null], // Every 2.5 min × 5
  ['WOD 25 Feb 2026 — Supernova', 1, 40, null], // E2MOM 12 min, 3 ejercicios
  ['WOD 26 Feb 2026', 1, 120, null], // Every 2 min × 5
];

// Las de 3'30" con 4 ejercicios: 4 × 50 s + 10 s de vuelta = 210 s
const ROUND_REST_10 = new Set(['WOD 04 Mar 2026 B — Dark Pulse', 'WOD 12 Mar 2026 — Siege Protocol']);

// EMOM sin descanso entre vueltas explícito (la ventana ya está bien)
const EMOM_NO_ROUND_REST: [string, number][] = [
  ['Girl: Chelsea', 2],
  ['WOD 03 Mar 2026', 1],
  ['WOD 10 Mar 2026 — Voltage Shift', 1],
  ['WOD 11 Mar 2026', 1],
  ['WOD 17 Mar 2026', 1],
  ['WOD 18 Mar 2026 — C&J Ladder', 2],
];

const up: string[] = [];
const touched = new Set<string>();

for (const [cls, sec, interval, rounds] of INTERVALS) {
  const roundRest = ROUND_REST_10.has(cls) ? 10 : 0;
  const roundsSet = rounds ? `, total_rounds = ${rounds}` : '';
  up.push(section(cls, sec, `interval_seconds = ${interval}, rest_between_rounds_seconds = ${roundRest}${roundsSet}`));
  touched.add(cls);
}
for (const [cls, sec] of EMOM_NO_ROUND_REST) {
  up.push(section(cls, sec, `rest_between_rounds_seconds = 0`));
  touched.add(cls);
}

// ── Ejercicios de máximas reps: tiempo sugerido ─────────────────────────────
// Lynne: 5 rondas de bench press + dominadas al fallo, descanso libre entre rondas
up.push(exercise('Girl: Lynne', 2, 1, 'suggested_timer_seconds = 45'));
up.push(exercise('Girl: Lynne', 2, 2, 'suggested_timer_seconds = 30'));
up.push(section('Girl: Lynne', 2, 'rest_between_exercises_seconds = 60, rest_between_rounds_seconds = 120'));
// Nicole: AMRAP 20 min de 400 m + dominadas al fallo
up.push(exercise('Girl: Nicole', 2, 2, 'suggested_timer_seconds = 30'));
// 12 Feb: el resto de la ventana de 50 s
up.push(exercise('WOD 12 Feb 2026', 2, 3, 'suggested_timer_seconds = 50'));
touched.add('Girl: Lynne').add('Girl: Nicole');

// ── Voltage Shift: 2 vueltas de (set impar + set par), 2 min ON / 2 min OFF ──
{
  const cls = 'WOD 10 Mar 2026 — Voltage Shift';
  up.push(
    section(
      cls,
      2,
      `work_format_id = ${workFormat('Por rondas')}, interval_seconds = NULL, total_rounds = 2,
       rest_between_rounds_seconds = 120, rest_between_exercises_seconds = 0,
       general_description = 'Sets 1/3: Run + Clusters. Sets 2/4: Row + Devil''s Press. 2 min de trabajo y 2 min de descanso; cada vuelta son 2 sets.'`
    )
  );
  up.push(exercise(cls, 2, 1, 'planned_rest_seconds = 0'));
  up.push(exercise(cls, 2, 2, 'suggested_timer_seconds = 70, planned_rest_seconds = 120'));
  up.push(exercise(cls, 2, 3, 'planned_rest_seconds = 0'));
  up.push(exercise(cls, 2, 4, 'suggested_timer_seconds = 70'));
  touched.add(cls);
}

// ── C&J Ladder: 2 vueltas × 4 sets = 8 sets de 2 min ON / 1 min OFF ──────────
{
  const cls = 'WOD 18 Mar 2026 — C&J Ladder';
  up.push(
    section(
      cls,
      1,
      `work_format_id = ${workFormat('Por rondas')}, interval_seconds = NULL, total_rounds = 8,
       rest_between_rounds_seconds = 60, rest_between_exercises_seconds = 0,
       general_description = 'Escalera de intensidad 70→75→80→85%, 2 vueltas completas: 8 sets de 2 min de trabajo y 1 min de descanso.'`
    )
  );
  up.push(exercise(cls, 1, 2, 'suggested_timer_seconds = 40'));
  up.push(exercise(cls, 1, 3, 'suggested_timer_seconds = 30'));
  touched.add(cls);
}

// ── "N Rondas For Time" con formato "Por rondas" → "For Time" ─────────────────
up.push(
  `UPDATE class_section
      SET work_format_id = ${workFormat('For Time')}, updated_at = datetime('now')
    WHERE visible_title LIKE '%For Time%'
      AND work_format_id = ${workFormat('Por rondas')}
      AND ${workFormat('For Time')} IS NOT NULL
      AND class_template_id IN (
        SELECT id FROM class_template
         WHERE name NOT LIKE 'GOAT%' AND is_plan_day = 0 AND COALESCE(user_modified, 0) = 0)`
);
up.push(
  `UPDATE class_template SET updated_at = datetime('now')
    WHERE name NOT LIKE 'GOAT%' AND is_plan_day = 0 AND COALESCE(user_modified, 0) = 0
      AND id IN (SELECT class_template_id FROM class_section WHERE visible_title LIKE '%For Time%')`
);

for (const cls of touched) up.push(touch(cls));

export const v020_fix_classic_classes: Migration = {
  version: 20,
  name: 'v020_fix_classic_classes',
  up,
  // Correcciones de datos: no se revierten
  down: [],
};
