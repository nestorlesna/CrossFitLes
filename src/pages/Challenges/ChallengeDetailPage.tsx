// Detalle de un challenge: inscripción (con test inicial) o avance del que está en curso
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ShieldAlert,
  Play,
  CheckCircle2,
  Moon,
  Flame,
  Trophy,
  AlertTriangle,
  RotateCcw,
  CalendarClock,
  Gauge,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { getChallenge, CHALLENGE_SAFETY_TEXT } from '../../data/challenges';
import { ChallengeEnrollment, ChallengeLevel } from '../../models/Challenge';
import { PlanDay } from '../../models/TrainingPlan';
import * as challengeRepo from '../../db/repositories/challengeRepo';
import { ChallengeDaySet, ChallengeVolumePoint } from '../../db/repositories/challengeRepo';
import {
  buildMetaSession,
  formatSets,
  levelFromTest,
  testRangeLabel,
  todayISO,
  LEVEL_LABEL,
  META_WEEKS,
  SESSIONS_PER_WEEK,
} from '../../services/challengeEngine';

// recharts es pesado: el gráfico se carga bajo demanda
const ChallengeProgressChart = lazy(() => import('./ChallengeProgressChart'));

const LEVELS: ChallengeLevel[] = ['beginner', 'intermediate', 'advanced'];

function formatDay(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), "EEE d 'de' MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

/** Texto corto de las series planificadas de un día */
function describeSets(sets: ChallengeDaySet[] | undefined, lastToFailure: boolean): string {
  if (!sets || sets.length === 0) return '';
  // Circuito: varios ejercicios distintos con vueltas
  const names = new Set(sets.map((s) => s.exercise_name));
  if (names.size > 1) {
    const rounds = sets[0].total_rounds ?? 1;
    const items = sets.map((s) =>
      s.planned_time_seconds ? `${s.planned_time_seconds}s` : `${s.planned_repetitions ?? ''}`
    );
    return `${rounds} vueltas: ${items.join(' · ')}`;
  }
  const seconds = sets.some((s) => s.planned_time_seconds);
  const values = sets.map((s) => (seconds ? s.planned_time_seconds ?? 0 : s.planned_repetitions ?? 0));
  return formatSets(values, seconds ? 'seconds' : 'reps', lastToFailure);
}

