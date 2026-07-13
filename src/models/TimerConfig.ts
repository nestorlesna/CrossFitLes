// Configuración global del cronómetro guiado (fila única en timer_config)

export interface TimerConfig {
  id: string;
  /** Duración por defecto de un ejercicio por repeticiones (sin tiempo propio) */
  default_exercise_seconds: number;
  /** Descanso por defecto entre ejercicios */
  rest_between_exercises_seconds: number;
  /** Descanso por defecto entre vueltas del circuito */
  rest_between_rounds_seconds: number;
  /** Descanso por defecto al terminar una sección */
  rest_between_sections_seconds: number;
  /** Ventana por defecto para formatos de intervalo (EMOM y similares) */
  default_interval_seconds: number;
  /** Cuenta regresiva antes de arrancar la clase */
  lead_in_seconds: number;
  /** Segundos restantes en los que suena el pip de aviso */
  warning_seconds: number;
  sound_enabled: number;
  vibration_enabled: number;
  keep_awake: number;
  /** 0 = los ejercicios por repeticiones esperan a que el usuario avance */
  auto_advance_reps: number;
  created_at: string;
  updated_at: string;
}

export const TIMER_CONFIG_ID = 'timer-config-singleton';

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  id: TIMER_CONFIG_ID,
  default_exercise_seconds: 45,
  rest_between_exercises_seconds: 15,
  rest_between_rounds_seconds: 60,
  rest_between_sections_seconds: 90,
  default_interval_seconds: 60,
  lead_in_seconds: 10,
  warning_seconds: 10,
  sound_enabled: 1,
  vibration_enabled: 1,
  keep_awake: 1,
  auto_advance_reps: 1,
  created_at: '',
  updated_at: '',
};
