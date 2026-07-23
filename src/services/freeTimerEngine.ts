// Motor del timer libre: aplana un FreeTimerConfig en la misma lista lineal de
// pasos (TimerStep) que usa el cronómetro guiado, para correr sobre el mismo
// useTimerRunner sin tocarlo. "prepare" -> lead_in, "work"/"rest" -> igual,
// descanso entre repeticiones de un bloque -> round_rest.

import { TimerStep, TimerStepKind, formatClock } from './timerEngine';
import { FreeInterval, FreeTimerConfig } from '../models/FreeTimer';

function stepKind(kind: FreeInterval['kind']): TimerStepKind {
  if (kind === 'prepare') return 'lead_in';
  if (kind === 'rest') return 'rest';
  return 'work';
}

/** Aplana la config completa (bloques × repeticiones × intervalos) a TimerStep[] */
export function buildFreeTimeline(config: FreeTimerConfig): TimerStep[] {
  const steps: TimerStep[] = [];

  if (config.prepareSeconds > 0) {
    const firstWork = config.blocks[0]?.intervals.find((i) => i.kind === 'work');
    steps.push({
      kind: 'lead_in',
      durationSeconds: config.prepareSeconds,
      label: 'Preparados',
      detail: config.name,
      nextExerciseName: firstWork?.label,
      sectionIndex: 0,
      sectionTitle: config.name,
      round: 1,
      totalRounds: 1,
      set: 1,
      totalSets: 1,
    });
  }

  config.blocks.forEach((block, blockIndex) => {
    const totalRounds = Math.max(1, block.repeat);
    const base = {
      sectionIndex: blockIndex,
      sectionTitle: config.name,
      totalRounds,
    };

    for (let round = 1; round <= totalRounds; round++) {
      const isLastRound = round === totalRounds;
      const roundLabel =
        block.labelsCycle && block.labelsCycle.length > 0
          ? block.labelsCycle[(round - 1) % block.labelsCycle.length]
          : undefined;

      block.intervals.forEach((interval, intervalIndex) => {
        const isLastInterval = intervalIndex === block.intervals.length - 1;
        const nextInterval = isLastInterval ? block.intervals[0] : block.intervals[intervalIndex + 1];
        const isWork = interval.kind === 'work';

        steps.push({
          ...base,
          kind: stepKind(interval.kind),
          durationSeconds: interval.durationSeconds ?? 0,
          label: (isWork ? roundLabel ?? interval.label : interval.label) ?? (isWork ? 'Trabajo' : 'Descanso'),
          nextExerciseName: nextInterval?.label ?? roundLabel,
          round,
          set: 1,
          totalSets: 1,
        });
      });

      if (!isLastRound && block.restBetweenRepeatsSeconds) {
        steps.push({
          ...base,
          kind: 'round_rest',
          durationSeconds: block.restBetweenRepeatsSeconds,
          label: 'Descanso de ronda',
          detail: `Ronda ${round + 1} de ${totalRounds}`,
          round,
          set: 1,
          totalSets: 1,
        });
      }
    }
  });

  return steps;
}

/** Resumen corto para mostrar en la lista de plantillas guardadas */
export function summarizeFreeTimerConfig(config: FreeTimerConfig): string {
  const block = config.blocks[0];

  switch (config.preset) {
    case 'for_time':
      return config.timeCapSeconds ? `Cap ${formatClock(config.timeCapSeconds)}` : 'Sin límite de tiempo';
    case 'amrap':
      return `${Math.round((config.timeCapSeconds ?? 0) / 60)} min`;
    case 'emom': {
      const interval = block?.intervals.find((i) => i.kind === 'work')?.durationSeconds ?? 0;
      return `${interval}s · ${block?.repeat ?? 0} rondas`;
    }
    case 'tabata':
    case 'intervals_fixed': {
      const work = block?.intervals.find((i) => i.kind === 'work')?.durationSeconds ?? 0;
      const rest = block?.intervals.find((i) => i.kind === 'rest')?.durationSeconds ?? 0;
      return `${work}/${rest}s · ${block?.repeat ?? 0} rondas`;
    }
    case 'intervals_variable': {
      const rounds = block?.intervals.filter((i) => i.kind === 'work').length ?? 0;
      return `${rounds} rondas variables`;
    }
    case 'custom':
    default:
      return 'Personalizado';
  }
}
