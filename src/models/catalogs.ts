// Tipos TypeScript para todas las tablas de catálogos

export interface MuscleGroup {
  id: string;
  name: string;
  description?: string;
  body_zone?: 'upper_body' | 'lower_body' | 'core' | 'full_body';
  image_path?: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  image_path?: string;
  category?: 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'bodyweight' | 'cardio' | 'other';
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  unit_type: 'weight' | 'repetitions' | 'calories' | 'time' | 'distance';
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface DifficultyLevel {
  id: string;
  name: string;
  description?: string;
  color?: string;
  numeric_value?: number;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SectionType {
  id: string;
  name: string;
  description?: string;
  default_order?: number;
  color?: string;
  icon?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface WorkFormat {
  id: string;
  name: string;
  description?: string;
  has_time_cap: number;
  has_rounds: number;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Tipo genérico para registros de catálogo
export type CatalogRecord = Record<string, unknown>;
