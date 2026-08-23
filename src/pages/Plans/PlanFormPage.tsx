// Alta y edición de un plan: datos generales y generación automática de los días
import { useState, useEffect, useId } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, CalendarDays, ListOrdered, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { PlanScheduleMode } from '../../models/TrainingPlan';
import * as planRepo from '../../db/repositories/trainingPlanRepo';
import type { PlanDayDraft } from '../../db/repositories/trainingPlanRepo';

// Días de la semana con lunes primero (getUTCDay: 0=Dom)
const WEEKDAYS = [
  { key: 1, label: 'Lu' },
  { key: 2, label: 'Ma' },
  { key: 3, label: 'Mi' },
  { key: 4, label: 'Ju' },
  { key: 5, label: 'Vi' },
  { key: 6, label: 'Sa' },
  { key: 0, label: 'Do' },
];

// Suma días a una fecha ISO sin depender de la zona horaria
function addDaysISO(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function PlanFormPage() {
  const uid = useId();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleMode, setScheduleMode] = useState<PlanScheduleMode>('dates');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeks, setWeeks] = useState(4);
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [includeRest, setIncludeRest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // En edición solo se cargan los datos generales; los días se editan en el detalle
  useEffect(() => {
    if (!id) return;
    planRepo
      .getById(id)
      .then((plan) => {
        if (!plan) {
          toast.error('Plan no encontrado');
          navigate('/planes');
          return;
        }
        setName(plan.name);
        setGoal(plan.goal ?? '');
        setDescription(plan.description ?? '');
        setScheduleMode(plan.schedule_mode);
        setStartDate(plan.start_date ?? new Date().toISOString().split('T')[0]);
      })
      .catch(() => toast.error('Error al cargar el plan'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const toggleWeekday = (key: number) => {
    setWeekdays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  // Genera los días del plan según el patrón elegido
  const buildDays = (): PlanDayDraft[] => {
    const days: PlanDayDraft[] = [];

    if (scheduleMode === 'sequence') {
      const total = weeks * daysPerWeek;
      for (let i = 0; i < total; i++) {
        days.push({ day_index: i + 1, day_type: 'class' });
      }
      return days;
    }

    // Modo fechas: recorre semana por semana marcando los días elegidos
    let index = 1;
    for (let w = 0; w < weeks; w++) {
      for (let offset = 0; offset < 7; offset++) {
        const date = addDaysISO(startDate, w * 7 + offset);
        const dow = weekdayOf(date);
        const isTrainingDay = weekdays.includes(dow);
        if (isTrainingDay) {
          days.push({ day_index: index++, day_type: 'class', scheduled_date: date });
        } else if (includeRest) {
          days.push({ day_index: index++, day_type: 'rest', scheduled_date: date, title: 'Descanso' });
        }
      }
    }
    return days;
  };

  const totalGenerated =
    scheduleMode === 'sequence' ? weeks * daysPerWeek : weeks * weekdays.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Poné un nombre al plan');
      return;
    }
    if (!isEdit && scheduleMode === 'dates' && weekdays.length === 0) {
      toast.error('Elegí al menos un día de la semana');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await planRepo.update(id, {
          name: name.trim(),
          goal: goal.trim() || undefined,
          description: description.trim() || undefined,
          start_date: scheduleMode === 'dates' ? startDate : undefined,
        });
        toast.success('Plan actualizado');
        navigate(`/planes/${id}`);
      } else {
        const newId = await planRepo.create(
          {
            name: name.trim(),
            goal: goal.trim() || undefined,
            description: description.trim() || undefined,
            start_date: scheduleMode === 'dates' ? startDate : undefined,
            schedule_mode: scheduleMode,
            status: 'active',
            is_active: 1,
          },
          buildDays()
        );
        toast.success('Plan creado: asigná las clases de cada día');
        navigate(`/planes/${newId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Plan" />
        <div className="p-4 text-gray-500 text-sm">Cargando...</div>
      </>
    );
  }

  const inputClass =
    'w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500';

  return (
    <>
      <Header
        title={isEdit ? 'Editar plan' : 'Nuevo plan'}
        leftAction={
          <button
            aria-label="Volver"
            onClick={() => navigate(-1)}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-28">
        {/* ── Datos generales ── */}
        <div className="space-y-3">
          <div>
            <label htmlFor={`${uid}-name`} className="block text-xs text-gray-400 mb-1">
              Nombre del plan *
            </label>
            <input
              id={`${uid}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Fuerza 4 semanas"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`${uid}-goal`} className="block text-xs text-gray-400 mb-1">
              Objetivo
            </label>
            <input
              id={`${uid}-goal`}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ej: Subir sentadilla"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`${uid}-desc`} className="block text-xs text-gray-400 mb-1">
              Notas
            </label>
            <textarea
              id={`${uid}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>

        {/* ── Modo de programación ── */}
        <div>
          <span className="block text-xs text-gray-400 mb-2">Modo de programación</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => !isEdit && setScheduleMode('dates')}
              disabled={isEdit}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors ${
                scheduleMode === 'dates'
                  ? 'bg-primary-600/15 border-primary-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-400'
              } ${isEdit ? 'opacity-60' : ''}`}
            >
              <CalendarDays size={18} />
              <span className="text-sm font-medium">Fechas fijas</span>
              <span className="text-[11px] text-gray-500 leading-tight">
                Cada día cae en una fecha del calendario.
              </span>
            </button>
            <button
              type="button"
              onClick={() => !isEdit && setScheduleMode('sequence')}
              disabled={isEdit}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors ${
                scheduleMode === 'sequence'
                  ? 'bg-primary-600/15 border-primary-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-400'
              } ${isEdit ? 'opacity-60' : ''}`}
            >
              <ListOrdered size={18} />
              <span className="text-sm font-medium">Secuencial</span>
              <span className="text-[11px] text-gray-500 leading-tight">
                Día 1, 2, 3... avanza cuando entrenás.
              </span>
            </button>
          </div>
          {isEdit && (
            <p className="text-[11px] text-gray-600 mt-2 flex items-start gap-1">
              <Info size={12} className="mt-0.5 shrink-0" />
              El modo no se puede cambiar una vez creado el plan.
            </p>
          )}
        </div>

        {scheduleMode === 'dates' && (
          <div>
            <label htmlFor={`${uid}-start`} className="block text-xs text-gray-400 mb-1">
              Fecha de inicio
            </label>
            <input
              id={`${uid}-start`}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {/* ── Generación de días (solo al crear) ── */}
        {!isEdit && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-bold text-white">Estructura del plan</h2>

            <div>
              <label htmlFor={`${uid}-weeks`} className="block text-xs text-gray-400 mb-1">
                Semanas
              </label>
              <input
                id={`${uid}-weeks`}
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(Math.max(1, Number(e.target.value) || 1))}
                className={inputClass}
              />
            </div>

            {scheduleMode === 'dates' ? (
              <>
                <div>
                  <span className="block text-xs text-gray-400 mb-2">Días de entrenamiento</span>
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleWeekday(d.key)}
                        aria-pressed={weekdays.includes(d.key)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
                          weekdays.includes(d.key)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={includeRest}
                  onClick={() => setIncludeRest(!includeRest)}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`block w-11 h-6 rounded-full transition-colors relative ${
                      includeRest ? 'bg-primary-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        includeRest ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                  <span className="text-sm text-gray-300">Marcar los demás días como descanso</span>
                </button>
              </>
            ) : (
              <div>
                <label htmlFor={`${uid}-dpw`} className="block text-xs text-gray-400 mb-1">
                  Días por semana
                </label>
                <input
                  id={`${uid}-dpw`}
                  type="number"
                  min={1}
                  max={7}
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
                  className={inputClass}
                />
              </div>
            )}

            <p className="text-xs text-gray-500">
              Se van a generar <span className="text-primary-400 font-medium">{totalGenerated}</span>{' '}
              días de entrenamiento sin asignar. Después elegís para cada uno la clase o los
              ejercicios.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors min-h-[48px] flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear plan'}
        </button>
      </form>
    </>
  );
}
