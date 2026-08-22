import { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Plus,
  Flag,
  Dumbbell,
  Video,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { ResolvedImage } from '../../components/ui/ResolvedImage';
import { VideoEmbed } from '../../components/ui/VideoEmbed';
import { getById as getSessionById, finalize, saveResults } from '../../db/repositories/trainingSessionRepo';
import { getById as getTemplateById } from '../../db/repositories/classTemplateRepo';
import { get as getTimerConfig } from '../../db/repositories/timerConfigRepo';
import { SessionWithRelations } from '../../models/TrainingSession';
import { ClassTemplateWithSections } from '../../models/ClassTemplate';
import { TimerConfig, DEFAULT_TIMER_CONFIG } from '../../models/TimerConfig';
import { GeneralFeeling } from '../../types';
import { buildTimeline, formatClock, timelineDuration, TimerStep } from '../../services/timerEngine';
import { configureAudio, unlockAudio } from '../../services/timerAudio';
import { useTimerRunner } from '../../hooks/useTimerRunner';

// Paleta por tipo de paso: el color domina la pantalla para que se lea a varios metros
function stepPalette(step: TimerStep | undefined): { ring: string; text: string; bg: string; title: string } {
  if (!step) return { ring: 'stroke-gray-600', text: 'text-gray-300', bg: 'bg-gray-950', title: 'Fin' };

  switch (step.kind) {
    case 'lead_in':
      return { ring: 'stroke-amber-500', text: 'text-amber-400', bg: 'bg-amber-950/20', title: 'Preparados' };
    case 'work':
      return { ring: 'stroke-primary-500', text: 'text-white', bg: 'bg-gray-950', title: 'Trabajo' };
    case 'rest':
      return { ring: 'stroke-cyan-500', text: 'text-cyan-300', bg: 'bg-cyan-950/20', title: 'Descanso' };
    case 'round_rest':
      return { ring: 'stroke-cyan-500', text: 'text-cyan-300', bg: 'bg-cyan-950/20', title: 'Descanso de ronda' };
    case 'section_rest':
      return { ring: 'stroke-violet-500', text: 'text-violet-300', bg: 'bg-violet-950/20', title: 'Cambio de sección' };
  }
}

// Anillo de progreso del paso actual
function ProgressRing({ progress, className }: { progress: number; className: string }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
      <circle cx="50" cy="50" r={radius} className="stroke-gray-800" strokeWidth="3" fill="none" />
      <circle
        cx="50"
        cy="50"
        r={radius}
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

export function SessionTimerPage() {
  const uid = useId();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [template, setTemplate] = useState<ClassTemplateWithSections | null>(null);
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_TIMER_CONFIG);
  const [hasStarted, setHasStarted] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('Video');
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [feeling, setFeeling] = useState<GeneralFeeling>('normal');
  const [effort, setEffort] = useState(5);
  const [notes, setNotes] = useState('');

  const wakeLockRef = useRef<any>(null);

  const steps = useMemo(
    () => (template ? buildTimeline(template, config) : []),
    [template, config]
  );

  const runner = useTimerRunner(steps, config);
  const { step, stepIndex, remaining, openElapsed, isOpenStep, isRunning, isFinished, totalElapsed } = runner;

  // Ejercicio del próximo paso de trabajo: durante la cuenta regresiva y los descansos
  // permite ver de antemano el video de lo que viene.
  const upcomingExercise = useMemo(() => {
    if (!step || step.kind === 'work') return undefined;
    for (let i = stepIndex + 1; i < steps.length; i++) {
      if (steps[i].kind === 'work') return steps[i].exercise;
    }
    return undefined;
  }, [steps, stepIndex, step]);

  // ── Carga de datos ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const [sess, cfg] = await Promise.all([getSessionById(id!), getTimerConfig()]);
        if (cancelled) return;

        if (!sess) {
          toast.error('Sesión no encontrada');
          navigate('/sesiones');
          return;
        }
        if (!sess.class_template_id) {
          toast.error('Esta sesión no tiene una clase asociada');
          navigate(`/sesiones/${id}/ejecutar`);
          return;
        }

        const templ = await getTemplateById(sess.class_template_id);
        if (cancelled) return;
        if (templ?.video_url) {
          // La clase se ejecuta mirando el video, no con el cronómetro paso a paso
          navigate(`/sesiones/${id}/video`, { replace: true });
          return;
        }
        if (!templ || templ.sections.length === 0) {
          toast.error('La clase no tiene secciones cargadas');
          navigate('/sesiones');
          return;
        }

        setSession(sess);
        setTemplate(templ);
        setConfig(cfg);
        configureAudio({ sound: Boolean(cfg.sound_enabled), vibration: Boolean(cfg.vibration_enabled) });
      } catch {
        if (!cancelled) toast.error('Error al cargar la clase');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // ── Mantener la pantalla encendida mientras el cronómetro corre ───────────
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

  // Al llegar al final abrimos el resumen automáticamente
  useEffect(() => {
    if (isFinished && hasStarted) setShowFinishModal(true);
  }, [isFinished, hasStarted]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleStart = async () => {
    await unlockAudio();
    setHasStarted(true);
    runner.start();
  };

  const handleWatchVideo = useCallback(
    (url: string, title: string) => {
      runner.pause();
      setVideoUrl(url);
      setVideoTitle(title);
    },
    [runner]
  );

  const handleFinalize = async () => {
    if (!id || !session) return;
    setSaving(true);
    try {
      // El cronómetro ya recorrió los ejercicios: se guardan los resultados como están
      // (la sesión se crea con is_completed = 1) y se cierra con el resumen.
      await saveResults(id, session.results);
      await finalize(id, {
        durationMinutes: Math.max(1, Math.round(totalElapsed / 60)),
        feeling,
        effort,
        notes,
      });
      toast.success('¡Clase completada!');
      navigate(`/sesiones/${id}`);
    } catch {
      toast.error('Error al finalizar la clase');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
      </div>
    );
  }

  if (!template) return null;

  const totalSteps = steps.length;
  const estimatedTotal = timelineDuration(steps);
  const palette = stepPalette(step);
  const exercise = step?.exercise;
  const isWork = step?.kind === 'work';

  const stepProgress =
    step && step.durationSeconds > 0 ? 1 - remaining / step.durationSeconds : 0;

  const displaySeconds = isOpenStep ? openElapsed : remaining;
  const isUrgent = !isOpenStep && remaining <= 3 && remaining > 0 && isRunning;

  // ── Pantalla previa al arranque ──
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
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
            <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2">
              Clase guiada
            </p>
            <h1 className="text-3xl font-bold text-white">{template.name}</h1>
            {template.objective && (
              <p className="text-gray-400 text-sm mt-2">{template.objective}</p>
            )}
          </div>

          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-white">{template.sections.length}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Secciones</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalSteps}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Pasos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{Math.round(estimatedTotal / 60)}'</p>
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

          <p className="text-xs text-gray-600 max-w-xs">
            El cronómetro avanza solo por los ejercicios, descansos y secciones. Podés pausar,
            saltar o sumar segundos en cualquier momento.
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla del cronómetro ──
  return (
    // z-[60]: el BottomNav es fixed en z-50, así que el cronómetro tiene que taparlo
    <div className={`fixed inset-0 flex flex-col z-[60] transition-colors duration-500 ${palette.bg} bg-gray-950`}>
      {/* Encabezado mínimo: sección, ronda y progreso general */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Salir"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="text-center">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: step?.sectionColor ?? '#9ca3af' }}
          >
            {step?.sectionTitle ?? 'Clase'}
          </p>
          {step && step.totalRounds > 1 && (
            <p className="text-[10px] text-gray-500 font-bold">
              Vuelta {step.round}/{step.totalRounds}
              {step.totalSets > 1 && ` · Serie ${step.set}/${step.totalSets}`}
            </p>
          )}
        </div>

        <div className="min-w-[44px] text-right">
          <p className="text-xs font-mono text-gray-500">{formatClock(totalElapsed)}</p>
        </div>
      </div>

      <div className="h-1 bg-gray-900 shrink-0">
        <div
          className="h-full bg-primary-500 transition-[width] duration-300"
          style={{ width: `${totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0}%` }}
        />
      </div>

      {/* Cuerpo: en trabajo, imagen grande + reloj centrado; en las transiciones
          (descanso / cambio de sección) el reloj se achica a la derecha y a la
          izquierda aparece el próximo ejercicio para anticiparlo sin confundirlo
          con lo que hay que hacer ahora. */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 py-2 min-h-0">
        {isWork ? (
          <>
            <div className="relative w-full max-w-[min(52vh,240px)] aspect-square shrink">
              <ProgressRing progress={stepProgress} className={palette.ring} />

              <div className="absolute inset-[10%] rounded-full overflow-hidden bg-gray-900 flex items-center justify-center">
                {exercise ? (
                  <ResolvedImage
                    path={exercise.exercise_image_url || exercise.exercise_image_path}
                    alt={exercise.exercise_name ?? ''}
                    className="w-full h-full object-contain p-2"
                    fallback={<Dumbbell size={72} className="text-gray-700" />}
                  />
                ) : (
                  <Dumbbell size={72} className="text-gray-700" />
                )}
              </div>
            </div>

            {/* Reloj */}
            <div
              className={`font-mono font-bold leading-none tabular-nums transition-transform ${palette.text} ${
                isUrgent ? 'scale-110 text-red-400' : ''
              }`}
              style={{ fontSize: 'clamp(2.75rem, 13vw, 4.5rem)' }}
            >
              {formatClock(displaySeconds)}
            </div>

            {/* Ejercicio */}
            <div className="text-center px-2">
              <h2 className="text-xl font-bold text-white leading-tight">
                {step?.label ?? 'Clase terminada'}
              </h2>
              {step?.detail && <p className="text-sm text-primary-400 font-semibold mt-1">{step.detail}</p>}
              {isOpenStep && (
                <p className="text-xs text-amber-500 mt-2 font-bold uppercase tracking-wider">
                  Avanzá cuando termines
                </p>
              )}
              {exercise?.coach_notes && (
                <p className="text-xs text-gray-500 mt-2 italic">{exercise.coach_notes}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="w-full max-w-md flex items-center justify-center gap-4">
              {/* Izquierda: el ejercicio que se viene, atenuado y con borde punteado
                  para que quede claro que todavía no hay que hacerlo */}
              <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <ArrowRight size={12} /> Próximo
                </span>
                <div className="relative w-full aspect-square max-w-[190px] rounded-3xl overflow-hidden bg-gray-900/60 border border-dashed border-gray-700 flex items-center justify-center opacity-60">
                  {upcomingExercise ? (
                    <ResolvedImage
                      path={upcomingExercise.exercise_image_url || upcomingExercise.exercise_image_path}
                      alt={upcomingExercise.exercise_name ?? ''}
                      className="w-full h-full object-contain p-3"
                      fallback={<Dumbbell size={56} className="text-gray-700" />}
                    />
                  ) : (
                    <Flag size={44} className="text-gray-700" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-300 text-center leading-tight line-clamp-2">
                  {upcomingExercise?.exercise_name ?? step?.nextExerciseName ?? 'Fin de la clase'}
                </p>
              </div>

              {/* Derecha: reloj chico de la transición */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className="relative w-[34vw] max-w-[150px] aspect-square">
                  <ProgressRing progress={stepProgress} className={palette.ring} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={`font-mono font-bold tabular-nums leading-none ${palette.text} ${
                        isUrgent ? 'text-red-400' : ''
                      }`}
                      style={{ fontSize: 'clamp(1.5rem, 8vw, 2.5rem)' }}
                    >
                      {formatClock(displaySeconds)}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${palette.text}`}>
                  {palette.title}
                </span>
              </div>
            </div>

            {/* Detalle de la transición: vuelta, sección de destino o ventana */}
            {(step?.label || step?.detail) && (
              <div className="text-center px-2">
                <h2 className="text-lg font-bold text-white leading-tight">{step?.label}</h2>
                {step?.detail && (
                  <p className="text-sm text-primary-400 font-semibold mt-1">{step.detail}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Controles */}
      <div className="shrink-0 px-4 pb-4 pt-2 flex flex-col gap-2 safe-bottom">
        {isWork && exercise?.exercise_video_url && (
          <button
            onClick={() =>
              handleWatchVideo(exercise.exercise_video_url!, exercise.exercise_name ?? 'Video')
            }
            className="self-center flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 active:scale-95 transition-transform"
          >
            <Video size={14} />
            Ver video (pausa el reloj)
          </button>
        )}

        {/* En el descanso: adelantar el video de lo que viene */}
        {!isWork && upcomingExercise?.exercise_video_url && (
          <button
            onClick={() =>
              handleWatchVideo(
                upcomingExercise.exercise_video_url!,
                upcomingExercise.exercise_name ?? 'Video'
              )
            }
            className="self-center flex items-center gap-2 text-xs font-bold text-gray-300 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 max-w-full active:scale-95 transition-transform"
          >
            <Video size={14} className="shrink-0" />
            <span className="truncate">Ver qué sigue: {upcomingExercise.exercise_name}</span>
          </button>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={runner.previous}
            className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 text-gray-400 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Ejercicio anterior"
          >
            <SkipBack size={22} />
          </button>

          <button
            onClick={() => runner.addSeconds(15)}
            disabled={isOpenStep}
            className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 text-gray-400 flex flex-col items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
            aria-label="Sumar 15 segundos"
          >
            <Plus size={16} />
            <span className="text-[10px] font-bold">15s</span>
          </button>

          <button
            onClick={runner.toggle}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform ${
              isRunning
                ? 'bg-amber-500 text-gray-950 shadow-amber-900/30'
                : 'bg-primary-600 text-white shadow-primary-900/30'
            }`}
            aria-label={isRunning ? 'Pausar' : 'Continuar'}
          >
            {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          </button>

          <button
            onClick={runner.next}
            className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 text-gray-400 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Siguiente ejercicio"
          >
            <SkipForward size={22} />
          </button>

          <button
            onClick={() => {
              runner.pause();
              setShowFinishModal(true);
            }}
            className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 text-red-400 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Finalizar clase"
          >
            <Flag size={22} />
          </button>
        </div>
      </div>

      {/* Video: al cerrarlo el usuario decide cuándo retomar */}
      <Modal
        isOpen={Boolean(videoUrl)}
        onClose={() => setVideoUrl(null)}
        title={videoTitle}
        size="md"
      >
        <div className="flex flex-col gap-4">
          {videoUrl && <VideoEmbed url={videoUrl} />}
          <button
            onClick={() => {
              setVideoUrl(null);
              runner.resume();
            }}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"
          >
            <Play size={18} fill="currentColor" />
            Retomar la clase
          </button>
          <p className="text-xs text-gray-500 text-center">
            El cronómetro está en pausa. También podés cerrar el video y retomarlo con el botón de play.
          </p>
        </div>
      </Modal>

      {/* Resumen final */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Finalizar clase"
        footer={
          <div className="flex gap-3 w-full">
            <button
              className="flex-1 border border-gray-700 text-gray-400 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              onClick={() => setShowFinishModal(false)}
              disabled={saving || isFinished}
            >
              Seguir
            </button>
            <button
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
              onClick={handleFinalize}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar y cerrar'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 py-2">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} className="text-primary-500" />
            </div>
            <p className="text-xl font-bold text-white">
              {isFinished ? '¡Clase terminada!' : '¿Cerrar la clase?'}
            </p>
            <p className="text-sm text-gray-400">{formatClock(totalElapsed)} de entrenamiento.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">¿Cómo te sentiste?</label>
            <div className="flex justify-between gap-2">
              {(['terrible', 'bad', 'normal', 'good', 'excellent'] as GeneralFeeling[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFeeling(f)}
                  className={`flex-1 py-3 rounded-xl border text-xl transition ${
                    feeling === f
                      ? 'bg-primary-500/20 border-primary-500'
                      : 'bg-gray-900 border-gray-800 opacity-40'
                  }`}
                >
                  {f === 'terrible' && '😫'}
                  {f === 'bad' && '😕'}
                  {f === 'normal' && '😐'}
                  {f === 'good' && '😊'}
                  {f === 'excellent' && '🔥'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Esfuerzo (RPE)</label>
              <span className="text-xs font-bold text-primary-500">{effort}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={effort}
              onChange={(e) => setEffort(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          <div>
            <label htmlFor={`${uid}-notas`} className="block text-xs font-bold text-gray-500 uppercase mb-2">Notas</label>
            <textarea
              id={`${uid}-notas`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Algo para recordar de hoy?"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 min-h-[80px] resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
