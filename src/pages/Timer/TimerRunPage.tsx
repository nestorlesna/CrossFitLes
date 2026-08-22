import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pause, Play, SkipForward, Plus, Flag, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { getById } from '../../db/repositories/freeTimerTemplateRepo';
import { get as getTimerConfig } from '../../db/repositories/timerConfigRepo';
import { FreeTimerConfig } from '../../models/FreeTimer';
import { TimerConfig, DEFAULT_TIMER_CONFIG } from '../../models/TimerConfig';
import { buildFreeTimeline } from '../../services/freeTimerEngine';
import { formatClock, timelineDuration, TimerStep } from '../../services/timerEngine';
import { configureAudio, unlockAudio } from '../../services/timerAudio';
import { useTimerRunner } from '../../hooks/useTimerRunner';

// Paleta de fase: verde = trabajo, rojo = descanso, ámbar = preparación.
// Deliberadamente distinta de la del cronómetro de clase: esta pantalla es
// un timer libre, no una clase guiada, y estos son los colores universales
// de un timer de box.
function phasePalette(step: TimerStep | undefined): { ring: string; text: string; bg: string; title: string } {
  if (!step) return { ring: 'stroke-gray-600', text: 'text-gray-300', bg: 'bg-gray-950', title: 'Fin' };

  switch (step.kind) {
    case 'lead_in':
      return { ring: 'stroke-amber-500', text: 'text-amber-400', bg: 'bg-amber-950/20', title: 'Preparados' };
    case 'work':
      return { ring: 'stroke-green-500', text: 'text-green-400', bg: 'bg-green-950/20', title: 'Trabajo' };
    case 'rest':
    case 'round_rest':
      return { ring: 'stroke-red-500', text: 'text-red-400', bg: 'bg-red-950/20', title: 'Descanso' };
    case 'section_rest':
      return { ring: 'stroke-red-500', text: 'text-red-400', bg: 'bg-red-950/20', title: 'Descanso' };
  }
}

function ProgressRing({ progress, className }: { progress: number; className: string }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
      <circle cx="50" cy="50" r={radius} className="stroke-gray-800" strokeWidth="3" fill="none" />
      <circle
        cx="50" cy="50" r={radius}
        className={className}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.3s linear' }}
      />
    </svg>
  );
}

