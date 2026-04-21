// Tipos TypeScript para sesiones de entrenamiento y sus resultados realies

import { RxScaled, GeneralFeeling } from '../types';

export interface SessionExerciseResult {
  id: string;
  training_session_id: string;
  section_exercise_id?: string;
  exercise_id: string;
  section_type_id?: string;
  sort_order: number;
  actual_repetitions?: number;
  actual_weight_value?: number;
  actual_weight_unit_id?: string;
  actual_time_seconds?: number;
  actual_distance_value?: number;
  actual_distance_unit_id?: string;
  actual_calories?: number;
  actual_rounds?: number;
  actual_rest_seconds?: number;
  rx_or_scaled: RxScaled;
  result_text?: string;
  notes?: string;
  is_completed: number;
  is_personal_record: number;
  created_at: string;
  updated_at: string;
  // Campos enriquecidos
  exercise_name?: string;
  exercise_image_path?: string;
  exercise_image_url?: string;
  exercise_video_url?: string;
  weight_unit_abbreviation?: string;
  distance_unit_abbreviation?: string;
}

export interface TrainingSession {
  id: string;
  class_template_id?: string;
  session_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  actual_duration_minutes?: number;
  general_feeling?: GeneralFeeling;
  perceived_effort?: number;
  final_notes?: string;
  body_weight?: number;
  body_weight_unit_id?: string;
  estimated_calories?: number;
  created_at: string;
  updated_at: string;
  // Campos enriquecidos
  template_name?: string;
}

export interface SessionWithRelations extends TrainingSession {
  results: SessionExerciseResult[];
}
