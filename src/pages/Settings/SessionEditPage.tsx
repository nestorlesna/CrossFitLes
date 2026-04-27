// Edición de sesión completada: corregir duración, sensación y valores de ejercicios
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  Clock,
  Activity,
  StickyNote,
  Dumbbell,
  Scale,
  TrendingUp,
  Timer,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import {
  getById,
  updateSession,
  saveResults,
} from '../../db/repositories/trainingSessionRepo';
import { SessionWithRelations, SessionExerciseResult } from '../../models/TrainingSession';
import { formatDate } from '../../utils/formatters';

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface SessionFields {
  actual_duration_minutes: string;
  general_feeling: string;
  perceived_effort: string;
  final_notes: string;
  body_weight: string;
}

interface ResultFields {
  id: string;
  exercise_id: string;
  exercise_name: string;
  // valores numéricos como string para inputs
  actual_repetitions: string;
  actual_weight_value: string;
  actual_weight_unit_id: string;
  weight_unit_abbreviation: string;
  actual_time_minutes: string;
  actual_time_secs: string;
  actual_distance_value: string;
  actual_distance_unit_id: string;
  distance_unit_abbreviation: string;
  actual_calories: string;
  actual_rounds: string;
  // texto
  rx_or_scaled: 'rx' | 'scaled' | 'rx+';
  result_text: string;
  notes: string;
  is_completed: number;
  is_personal_record: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FEELINGS = [
  { value: 'terrible', emoji: '😫', label: 'Terrible' },
  { value: 'bad',      emoji: '😕', label: 'Mal'      },
  { value: 'normal',   emoji: '😐', label: 'Normal'   },
  { value: 'good',     emoji: '😊', label: 'Bien'     },
  { value: 'excellent',emoji: '🔥', label: 'Excelente'},
] as const;

function resultToFields(r: SessionExerciseResult): ResultFields {
  const totalSecs = r.actual_time_seconds ?? 0;
  return {
    id: r.id,
    exercise_id: r.exercise_id,
    exercise_name: r.exercise_name ?? '',
    actual_repetitions: r.actual_repetitions != null ? String(r.actual_repetitions) : '',
    actual_weight_value: r.actual_weight_value != null ? String(r.actual_weight_value) : '',
    actual_weight_unit_id: r.actual_weight_unit_id ?? '',
    weight_unit_abbreviation: r.weight_unit_abbreviation ?? 'kg',
    actual_time_minutes: totalSecs > 0 ? String(Math.floor(totalSecs / 60)) : '',
    actual_time_secs: totalSecs > 0 ? String(totalSecs % 60) : '',
    actual_distance_value: r.actual_distance_value != null ? String(r.actual_distance_value) : '',
    actual_distance_unit_id: r.actual_distance_unit_id ?? '',
    distance_unit_abbreviation: r.distance_unit_abbreviation ?? 'm',
    actual_calories: r.actual_calories != null ? String(r.actual_calories) : '',
    actual_rounds: r.actual_rounds != null ? String(r.actual_rounds) : '',
    rx_or_scaled: r.rx_or_scaled as 'rx' | 'scaled' | 'rx+',
    result_text: r.result_text ?? '',
    notes: r.notes ?? '',
    is_completed: r.is_completed,
    is_personal_record: r.is_personal_record,
  };
}

function fieldsToResult(f: ResultFields): Partial<SessionExerciseResult> {
  const mins = parseInt(f.actual_time_minutes) || 0;
  const secs = parseInt(f.actual_time_secs) || 0;
  const totalSecs = mins * 60 + secs;
  return {
    id: f.id,
    exercise_id: f.exercise_id,
    actual_repetitions: f.actual_repetitions !== '' ? parseInt(f.actual_repetitions) || undefined : undefined,
    actual_weight_value: f.actual_weight_value !== '' ? parseFloat(f.actual_weight_value) || undefined : undefined,
    actual_weight_unit_id: f.actual_weight_unit_id || undefined,
    actual_time_seconds: totalSecs > 0 ? totalSecs : undefined,
    actual_distance_value: f.actual_distance_value !== '' ? parseFloat(f.actual_distance_value) || undefined : undefined,
    actual_distance_unit_id: f.actual_distance_unit_id || undefined,
    actual_calories: f.actual_calories !== '' ? parseFloat(f.actual_calories) || undefined : undefined,
    actual_rounds: f.actual_rounds !== '' ? parseInt(f.actual_rounds) || undefined : undefined,
    rx_or_scaled: f.rx_or_scaled,
    result_text: f.result_text || undefined,
    notes: f.notes || undefined,
    is_completed: f.is_completed,
    is_personal_record: f.is_personal_record,
  };
}

// ── Subcomponente: tarjeta de un resultado ────────────────────────────────────

function ResultCard({
  field,
  onChange,
}: {
  field: ResultFields;
  onChange: (updated: ResultFields) => void;
}) {
  const set = (key: keyof ResultFields, value: string | number) =>
    onChange({ ...field, [key]: value });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      {/* Nombre del ejercicio */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
          <Dumbbell size={14} className="text-primary-400" />
        </div>
        <span className="text-sm font-bold text-white truncate flex-1">{field.exercise_name}</span>
      </div>

      {/* RX / Scaled selector */}
      <div className="flex gap-1">
        {(['rx', 'scaled', 'rx+'] as const).map(opt => (
          <button
            key={opt}
            onClick={() => set('rx_or_scaled', opt)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
              field.rx_or_scaled === opt
                ? opt === 'rx' || opt === 'rx+'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-gray-800 text-gray-500 border border-transparent'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Grilla de valores numéricos */}
      <div className="grid grid-cols-2 gap-2">
        {/* Reps */}
        <div className="bg-gray-950 rounded-xl p-2.5 border border-gray-800/50">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={11} className="text-gray-600" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Reps</span>
          </div>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={field.actual_repetitions}
            onChange={e => set('actual_repetitions', e.target.value)}
            placeholder="—"
            className="w-full bg-transparent text-white text-base font-black outline-none placeholder-gray-700"
          />
        </div>

        {/* Rondas */}
        <div className="bg-gray-950 rounded-xl p-2.5 border border-gray-800/50">
          <div className="flex items-center gap-1 mb-1">
            <RotateCcw size={11} className="text-gray-600" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Rondas</span>
          </div>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={field.actual_rounds}
            onChange={e => set('actual_rounds', e.target.value)}
            placeholder="—"
            className="w-full bg-transparent text-white text-base font-black outline-none placeholder-gray-700"
          />
        </div>

        {/* Peso */}
        <div className="bg-gray-950 rounded-xl p-2.5 border border-gray-800/50">
          <div className="flex items-center gap-1 mb-1">
            <Scale size={11} className="text-gray-600" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              Peso {field.weight_unit_abbreviation && `(${field.weight_unit_abbreviation})`}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={field.actual_weight_value}
            onChange={e => set('actual_weight_value', e.target.value)}
            placeholder="—"
            className="w-full bg-transparent text-white text-base font-black outline-none placeholder-gray-700"
          />
        </div>

        {/* Distancia */}
        <div className="bg-gray-950 rounded-xl p-2.5 border border-gray-800/50">
          <div className="flex items-center gap-1 mb-1">
            <Activity size={11} className="text-gray-600" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              Dist. {field.distance_unit_abbreviation && `(${field.distance_unit_abbreviation})`}
            </span>
          </div>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={field.actual_distance_value}
            onChange={e => set('actual_distance_value', e.target.value)}
            placeholder="—"
            className="w-full bg-transparent text-white text-base font-black outline-none placeholder-gray-700"
          />
        </div>

        {/* Tiempo (mm:ss) */}
        <div className="bg-gray-950 rounded-xl p-2.5 border border-gray-800/50">
          <div className="flex items-center gap-1 mb-1">
            <Timer size={11} className="text-gray-600" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Tiempo (mm:ss)</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={field.actual_time_minutes}
              onChange={e => set('actual_time_minutes', e.target.value)}
              placeholder="00"
              className="w-10 bg-transparent text-white text-base font-black outline-none placeholder-gray-700 text-center"
            />
            <span className="text-gray-600 font-bold">:</span>
            <input
              type="number"
              min="0"
              max="59"
              inputMode="numeric"
              value={field.actual_time_secs}
              onChange={e => set('actual_time_secs', e.target.value)}
              placeholder="00"
              className="w-10 bg-transparent text-white text-base font-black outline-none placeholder-gray-700 text-center"
            />
          </div>
        </div>

        {/* Calorías */}
        <div className="bg-gray-950 rounded-xl p-2.5 border border-gray-800/50">
          <div className="flex items-center gap-1 mb-1">
            <Flame size={11} className="text-gray-600" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Calorías</span>
          </div>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={field.actual_calories}
            onChange={e => set('actual_calories', e.target.value)}
            placeholder="—"
            className="w-full bg-transparent text-white text-base font-black outline-none placeholder-gray-700"
          />
        </div>
      </div>

      {/* Resultado libre */}
      <div className="bg-gray-950 rounded-xl p-2.5 border border-gray-800/50">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Resultado (texto libre)</span>
        </div>
        <input
          type="text"
          value={field.result_text}
          onChange={e => set('result_text', e.target.value)}
          placeholder="ej: 5 rounds + 12 reps"
          className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-700"
        />
      </div>

      {/* Notas del ejercicio */}
      <div className="bg-gray-950 rounded-xl p-2.5 border border-gray-800/50">
        <div className="flex items-center gap-1 mb-1">
          <StickyNote size={11} className="text-gray-600" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">Notas del ejercicio</span>
        </div>
        <input
          type="text"
          value={field.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="—"
          className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-700"
        />
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function SessionEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [sessionFields, setSessionFields] = useState<SessionFields>({
    actual_duration_minutes: '',
    general_feeling: '',
    perceived_effort: '',
    final_notes: '',
    body_weight: '',
  });
  const [resultFields, setResultFields] = useState<ResultFields[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const sess = await getById(id);
      if (!sess) {
        toast.error('Sesión no encontrada');
        navigate('/configuracion/sesiones');
        return;
      }
      setSession(sess);
      setSessionFields({
        actual_duration_minutes: sess.actual_duration_minutes != null ? String(sess.actual_duration_minutes) : '',
        general_feeling: sess.general_feeling ?? '',
        perceived_effort: sess.perceived_effort != null ? String(sess.perceived_effort) : '',
        final_notes: sess.final_notes ?? '',
        body_weight: sess.body_weight != null ? String(sess.body_weight) : '',
      });
      setResultFields(sess.results.map(resultToFields));
    } catch {
      toast.error('Error al cargar la sesión');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!id || !session) return;
    setSaving(true);
    try {
      // 1. Actualizar campos de la sesión
      await updateSession(id, {
        actual_duration_minutes: sessionFields.actual_duration_minutes !== ''
          ? parseInt(sessionFields.actual_duration_minutes) || null
          : null,
        general_feeling: sessionFields.general_feeling || null,
        perceived_effort: sessionFields.perceived_effort !== ''
          ? parseInt(sessionFields.perceived_effort) || null
          : null,
        final_notes: sessionFields.final_notes || null,
        body_weight: sessionFields.body_weight !== ''
          ? parseFloat(sessionFields.body_weight) || null
          : null,
      });

      // 2. Actualizar resultados de ejercicios
      if (resultFields.length > 0) {
        await saveResults(id, resultFields.map(fieldsToResult));
      }

      toast.success('Sesión actualizada correctamente');
      navigate('/configuracion/sesiones');
    } catch {
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
    </div>
  );

  if (!session) return null;

  return (
    <>
      <Header
        title="Editar sesión"
        leftAction={
          <button
            onClick={() => navigate('/configuracion/sesiones')}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-40"
          >
            <Save size={20} />
          </button>
        }
      />

      <div className="p-4 pb-28 space-y-6">

        {/* ── Info de la sesión ── */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl px-4 py-3 space-y-0.5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {formatDate(session.session_date)}
          </p>
          <p className="text-base font-black text-white">
            {session.template_name || 'Sesión Libre'}
          </p>
        </div>

        {/* ── Datos generales de la sesión ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
            Datos de la sesión
          </h2>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">

            {/* Duración */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5">
                <Clock size={13} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-400 uppercase">Duración (minutos)</span>
              </label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={sessionFields.actual_duration_minutes}
                onChange={e => setSessionFields(s => ({ ...s, actual_duration_minutes: e.target.value }))}
                placeholder="—"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Sensación */}
            <div>
              <label className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Sensación</span>
              </label>
              <div className="flex gap-2">
                {FEELINGS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setSessionFields(s => ({
                      ...s,
                      general_feeling: s.general_feeling === f.value ? '' : f.value,
                    }))}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-colors ${
                      sessionFields.general_feeling === f.value
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    <span className="text-lg leading-none">{f.emoji}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Esfuerzo percibido (RPE) */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5">
                <Activity size={13} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Esfuerzo percibido (RPE 1–10)
                  {sessionFields.perceived_effort && (
                    <span className="ml-2 text-primary-400">{sessionFields.perceived_effort}/10</span>
                  )}
                </span>
              </label>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setSessionFields(s => ({
                      ...s,
                      perceived_effort: s.perceived_effort === String(n) ? '' : String(n),
                    }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      sessionFields.perceived_effort === String(n)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Peso corporal */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5">
                <Scale size={13} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-400 uppercase">Peso corporal (kg)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={sessionFields.body_weight}
                onChange={e => setSessionFields(s => ({ ...s, body_weight: e.target.value }))}
                placeholder="—"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Notas finales */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5">
                <StickyNote size={13} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-400 uppercase">Notas finales</span>
              </label>
              <textarea
                rows={3}
                value={sessionFields.final_notes}
                onChange={e => setSessionFields(s => ({ ...s, final_notes: e.target.value }))}
                placeholder="Observaciones, notas de la sesión..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Resultados de ejercicios ── */}
        {resultFields.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
              Ejercicios ({resultFields.length})
            </h2>
            {resultFields.map((rf, idx) => (
              <ResultCard
                key={rf.id}
                field={rf}
                onChange={updated =>
                  setResultFields(prev => prev.map((r, i) => (i === idx ? updated : r)))
                }
              />
            ))}
          </div>
        )}

        {/* ── Botón guardar ── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </>
  );
}
