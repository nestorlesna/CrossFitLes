// Tipos TypeScript para perfil de usuario, medidas corporales y fotos de progreso

export type Sex = 'male' | 'female' | 'other';
export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type PhotoAngle = 'front' | 'side' | 'back';

export interface UserProfile {
  id: string;
  full_name?: string;
  sex?: Sex;
  birth_date?: string;          // YYYY-MM-DD
  height_cm?: number;
  body_type?: BodyType;
  experience_level?: ExperienceLevel;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasurement {
  id: string;
  measurement_date: string;     // YYYY-MM-DD
  weight_kg?: number;
  body_fat_percentage?: number;
  // Parte superior
  neck_cm?: number;
  shoulders_cm?: number;
  chest_cm?: number;
  bicep_relaxed_cm?: number;
  bicep_contracted_cm?: number;
  forearm_cm?: number;
  // Parte media
  waist_cm?: number;
  abdomen_cm?: number;
  // Parte inferior
  hip_cm?: number;
  glutes_cm?: number;
  thigh_cm?: number;
  mid_thigh_cm?: number;
  calf_cm?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Campos calculados (no en BD)
  bmi?: number;
  lean_mass_kg?: number;
}

export interface ProgressPhoto {
  id: string;
  photo_date: string;           // YYYY-MM-DD
  angle: PhotoAngle;
  image_path: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Etiquetas UI
export const SEX_LABELS: Record<Sex, string> = {
  male:   'Masculino',
  female: 'Femenino',
  other:  'Otro',
};

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  ectomorph:  'Ectomorfo',
  mesomorph:  'Mesomorfo',
  endomorph:  'Endomorfo',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
};

export const ANGLE_LABELS: Record<PhotoAngle, string> = {
  front: 'Frente',
  side:  'Perfil',
  back:  'Espalda',
};
