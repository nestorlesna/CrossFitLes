// Ejecución de un día de challenge.
// Reutiliza el motor del cronómetro (buildTimeline + useTimerRunner): las series
// por repeticiones son pasos abiertos que esperan al usuario, y los descansos
// corren solos con aviso sonoro. Se registran las reps reales de cada serie.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Pause, Minus, Plus, Check, SkipForward, ShieldAlert, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { getById as getSessionById, finalize, saveResults } from '../../db/repositories/trainingSessionRepo';
import { getById as getTemplateById } from '../../db/repositories/classTemplateRepo';
import { get as getTimerConfig } from '../../db/repositories/timerConfigRepo';
import * as challengeRepo from '../../db/repositories/challengeRepo';
import { SessionWithRelations } from '../../models/TrainingSession';
import { ClassTemplateWithSections } from '../../models/ClassTemplate';
import { TimerConfig, DEFAULT_TIMER_CONFIG } from '../../models/TimerConfig';
import { TrainingPlan, PlanDay } from '../../models/TrainingPlan';
import { GeneralFeeling } from '../../types';
import { buildTimeline, formatClock } from '../../services/timerEngine';
import { configureAudio, unlockAudio } from '../../services/timerAudio';
import { useTimerRunner } from '../../hooks/useTimerRunner';
import { getChallenge, CHALLENGE_SAFETY_TEXT } from '../../data/challenges';
import { SESSIONS_PER_WEEK } from '../../services/challengeEngine';

const FEELINGS: { value: GeneralFeeling; label: string }[] = [
  { value: 'terrible', label: '😫' },
  { value: 'bad', label: '😕' },
  { value: 'normal', label: '😐' },
  { value: 'good', label: '🙂' },
  { value: 'excellent', label: '💪' },
];

