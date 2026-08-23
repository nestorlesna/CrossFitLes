// Detalle de un plan: avance, calendario / agenda y acciones sobre cada día
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Pencil,
  Plus,
  CalendarDays,
  List,
  Play,
  ClipboardList,
  SkipForward,
  RotateCcw,
  Trash2,
  CalendarClock,
  CheckCircle2,
  Moon,
  Dumbbell,
  Clock,
  Flame,
  Target,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { PlanCalendar } from '../../components/plans/PlanCalendar';
import { PlanWithDays, PlanDay, PlanProgress } from '../../models/TrainingPlan';
import * as planRepo from '../../db/repositories/trainingPlanRepo';
import { onActivateKey } from '../../utils/a11y';

type ViewMode = 'agenda' | 'calendar';

// Etiqueta corta de la fecha de un día
function dayDateLabel(day: PlanDay): string {
  if (!day.scheduled_date) return `Día ${day.day_index}`;
  try {
    return format(parseISO(day.scheduled_date), "EEE d 'de' MMM", { locale: es });
  } catch {
    return day.scheduled_date;
  }
}

// Título visible de un día
function dayTitle(day: PlanDay): string {
  if (day.day_type === 'rest') return day.title || 'Descanso';
  return day.title || day.template_name || 'Sin asignar';
}

