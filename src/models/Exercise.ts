// Tipos TypeScript para ejercicios y sus relaciones

export interface ExerciseRelations {
  muscleGroups: Array<{ id: string; name: string; is_primary: number }>;
  equipment: Array<{ id: string; name: string; is_required: number }>;
  sectionTypes: Array<{ id: string; name: string }>;
  units: Array<{ id: string; name: string; abbreviation: string; is_default: number }>;
  tags: Array<{ id: string; name: string; color?: string }>;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  technical_notes?: string;
  difficulty_level_id?: string;
  primary_muscle_group_id?: string;
  image_path?: string;
  image_url?: string;
  video_path?: string;
  video_long_path?: string;
  is_compound: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  // Campos enriquecidos (de JOINs)
  difficulty_name?: string;
  difficulty_color?: string;
  primary_muscle_name?: string;
  // Métricas de uso calculadas (sólo con sort_by = 'usage'; no son columnas de la tabla)
  // Sesiones completadas en las que se hizo el ejercicio
  session_count?: number;
  // Clases activas + planes/challenges vigentes que lo incluyen
  program_count?: number;
}

export type ExerciseSort = 'usage' | 'name';

export interface ExerciseWithRelations extends Exercise {
  relations: ExerciseRelations;
}

// Para los filtros del listado
export interface ExerciseFilters {
  search?: string;
  // Búsqueda en todos los campos de texto (ejercicio + catálogos asociados)
  search_all?: string;
  difficulty_level_id?: string;
  muscle_group_id?: string;
  equipment_id?: string;
  tag_id?: string;
  section_type_id?: string;
  in_classes?: boolean;
  // Orden del listado (por defecto, nombre)
  sort_by?: ExerciseSort;
}
