// Edición de un día del plan: clase existente, día armado a mano o descanso
import { useState, useEffect, useMemo, useId } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  Search,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  LayoutTemplate,
  ListChecks,
  Moon,
  Star,
  Check,
  Dumbbell,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { ResolvedImage } from '../../components/ui/ResolvedImage';
import { ClassTemplate } from '../../models/ClassTemplate';
import { Exercise } from '../../models/Exercise';
import { PlanDay, PlanDayType, PlanDayExerciseDraft } from '../../models/TrainingPlan';
import * as planRepo from '../../db/repositories/trainingPlanRepo';
import * as classTemplateRepo from '../../db/repositories/classTemplateRepo';
import { getAll as getAllExercises } from '../../db/repositories/exerciseRepo';

const inputClass =
  'w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-primary-500';

// Miniatura del ejercicio (SVG propio o imagen cargada)
function ExerciseThumb({
  imageUrl,
  imagePath,
  name,
  size = 'md',
}: {
  imageUrl?: string | null;
  imagePath?: string | null;
  name: string;
  size?: 'sm' | 'md';
}) {
  const box = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  return (
    <div
      className={`${box} rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden`}
    >
      <ResolvedImage
        path={imageUrl || imagePath}
        alt={name}
        className="w-full h-full object-contain"
        fallback={<Dumbbell size={16} className="text-gray-600" />}
      />
    </div>
  );
}

// Campo numérico compacto de un ejercicio del día
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v?: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-500">{label}</span>
      <input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full bg-gray-800 text-white rounded-lg px-2 py-1.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
      />
    </label>
  );
}

