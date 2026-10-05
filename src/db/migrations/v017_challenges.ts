// Migración v017: challenges de ejercicios.
// Un challenge en curso es un training_plan con plan_kind = 'challenge': reutiliza
// días, plantillas privadas y sesiones. Los tests de repeticiones máximas (inicial
// y retests) se guardan aparte para recalcular el nivel y graficar el progreso.
import { Migration } from '../../services/migrationService';

export const v017_challenges: Migration = {
  version: 17,
  name: 'v017_challenges',
  up: [
    `ALTER TABLE training_plan ADD COLUMN plan_kind TEXT NOT NULL DEFAULT 'plan'`,
    `ALTER TABLE training_plan ADD COLUMN challenge_code TEXT`,
    `ALTER TABLE training_plan ADD COLUMN challenge_level TEXT`,
    `ALTER TABLE training_plan ADD COLUMN challenge_easy INTEGER NOT NULL DEFAULT 0`,
    `CREATE INDEX IF NOT EXISTS idx_training_plan_kind ON training_plan(plan_kind, challenge_code)`,
    `CREATE TABLE IF NOT EXISTS challenge_test (
      id               TEXT PRIMARY KEY,
      training_plan_id TEXT NOT NULL,
      week             INTEGER NOT NULL,
      max_reps         INTEGER,
      level            TEXT NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (training_plan_id) REFERENCES training_plan(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_challenge_test_plan ON challenge_test(training_plan_id, week)`,
  ],
  down: [`DROP TABLE IF EXISTS challenge_test`],
};
