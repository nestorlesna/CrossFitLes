// Hook que ejecuta la línea de tiempo del cronómetro guiado.
// El avance se calcula contra el reloj del sistema (no acumulando ticks), así la
// clase no se desfasa aunque el navegador atrase el intervalo o el celular se
// bloquee un rato.

import { useCallback, useEffect, useRef, useState } from 'react';
import { TimerStep } from '../services/timerEngine';
import { TimerConfig } from '../models/TimerConfig';
import {
  playClassEnd,
  playClassStart,
  playCountdownPip,
  playRestStart,
  playSectionChange,
  playWarningPip,
  playWorkStart,
} from '../services/timerAudio';

const TICK_MS = 200;

export interface TimerRunner {
  step: TimerStep | undefined;
  stepIndex: number;
  /** Segundos restantes del paso actual (0 en pasos abiertos) */
  remaining: number;
  /** Segundos transcurridos en un paso abierto (sin duración fija) */
  openElapsed: number;
  /** El paso actual espera a que el usuario avance a mano */
  isOpenStep: boolean;
  isRunning: boolean;
  isFinished: boolean;
  /** Segundos reales de clase (no corre en pausa) */
  totalElapsed: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  addSeconds: (seconds: number) => void;
  finish: () => void;
}

export function useTimerRunner(steps: TimerStep[], config: TimerConfig): TimerRunner {
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [openElapsed, setOpenElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);

  // Refs espejo: el tick lee de acá para no re-suscribir el intervalo en cada segundo
  const stepsRef = useRef(steps);
  const stepIndexRef = useRef(0);
  const remainingRef = useRef(0);
  const endsAtRef = useRef(0);
  const openStartedAtRef = useRef(0);
  const lastTickRef = useRef(0);
  const elapsedRef = useRef(0);
  const beepedRef = useRef<Set<number>>(new Set());
  const startedRef = useRef(false);

  // Mantiene el ref espejo sincronizado sin mutarlo durante el render.
  // Declarado antes del efecto de inicializacion para que corra primero.
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const currentStep = steps[stepIndex];
  const isOpenStep = Boolean(currentStep && currentStep.durationSeconds === 0);

  // Inicializa el primer paso cuando la línea de tiempo termina de cargarse
  useEffect(() => {
    if (steps.length === 0 || startedRef.current) return;
    remainingRef.current = steps[0].durationSeconds;
    setRemaining(steps[0].durationSeconds);
  }, [steps]);

  // Sonido al entrar a un paso (según de dónde venimos y a dónde vamos)
  const announceStep = useCallback((from: TimerStep | undefined, to: TimerStep | undefined) => {
    if (!to) {
      playClassEnd();
      return;
    }
    if (to.kind === 'section_rest') {
      playSectionChange();
      return;
    }
    if (to.kind === 'rest' || to.kind === 'round_rest') {
      playRestStart();
      return;
    }
    if (to.kind === 'work') {
      if (from?.kind === 'lead_in') playClassStart();
      else playWorkStart();
    }
  }, []);

  // Posiciona el cronómetro en un paso concreto
  const goToStep = useCallback(
    (index: number, options: { announce: boolean } = { announce: true }) => {
      const list = stepsRef.current;
      const from = list[stepIndexRef.current];

      if (index >= list.length) {
        stepIndexRef.current = list.length;
        setStepIndex(list.length);
        setIsRunning(false);
        setIsFinished(true);
        if (options.announce) announceStep(from, undefined);
        return;
      }

      const target = list[Math.max(0, index)];
      const safeIndex = Math.max(0, index);

      stepIndexRef.current = safeIndex;
      setStepIndex(safeIndex);

      beepedRef.current.clear();
      remainingRef.current = target.durationSeconds;
      setRemaining(target.durationSeconds);
      setOpenElapsed(0);

      const now = Date.now();
      endsAtRef.current = now + target.durationSeconds * 1000;
      openStartedAtRef.current = now;

      if (options.announce) announceStep(from, target);
    },
    [announceStep]
  );

  // Pips dentro del paso: aviso previo y cuenta regresiva final
  const handleBeeps = useCallback(
    (step: TimerStep, secondsLeft: number) => {
      if (beepedRef.current.has(secondsLeft)) return;

      const isWarning =
        step.kind === 'work' &&
        config.warning_seconds > 0 &&
        secondsLeft === config.warning_seconds &&
        step.durationSeconds > config.warning_seconds + 3;

      if (isWarning) {
        beepedRef.current.add(secondsLeft);
        playWarningPip();
        return;
      }

      if (secondsLeft >= 1 && secondsLeft <= 3) {
        beepedRef.current.add(secondsLeft);
        playCountdownPip();
      }
    },
    [config.warning_seconds]
  );

  // Bucle principal
  useEffect(() => {
    if (!isRunning) return;

    lastTickRef.current = Date.now();

    const id = setInterval(() => {
      const now = Date.now();

      // Tiempo real de clase (excluye las pausas porque el intervalo no corre)
      elapsedRef.current += (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setTotalElapsed(Math.floor(elapsedRef.current));

      const step = stepsRef.current[stepIndexRef.current];
      if (!step) return;

      // Paso abierto (ejercicio por reps sin sugerido): cuenta hacia arriba y espera al usuario
      if (step.durationSeconds === 0) {
        setOpenElapsed(Math.floor((now - openStartedAtRef.current) / 1000));
        return;
      }

      const secondsLeft = Math.max(0, Math.ceil((endsAtRef.current - now) / 1000));

      if (secondsLeft !== remainingRef.current) {
        remainingRef.current = secondsLeft;
        setRemaining(secondsLeft);
        if (secondsLeft > 0) handleBeeps(step, secondsLeft);
      }

      if (now >= endsAtRef.current) {
        goToStep(stepIndexRef.current + 1);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [isRunning, goToStep, handleBeeps]);

  const start = useCallback(() => {
    if (stepsRef.current.length === 0) return;
    startedRef.current = true;
    goToStep(0, { announce: false });
    setIsRunning(true);
  }, [goToStep]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    // Congela lo que falta del paso para poder retomarlo exacto
    const now = Date.now();
    const step = stepsRef.current[stepIndexRef.current];
    if (step && step.durationSeconds > 0) {
      remainingRef.current = Math.max(0, (endsAtRef.current - now) / 1000);
    }
    setIsRunning(false);
  }, [isRunning]);

  const resume = useCallback(() => {
    if (isRunning || isFinished || stepsRef.current.length === 0) return;
    const now = Date.now();
    const step = stepsRef.current[stepIndexRef.current];

    if (step && step.durationSeconds > 0) {
      endsAtRef.current = now + remainingRef.current * 1000;
    } else {
      // En un paso abierto retomamos el conteo donde quedó
      openStartedAtRef.current = now - openElapsed * 1000;
    }

    startedRef.current = true;
    setIsRunning(true);
  }, [isRunning, isFinished, openElapsed]);

  const toggle = useCallback(() => {
    if (isRunning) pause();
    else resume();
  }, [isRunning, pause, resume]);

  const next = useCallback(() => {
    goToStep(stepIndexRef.current + 1);
  }, [goToStep]);

  const previous = useCallback(() => {
    goToStep(Math.max(0, stepIndexRef.current - 1), { announce: false });
  }, [goToStep]);

  // Suma (o resta) segundos al paso en curso
  const addSeconds = useCallback((seconds: number) => {
    const step = stepsRef.current[stepIndexRef.current];
    if (!step || step.durationSeconds === 0) return;

    endsAtRef.current += seconds * 1000;
    const secondsLeft = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
    remainingRef.current = secondsLeft;
    setRemaining(secondsLeft);
    beepedRef.current.clear();
  }, []);

  const finish = useCallback(() => {
    setIsRunning(false);
    setIsFinished(true);
  }, []);

  return {
    step: currentStep,
    stepIndex,
    remaining: Math.ceil(remaining),
    openElapsed,
    isOpenStep,
    isRunning,
    isFinished,
    totalElapsed,
    start,
    pause,
    resume,
    toggle,
    next,
    previous,
    addSeconds,
    finish,
  };
}
