// Tipos compartidos y enums de la aplicación

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type RxScaled = 'rx' | 'scaled' | 'rx+';
export type GeneralFeeling = 'terrible' | 'bad' | 'normal' | 'good' | 'excellent';
export type RecordType = 'max_weight' | 'max_reps' | 'min_time' | 'max_distance' | 'max_calories';
export type BodyZone = 'upper_body' | 'lower_body' | 'core' | 'full_body';
export type EquipmentCategory = 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'bodyweight' | 'cardio' | 'other';
export type UnitType = 'weight' | 'repetitions' | 'calories' | 'time' | 'distance';

// Resultado de operaciones de base de datos
export interface DbResult<T> {
  data: T | null;
  error: string | null;
}

// Paginación
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
