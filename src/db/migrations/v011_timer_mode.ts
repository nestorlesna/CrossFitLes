// Migración v011: modo cronómetro guiado
// Agrega la configuración global del cronómetro (singleton) y los campos de
// tiempo necesarios para que el cronómetro avance solo por la clase.
import { Migration } from '../../services/migrationService';

export const v011_timer_mode: Migration = {
  version: 11,
  name: 'v011_timer_mode',
  up: [
    // ── Configuración global del cronómetro (singleton: siempre 1 fila) ───────
    `CREATE TABLE IF NOT EXISTS timer_config (
      id                               TEXT PRIMARY KEY,
      default_exercise_seconds         INTEGER NOT NULL DEFAULT 45,  -- ejercicios por repeticiones sin tiempo propio
      rest_between_exercises_seconds   INTEGER NOT NULL DEFAULT 15,
      rest_between_rounds_seconds      INTEGER NOT NULL DEFAULT 60,
      rest_between_sections_seconds    INTEGER NOT NULL DEFAULT 90,
      default_interval_seconds         INTEGER NOT NULL DEFAULT 60,  -- ventana EMOM por defecto
      lead_in_seconds                  INTEGER NOT NULL DEFAULT 10,  -- cuenta regresiva antes de arrancar
      warning_seconds                  INTEGER NOT NULL DEFAULT 10,  -- pip de aviso previo al fin del ejercicio
      sound_enabled                    INTEGER NOT NULL DEFAULT 1,
      vibration_enabled                INTEGER NOT NULL DEFAULT 1,
      keep_awake                       INTEGER NOT NULL DEFAULT 1,
      auto_advance_reps                INTEGER NOT NULL DEFAULT 1,  -- 0 = los ejercicios por reps esperan al usuario
      created_at                       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at                       TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    `INSERT INTO timer_config (id, created_at, updated_at)
     SELECT 'timer-config-singleton', datetime('now'), datetime('now')
     WHERE NOT EXISTS (SELECT 1 FROM timer_config)`,

    // ── Overrides por sección ────────────────────────────────────────────────
    `ALTER TABLE class_section ADD COLUMN rest_between_exercises_seconds INTEGER`,
    `ALTER TABLE class_section ADD COLUMN rest_after_section_seconds INTEGER`,
    `ALTER TABLE class_section ADD COLUMN interval_seconds INTEGER`,

    // ── Override por ejercicio: segundos sugeridos cuando no es por tiempo ────
    `ALTER TABLE section_exercise ADD COLUMN suggested_timer_seconds INTEGER`,

    // ── Formatos de trabajo con ventana fija (EMOM, E2MOM, Tabata, Intervalos) ─
    `ALTER TABLE work_format ADD COLUMN is_interval INTEGER DEFAULT 0`,
    `ALTER TABLE work_format ADD COLUMN default_interval_seconds INTEGER`,

    `UPDATE work_format SET is_interval = 1, default_interval_seconds = 60  WHERE name = 'EMOM'`,
    `UPDATE work_format SET is_interval = 1, default_interval_seconds = 120 WHERE name = 'E2MOM'`,
    `UPDATE work_format SET is_interval = 1, default_interval_seconds = 30  WHERE name = 'Tabata'`,
    `UPDATE work_format SET is_interval = 1, default_interval_seconds = 60  WHERE name = 'Intervalos'`,
  ],
  down: [
    `DROP TABLE IF EXISTS timer_config`,
  ],
};
