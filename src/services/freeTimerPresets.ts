// Presets del timer libre: cada uno es una función pura que arma un FreeTimerConfig.
// El motor (freeTimerEngine.ts) no sabe de presets, sólo aplana blocks/intervals.

import { generateUUID } from '../utils/formatters';
import { FreeTimerConfig, FreeTimerPreset } from '../models/FreeTimer';

const DEFAULT_PREPARE_SECONDS = 10;

function baseConfig(name: string, preset: FreeTimerPreset, presetParams: Record<string, unknown>) {
  const now = new Date().toISOString();
  return {
    id: generateUUID(),
    name,
    preset,
    prepareSeconds: DEFAULT_PREPARE_SECONDS,
    presetParams,
    createdAt: now,
    updatedAt: now,
  };
}

export interface ForTimeParams {
  name: string;
  timeCapSeconds?: number | null;
}

export function buildForTime({ name, timeCapSeconds }: ForTimeParams): FreeTimerConfig {
  return {
    ...baseConfig(name, 'for_time', { timeCapSeconds: timeCapSeconds ?? null }),
    timeCapSeconds: timeCapSeconds ?? null,
    blocks: [
      {
        repeat: 1,
        intervals: [{ kind: 'work', durationSeconds: timeCapSeconds ?? null, label: name }],
      },
    ],
  };
}

export interface AmrapParams {
  name: string;
  minutes: number;
}

export function buildAmrap({ name, minutes }: AmrapParams): FreeTimerConfig {
  return {
    ...baseConfig(name, 'amrap', { minutes }),
    timeCapSeconds: minutes * 60,
    blocks: [
      {
        repeat: 1,
        intervals: [{ kind: 'work', durationSeconds: minutes * 60, label: name }],
      },
    ],
  };
}

export interface EmomParams {
  name: string;
  intervalSeconds: number; // 60 EMOM, 120 E2MOM, etc.
  totalMinutes: number;
  labelsCycle?: string[]; // EMOM alternado
}

export function buildEmom({ name, intervalSeconds, totalMinutes, labelsCycle }: EmomParams): FreeTimerConfig {
  const totalSeconds = totalMinutes * 60;
  const rounds = Math.max(1, Math.floor(totalSeconds / intervalSeconds));
  const cleanLabels = (labelsCycle ?? []).map((l) => l.trim()).filter(Boolean);

  return {
    ...baseConfig(name, 'emom', { intervalSeconds, totalMinutes, labelsCycle: cleanLabels }),
    timeCapSeconds: rounds * intervalSeconds,
    blocks: [
      {
        repeat: rounds,
        intervals: [{ kind: 'work', durationSeconds: intervalSeconds, label: name }],
        labelsCycle: cleanLabels.length > 0 ? cleanLabels : undefined,
      },
    ],
  };
}

export interface TabataParams {
  name: string;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
}

export function buildTabata({ name, workSeconds, restSeconds, rounds }: TabataParams): FreeTimerConfig {
  return {
    ...baseConfig(name, 'tabata', { workSeconds, restSeconds, rounds }),
    timeCapSeconds: (workSeconds + restSeconds) * rounds,
    blocks: [
      {
        repeat: rounds,
        intervals: [
          { kind: 'work', durationSeconds: workSeconds, label: name },
          { kind: 'rest', durationSeconds: restSeconds },
        ],
      },
    ],
  };
}

export interface IntervalsFixedParams {
  name: string;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
}

export function buildIntervalsFixed(params: IntervalsFixedParams): FreeTimerConfig {
  const config = buildTabata(params);
  return { ...config, preset: 'intervals_fixed', presetParams: { ...params } };
}

export interface VariableRound {
  workSeconds: number;
  restSeconds: number;
}

export interface IntervalsVariableParams {
  name: string;
  rounds: VariableRound[];
}

export function buildIntervalsVariable({ name, rounds }: IntervalsVariableParams): FreeTimerConfig {
  const intervals = rounds.flatMap((r, i) => {
    const isLast = i === rounds.length - 1;
    const work = { kind: 'work' as const, durationSeconds: r.workSeconds, label: `${name} - Ronda ${i + 1}` };
    if (isLast || r.restSeconds <= 0) return [work];
    return [work, { kind: 'rest' as const, durationSeconds: r.restSeconds }];
  });

  const timeCapSeconds = rounds.reduce((acc, r, i) => {
    const isLast = i === rounds.length - 1;
    return acc + r.workSeconds + (isLast ? 0 : r.restSeconds);
  }, 0);

  return {
    ...baseConfig(name, 'intervals_variable', { rounds }),
    timeCapSeconds,
    blocks: [{ repeat: 1, intervals }],
  };
}