export function ChallengeRunPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [template, setTemplate] = useState<ClassTemplateWithSections | null>(null);
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_TIMER_CONFIG);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [day, setDay] = useState<PlanDay | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Reps / segundos reales por section_exercise
  const [actualReps, setActualReps] = useState<Record<string, number>>({});
  const [actualSeconds, setActualSeconds] = useState<Record<string, number>>({});
  const [currentReps, setCurrentReps] = useState(0);

  const [feeling, setFeeling] = useState<GeneralFeeling>('good');
  const [couldNotComplete, setCouldNotComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const def = getChallenge(plan?.challenge_code);

  // Las series por repeticiones esperan al usuario (paso abierto), sin importar la config global
  const runConfig = useMemo<TimerConfig>(() => ({ ...config, auto_advance_reps: 0 }), [config]);
  const steps = useMemo(
    () => (template ? buildTimeline(template, runConfig) : []),
    [template, runConfig]
  );
  const runner = useTimerRunner(steps, runConfig);
  const { step, stepIndex, remaining, openElapsed, isOpenStep, isRunning, isFinished, totalElapsed } = runner;

  const exercises = useMemo(() => template?.sections.flatMap((s) => s.exercises) ?? [], [template]);
  const isCircuit = (template?.sections[0]?.total_rounds ?? 1) > 1 || new Set(exercises.map((e) => e.exercise_id)).size > 1;
  const workSteps = steps.filter((s) => s.kind === 'work');
  const workIndex = steps.slice(0, stepIndex + 1).filter((s) => s.kind === 'work').length;

  // Semana del día (challenges de meta) y si es el intento final
  const isMeta = def?.kind === 'meta_reps';
  const week = day ? Math.ceil(day.day_index / SESSIONS_PER_WEEK) : 0;
  const isFinal = isMeta && exercises.length === 1;

  // ── Carga ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    (async () => {
      try {
        const [sess, cfg, link] = await Promise.all([
          getSessionById(sessionId),
          getTimerConfig(),
          challengeRepo.getDayBySession(sessionId),
        ]);
        if (cancelled) return;
        if (!sess?.class_template_id) {
          toast.error('Sesión no encontrada');
          navigate('/challenges');
          return;
        }
        const templ = await getTemplateById(sess.class_template_id);
        if (cancelled) return;
        if (!templ || templ.sections.length === 0) {
          toast.error('El día no tiene ejercicios');
          navigate('/challenges');
          return;
        }
        setSession(sess);
        setTemplate(templ);
        setConfig(cfg);
        setPlan(link?.plan ?? null);
        setDay(link?.day ?? null);
        configureAudio({ sound: Boolean(cfg.sound_enabled), vibration: Boolean(cfg.vibration_enabled) });
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error('Error al cargar el challenge');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  // Al entrar a una serie por reps, el contador arranca en el objetivo
  useEffect(() => {
    if (step?.kind === 'work' && step.exercise) {
      setCurrentReps(actualReps[step.exercise.id] ?? step.exercise.planned_repetitions ?? 0);
    }
    // Sólo al cambiar de paso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, step?.kind]);

  // Pantalla encendida mientras corre
  useEffect(() => {
    if (!config.keep_awake || !isRunning) return;
    let cancelled = false;
    const anyNav = navigator as any;
    if (anyNav.wakeLock?.request) {
      anyNav.wakeLock
        .request('screen')
        .then((lock: any) => {
          if (cancelled) lock.release().catch(() => {});
          else wakeLockRef.current = lock;
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [config.keep_awake, isRunning]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleStart = async () => {
    await unlockAudio();
    setHasStarted(true);
    runner.start();
  };

  // Termina la serie actual registrando lo hecho
  const completeSet = () => {
    const ex = step?.exercise;
    if (step?.kind === 'work' && ex) {
      if (isOpenStep) {
        setActualReps((prev) => ({ ...prev, [ex.id]: currentReps }));
      } else {
        // Serie por tiempo cortada antes: cuenta lo aguantado
        const held = Math.max(0, step.durationSeconds - remaining);
        setActualSeconds((prev) => ({ ...prev, [ex.id]: held }));
      }
    }
    runner.next();
  };

  const totals = useMemo(() => {
    let planned = 0;
    let done = 0;
    for (const ex of exercises) {
      const p = ex.planned_repetitions ?? 0;
      planned += p;
      done += actualReps[ex.id] ?? p;
    }
    return { planned, done };
  }, [exercises, actualReps]);

  const handleFinish = async () => {
    if (!session || !sessionId) return;
    setSaving(true);
    try {
      const rounds = template?.sections[0]?.total_rounds ?? undefined;
      const results = session.results.map((r) => {
        const ex = exercises.find((e) => e.id === r.section_exercise_id);
        return {
          ...r,
          actual_repetitions: ex?.planned_repetitions
            ? actualReps[ex.id] ?? ex.planned_repetitions
            : undefined,
          actual_time_seconds: ex?.planned_time_seconds
            ? actualSeconds[ex.id] ?? ex.planned_time_seconds
            : undefined,
          actual_rounds: isCircuit ? rounds : undefined,
          is_completed: 1,
        };
      });
      await saveResults(sessionId, results);
      await finalize(sessionId, {
        durationMinutes: Math.max(1, Math.round(totalElapsed / 60)),
        feeling: couldNotComplete ? 'bad' : feeling,
        effort: couldNotComplete ? 9 : 7,
        notes: couldNotComplete ? 'No se pudo completar: se repite la semana' : undefined,
      });

      if (plan && couldNotComplete && isMeta) {
        await challengeRepo.repeatWeek(plan.id, week);
        toast.info(`Semana ${week} reprogramada. ¡La próxima sale!`);
      } else if (plan) {
        const finished = await challengeRepo.afterSessionFinished(plan.id);
        toast.success(finished ? '¡Challenge completado! 🏆' : '¡Día completado!');
      }
      navigate(plan ? `/challenges/${plan.challenge_code}` : '/challenges', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el día');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
      </div>
    );
  }
  if (!template) return null;

  const accent = def?.color ?? '#3b82f6';
  const title = day?.title ?? template.name;

  // ── Antes de empezar ──
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-[60] bg-gray-950 flex flex-col overflow-y-auto">
        <div className="p-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Volver"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center pb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>
              {def?.name ?? 'Challenge'}
            </p>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="text-gray-400 text-sm mt-2">{exercises[0]?.exercise_name}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {exercises.map((ex, i) => (
              <span
                key={ex.id}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-white font-mono text-sm"
              >
                {isCircuit && <span className="text-gray-500 mr-1">{ex.exercise_name}</span>}
                {ex.planned_time_seconds ? `${ex.planned_time_seconds}s` : ex.planned_repetitions}
                {isMeta && !isFinal && i === exercises.length - 1 && '+'}
              </span>
            ))}
          </div>
          {isCircuit && (
            <p className="text-sm text-gray-400">{template.sections[0]?.total_rounds ?? 1} vueltas</p>
          )}

          {def?.regression && (
            <p className="text-xs text-gray-500 max-w-xs">Versión fácil: {def.regression.hint}</p>
          )}

          <button
            onClick={handleStart}
            className="w-full max-w-xs bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-5 flex items-center justify-center gap-3 font-bold text-lg active:scale-[0.97] transition-transform"
          >
            <Play size={24} fill="currentColor" />
            Empezar
          </button>

          <div className="flex gap-2 max-w-xs text-left">
            <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 leading-relaxed">{CHALLENGE_SAFETY_TEXT}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Resumen final ──
  if (isFinished) {
    const reached = isFinal && totals.done >= totals.planned;
    return (
      <div className="fixed inset-0 z-[60] bg-gray-950 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center py-10">
          <Trophy size={48} className={reached ? 'text-amber-400' : 'text-primary-500'} />
          <div>
            <h1 className="text-2xl font-bold text-white">{reached ? '¡Meta alcanzada!' : '¡Día terminado!'}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {formatClock(totalElapsed)} de trabajo
              {totals.planned > 0 && !isCircuit && ` · ${totals.done} de ${totals.planned} reps`}
            </p>
          </div>

          <div className="w-full max-w-xs">
            <p className="text-xs text-gray-500 mb-2">¿Cómo te sentiste?</p>
            <div className="flex justify-between">
              {FEELINGS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFeeling(f.value)}
                  aria-label={f.value}
                  className={`w-12 h-12 rounded-xl text-2xl border ${
                    feeling === f.value ? 'border-primary-500 bg-primary-600/20' : 'border-gray-800 bg-gray-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {isMeta && (
            <label className="flex items-start gap-3 max-w-xs text-left cursor-pointer bg-gray-900 border border-gray-800 rounded-xl p-3">
              <input
                type="checkbox"
                checked={couldNotComplete}
                onChange={(e) => setCouldNotComplete(e.target.checked)}
                className="mt-1 w-4 h-4 accent-amber-500"
              />
              <span className="text-sm text-gray-300">
                No pude completar la sesión
                <span className="block text-xs text-gray-500">
                  Se repite la semana {week} entera antes de avanzar.
                </span>
              </span>
            </label>
          )}

          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full max-w-xs bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Guardar
          </button>
        </div>
      </div>
    );
  }

  // ── En ejecución ──
  const isWork = step?.kind === 'work';
  const isRest = step?.kind === 'rest' || step?.kind === 'round_rest' || step?.kind === 'section_rest';
  const ex = step?.exercise;
  const isLastSet = isMeta && !isFinal && isWork && ex?.id === exercises[exercises.length - 1]?.id;
  const nextWork = steps.slice(stepIndex + 1).find((s) => s.kind === 'work');
  const progressPct = workSteps.length > 0 ? ((workIndex - (isWork ? 1 : 0)) / workSteps.length) * 100 : 0;

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col transition-colors duration-500 ${
        isRest ? 'bg-cyan-950/30' : 'bg-gray-950'
      } bg-gray-950`}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Salir"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
            {title}
          </p>
          <p className="text-[11px] text-gray-500 font-bold">
            {step && step.totalRounds > 1 ? `Vuelta ${step.round}/${step.totalRounds} · ` : ''}
            Serie {Math.max(1, workIndex)}/{workSteps.length}
          </p>
        </div>
        <p className="min-w-[44px] text-right text-xs font-mono text-gray-500">{formatClock(totalElapsed)}</p>
      </div>
      <div className="h-1 bg-gray-900 shrink-0">
        <div className="h-full transition-[width] duration-300" style={{ width: `${progressPct}%`, backgroundColor: accent }} />
      </div>

      {/* Cuerpo */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 min-h-0">
        {step?.kind === 'lead_in' && (
          <>
            <p className="text-sm uppercase tracking-widest text-amber-400 font-bold">Preparados</p>
            <p className="text-8xl font-mono font-bold text-white tabular-nums">{remaining}</p>
            <p className="text-gray-400">{nextWork?.label}</p>
          </>
        )}

        {isWork && ex && isOpenStep && (
          <>
            <p className="text-gray-400 text-lg text-center">{step.label}</p>
            <p className="text-[110px] leading-none font-mono font-bold text-white tabular-nums">
              {ex.planned_repetitions ?? '—'}
              {isLastSet && <span className="text-5xl align-top" style={{ color: accent }}>+</span>}
            </p>
            <p className="text-sm text-gray-500 text-center">
              {isFinal
                ? 'Intento final: todas seguidas'
                : isLastSet
                ? 'Al fallo: el número es el mínimo, no el tope'
                : ex.notes || 'Repeticiones'}
            </p>

            {!isCircuit && (
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => setCurrentReps((v) => Math.max(0, v - 1))}
                  className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 text-white flex items-center justify-center active:scale-95"
                  aria-label="Una repetición menos"
                >
                  <Minus size={24} />
                </button>
                <div className="text-center min-w-[90px]">
                  <p className="text-4xl font-mono font-bold text-white tabular-nums">{currentReps}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">hechas</p>
                </div>
                <button
                  onClick={() => setCurrentReps((v) => v + 1)}
                  className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 text-white flex items-center justify-center active:scale-95"
                  aria-label="Una repetición más"
                >
                  <Plus size={24} />
                </button>
              </div>
            )}
          </>
        )}

        {isWork && ex && !isOpenStep && (
          <>
            <p className="text-gray-400 text-lg text-center">{step.label}</p>
            <p className="text-[100px] leading-none font-mono font-bold text-white tabular-nums">
              {formatClock(remaining)}
            </p>
            <p className="text-sm text-gray-500">Aguantá · objetivo {step.durationSeconds}s</p>
          </>
        )}

        {isRest && (
          <>
            <p className="text-sm uppercase tracking-widest text-cyan-300 font-bold">{step?.label}</p>
            <p className="text-[100px] leading-none font-mono font-bold text-cyan-200 tabular-nums">
              {formatClock(remaining)}
            </p>
            {nextWork && (
              <p className="text-gray-400 text-center">
                Sigue: <span className="text-white font-semibold">{nextWork.label}</span>
                {nextWork.exercise?.planned_repetitions
                  ? ` · ${nextWork.exercise.planned_repetitions} reps`
                  : nextWork.exercise?.planned_time_seconds
                  ? ` · ${nextWork.exercise.planned_time_seconds}s`
                  : ''}
              </p>
            )}
          </>
        )}
      </div>

      {/* Controles */}
      <div className="px-6 pb-8 pt-2 shrink-0 space-y-3">
        {isWork ? (
          <button
            onClick={completeSet}
            className="w-full text-white rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ backgroundColor: accent }}
          >
            <Check size={22} />
            {isOpenStep ? 'Serie hecha' : 'Terminé antes'}
          </button>
        ) : (
          <div className="flex gap-3">
            {isRest && (
              <button
                onClick={() => runner.addSeconds(15)}
                className="flex-1 bg-gray-900 border border-gray-800 text-gray-200 rounded-2xl py-4 font-semibold"
              >
                +15s
              </button>
            )}
            <button
              onClick={() => runner.next()}
              className="flex-1 bg-gray-900 border border-gray-800 text-gray-200 rounded-2xl py-4 font-semibold flex items-center justify-center gap-2"
            >
              <SkipForward size={18} /> Saltar
            </button>
          </div>
        )}
        <button
          onClick={runner.toggle}
          className="w-full text-gray-400 py-2 text-sm flex items-center justify-center gap-2"
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {isRunning ? 'Pausar' : 'Reanudar'}
          {isOpenStep && isRunning && <span className="font-mono text-gray-600">· {formatClock(openElapsed)}</span>}
        </button>
      </div>
    </div>
  );
}