export function PlanDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [plan, setPlan] = useState<PlanWithDays | null>(null);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [showShift, setShowShift] = useState(false);
  const [shiftDays, setShiftDays] = useState(1);
  const [confirmRemoveDay, setConfirmRemoveDay] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [planData, progressData] = await Promise.all([
        planRepo.getById(id),
        planRepo.getProgress(id),
      ]);
      if (!planData) {
        toast.error('Plan no encontrado');
        navigate('/planes');
        return;
      }
      setPlan(planData);
      setProgress(progressData);
      // Posiciona el calendario en el mes del primer día pendiente
      const firstPending = planData.days.find((d) => d.status === 'pending' && d.scheduled_date);
      if (firstPending?.scheduled_date) setMonth(parseISO(firstPending.scheduled_date));
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar el plan');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresca el día abierto en la hoja tras recargar
  useEffect(() => {
    if (!selectedDay || !plan) return;
    const fresh = plan.days.find((d) => d.id === selectedDay.id);
    if (fresh && fresh !== selectedDay) setSelectedDay(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // Agrupa los días en semanas: por semana del calendario si hay fechas,
  // o en bloques de 7 días cuando el plan es secuencial
  const weeks = useMemo(() => {
    if (!plan) return [];
    const groups: { label: string; days: PlanDay[] }[] = [];

    if (plan.schedule_mode === 'sequence') {
      plan.days.forEach((day, i) => {
        const weekIndex = Math.floor(i / 7);
        if (!groups[weekIndex]) groups[weekIndex] = { label: `Semana ${weekIndex + 1}`, days: [] };
        groups[weekIndex].days.push(day);
      });
      return groups;
    }

    const byWeek = new Map<string, PlanDay[]>();
    for (const day of plan.days) {
      const key = day.scheduled_date
        ? format(startOfWeek(parseISO(day.scheduled_date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        : 'sin-fecha';
      const list = byWeek.get(key) ?? [];
      list.push(day);
      byWeek.set(key, list);
    }
    [...byWeek.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, days], i) => {
        groups.push({
          label:
            key === 'sin-fecha'
              ? 'Sin fecha'
              : `Semana ${i + 1} · ${format(parseISO(key), "d 'de' MMM", { locale: es })}`,
          days,
        });
      });
    return groups;
  }, [plan]);

  const openDay = (day: PlanDay) => {
    setSelectedDay(day);
    setRescheduleDate(day.scheduled_date ?? '');
  };

  // Arranca el día: crea la sesión y navega al modo elegido
  const handleStart = async (mode: 'timer' | 'manual') => {
    if (!selectedDay) return;
    try {
      const { sessionId, hasVideo } = await planRepo.startDay(selectedDay.id);
      setSelectedDay(null);
      if (mode === 'timer' && hasVideo) {
        navigate(`/sesiones/${sessionId}/video`);
        return;
      }
      navigate(mode === 'timer' ? `/sesiones/${sessionId}/cronometro` : `/sesiones/${sessionId}/ejecutar`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el día');
    }
  };

  const handleSkip = async () => {
    if (!selectedDay) return;
    await planRepo.markSkipped(selectedDay.id);
    toast.success('Día salteado');
    setSelectedDay(null);
    await load();
  };

  const handleReset = async () => {
    if (!selectedDay) return;
    await planRepo.resetDay(selectedDay.id);
    toast.success('Día reabierto');
    setSelectedDay(null);
    await load();
  };

  const handleReschedule = async () => {
    if (!selectedDay || !rescheduleDate) return;
    await planRepo.updateDay(selectedDay.id, { scheduled_date: rescheduleDate });
    toast.success('Día reprogramado');
    setSelectedDay(null);
    await load();
  };

  const handleRemoveDay = async () => {
    if (!selectedDay) return;
    await planRepo.removeDay(selectedDay.id);
    toast.success('Día eliminado');
    setConfirmRemoveDay(false);
    setSelectedDay(null);
    await load();
  };

  const handleAddDay = async () => {
    if (!plan) return;
    const lastDate = [...plan.days].reverse().find((d) => d.scheduled_date)?.scheduled_date;
    const nextDate =
      plan.schedule_mode === 'dates'
        ? lastDate
          ? new Date(new Date(`${lastDate}T00:00:00Z`).getTime() + 86400000)
              .toISOString()
              .split('T')[0]
          : new Date().toISOString().split('T')[0]
        : undefined;
    await planRepo.addDay(plan.id, { day_type: 'class', scheduled_date: nextDate });
    toast.success('Día agregado');
    await load();
  };

  const handleShift = async () => {
    if (!plan) return;
    const count = await planRepo.shiftPlan(plan.id, shiftDays);
    setShowShift(false);
    toast.success(`${count} días reprogramados`);
    await load();
  };

  if (loading || !plan || !progress) {
    return (
      <>
        <Header title="Plan" />
        <div className="p-4 text-gray-500 text-sm">Cargando...</div>
      </>
    );
  }

  const pct = progress.trainingDays > 0
    ? Math.round((progress.completed / progress.trainingDays) * 100)
    : 0;

  return (
    <>
      <Header
        title={plan.name}
        subtitle={plan.goal}
        leftAction={
          <button
            aria-label="Volver"
            onClick={() => navigate('/planes')}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button
            onClick={() => navigate(`/planes/${plan.id}/editar`)}
            className="text-gray-400 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Editar plan"
          >
            <Pencil size={20} />
          </button>
        }
      />

      <div className="p-4 space-y-4 pb-24">
        {/* ── Avance ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-white font-semibold">
              Día {progress.currentIndex} de {progress.trainingDays}
            </span>
            <span className="text-xs text-gray-500">{pct}% completado</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary-500 rounded-full transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800/60 rounded-lg py-2">
              <div className="flex items-center justify-center gap-1 text-primary-400">
                <Target size={13} />
                <span className="text-sm font-bold">{progress.adherence}%</span>
              </div>
              <span className="text-[10px] text-gray-500">Adherencia</span>
            </div>
            <div className="bg-gray-800/60 rounded-lg py-2">
              <div className="flex items-center justify-center gap-1 text-orange-400">
                <Flame size={13} />
                <span className="text-sm font-bold">{progress.streak}</span>
              </div>
              <span className="text-[10px] text-gray-500">Racha</span>
            </div>
            <div className="bg-gray-800/60 rounded-lg py-2">
              <div className="flex items-center justify-center gap-1 text-gray-300">
                <CalendarClock size={13} />
                <span className="text-sm font-bold">{progress.pending}</span>
              </div>
              <span className="text-[10px] text-gray-500">Pendientes</span>
            </div>
          </div>

          {progress.overdue > 0 && (
            <button
              onClick={() => setShowShift(true)}
              className="w-full mt-3 text-xs bg-amber-900/30 border border-amber-800 text-amber-300 rounded-lg py-2 px-3 flex items-center justify-between"
            >
              <span>
                {progress.overdue} día{progress.overdue > 1 ? 's' : ''} atrasado
                {progress.overdue > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 font-medium">
                Correr el plan <ChevronRight size={12} />
              </span>
            </button>
          )}
        </div>

        {/* ── Acciones de vista ── */}
        <div className="flex gap-2">
          {plan.schedule_mode === 'dates' && (
            <button
              onClick={() => setViewMode(viewMode === 'agenda' ? 'calendar' : 'agenda')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl py-2.5 text-sm min-h-[44px]"
            >
              {viewMode === 'agenda' ? <CalendarDays size={16} /> : <List size={16} />}
              {viewMode === 'agenda' ? 'Calendario' : 'Agenda'}
            </button>
          )}
          <button
            onClick={handleAddDay}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl py-2.5 text-sm min-h-[44px]"
          >
            <Plus size={16} />
            Agregar día
          </button>
        </div>

        {/* ── Calendario ── */}
        {viewMode === 'calendar' && plan.schedule_mode === 'dates' && (
          <PlanCalendar
            days={plan.days}
            month={month}
            onMonthChange={setMonth}
            onSelectDay={openDay}
            selectedDayId={selectedDay?.id}
          />
        )}

        {/* ── Agenda ── */}
        {viewMode === 'agenda' && (
          <div className="space-y-5">
            {weeks.map((week) => (
              <div key={week.label}>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {week.label}
                </h2>
                <div className="space-y-2">
                  {week.days.map((day) => (
                    <div
                      key={day.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDay(day)}
                      onKeyDown={onActivateKey(() => openDay(day))}
                      className={`flex items-center gap-3 bg-gray-900 border rounded-xl p-3 cursor-pointer transition-colors ${
                        day.status === 'completed'
                          ? 'border-green-900/60'
                          : day.status === 'skipped'
                          ? 'border-red-900/50 opacity-70'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {/* Indicador de estado */}
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
                        {day.status === 'completed' ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : day.day_type === 'rest' ? (
                          <Moon size={16} className="text-gray-500" />
                        ) : day.status === 'skipped' ? (
                          <SkipForward size={16} className="text-red-400" />
                        ) : (
                          <Dumbbell size={16} className="text-primary-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 shrink-0">
                            {dayDateLabel(day)}
                          </span>
                          {!day.class_template_id && day.day_type !== 'rest' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                              sin asignar
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white truncate">{dayTitle(day)}</p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                          {(day.exercise_count ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Dumbbell size={10} />
                              {day.exercise_count} ej.
                            </span>
                          )}
                          {(day.template_duration_minutes ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {day.template_duration_minutes} min
                            </span>
                          )}
                          {day.status === 'completed' &&
                            (day.session_duration_minutes ?? 0) > 0 && (
                              <span className="text-green-500">
                                hecho en {day.session_duration_minutes} min
                              </span>
                            )}
                        </div>
                      </div>

                      <ChevronRight size={16} className="text-gray-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {plan.days.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-10">
                Este plan todavía no tiene días. Agregá el primero.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Hoja de detalle del día ── */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? dayDateLabel(selectedDay) : ''}
      >
        {selectedDay && (
          <div className="space-y-4">
            <div>
              <p className="text-white font-semibold">{dayTitle(selectedDay)}</p>
              {selectedDay.notes && (
                <p className="text-xs text-gray-500 mt-1">{selectedDay.notes}</p>
              )}
            </div>

            {/* Acciones principales */}
            {selectedDay.day_type !== 'rest' && selectedDay.status !== 'completed' && (
              <div className="space-y-2">
                {selectedDay.class_template_id ? (
                  <>
                    <button
                      onClick={() => handleStart('timer')}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      <Play size={18} />
                      Empezar con cronómetro
                    </button>
                    <button
                      onClick={() => handleStart('manual')}
                      className="w-full bg-gray-800 hover:bg-gray-750 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[48px] border border-gray-700"
                    >
                      <ClipboardList size={18} />
                      Cargar a mano
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/planes/${plan.id}/dias/${selectedDay.id}`)}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Plus size={18} />
                    Asignar entrenamiento
                  </button>
                )}
              </div>
            )}

            {selectedDay.status === 'completed' && selectedDay.training_session_id && (
              <button
                onClick={() => navigate(`/sesiones/${selectedDay.training_session_id}`)}
                className="w-full bg-green-900/30 border border-green-800 text-green-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[48px]"
              >
                <CheckCircle2 size={18} />
                Ver el resultado
              </button>
            )}

            {/* Acciones secundarias */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/planes/${plan.id}/dias/${selectedDay.id}`)}
                className="flex items-center justify-center gap-2 bg-gray-800 text-gray-300 py-2.5 rounded-lg text-sm min-h-[44px]"
              >
                <Pencil size={15} />
                Editar día
              </button>
              {selectedDay.status === 'pending' ? (
                <button
                  onClick={handleSkip}
                  className="flex items-center justify-center gap-2 bg-gray-800 text-gray-300 py-2.5 rounded-lg text-sm min-h-[44px]"
                >
                  <SkipForward size={15} />
                  Saltear
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-gray-800 text-gray-300 py-2.5 rounded-lg text-sm min-h-[44px]"
                >
                  <RotateCcw size={15} />
                  Reabrir
                </button>
              )}
            </div>

            {/* Reprogramar */}
            {plan.schedule_mode === 'dates' && (
              <div className="border-t border-gray-800 pt-3">
                <span className="block text-xs text-gray-400 mb-1">Reprogramar</span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    aria-label="Nueva fecha del día"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
                  />
                  <button
                    onClick={handleReschedule}
                    disabled={!rescheduleDate || rescheduleDate === selectedDay.scheduled_date}
                    className="px-4 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg text-sm disabled:opacity-40 min-h-[44px]"
                  >
                    Mover
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setConfirmRemoveDay(true)}
              className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-2 min-h-[44px]"
            >
              <Trash2 size={15} />
              Eliminar día del plan
            </button>
          </div>
        )}
      </Modal>

      {/* ── Confirmación de borrado de un día ── */}
      <Modal
        isOpen={confirmRemoveDay}
        onClose={() => setConfirmRemoveDay(false)}
        title="Eliminar día"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmRemoveDay(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-sm font-medium min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              onClick={handleRemoveDay}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium min-h-[44px] transition-colors"
            >
              Eliminar
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3 py-1">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-medium">
              {selectedDay ? dayDateLabel(selectedDay) : ''}
            </p>
            <p className="text-gray-400 text-sm mt-0.5">
              Se quita el día del plan. La sesión que hayas hecho se conserva.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Correr el plan N días ── */}
      <Modal isOpen={showShift} onClose={() => setShowShift(false)} title="Correr el plan" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Mueve todos los días pendientes hacia adelante. Los días ya completados no se tocan.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              aria-label="Cantidad de días"
              min={1}
              max={60}
              value={shiftDays}
              onChange={(e) => setShiftDays(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
            />
            <span className="text-sm text-gray-400">días</span>
          </div>
          <button
            onClick={handleShift}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium min-h-[48px]"
          >
            Reprogramar
          </button>
        </div>
      </Modal>
    </>
  );
}