export function ChallengeDetailPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const def = getChallenge(code);

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<ChallengeEnrollment | null>(null);
  const [daySets, setDaySets] = useState<Record<string, ChallengeDaySet[]>>({});
  const [volume, setVolume] = useState<ChallengeVolumePoint[]>([]);
  const [completedBefore, setCompletedBefore] = useState(0);

  // Formulario de inscripción
  const [startDate, setStartDate] = useState(todayISO());
  const [testReps, setTestReps] = useState('');
  const [easy, setEasy] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modales
  const [retestWeek, setRetestWeek] = useState<number | null>(null);
  const [retestReps, setRetestReps] = useState('');
  const [repeatWeekNumber, setRepeatWeekNumber] = useState<number | null>(null);
  const [showAbandon, setShowAbandon] = useState(false);
  const [restart, setRestart] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        challengeRepo.getActiveByCode(code),
        challengeRepo.getHistoryByCode(code),
      ]);
      setCompletedBefore(history.filter((p) => p.status === 'completed').length);
      // Sin uno en curso, se muestra el último completado (hasta que se elija empezar de nuevo)
      const current = active ?? history.find((p) => p.status === 'completed');
      if (current) {
        const [full, sets, vol] = await Promise.all([
          challengeRepo.getEnrollment(current.id),
          challengeRepo.getDaySets(current.id),
          challengeRepo.getVolumeSeries(current.id),
        ]);
        setEnrollment(full);
        setDaySets(sets);
        setVolume(vol);
      } else {
        setEnrollment(null);
        setDaySets({});
        setVolume([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar el challenge');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  if (!def) {
    return (
      <>
        <Header title="Challenge" />
        <p className="p-6 text-center text-gray-500">Challenge no encontrado</p>
      </>
    );
  }

  const isMeta = def.kind === 'meta_reps';
  const testNumber = testReps === '' ? null : Math.max(0, parseInt(testReps, 10) || 0);
  const previewLevel: ChallengeLevel | null =
    isMeta && testNumber !== null ? levelFromTest(def, testNumber) : null;

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleEnroll = async () => {
    if (isMeta && testNumber === null) {
      toast.error('Cargá el resultado del test inicial');
      return;
    }
    setSaving(true);
    try {
      await challengeRepo.enroll(def.code, {
        startDate,
        maxReps: testNumber ?? undefined,
        easy,
      });
      toast.success('¡Challenge iniciado!');
      setRestart(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el challenge');
    } finally {
      setSaving(false);
    }
  };

  const handleStartDay = async (day: PlanDay) => {
    try {
      const sessionId = await challengeRepo.startDay(day.id);
      navigate(`/challenges/sesion/${sessionId}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el día');
    }
  };

  const handleRetest = async (skip: boolean) => {
    if (!enrollment || retestWeek === null) return;
    const value = skip ? null : Math.max(0, parseInt(retestReps, 10) || 0);
    if (!skip && retestReps === '') {
      toast.error('Cargá cuántas repeticiones hiciste');
      return;
    }
    try {
      const { level, changed } = await challengeRepo.saveRetest(enrollment.plan.id, retestWeek, value);
      toast.success(
        changed ? `Nuevo nivel: ${LEVEL_LABEL[level]}. Se recalcularon las sesiones.` : 'Retest guardado'
      );
      setRetestWeek(null);
      setRetestReps('');
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el retest');
    }
  };

  const handleRepeatWeek = async () => {
    if (!enrollment || repeatWeekNumber === null) return;
    try {
      await challengeRepo.repeatWeek(enrollment.plan.id, repeatWeekNumber);
      toast.success(`Semana ${repeatWeekNumber} reprogramada`);
      setRepeatWeekNumber(null);
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Error al reprogramar la semana');
    }
  };

  const handleReschedule = async () => {
    if (!enrollment) return;
    try {
      await challengeRepo.rescheduleFromToday(enrollment.plan.id);
      toast.success('Días reprogramados desde hoy');
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Error al reprogramar');
    }
  };

  const handleAbandon = async () => {
    if (!enrollment) return;
    try {
      await challengeRepo.abandon(enrollment.plan.id);
      toast.success('Challenge abandonado');
      setShowAbandon(false);
      await load();
    } catch {
      toast.error('Error al abandonar el challenge');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const backButton = (
    <button
      onClick={() => navigate('/challenges')}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      aria-label="Volver"
    >
      <ChevronLeft size={22} />
    </button>
  );

  const infoCard = (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${def.color}22` }}
        >
          <Trophy size={22} style={{ color: def.color }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-white font-bold text-lg leading-tight">{def.name}</h2>
          <p className="text-xs text-gray-500">{def.summary}</p>
        </div>
      </div>
      <div className="text-xs text-gray-400 space-y-1 pt-1">
        <p>
          <span className="text-gray-500">Equipamiento:</span> {def.equipment}
        </p>
        {def.regression && (
          <p>
            <span className="text-gray-500">Versión fácil:</span> {def.regression.hint}
          </p>
        )}
        {def.notes && <p className="text-gray-500">{def.notes}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Header title={def.name} leftAction={backButton} />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" />
        </div>
      </>
    );
  }

  // ── Sin challenge en curso: inscripción ──
  if (!enrollment || restart) {
    const preview = isMeta && def.goal ? buildMetaSession(def.goal, previewLevel ?? 'intermediate', 1, 1) : null;
    const firstDaily = !isMeta ? def.days?.find((d) => !d.rest) : undefined;

    return (
      <>
        <Header title={def.name} leftAction={backButton} />
        <div className="px-4 py-4 space-y-4 pb-24">
          {infoCard}

          {completedBefore > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 border border-green-800 rounded-xl px-3 py-2">
              <CheckCircle2 size={16} />
              Ya lo completaste {completedBefore === 1 ? 'una vez' : `${completedBefore} veces`}
            </div>
          )}

          <div className="flex gap-3 bg-amber-950/30 border border-amber-800/60 rounded-xl p-3">
            <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">{CHALLENGE_SAFETY_TEXT}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            {isMeta && (
              <div className="space-y-2">
                <label htmlFor="test-reps" className="block text-sm font-medium text-white">
                  Test inicial
                </label>
                <p className="text-xs text-gray-500">
                  Hacé todas las repeticiones seguidas que puedas con buena técnica y cargá el número.
                </p>
                <input
                  id="test-reps"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={testReps}
                  onChange={(e) => setTestReps(e.target.value)}
                  placeholder="Repeticiones"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-primary-500"
                />
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map((lvl) => (
                    <div
                      key={lvl}
                      className={`text-center rounded-lg border px-2 py-1.5 ${
                        previewLevel === lvl
                          ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                          : 'border-gray-800 text-gray-500'
                      }`}
                    >
                      <p className="text-[11px] font-semibold">{LEVEL_LABEL[lvl]}</p>
                      <p className="text-[10px] font-mono">{testRangeLabel(def, lvl)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="start-date" className="block text-sm font-medium text-white">
                Fecha de inicio
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value || todayISO())}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              />
              {isMeta && (
                <p className="text-[11px] text-gray-500">3 sesiones por semana con un día de descanso entre medio.</p>
              )}
            </div>

            {def.regression?.exercise && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={easy}
                  onChange={(e) => setEasy(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary-500"
                />
                <span className="text-sm text-gray-300">
                  Usar la versión fácil
                  <span className="block text-xs text-gray-500">{def.regression.hint}</span>
                </span>
              </label>
            )}

            {(preview || firstDaily) && (
              <div className="text-xs text-gray-500 bg-gray-950 rounded-lg px-3 py-2">
                <span className="text-gray-400">Primer día: </span>
                {preview
                  ? `${formatSets(preview.sets, 'reps', true)} · ${preview.restSeconds}s de descanso`
                  : firstDaily?.sets
                  ? formatSets(firstDaily.sets, def.unit, false)
                  : firstDaily?.circuit
                  ? `Circuito de ${firstDaily.circuit.rounds} vueltas`
                  : ''}
              </div>
            )}

            <button
              onClick={handleEnroll}
              disabled={saving}
              className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Play size={18} className="fill-white" />
              Empezar challenge
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Challenge en curso ──
  const { plan, days, progress, tests } = enrollment;
  const level = plan.challenge_level as ChallengeLevel | undefined;
  const pendingRetest = challengeRepo.pendingRetestWeek(enrollment);
  const nextDay = days.find((d) => d.status === 'pending' && d.day_type !== 'rest');
  const today = todayISO();
  const pct = progress.trainingDays > 0 ? Math.round((progress.completed / progress.trainingDays) * 100) : 0;
  const isCompleted = plan.status === 'completed';

  const renderDay = (day: PlanDay, lastToFailure: boolean) => {
    const isRest = day.day_type === 'rest';
    const isDone = day.status === 'completed';
    const isNext = nextDay?.id === day.id;
    const isLate = !isDone && !isRest && !!day.scheduled_date && day.scheduled_date < today;
    return (
      <div
        key={day.id}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
          isNext ? 'bg-primary-600/10 border border-primary-700/60' : 'bg-gray-950/60'
        }`}
      >
        <div className="w-6 flex justify-center shrink-0">
          {isRest ? (
            <Moon size={16} className="text-gray-600" />
          ) : isDone ? (
            <CheckCircle2 size={18} className="text-green-500" />
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full ${isLate ? 'bg-amber-500' : 'bg-gray-700'}`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm truncate ${isDone ? 'text-gray-400' : 'text-white'}`}>
            {day.title}
            <span className="text-[11px] text-gray-500 ml-2">{formatDay(day.scheduled_date)}</span>
          </p>
          <p className="text-[11px] text-gray-500 font-mono truncate">
            {isRest ? day.notes || 'Descanso' : describeSets(daySets[day.id], lastToFailure)}
          </p>
        </div>
        {isDone && day.training_session_id ? (
          <button
            onClick={() => navigate(`/sesiones/${day.training_session_id}`)}
            className="text-[11px] text-primary-400 font-semibold px-2 min-h-[36px]"
          >
            Ver
          </button>
        ) : isNext && pendingRetest === null && !isCompleted ? (
          <button
            onClick={() => handleStartDay(day)}
            className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1 min-h-[36px]"
          >
            <Play size={12} className="fill-white" />
            {day.training_session_id ? 'Retomar' : 'Empezar'}
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <Header title={def.name} leftAction={backButton} />
      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Avance */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-wrap items-center gap-2">
              {level && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-300 flex items-center gap-1">
                  <Gauge size={11} /> {LEVEL_LABEL[level]}
                </span>
              )}
              {plan.challenge_easy === 1 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-400">
                  Versión fácil
                </span>
              )}
              {isCompleted && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-800">
                  Completado
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-amber-400 text-sm font-bold">
              <Flame size={16} /> {progress.streak}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%`, backgroundColor: def.color }}
              />
            </div>
            <span className="text-xs text-gray-400 tabular-nums">
              {progress.completed}/{progress.trainingDays}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Racha de {progress.streak} {progress.streak === 1 ? 'sesión' : 'sesiones'} seguidas
          </p>
        </div>

        {isCompleted && (
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 text-center space-y-2">
            <Trophy size={32} className="text-amber-400 mx-auto" />
            <p className="text-white font-bold">¡Challenge completado!</p>
            <button
              onClick={() => setRestart(true)}
              className="bg-gray-800 border border-gray-700 text-gray-200 rounded-xl px-4 py-2 text-sm font-medium min-h-[40px]"
            >
              Empezar de nuevo
            </button>
          </div>
        )}

        {/* Retest pendiente */}
        {pendingRetest !== null && (
          <div className="bg-primary-600/10 border border-primary-700 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ClipboardList size={20} className="text-primary-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Retest de la semana {pendingRetest}</p>
                <p className="text-xs text-gray-400">
                  Hacé el máximo de repeticiones seguidas. Con eso se recalcula tu nivel antes de seguir.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRetestWeek(pendingRetest)}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 text-sm font-bold min-h-[44px]"
            >
              Cargar retest
            </button>
          </div>
        )}

        {/* Días salteados */}
        {!isCompleted && progress.overdue >= 2 && (
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/90">
                Te salteaste {progress.overdue} {isMeta ? 'sesiones' : 'días'}. Reprogramá para retomar desde hoy.
              </p>
            </div>
            <button
              onClick={handleReschedule}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
            >
              <CalendarClock size={16} /> Reprogramar desde hoy
            </button>
          </div>
        )}

        {/* Días */}
        {isMeta ? (
          Array.from({ length: META_WEEKS }, (_, w) => w + 1).map((week) => {
            const weekDays = days.filter((d) => Math.ceil(d.day_index / SESSIONS_PER_WEEK) === week);
            const started = weekDays.some((d) => d.status === 'completed');
            const isCurrent = weekDays.some((d) => d.id === nextDay?.id) || (started && weekDays.some((d) => d.status === 'pending'));
            const isLastWeek = week === META_WEEKS;
            return (
              <section key={week} className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Semana {week}</h3>
                  {!isCompleted && (started || isCurrent) && (
                    <button
                      onClick={() => setRepeatWeekNumber(week)}
                      className="text-[11px] text-gray-500 hover:text-amber-400 flex items-center gap-1 min-h-[32px]"
                    >
                      <RotateCcw size={12} /> No pude completar
                    </button>
                  )}
                </div>
                {weekDays.map((d) => renderDay(d, !(isLastWeek && d.day_index === META_WEEKS * SESSIONS_PER_WEEK)))}
              </section>
            );
          })
        ) : (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
            {days.map((d) => renderDay(d, false))}
          </section>
        )}

        {/* Gráficos de progreso */}
        {(volume.length > 0 || tests.length > 0) && (
          <Suspense
            fallback={<div className="h-[220px] bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />}
          >
            <ChallengeProgressChart volume={volume} tests={tests} unit={def.unit} color={def.color} />
          </Suspense>
        )}

        {/* Tests */}
        {tests.length > 0 && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tests</h3>
            {tests.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{t.week === 0 ? 'Test inicial' : `Retest semana ${t.week}`}</span>
                <span className="text-gray-400 font-mono">
                  {t.max_reps ?? '—'} reps · {LEVEL_LABEL[t.level]}
                </span>
              </div>
            ))}
          </section>
        )}

        {!isCompleted && (
          <button
            onClick={() => setShowAbandon(true)}
            className="w-full text-sm text-gray-500 hover:text-red-400 flex items-center justify-center gap-2 py-3"
          >
            <Trash2 size={16} /> Abandonar challenge
          </button>
        )}
      </div>

      {/* Retest */}
      <Modal
        isOpen={retestWeek !== null}
        onClose={() => setRetestWeek(null)}
        title={`Retest semana ${retestWeek ?? ''}`}
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => handleRetest(true)}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium min-h-[44px]"
            >
              Omitir
            </button>
            <button
              onClick={() => handleRetest(false)}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold min-h-[44px]"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Máximo de repeticiones seguidas. Si lo omitís, se mantiene el nivel actual.
          </p>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            autoFocus
            value={retestReps}
            onChange={(e) => setRetestReps(e.target.value)}
            placeholder="Repeticiones"
            aria-label="Repeticiones del retest"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-primary-500"
          />
          {retestReps !== '' && (
            <p className="text-xs text-gray-400">
              Nivel resultante:{' '}
              <span className="text-primary-400 font-semibold">
                {LEVEL_LABEL[levelFromTest(def, parseInt(retestReps, 10) || 0)]}
              </span>
            </p>
          )}
        </div>
      </Modal>

      {/* Repetir semana */}
      <Modal
        isOpen={repeatWeekNumber !== null}
        onClose={() => setRepeatWeekNumber(null)}
        title="Repetir la semana"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setRepeatWeekNumber(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              onClick={handleRepeatWeek}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold min-h-[44px]"
            >
              Repetir
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-400">
          La semana {repeatWeekNumber} vuelve a empezar y el resto del programa se corre. Mejor repetir que
          lesionarse: las sesiones que ya hiciste quedan en el historial.
        </p>
      </Modal>

      {/* Abandonar */}
      <Modal
        isOpen={showAbandon}
        onClose={() => setShowAbandon(false)}
        title={isCompleted ? 'Cerrar challenge' : 'Abandonar challenge'}
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowAbandon(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              onClick={handleAbandon}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium min-h-[44px]"
            >
              {isCompleted ? 'Cerrar' : 'Abandonar'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-400">
          Se quita el challenge del listado. Las sesiones realizadas se conservan en el historial.
        </p>
      </Modal>
    </>
  );
}
