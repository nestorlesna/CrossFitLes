// Migración v006: perfil de usuario, medidas corporales y fotos de progreso
import { Migration } from '../../services/migrationService';

export const v006_user_profile: Migration = {
  version: 6,
  name: 'v006_user_profile',
  up: [
    // ── Perfil básico (singleton: siempre 1 fila) ─────────────────────────────
    `CREATE TABLE IF NOT EXISTS user_profile (
      id                TEXT PRIMARY KEY,
      full_name         TEXT,
      sex               TEXT,           -- 'male' | 'female' | 'other'
      birth_date        TEXT,           -- YYYY-MM-DD (edad se calcula)
      height_cm         REAL,
      body_type         TEXT,           -- 'ectomorph' | 'mesomorph' | 'endomorph'
      experience_level  TEXT,           -- 'beginner' | 'intermediate' | 'advanced'
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL
    )`,

    // ── Medidas corporales (historial: N filas, una por sesión de medición) ───
    `CREATE TABLE IF NOT EXISTS body_measurement (
      id                    TEXT PRIMARY KEY,
      measurement_date      TEXT NOT NULL,  -- YYYY-MM-DD
      weight_kg             REAL,
      body_fat_percentage   REAL,
      -- Parte superior
      neck_cm               REAL,
      shoulders_cm          REAL,
      chest_cm              REAL,
      bicep_relaxed_cm      REAL,
      bicep_contracted_cm   REAL,
      forearm_cm            REAL,
      -- Parte media
      waist_cm              REAL,
      abdomen_cm            REAL,
      -- Parte inferior
      hip_cm                REAL,
      glutes_cm             REAL,
      thigh_cm              REAL,
      mid_thigh_cm          REAL,
      calf_cm               REAL,
      notes                 TEXT,
      created_at            TEXT NOT NULL,
      updated_at            TEXT NOT NULL
    )`,

    // ── Fotos de progreso ─────────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS progress_photo (
      id          TEXT PRIMARY KEY,
      photo_date  TEXT NOT NULL,   -- YYYY-MM-DD
      angle       TEXT NOT NULL,   -- 'front' | 'side' | 'back'
      image_path  TEXT NOT NULL,   -- ruta gestionada por mediaService
      notes       TEXT,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    )`,
  ],
  down: [
    `DROP TABLE IF EXISTS progress_photo`,
    `DROP TABLE IF EXISTS body_measurement`,
    `DROP TABLE IF EXISTS user_profile`,
  ],
};