export function TimerRunPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [freeConfig, setFreeConfig] = useState<FreeTimerConfig | null>(null);
  const [globalConfig, setGlobalConfig] = useState<TimerConfig>(DEFAULT_TIMER_CONFIG);
  const [hasStarted, setHasStarted] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [amrapRounds, setAmrapRounds] = useState(0);

  const wakeLockRef = useRef<any>(null);

  const steps = useMemo(
    () => (freeConfig ? buildFreeTimeline(freeConfig) : []),
    [freeConfig]
  );

  const runner = useTimerRunner(steps, globalConfig);
  const { step, stepIndex, remaining, openElapsed, isOpenStep, isRunning, isFinished, totalElapsed } = runner;

  const isAmrap = freeConfig?.preset === 'amrap';

  // ── Carga de datos ──
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const [tpl, cfg] = await Promise.all([getById(id), getTimerConfig()]);
        if (cancelled) return;
        if (!tpl) {
          toast.error('Timer no encontrado');
          navigate('/timer');
          return;
        }
        setFreeConfig(JSON.parse(tpl.config_json));
        setGlobalConfig(cfg);
        setSoundOn(Boolean(cfg.sound_enabled));
        configureAudio({ sound: Boolean(cfg.sound_enabled), vibration: Boolean(cfg.vibration_enabled) });
      } catch {
        if (cancelled) return;
        toast.error('Error al cargar el timer');
        navigate('/timer');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // ── Mantener la pantalla encendida mientras corre ──
  useEffect(() => {
    if (!globalConfig.keep_awake || !isRunning) return;
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
  }, [globalConfig.keep_awake, isRunning]);

  useEffect(() => {
    if (isFinished && hasStarted) setShowFinishModal(true);
  }, [isFinished, hasStarted]);

  const handleStart = async () => {
    await unlockAudio();
    setHasStarted(true);
    runner.start();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    configureAudio({ sound: next, vibration: Boolean(globalConfig.vibration_enabled) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
      </div>
    );
  }

  if (!freeConfig) return null;

  const totalSteps = steps.length;
  const estimatedTotal = timelineDuration(steps);
  const palette = phasePalette(step);
  const isWork = step?.kind === 'work';
  const stepProgress = step && step.durationSeconds > 0 ? 1 - remaining / step.durationSeconds : 0;
  const displaySeconds = isOpenStep ? openElapsed : remaining;
  const isUrgent = !isOpenStep && remaining <= 3 && remaining > 0 && isRunning;

  // ── Pantalla previa ──
  if (!hasStarted) {
    // z-[60]: el BottomNav es fixed en z-50 y empata en orden de DOM, así que esta
    // pantalla tiene que taparlo explícitamente (mismo motivo que en SessionTimerPage)
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col z-[60]">
        <div className="p-4">
          <button aria-label="Volver"
            onClick={() => navigate(-1)}
            className="text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2">Timer</p>
            <h1 className="text-3xl font-bold text-white">{freeConfig.name}</h1>
          </div>

          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-white">{totalSteps}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Pasos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {estimatedTotal > 0 ? `${Math.round(estimatedTotal / 60)}'` : '∞'}
              </p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Estimado</p>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full max-w-xs bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-5 flex items-center justify-center gap-3 font-bold text-lg shadow-lg shadow-primary-900/30 active:scale-[0.97] transition-transform"
          >
            <Play size={24} fill="currentColor" />
            Empezar
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla del timer ──
  return (
    <div className={`fixed inset-0 flex flex-col z-[60] transition-colors duration-500 ${palette.bg} bg-gray-950`}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Salir"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{freeConfig.name}</p>
          {step && step.totalRounds > 1 && (
            <p className="text-[10px] text-gray-500 font-bold">
              Ronda {step.round}/{step.totalRounds}
            </p>
          )}
        </div>

        <button
          onClick={toggleSound}
          className="text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={soundOn ? 'Silenciar' : 'Activar sonido'}
        >
          {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="h-1 bg-gray-900 shrink-0">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0}%` }}
        />
      </div>

      {/* Sin imagen de ejercicio que mostrar (a diferencia de la clase guiada), así que
          el reloj puede ocupar casi toda la pantalla disponible en el celular */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-1 min-h-0">
        <div className="relative w-full max-w-[min(78vh,420px)] aspect-square shrink">
          <ProgressRing progress={stepProgress} className={palette.ring} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div
              className={`font-mono font-bold leading-none tabular-nums transition-transform ${palette.text} ${
                isUrgent ? 'scale-110 text-red-300' : ''
              }`}
              style={{ fontSize: 'clamp(3.5rem, 20vw, 7.5rem)' }}
            >
              {formatClock(displaySeconds)}
            </div>
            <span className={`text-sm font-bold uppercase tracking-widest ${palette.text}`}>{palette.title}</span>
          </div>
        </div>

        <div className="text-center px-2">
          <h2 className="text-xl font-bold text-white leading-tight">{step?.label ?? 'Terminado'}</h2>
          {isOpenStep && (
            <p className="text-xs text-amber-500 mt-2 font-bold uppercase tracking-wider">
              Corre libre — finalizá cuando termines
            </p>
          )}
          {!isWork && step?.nextExerciseName && (
            <p className="text-sm text-gray-500 mt-1">Próximo: {step.nextExerciseName}</p>
          )}
        </div>

        {isAmrap && isWork && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-3xl font-bold text-white">{amrapRounds}</p>
            <button
              onClick={() => setAmrapRounds((r) => r + 1)}
              className="bg-white/10 border border-white/20 text-white rounded-full px-6 py-3 font-bold flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Plus size={18} />
              Ronda
            </button>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2 flex flex-col gap-2 safe-bottom">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => runner.addSeconds(15)}
            disabled={isOpenStep}
            className="w-14 h-14 rounded-2xl bg-gray-900/80 border border-gray-800 text-gray-400 flex flex-col items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
            aria-label="Sumar 15 segundos"
          >
            <Plus size={16} />
            <span className="text-[10px] font-bold">15s</span>
          </button>

          <button
            onClick={runner.toggle}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform ${
              isRunning ? 'bg-amber-500 text-gray-950 shadow-amber-900/30' : 'bg-primary-600 text-white shadow-primary-900/30'
            }`}
            aria-label={isRunning ? 'Pausar' : 'Continuar'}
          >
            {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          </button>

          <button
            onClick={runner.next}
            className="w-14 h-14 rounded-2xl bg-gray-900/80 border border-gray-800 text-gray-400 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Siguiente paso"
          >
            <SkipForward size={22} />
          </button>

          <button
            onClick={() => {
              runner.pause();
              setShowFinishModal(true);
            }}
            className="w-14 h-14 rounded-2xl bg-gray-900/80 border border-gray-800 text-red-400 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Finalizar"
          >
            <Flag size={22} />
          </button>
        </div>
      </div>

      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Finalizar timer"
        footer={
          <div className="flex gap-3 w-full">
            {!isFinished && (
              <button
                className="flex-1 border border-gray-700 text-gray-400 rounded-xl px-4 py-3 text-sm font-semibold"
                onClick={() => setShowFinishModal(false)}
              >
                Seguir
              </button>
            )}
            <button
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-3 text-sm font-bold"
              onClick={() => navigate('/timer')}
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center gap-2 py-2">
          <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 size={32} className="text-primary-500" />
          </div>
          <p className="text-xl font-bold text-white">{isFinished ? '¡Terminado!' : '¿Finalizar ahora?'}</p>
          <p className="text-sm text-gray-400">{formatClock(totalElapsed)} transcurridos.</p>
          {isAmrap && <p className="text-sm text-gray-400">{amrapRounds} rondas completadas.</p>}
        </div>
      </Modal>
    </div>
  );
}
