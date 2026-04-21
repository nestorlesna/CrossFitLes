import { RecordType } from '../types';

export interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name?: string; // JOIN
  exercise_image_url?: string; // JOIN
  record_type: RecordType;
  record_value: number;
  record_unit_id?: string;
  record_unit_abbreviation?: string; // JOIN
  session_exercise_result_id?: string;
  achieved_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseProgressionPoint {
  date: string;
  value: number;
  rx_or_scaled: string;
  training_session_id: string;
}

export interface WeeklyActivity {
  week: string; // ISO week or date range
  count: number;
  total_minutes: number;
  total_calories: number;
}

export interface SectionDistribution {
  name: string;
  value: number;
  color?: string;
}

export interface CaloriesDataPoint {
  date: string;        // YYYY-MM-DD (fecha de la sesión)
  calories: number;    // kcal estimadas
  duration: number;    // minutos (para tooltip)
  feeling?: string;    // emoji para tooltip
}
