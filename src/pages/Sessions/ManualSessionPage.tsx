// Página para registrar una sesión pasada manualmente (sin temporizador)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Dumbbell, CheckCircle2,
  Circle, Save, ChevronDown, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { ExerciseInfoModal } from '../../components/ui/ExerciseInfoModal';
import { ClassTemplate, ClassTemplateWithSections, SectionExercise } from '../../models/ClassTemplate';
import { GeneralFeeling } from '../../types';
import { getAll as getAllTemplates, getById as getTemplateById } from '../../db/repositories/classTemplateRepo';
import { createAndFinalizeManual } from '../../db/repositories/trainingSessionRepo';
import { getDatabase } from '../../db/database';
import { getImageDisplayUrl } from '../../services/mediaService';

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  unit_type: string;
}

interface ResultDraft {
  exercise_id: string;
  section_exercise_id?: string;
  section_type_id?: string;
  sort_order: number;
  exercise_name: string;
  exercise_image_path?: string;
  exercise_image_url?: string;
  rx_or_scaled: 'rx' | 'scaled' | 'rx+';
  result_text: string;
  actual_repetitions: string;
  actual_weight_value: string;
  actual_weight_unit_id: string;
  actual_time_seconds: string;
  actual_distance_value: string;
  actual_distance_unit_id: string;
  actual_calories: string;
  actual_rounds: string;
  notes: string;
  is_completed: boolean;
}

const FEELINGS: { value: GeneralFeeling; label: string; emoji: string }[] = [
  { value: 'terrible', label: 'Pésimo',    emoji: '😞' },
  { value: 'bad',      label: 'Malo',      emoji: '😕' },
  { value: 'normal',   label: 'Normal',    emoji: '😐' },
  { value: 'good',     label: 'Bien',      emoji: '😊' },
  { value: 'excellent',label: 'Excelente', emoji: '🤩' },
];

function ExerciseThumb({ imagePath, imageUrl, name }: { imagePath?: string | null; imageUrl?: string | null; name: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const path = imageUrl || imagePath;
    if (path) getImageDisplayUrl(path).then(setSrc);
  }, [imagePath, imageUrl]);

  return (
    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <Dumbbell size={16} className="text-gray-600" />
      }
    </div>
  );
}

