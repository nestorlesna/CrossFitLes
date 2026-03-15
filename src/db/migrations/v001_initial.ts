// Migración v001: Schema inicial completo de CrossFit Session Tracker
import { Migration } from '../../services/migrationService';

export const v001_initial: Migration = {
  version: 1,
  name: 'v001_initial',
  up: [
    // Grupos musculares
    `CREATE TABLE IF NOT EXISTS muscle_group (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      body_zone TEXT,
      image_path TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Equipamiento
    `CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      image_path TEXT,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Unidades de medida
    `CREATE TABLE IF NOT EXISTS measurement_unit (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      abbreviation TEXT NOT NULL,
      unit_type TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Niveles de dificultad
    `CREATE TABLE IF NOT EXISTS difficulty_level (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT,
      numeric_value INTEGER,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Tags
    `CREATE TABLE IF NOT EXISTS tag (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Tipos de sección
    `CREATE TABLE IF NOT EXISTS section_type (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      default_order INTEGER,
      color TEXT,
      icon TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Formatos de trabajo
    `CREATE TABLE IF NOT EXISTS work_format (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      has_time_cap INTEGER DEFAULT 0,
      has_rounds INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Ejercicios
    `CREATE TABLE IF NOT EXISTS exercise (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      technical_notes TEXT,
      difficulty_level_id TEXT,
      primary_muscle_group_id TEXT,
      image_path TEXT,
      video_path TEXT,
      is_compound INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (difficulty_level_id) REFERENCES difficulty_level(id) ON DELETE SET NULL,
      FOREIGN KEY (primary_muscle_group_id) REFERENCES muscle_group(id) ON DELETE SET NULL
    )`,

    // Relación ejercicio - grupo muscular
    `CREATE TABLE IF NOT EXISTS exercise_muscle_group (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      muscle_group_id TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
      FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE,
      UNIQUE(exercise_id, muscle_group_id)
    )`,

    // Relación ejercicio - equipamiento
    `CREATE TABLE IF NOT EXISTS exercise_equipment (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      equipment_id TEXT NOT NULL,
      is_required INTEGER DEFAULT 1,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
      UNIQUE(exercise_id, equipment_id)
    )`,

    // Relación ejercicio - tipo de sección
    `CREATE TABLE IF NOT EXISTS exercise_section_type (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      section_type_id TEXT NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
      FOREIGN KEY (section_type_id) REFERENCES section_type(id) ON DELETE CASCADE,
      UNIQUE(exercise_id, section_type_id)
    )`,

    // Relación ejercicio - unidad de medida
    `CREATE TABLE IF NOT EXISTS exercise_unit (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      measurement_unit_id TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
      FOREIGN KEY (measurement_unit_id) REFERENCES measurement_unit(id) ON DELETE CASCADE,
      UNIQUE(exercise_id, measurement_unit_id)
    )`,

    // Relación ejercicio - tags
    `CREATE TABLE IF NOT EXISTS exercise_tag (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE,
      UNIQUE(exercise_id, tag_id)
    )`,

    // Índices de ejercicios
    `CREATE INDEX IF NOT EXISTS idx_exercise_name ON exercise(name)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_difficulty ON exercise(difficulty_level_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_muscle ON exercise(primary_muscle_group_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_muscle_group_exercise ON exercise_muscle_group(exercise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_equipment_exercise ON exercise_equipment(exercise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_tag_exercise ON exercise_tag(exercise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_tag_tag ON exercise_tag(tag_id)`,

    // Plantillas de clase
    `CREATE TABLE IF NOT EXISTS class_template (
      id TEXT PRIMARY KEY,
      date TEXT,
      name TEXT NOT NULL,
      objective TEXT,
      general_notes TEXT,
      estimated_duration_minutes INTEGER,
      is_favorite INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Secciones de clase
    `CREATE TABLE IF NOT EXISTS class_section (
      id TEXT PRIMARY KEY,
      class_template_id TEXT NOT NULL,
      section_type_id TEXT NOT NULL,
      work_format_id TEXT,
      sort_order INTEGER NOT NULL,
      visible_title TEXT,
      general_description TEXT,
      time_cap_seconds INTEGER,
      total_rounds INTEGER,
      rest_between_rounds_seconds INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_template_id) REFERENCES class_template(id) ON DELETE CASCADE,
      FOREIGN KEY (section_type_id) REFERENCES section_type(id) ON DELETE SET NULL,
      FOREIGN KEY (work_format_id) REFERENCES work_format(id) ON DELETE SET NULL
    )`,

    // Ejercicios de sección
    `CREATE TABLE IF NOT EXISTS section_exercise (
      id TEXT PRIMARY KEY,
      class_section_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      coach_notes TEXT,
      planned_repetitions INTEGER,
      planned_weight_value REAL,
      planned_weight_unit_id TEXT,
      planned_time_seconds INTEGER,
      planned_distance_value REAL,
      planned_distance_unit_id TEXT,
      planned_calories INTEGER,
      planned_rest_seconds INTEGER,
      planned_rounds INTEGER,
      rm_percentage REAL,
      suggested_scaling TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_section_id) REFERENCES class_section(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE RESTRICT,
      FOREIGN KEY (planned_weight_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL,
      FOREIGN KEY (planned_distance_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL
    )`,

    // Índices de plantillas
    `CREATE INDEX IF NOT EXISTS idx_class_template_date ON class_template(date)`,
    `CREATE INDEX IF NOT EXISTS idx_class_section_template ON class_section(class_template_id)`,
    `CREATE INDEX IF NOT EXISTS idx_section_exercise_section ON section_exercise(class_section_id)`,
    `CREATE INDEX IF NOT EXISTS idx_section_exercise_exercise ON section_exercise(exercise_id)`,

    // Sesiones de entrenamiento
    `CREATE TABLE IF NOT EXISTS training_session (
      id TEXT PRIMARY KEY,
      class_template_id TEXT,
      session_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      actual_duration_minutes INTEGER,
      general_feeling TEXT,
      perceived_effort INTEGER,
      final_notes TEXT,
      body_weight REAL,
      body_weight_unit_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_template_id) REFERENCES class_template(id) ON DELETE SET NULL,
      FOREIGN KEY (body_weight_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL
    )`,

    // Resultados de ejercicios en sesión
    `CREATE TABLE IF NOT EXISTS session_exercise_result (
      id TEXT PRIMARY KEY,
      training_session_id TEXT NOT NULL,
      section_exercise_id TEXT,
      exercise_id TEXT NOT NULL,
      section_type_id TEXT,
      sort_order INTEGER,
      actual_repetitions INTEGER,
      actual_weight_value REAL,
      actual_weight_unit_id TEXT,
      actual_time_seconds INTEGER,
      actual_distance_value REAL,
      actual_distance_unit_id TEXT,
      actual_calories INTEGER,
      actual_rounds INTEGER,
      actual_rest_seconds INTEGER,
      rx_or_scaled TEXT DEFAULT 'rx',
      result_text TEXT,
      notes TEXT,
      is_completed INTEGER DEFAULT 1,
      is_personal_record INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (training_session_id) REFERENCES training_session(id) ON DELETE CASCADE,
      FOREIGN KEY (section_exercise_id) REFERENCES section_exercise(id) ON DELETE SET NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE RESTRICT,
      FOREIGN KEY (section_type_id) REFERENCES section_type(id) ON DELETE SET NULL,
      FOREIGN KEY (actual_weight_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL,
      FOREIGN KEY (actual_distance_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL
    )`,

    // Índices de sesiones
    `CREATE INDEX IF NOT EXISTS idx_training_session_date ON training_session(session_date)`,
    `CREATE INDEX IF NOT EXISTS idx_training_session_status ON training_session(status)`,
    `CREATE INDEX IF NOT EXISTS idx_training_session_template ON training_session(class_template_id)`,
    `CREATE INDEX IF NOT EXISTS idx_session_result_session ON session_exercise_result(training_session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_session_result_exercise ON session_exercise_result(exercise_id)`,

    // Records personales
    `CREATE TABLE IF NOT EXISTS personal_record (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_value REAL NOT NULL,
      record_unit_id TEXT,
      session_exercise_result_id TEXT,
      achieved_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
      FOREIGN KEY (record_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL,
      FOREIGN KEY (session_exercise_result_id) REFERENCES session_exercise_result(id) ON DELETE SET NULL
    )`,

    `CREATE INDEX IF NOT EXISTS idx_pr_exercise ON personal_record(exercise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pr_type ON personal_record(record_type)`,
  ],
  down: [
    `DROP TABLE IF EXISTS personal_record`,
    `DROP TABLE IF EXISTS session_exercise_result`,
    `DROP TABLE IF EXISTS training_session`,
    `DROP TABLE IF EXISTS section_exercise`,
    `DROP TABLE IF EXISTS class_section`,
    `DROP TABLE IF EXISTS class_template`,
    `DROP TABLE IF EXISTS exercise_tag`,
    `DROP TABLE IF EXISTS exercise_unit`,
    `DROP TABLE IF EXISTS exercise_section_type`,
    `DROP TABLE IF EXISTS exercise_equipment`,
    `DROP TABLE IF EXISTS exercise_muscle_group`,
    `DROP TABLE IF EXISTS exercise`,
    `DROP TABLE IF EXISTS work_format`,
    `DROP TABLE IF EXISTS section_type`,
    `DROP TABLE IF EXISTS tag`,
    `DROP TABLE IF EXISTS difficulty_level`,
    `DROP TABLE IF EXISTS measurement_unit`,
    `DROP TABLE IF EXISTS equipment`,
    `DROP TABLE IF EXISTS muscle_group`,
  ],
};