export function PlanDayEditPage() {
  const uid = useId();
  const navigate = useNavigate();
  const { id: planId, dayId } = useParams<{ id: string; dayId: string }>();

  const [day, setDay] = useState<PlanDay | null>(null);
  const [dayType, setDayType] = useState<PlanDayType>('class');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [exercises, setExercises] = useState<PlanDayExerciseDraft[]>([]);

  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carga el día, las plantillas disponibles y el catálogo de ejercicios
  useEffect(() => {
    async function load() {
      if (!planId || !dayId) return;
      try {
        const [plan, templateList, exerciseList] = await Promise.all([
          planRepo.getById(planId),
          classTemplateRepo.getAll(),
          getAllExercises(),
        ]);
        const current = plan?.days.find((d) => d.id === dayId) ?? null;
        if (!current) {
          toast.error('Día no encontrado');
          navigate(`/planes/${planId}`);
          return;
        }
        setDay(current);
        setDayType(current.day_type);
        setTitle(current.title ?? '');
        setNotes(current.notes ?? '');
        setScheduledDate(current.scheduled_date ?? '');
        setTemplates(templateList);
        setAllExercises(exerciseList);

        if (current.day_type === 'custom' && current.class_template_id) {
          setExercises(await planRepo.getCustomDayExercises(current.class_template_id));
        } else if (current.day_type === 'class') {
          setTemplateId(current.class_template_id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar el día');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [planId, dayId, navigate]);

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.objective ?? '').toLowerCase().includes(q)
    );
  }, [templates, templateSearch]);

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.toLowerCase().trim();
    if (!q) return allExercises.slice(0, 50);
    return allExercises.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 50);
  }, [allExercises, exerciseSearch]);

  const addExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        exercise_image_url: exercise.image_url,
        exercise_image_path: exercise.image_path,
      },
    ]);
    setShowPicker(false);
    setExerciseSearch('');
  };

  const updateExercise = (index: number, patch: Partial<PlanDayExerciseDraft>) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)));
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, dir: -1 | 1) => {
    setExercises((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const handleSave = async () => {
    if (!dayId || !planId) return;
    setSaving(true);
    try {
      if (dayType === 'class') {
        if (!templateId) {
          toast.error('Elegí una clase para este día');
          setSaving(false);
          return;
        }
        const template = templates.find((t) => t.id === templateId);
        await planRepo.updateDay(dayId, {
          day_type: 'class',
          class_template_id: templateId,
          title: title.trim() || template?.name,
          notes: notes.trim() || undefined,
          scheduled_date: scheduledDate || undefined,
        });
      } else if (dayType === 'custom') {
        if (exercises.length === 0) {
          toast.error('Agregá al menos un ejercicio');
          setSaving(false);
          return;
        }
        // La fecha y las notas se guardan antes: saveCustomDay las usa en la plantilla
        await planRepo.updateDay(dayId, {
          notes: notes.trim() || undefined,
          scheduled_date: scheduledDate || undefined,
        });
        await planRepo.saveCustomDay(dayId, title.trim() || 'Entrenamiento del día', exercises);
      } else {
        await planRepo.updateDay(dayId, {
          day_type: 'rest',
          class_template_id: undefined,
          title: title.trim() || 'Descanso',
          notes: notes.trim() || undefined,
          scheduled_date: scheduledDate || undefined,
        });
      }
      toast.success('Día guardado');
      navigate(`/planes/${planId}`);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el día');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !day) {
    return (
      <>
        <Header title="Día del plan" />
        <div className="p-4 text-gray-500 text-sm">Cargando...</div>
      </>
    );
  }

  const typeOptions: { key: PlanDayType; label: string; icon: typeof LayoutTemplate }[] = [
    { key: 'class', label: 'Clase', icon: LayoutTemplate },
    { key: 'custom', label: 'Armar día', icon: ListChecks },
    { key: 'rest', label: 'Descanso', icon: Moon },
  ];

  return (
    <>
      <Header
        title={`Día ${day.day_index}`}
        leftAction={
          <button
            aria-label="Volver"
            onClick={() => navigate(`/planes/${planId}`)}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="p-4 space-y-5 pb-28">
        {/* ── Tipo de día ── */}
        <div className="grid grid-cols-3 gap-2">
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = dayType === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setDayType(opt.key)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600/15 border-primary-600 text-white'
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
              >
                <Icon size={18} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* ── Fecha y título ── */}
        <div className="grid grid-cols-2 gap-3">
          {day.scheduled_date !== undefined && day.scheduled_date !== null && (
            <div>
              <label htmlFor={`${uid}-date`} className="block text-xs text-gray-400 mb-1">
                Fecha
              </label>
              <input
                id={`${uid}-date`}
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          <div className={day.scheduled_date ? '' : 'col-span-2'}>
            <label htmlFor={`${uid}-title`} className="block text-xs text-gray-400 mb-1">
              Título del día
            </label>
            <input
              id={`${uid}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dayType === 'rest' ? 'Descanso' : 'Opcional'}
              className={inputClass}
            />
          </div>
        </div>

        {/* ── Selección de clase ── */}
        {dayType === 'class' && (
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
              <input
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Buscar clase..."
                aria-label="Buscar clase"
                className={`${inputClass} pl-9`}
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTemplates.map((t) => {
                const isSelected = templateId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                      isSelected
                        ? 'bg-primary-600/15 border-primary-600'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {t.is_favorite === 1 && (
                          <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0" />
                        )}
                        <span className="text-sm text-white truncate">{t.name}</span>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {t.exercise_count ?? 0} ej.
                        {t.estimated_duration_minutes
                          ? ` · ${t.estimated_duration_minutes} min`
                          : ''}
                        {t.template_type === 'generic' ? ' · genérica' : ''}
                      </span>
                    </div>
                    {isSelected && <Check size={16} className="text-primary-400 shrink-0" />}
                  </button>
                );
              })}
              {filteredTemplates.length === 0 && (
                <p className="text-sm text-gray-600 text-center py-6">No hay clases que coincidan</p>
              )}
            </div>
          </div>
        )}

        {/* ── Día armado a mano ── */}
        {dayType === 'custom' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Ejercicios ({exercises.length})</h2>
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 min-h-[44px]"
              >
                <Plus size={16} />
                Agregar
              </button>
            </div>

            {exercises.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-8 bg-gray-900 border border-gray-800 border-dashed rounded-xl">
                Agregá los ejercicios que quieras hacer ese día.
              </p>
            ) : (
              <div className="space-y-3">
                {exercises.map((ex, i) => (
                  <div
                    key={`${ex.exercise_id}-${i}`}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-4 shrink-0">{i + 1}.</span>
                      <ExerciseThumb
                        imageUrl={ex.exercise_image_url}
                        imagePath={ex.exercise_image_path}
                        name={ex.exercise_name ?? ''}
                        size="sm"
                      />
                      <span className="text-sm text-white flex-1 truncate">{ex.exercise_name}</span>
                      <button
                        onClick={() => moveExercise(i, -1)}
                        disabled={i === 0}
                        aria-label="Subir ejercicio"
                        className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        onClick={() => moveExercise(i, 1)}
                        disabled={i === exercises.length - 1}
                        aria-label="Bajar ejercicio"
                        className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        onClick={() => removeExercise(i)}
                        aria-label="Quitar ejercicio"
                        className="p-1.5 text-gray-600 hover:text-red-400"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <NumberField
                        label="Reps"
                        value={ex.planned_repetitions}
                        onChange={(v) => updateExercise(i, { planned_repetitions: v })}
                      />
                      <NumberField
                        label="Peso"
                        value={ex.planned_weight_value}
                        onChange={(v) => updateExercise(i, { planned_weight_value: v })}
                      />
                      <NumberField
                        label="Seg."
                        value={ex.planned_time_seconds}
                        onChange={(v) => updateExercise(i, { planned_time_seconds: v })}
                      />
                      <NumberField
                        label="Rondas"
                        value={ex.planned_rounds}
                        onChange={(v) => updateExercise(i, { planned_rounds: v })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Notas ── */}
        <div>
          <label htmlFor={`${uid}-notes`} className="block text-xs text-gray-400 mb-1">
            Notas del día
          </label>
          <textarea
            id={`${uid}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors min-h-[48px] flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar día'}
        </button>
      </div>

      {/* ── Selector de ejercicios ── */}
      <Modal isOpen={showPicker} onClose={() => setShowPicker(false)} title="Agregar ejercicio">
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              autoFocus
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              placeholder="Buscar ejercicio..."
              aria-label="Buscar ejercicio"
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {filteredExercises.map((e) => (
              <button
                key={e.id}
                onClick={() => addExercise(e)}
                className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 min-h-[56px]"
              >
                <ExerciseThumb imageUrl={e.image_url} imagePath={e.image_path} name={e.name} />
                <span className="min-w-0">
                  <span className="block text-sm text-white truncate">{e.name}</span>
                  {e.primary_muscle_name && (
                    <span className="block text-[11px] text-gray-500 truncate">
                      {e.primary_muscle_name}
                    </span>
                  )}
                </span>
              </button>
            ))}
            {filteredExercises.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-6">Sin resultados</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