function ResultCard({
  result,
  weightUnits,
  distanceUnits,
  onChange,
  onInfoClick,
}: {
  result: ResultDraft;
  weightUnits: MeasurementUnit[];
  distanceUnits: MeasurementUnit[];
  onChange: (updated: ResultDraft) => void;
  onInfoClick: (id: string, name: string) => void;
}) {
  const upd = (field: keyof ResultDraft, value: any) => onChange({ ...result, [field]: value });

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors ${result.is_completed ? 'border-primary-500/40' : 'border-gray-800'}`}>
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <ExerciseThumb imagePath={result.exercise_image_path} imageUrl={result.exercise_image_url} name={result.exercise_name} />
        <button
          onClick={() => onInfoClick(result.exercise_id, result.exercise_name)}
          className="flex-1 text-left text-sm font-semibold text-white leading-tight hover:text-primary-400 transition-colors"
        >
          {result.exercise_name}
        </button>
        <button
          onClick={() => onInfoClick(result.exercise_id, result.exercise_name)}
          className="p-1 text-gray-600 hover:text-primary-400 transition-colors"
        >
          <Info size={16} />
        </button>
        <button
          onClick={() => upd('is_completed', !result.is_completed)}
          className={`p-1 transition-colors ${result.is_completed ? 'text-primary-400' : 'text-gray-600'}`}
        >
          {result.is_completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
      </div>

      {/* RX / Scaled */}
      <div className="flex gap-1">
        {(['rx', 'rx+', 'scaled'] as const).map(v => (
          <button
            key={v}
            onClick={() => upd('rx_or_scaled', v)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${result.rx_or_scaled === v ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            {v === 'rx+' ? 'RX+' : v === 'rx' ? 'RX' : 'Scaled'}
          </button>
        ))}
      </div>

      {/* Campos numéricos */}
      <div className="grid grid-cols-2 gap-2">
        {/* Repeticiones */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Reps</label>
          <input
            type="number" inputMode="numeric" min="0"
            value={result.actual_repetitions}
            onChange={e => upd('actual_repetitions', e.target.value)}
            placeholder="—"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 w-full"
          />
        </div>
        {/* Rondas */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Rondas</label>
          <input
            type="number" inputMode="numeric" min="0"
            value={result.actual_rounds}
            onChange={e => upd('actual_rounds', e.target.value)}
            placeholder="—"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 w-full"
          />
        </div>
        {/* Peso */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Peso</label>
          <div className="flex gap-1">
            <input
              type="number" inputMode="decimal" min="0"
              value={result.actual_weight_value}
              onChange={e => upd('actual_weight_value', e.target.value)}
              placeholder="—"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 flex-1 min-w-0"
            />
            {weightUnits.length > 0 && (
              <select
                value={result.actual_weight_unit_id}
                onChange={e => upd('actual_weight_unit_id', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-primary-500"
              >
                <option value="">u</option>
                {weightUnits.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
              </select>
            )}
          </div>
        </div>
        {/* Tiempo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Tiempo (seg)</label>
          <input
            type="number" inputMode="numeric" min="0"
            value={result.actual_time_seconds}
            onChange={e => upd('actual_time_seconds', e.target.value)}
            placeholder="—"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 w-full"
          />
        </div>
        {/* Distancia */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Distancia</label>
          <div className="flex gap-1">
            <input
              type="number" inputMode="decimal" min="0"
              value={result.actual_distance_value}
              onChange={e => upd('actual_distance_value', e.target.value)}
              placeholder="—"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 flex-1 min-w-0"
            />
            {distanceUnits.length > 0 && (
              <select
                value={result.actual_distance_unit_id}
                onChange={e => upd('actual_distance_unit_id', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-primary-500"
              >
                <option value="">u</option>
                {distanceUnits.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
              </select>
            )}
          </div>
        </div>
        {/* Calorías */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Calorías</label>
          <input
            type="number" inputMode="numeric" min="0"
            value={result.actual_calories}
            onChange={e => upd('actual_calories', e.target.value)}
            placeholder="—"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 w-full"
          />
        </div>
      </div>

      {/* Resultado libre */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Resultado (texto libre)</label>
        <input
          type="text"
          value={result.result_text}
          onChange={e => upd('result_text', e.target.value)}
          placeholder="Ej: 5 rondas + 10 reps"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Notas del ejercicio */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Notas</label>
        <input
          type="text"
          value={result.notes}
          onChange={e => upd('notes', e.target.value)}
          placeholder="Observaciones..."
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
        />
      </div>
    </div>
  );
}

export function ManualSessionPage() {
  const navigate = useNavigate();

  // ── Fecha ──
  const todayStr = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState(todayStr);

  // ── Plantillas ──
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loadedTemplate, setLoadedTemplate] = useState<ClassTemplateWithSections | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // ── Resultados ──
  const [results, setResults] = useState<ResultDraft[]>([]);

  // ── Unidades ──
  const [weightUnits, setWeightUnits] = useState<MeasurementUnit[]>([]);
  const [distanceUnits, setDistanceUnits] = useState<MeasurementUnit[]>([]);

  // ── Resumen ──
  const [durationMinutes, setDurationMinutes] = useState('');
  const [feeling, setFeeling] = useState<GeneralFeeling>('normal');
  const [effort, setEffort] = useState(5);
  const [notes, setNotes] = useState('');

  // ── Estados UI ──
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [infoExerciseId, setInfoExerciseId] = useState<string | null>(null);
  const [infoExerciseName, setInfoExerciseName] = useState<string | undefined>();

  // Cargar plantillas y unidades al montar
  useEffect(() => {
    async function load() {
      try {
        const tpls = await getAllTemplates();
        setTemplates(tpls);

        const db = getDatabase();
        const unitsResult = await db.query(`SELECT * FROM measurement_unit WHERE is_active = 1 ORDER BY sort_order`);
        const allUnits = (unitsResult.values ?? []) as MeasurementUnit[];
        setWeightUnits(allUnits.filter(u => u.unit_type === 'weight'));
        setDistanceUnits(allUnits.filter(u => u.unit_type === 'distance'));
      } catch {
        toast.error('Error al cargar datos');
      }
    }
    load();
  }, []);

  // Cargar plantilla seleccionada
  useEffect(() => {
    if (!selectedTemplateId) {
      setLoadedTemplate(null);
      setResults([]);
      return;
    }
    setLoadingTemplate(true);
    getTemplateById(selectedTemplateId)
      .then(tpl => {
        setLoadedTemplate(tpl);
        if (tpl) {
          const drafts: ResultDraft[] = [];
          let order = 1;
          for (const section of tpl.sections) {
            for (const se of (section.exercises ?? [])) {
              drafts.push(makeDraft(se, section.section_type_id, order++));
            }
          }
          setResults(drafts);
        }
      })
      .catch(() => toast.error('Error al cargar plantilla'))
      .finally(() => setLoadingTemplate(false));
  }, [selectedTemplateId]);

  function makeDraft(se: SectionExercise, sectionTypeId: string | undefined, order: number): ResultDraft {
    return {
      exercise_id: se.exercise_id,
      section_exercise_id: se.id,
      section_type_id: sectionTypeId,
      sort_order: order,
      exercise_name: (se as any).exercise_name ?? '',
      exercise_image_path: (se as any).exercise_image_path ?? undefined,
      exercise_image_url: (se as any).exercise_image_url ?? undefined,
      rx_or_scaled: 'rx',
      result_text: '',
      actual_repetitions: se.planned_repetitions ? String(se.planned_repetitions) : '',
      actual_weight_value: se.planned_weight_value ? String(se.planned_weight_value) : '',
      actual_weight_unit_id: se.planned_weight_unit_id ?? '',
      actual_time_seconds: se.planned_time_seconds ? String(se.planned_time_seconds) : '',
      actual_distance_value: se.planned_distance_value ? String(se.planned_distance_value) : '',
      actual_distance_unit_id: se.planned_distance_unit_id ?? '',
      actual_calories: '',
      actual_rounds: '',
      notes: '',
      is_completed: true,
    };
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = results.map(r => ({
        exercise_id: r.exercise_id,
        section_exercise_id: r.section_exercise_id,
        section_type_id: r.section_type_id,
        sort_order: r.sort_order,
        rx_or_scaled: r.rx_or_scaled,
        result_text: r.result_text || undefined,
        actual_repetitions: r.actual_repetitions ? Number(r.actual_repetitions) : undefined,
        actual_weight_value: r.actual_weight_value ? Number(r.actual_weight_value) : undefined,
        actual_weight_unit_id: r.actual_weight_unit_id || undefined,
        actual_time_seconds: r.actual_time_seconds ? Number(r.actual_time_seconds) : undefined,
        actual_distance_value: r.actual_distance_value ? Number(r.actual_distance_value) : undefined,
        actual_distance_unit_id: r.actual_distance_unit_id || undefined,
        actual_calories: r.actual_calories ? Number(r.actual_calories) : undefined,
        actual_rounds: r.actual_rounds ? Number(r.actual_rounds) : undefined,
        notes: r.notes || undefined,
        is_completed: r.is_completed ? 1 : 0,
      }));

      const sessionId = await createAndFinalizeManual(
        sessionDate,
        selectedTemplateId || null,
        {
          durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
          feeling,
          effort,
          notes: notes || undefined,
        },
        payload
      );

      toast.success('Sesión registrada correctamente');
      navigate(`/sesiones/${sessionId}`);
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar la sesión');
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  // Secciones del template para mostrar cabeceras de sección
  const sectionsMap = new Map<string, string>();
  if (loadedTemplate) {
    for (const s of loadedTemplate.sections) {
      for (const se of (s.exercises ?? [])) {
        sectionsMap.set(se.id, (s as any).section_type_name ?? s.section_type_id ?? '');
      }
    }
  }

  // Agrupar resultados por sección para renderizado
  const grouped: { sectionLabel: string; sectionColor?: string; items: ResultDraft[] }[] = [];
  if (loadedTemplate) {
    for (const section of loadedTemplate.sections) {
      const sectionResults = results.filter(r => r.section_exercise_id && section.exercises?.some((se: SectionExercise) => se.id === r.section_exercise_id));
      if (sectionResults.length > 0) {
        grouped.push({
          sectionLabel: (section as any).section_type_name ?? 'Sección',
          sectionColor: (section as any).section_type_color,
          items: sectionResults,
        });
      }
    }
  }

  return (
    <>
      <Header
        title="Registrar Sesión Pasada"
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-5 p-4 pb-28">

        {/* ── Fecha ── */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Calendar size={16} className="text-primary-400" />
            Fecha del entrenamiento
          </label>
          <input
            type="date"
            value={sessionDate}
            max={todayStr}
            onChange={e => setSessionDate(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* ── Plantilla (opcional) ── */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Dumbbell size={16} className="text-primary-400" />
            Plantilla de clase <span className="text-gray-600 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-primary-500 pr-10"
            >
              <option value="">— Sin plantilla —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* ── Ejercicios ── */}
        {loadingTemplate ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-primary-500" />
          </div>
        ) : grouped.length > 0 ? (
          <div className="flex flex-col gap-5">
            {grouped.map((g, gi) => (
              <div key={gi} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {g.sectionColor && (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.sectionColor }} />
                  )}
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{g.sectionLabel}</h3>
                </div>
                {g.items.map(item => (
                  <ResultCard
                    key={`${item.exercise_id}-${item.sort_order}`}
                    result={item}
                    weightUnits={weightUnits}
                    distanceUnits={distanceUnits}
                    onChange={updated =>
                      setResults(prev => prev.map(r => r.sort_order === updated.sort_order ? updated : r))
                    }
                    onInfoClick={(id, name) => { setInfoExerciseId(id); setInfoExerciseName(name); }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : selectedTemplateId && !loadingTemplate ? (
          <p className="text-gray-600 text-sm text-center py-4">La plantilla no tiene ejercicios cargados.</p>
        ) : null}

        {/* ── Resumen de sesión ── */}
        <div className="flex flex-col gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-gray-300">Resumen del entrenamiento</h3>

          {/* Duración */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Duración (minutos)</label>
            <input
              type="number" inputMode="numeric" min="1"
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              placeholder="Ej: 60"
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Sensación */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">¿Cómo te sentiste?</label>
            <div className="flex gap-1.5">
              {FEELINGS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFeeling(f.value)}
                  title={f.label}
                  className={`flex-1 py-2 rounded-xl text-xl transition-all ${feeling === f.value ? 'bg-primary-600/30 ring-1 ring-primary-500 scale-110' : 'bg-gray-800 opacity-50'}`}
                >
                  {f.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Esfuerzo percibido */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Esfuerzo percibido (RPE): <span className="text-white font-bold">{effort}/10</span></label>
            <input
              type="range" min="1" max="10" step="1"
              value={effort}
              onChange={e => setEffort(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Fácil</span><span>Moderado</span><span>Máximo</span>
            </div>
          </div>

          {/* Notas finales */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Notas finales</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="¿Algo destacable del entrenamiento?"
              rows={3}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </div>

        {/* ── Botón Guardar ── */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-900/30 disabled:opacity-50"
        >
          <Save size={20} />
          Guardar sesión
        </button>
      </div>

      {/* ── Modal info ejercicio ── */}
      <ExerciseInfoModal
        exerciseId={infoExerciseId}
        exerciseName={infoExerciseName}
        onClose={() => setInfoExerciseId(null)}
      />

      {/* ── Modal de confirmación ── */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirmar registro">
        <div className="flex flex-col gap-4">
          <p className="text-gray-300 text-sm">
            Se registrará la sesión del <span className="text-white font-semibold">{sessionDate}</span> como completada.
            {results.length > 0 && (
              <> Con <span className="text-white font-semibold">{results.filter(r => r.is_completed).length} de {results.length}</span> ejercicios completados.</>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /> : <Save size={16} />}
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
