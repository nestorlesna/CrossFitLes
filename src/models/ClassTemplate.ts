// Modelos de datos para plantillas de clase, secciones y ejercicios de sección

export type TemplateType = 'my_classes' | 'generic';

export interface ClassTemplate {
  id: string
  date?: string          // Fecha ISO YYYY-MM-DD o null
  name: string
  objective?: string
  general_notes?: string
  estimated_duration_minutes?: number
  /** Video de cabecera: si está cargado, la sesión se ejecuta en modo "clase por video" */
  video_url?: string
  /** Duración del video en segundos, para cerrar la clase automáticamente al terminar */
  video_duration_seconds?: number
  is_favorite: number    // 0 | 1
  template_type: TemplateType  // 'my_classes' | 'generic'
  /** 1 = plantilla privada de un día de plan: no se lista en Clases */
  is_plan_day?: number
  is_active: number      // 0 | 1
  created_at: string
  updated_at: string
  // Campos calculados (JOIN)
  section_count?: number
  exercise_count?: number
}

export interface ClassSection {
  id: string
  class_template_id: string
  section_type_id: string
  work_format_id?: string
  sort_order: number
  visible_title?: string
  general_description?: string
  time_cap_seconds?: number
  total_rounds?: number
  rest_between_rounds_seconds?: number
  notes?: string
  // ── Cronómetro (overrides de la config global) ──
  rest_between_exercises_seconds?: number
  rest_after_section_seconds?: number
  /** Ventana fija para formatos de intervalo (EMOM, Tabata, etc.) */
  interval_seconds?: number
  created_at: string
  updated_at: string
  // Campos enriquecidos (JOIN)
  section_type_name?: string
  section_type_color?: string
  section_type_icon?: string
  work_format_name?: string
  work_format_is_interval?: number
  work_format_default_interval_seconds?: number
  exercises: SectionExercise[]
}

export interface SectionExercise {
  id: string
  class_section_id: string
  exercise_id: string
  sort_order: number
  coach_notes?: string
  planned_repetitions?: number
  planned_weight_value?: number
  planned_weight_unit_id?: string
  planned_time_seconds?: number
  planned_distance_value?: number
  planned_distance_unit_id?: string
  planned_calories?: number
  planned_rest_seconds?: number
  planned_rounds?: number
  /** Segundos sugeridos para el cronómetro cuando el ejercicio no es por tiempo */
  suggested_timer_seconds?: number
  rm_percentage?: number
  suggested_scaling?: string
  notes?: string
  created_at: string
  updated_at: string
  // Campos enriquecidos (JOIN)
  exercise_name?: string
  exercise_image_path?: string
  exercise_image_url?: string
  exercise_video_url?: string
  weight_unit_abbreviation?: string
  distance_unit_abbreviation?: string
}

export interface ClassTemplateWithSections extends ClassTemplate {
  sections: ClassSection[]
}

export interface ClassTemplateFilters {
  search?: string
  from_date?: string
  to_date?: string
  is_favorite?: boolean
  template_type?: TemplateType
}
