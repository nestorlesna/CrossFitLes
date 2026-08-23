// Modelos de planes de entrenamiento: un plan agrupa días programados,
// cada uno resuelto contra una plantilla de clase (propia o armada a mano).

import { ClassTemplate } from './ClassTemplate';

/** 'dates': cada día tiene fecha fija. 'sequence': los días avanzan al completarse. */
export type PlanScheduleMode = 'dates' | 'sequence';

export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';

/** 'class': plantilla existente · 'custom': lista de ejercicios armada a mano · 'rest': descanso */
export type PlanDayType = 'class' | 'custom' | 'rest';

export type PlanDayStatus = 'pending' | 'completed' | 'skipped';

export interface TrainingPlan {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  start_date?: string;          // YYYY-MM-DD
  schedule_mode: PlanScheduleMode;
  status: PlanStatus;
  color?: string;
  is_active: number;            // 0 | 1
  created_at: string;
  updated_at: string;
  // Campos calculados (JOIN)
  total_days?: number;
  completed_days?: number;
  training_days?: number;       // días que no son descanso
}

export interface PlanDay {
  id: string;
  training_plan_id: string;
  day_index: number;
  scheduled_date?: string;      // YYYY-MM-DD, null en modo 'sequence'
  day_type: PlanDayType;
  class_template_id?: string;
  title?: string;
  notes?: string;
  status: PlanDayStatus;
  training_session_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Campos enriquecidos (JOIN)
  template_name?: string;
  template_duration_minutes?: number;
  template_video_url?: string;
  exercise_count?: number;
  session_duration_minutes?: number;
  session_feeling?: string;
}

export interface PlanWithDays extends TrainingPlan {
  days: PlanDay[];
}

export interface PlanProgress {
  total: number;          // días totales del plan
  trainingDays: number;   // sin contar descansos
  completed: number;
  skipped: number;
  pending: number;
  overdue: number;        // pendientes con fecha anterior a hoy
  adherence: number;      // 0..100 sobre los días ya vencidos
  streak: number;         // días de entrenamiento consecutivos completados
  currentIndex: number;   // "día N de M"
}

/** Ejercicio suelto de un día armado a mano (lista plana, sin secciones) */
export interface PlanDayExerciseDraft {
  exercise_id: string;
  exercise_name?: string;
  exercise_image_url?: string;
  exercise_image_path?: string;
  planned_repetitions?: number;
  planned_weight_value?: number;
  planned_time_seconds?: number;
  planned_rounds?: number;
  planned_rest_seconds?: number;
  notes?: string;
}

/** Día resuelto con su plantilla completa (para el detalle) */
export interface PlanDayWithTemplate extends PlanDay {
  template?: ClassTemplate;
}

export interface PlanFilters {
  search?: string;
  status?: PlanStatus;
}
