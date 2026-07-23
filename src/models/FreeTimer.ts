// Modelo del timer libre (independiente de las clases): For Time, AMRAP, EMOM,
// Tabata, intervalos fijos/variables y custom. El motor de ejecución es el mismo
// que el cronómetro guiado (useTimerRunner + TimerStep), ver freeTimerEngine.ts.

export type FreeIntervalKind = 'prepare' | 'work' | 'rest';

export interface FreeInterval {
  kind: FreeIntervalKind;
  /** null = paso abierto (For Time / AMRAP sin time cap): corre hasta que el usuario lo corta */
  durationSeconds: number | null;
  label?: string;
}

export interface FreeBlock {
  repeat: number;
  intervals: FreeInterval[];
  restBetweenRepeatsSeconds?: number;
  /** EMOM alternado: el label del step "work" rota según el índice de ronda (0-based) */
  labelsCycle?: string[];
}

export type FreeTimerPreset =
  | 'for_time'
  | 'amrap'
  | 'emom'
  | 'tabata'
  | 'intervals_fixed'
  | 'intervals_variable'
  | 'custom';

export interface FreeTimerConfig {
  id: string;
  name: string;
  preset: FreeTimerPreset;
  prepareSeconds: number;
  blocks: FreeBlock[];
  timeCapSeconds?: number | null;
  /** Parámetros crudos usados para generar la config, para reabrir el builder al editar */
  presetParams: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FreeTimerTemplate {
  id: string;
  name: string;
  preset: FreeTimerPreset;
  config_json: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export const PRESET_LABELS: Record<FreeTimerPreset, string> = {
  for_time: 'For Time',
  amrap: 'AMRAP',
  emom: 'EMOM',
  tabata: 'Tabata',
  intervals_fixed: 'Intervalos fijos',
  intervals_variable: 'Intervalos variables',
  custom: 'Custom',
};
