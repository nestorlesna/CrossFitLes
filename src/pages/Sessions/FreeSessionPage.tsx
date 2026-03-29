// Sesión libre: sin plantilla, el usuario agrega ejercicios en tiempo real con temporizador
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Play, Pause, Save, Timer, Info,
  CheckCircle2, Trash2, Dumbbell, Search, Plus, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { ExerciseInfoModal } from '../../components/ui/ExerciseInfoModal';
import { Exercise } from '../../models/Exercise';
import { SessionExerciseResult } from '../../models/TrainingSession';
import { GeneralFeeling } from '../../types';
import { getAll as getAllExercises } from '../../db/repositories/exerciseRepo';
import {
  createFreeSession,
  addExerciseToSession,
  removeExerciseFromSession,
  saveResults,
  finalize,
  updateSessionDuration,
  getById as getSessionById,
  softDelete,
} from '../../db/repositories/trainingSessionRepo';
import { getDatabase } from '../../db/database';
import { getImageDisplayUrl } from '../../services/mediaService';

// ── Helpers de video ─────────────────────────────────────────────────────────
function getYoutubeId(url: string): string | null {
  const m = url.match(/^.*(youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return m && m[2].length === 11 ? m[2] : null;
}
function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\w+\/)?|showcase\/(?:\w+\/)?|)(\d+)(?:$|\/|\?)/);
  return m ? m[1] : null;
}
function VideoEmbed({ url }: { url: string }) {
  const ytId = getYoutubeId(url);
  const vmId = getVimeoId(url);
  const iframeClass = 'absolute top-0 left-0 w-full h-full';
  if (ytId) return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-800">
      <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} title="Video" frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen className={iframeClass} />
    </div>
  );
  if (vmId) return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-800">
      <iframe src={`https://player.vimeo.com/video/${vmId}?autoplay=1`} title="Video" frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className={iframeClass} />
    </div>
  );
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
      <span className="text-sm text-gray-200 truncate">{url}</span>
      <span className="text-xs text-primary-500">Ver enlace</span>
    </a>
  );
}

// ── Imagen de ejercicio ───────────────────────────────────────────────────────
function ExerciseImg({ imagePath, imageUrl, name }: { imagePath?: string | null; imageUrl?: string | null; name: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (imageUrl) { setSrc(imageUrl); return; }
    if (imagePath) getImageDisplayUrl(imagePath).then(setSrc);
  }, [imagePath, imageUrl]);
  return (
    <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : <Dumbbell size={18} className="text-gray-600" />}
    </div>
  );
}

// ── Tipos de unidades ─────────────────────────────────────────────────────────
interface MeasurementUnit { id: string; name: string; abbreviation: string; unit_type: string; }

// ── Tarjeta de resultado ──────────────────────────────────────────────────────
function ResultCard({
  result, weightUnits, distanceUnits,
  onUpdate, onDelete, onInfo, onVideo,
}: {
  result: SessionExerciseResult;
  weightUnits: MeasurementUnit[];
  distanceUnits: MeasurementUnit[];
  onUpdate: (field: keyof SessionExerciseResult, value: any) => void;
  onDelete: () => void;
  onInfo: () => void;
  onVideo: () => void;
}) {
  const inputCls = 'w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500';
  const labelCls = 'text-[10px] font-bold text-gray-500 uppercase tracking-widest';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Cabecera */}
      <div className="p-4 border-b border-gray-800 flex items-start gap-3">
        <ExerciseImg imagePath={result.exercise_image_path} imageUrl={result.exercise_image_url} name={result.exercise_name ?? ''} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <button onClick={onInfo}
              className="flex-1 text-left text-white font-bold text-base truncate hover:text-primary-400 transition-colors">
              {result.exercise_name}
            </button>
            <button onClick={onInfo} className="p-1 text-gray-600 hover:text-gray-300 transition-colors shrink-0">
              <Info size={13} />
            </button>
            {result.exercise_video_url && (
              <button onClick={onVideo}
                className="p-1.5 rounded-full bg-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors shrink-0">
                <Play size={10} fill="currentColor" />
              </button>
            )}
          </div>
          {/* RX / Scaled */}
          <div className="flex gap-1">
            {(['rx', 'rx+', 'scaled'] as const).map(v => (
              <button key={v} onClick={() => onUpdate('rx_or_scaled', v)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border transition-all ${result.rx_or_scaled === v ? 'bg-primary-600 border-primary-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                {v === 'rx+' ? 'RX+' : v === 'rx' ? 'RX' : 'Scaled'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onDelete}
          className="p-1.5 text-gray-700 hover:text-red-400 transition-colors shrink-0 mt-0.5">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Campos */}
      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Reps</label>
          <input type="number" inputMode="numeric" min="0" placeholder="—"
            value={result.actual_repetitions ?? ''}
            onChange={e => onUpdate('actual_repetitions', e.target.value ? Number(e.target.value) : null)}
            className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Rondas</label>
          <input type="number" inputMode="numeric" min="0" placeholder="—"
            value={result.actual_rounds ?? ''}
            onChange={e => onUpdate('actual_rounds', e.target.value ? Number(e.target.value) : null)}
            className={inputCls} />
        </div>
        {/* Peso */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Peso</label>
          <div className="flex gap-1">
            <input type="number" inputMode="decimal" min="0" placeholder="—"
              value={result.actual_weight_value ?? ''}
              onChange={e => onUpdate('actual_weight_value', e.target.value ? Number(e.target.value) : null)}
              className={`${inputCls} flex-1 min-w-0`} />
            {weightUnits.length > 0 && (
              <select value={result.actual_weight_unit_id ?? ''}
                onChange={e => onUpdate('actual_weight_unit_id', e.target.value || null)}
                className="bg-gray-950 border border-gray-800 rounded-xl px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-primary-500">
                <option value="">u</option>
                {weightUnits.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
              </select>
            )}
          </div>
        </div>
        {/* Tiempo */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Tiempo (seg)</label>
          <input type="number" inputMode="numeric" min="0" placeholder="—"
            value={result.actual_time_seconds ?? ''}
            onChange={e => onUpdate('actual_time_seconds', e.target.value ? Number(e.target.value) : null)}
            className={inputCls} />
        </div>
        {/* Distancia */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Distancia</label>
          <div className="flex gap-1">
            <input type="number" inputMode="decimal" min="0" placeholder="—"
              value={result.actual_distance_value ?? ''}
              onChange={e => onUpdate('actual_distance_value', e.target.value ? Number(e.target.value) : null)}
              className={`${inputCls} flex-1 min-w-0`} />
            {distanceUnits.length > 0 && (
              <select value={result.actual_distance_unit_id ?? ''}
                onChange={e => onUpdate('actual_distance_unit_id', e.target.value || null)}
                className="bg-gray-950 border border-gray-800 rounded-xl px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-primary-500">
                <option value="">u</option>
                {distanceUnits.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
              </select>
            )}
          </div>
        </div>
        {/* Calorías */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Calorías</label>
          <input type="number" inputMode="numeric" min="0" placeholder="—"
            value={result.actual_calories ?? ''}
            onChange={e => onUpdate('actual_calories', e.target.value ? Number(e.target.value) : null)}
            className={inputCls} />
        </div>
        {/* Resultado libre - span 2 cols */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Resultado (texto libre)</label>
          <input type="text" placeholder="Ej: 5 rondas + 10 reps"
            value={result.result_text ?? ''}
            onChange={e => onUpdate('result_text', e.target.value)}
            className={inputCls} />
        </div>
        {/* Notas */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Notas</label>
          <input type="text" placeholder="Observaciones..."
            value={result.notes ?? ''}
            onChange={e => onUpdate('notes', e.target.value)}
            className={inputCls} />
        </div>
        {/* Completado */}
        <div className="col-span-2 flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">Marcar como completado</span>
          <button onClick={() => onUpdate('is_completed', result.is_completed ? 0 : 1)}
            className={`transition-colors ${result.is_completed ? 'text-primary-400' : 'text-gray-600'}`}>
            {result.is_completed ? <CheckCircle2 size={22} /> : <CheckCircle2 size={22} className="opacity-30" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
const FEELINGS: { value: GeneralFeeling; emoji: string }[] = [
  { value: 'terrible', emoji: '😫' }, { value: 'bad', emoji: '😕' },
  { value: 'normal', emoji: '😐' }, { value: 'good', emoji: '😊' },
  { value: 'excellent', emoji: '🔥' },
];

export function FreeSessionPage() {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  // ── Sesión ──
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDate] = useState(todayStr);
  const initDone = useRef(false); // evita doble init en React StrictMode

  // ── Timer ──
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Resultados ──
  const [results, setResults] = useState<SessionExerciseResult[]>([]);
  const [weightUnits, setWeightUnits] = useState<MeasurementUnit[]>([]);
  const [distanceUnits, setDistanceUnits] = useState<MeasurementUnit[]>([]);

  // ── Buscador de ejercicios ──
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [loadingExercises, setLoadingExercises] = useState(false);

  // ── Modales ──
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feeling, setFeeling] = useState<GeneralFeeling>('normal');
  const [effort, setEffort] = useState(5);
  const [notes, setNotes] = useState('');
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [videoExerciseName, setVideoExerciseName] = useState('');
  const [infoExerciseId, setInfoExerciseId] = useState<string | null>(null);
  const [infoExerciseName, setInfoExerciseName] = useState('');

  // ── Inicializar sesión y unidades ──
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    async function init() {
      try {
        const id = await createFreeSession(sessionDate);
        setSessionId(id);

        const db = getDatabase();
        const res = await db.query(`SELECT * FROM measurement_unit WHERE is_active = 1 ORDER BY sort_order`);
        const units = (res.values ?? []) as MeasurementUnit[];
        setWeightUnits(units.filter(u => u.unit_type === 'weight'));
        setDistanceUnits(units.filter(u => u.unit_type === 'distance'));
      } catch (e: any) {
        toast.error(`Error al iniciar sesión: ${e?.message ?? e}`);
      }
    }
    init();
  }, []);

  // ── Timer ──
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sessionId && seconds > 0) {
        updateSessionDuration(sessionId, Math.floor(seconds / 60)).catch(console.error);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, sessionId]);

  // ── Auto-guardado debounced ──
  useEffect(() => {
    if (!sessionId || results.length === 0) return;
    const t = setTimeout(() => saveResults(sessionId, results).catch(console.error), 3000);
    return () => clearTimeout(t);
  }, [results, sessionId]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Abrir selector de ejercicios ──
  const openExercisePicker = async () => {
    setExerciseSearch('');
    setShowExercisePicker(true);
    if (allExercises.length === 0) {
      setLoadingExercises(true);
      try {
        const exs = await getAllExercises();
        setAllExercises(exs);
      } catch { toast.error('Error al cargar ejercicios'); }
      finally { setLoadingExercises(false); }
    }
  };

  // ── Agregar ejercicio ──
  const handleAddExercise = async (exercise: Exercise) => {
    if (!sessionId) return;
    // Evitar duplicados
    if (results.some(r => r.exercise_id === exercise.id)) {
      toast.info('Ese ejercicio ya está en la sesión');
      return;
    }
    try {
      const sortOrder = results.length + 1;
      const resultId = await addExerciseToSession(sessionId, exercise.id, sortOrder);
      // Recargar el result con los campos enriquecidos (nombre, imagen, video)
      const updated = await getSessionById(sessionId);
      if (updated) setResults(updated.results);
      setShowExercisePicker(false);
      toast.success(`${exercise.name} agregado`);
    } catch {
      toast.error('Error al agregar ejercicio');
    }
  };

  // ── Actualizar campo de resultado ──
  const updateResult = useCallback((resultId: string, field: keyof SessionExerciseResult, value: any) => {
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, [field]: value } : r));
  }, []);

  // ── Eliminar ejercicio ──
  const handleDelete = async (result: SessionExerciseResult) => {
    if (!sessionId) return;
    try {
      await removeExerciseFromSession(result.id, sessionId);
      setResults(prev => prev.filter(r => r.id !== result.id));
      toast.success('Ejercicio eliminado');
    } catch {
      toast.error('Error al eliminar ejercicio');
    }
  };

  // ── Guardar parcial ──
  const handleSavePartial = async () => {
    if (!sessionId) return;
    try {
      await saveResults(sessionId, results);
      toast.success('Progreso guardado');
    } catch { toast.error('Error al guardar'); }
  };

  // ── Finalizar ──
  const handleFinalize = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      await saveResults(sessionId, results);
      await finalize(sessionId, {
        durationMinutes: Math.floor(seconds / 60),
        feeling, effort, notes,
      });
      toast.success('¡Entrenamiento completado!');
      const idToNavigate = sessionId;
      setShowFinishModal(false);
      setSaving(false);
      navigate(`/sesiones/${idToNavigate}`);
    } catch (e: any) {
      toast.error(`Error al finalizar: ${e?.message ?? e}`);
      setSaving(false);
      setShowFinishModal(false);
    }
  };

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <>
      <Header
        title="Sesión Libre"
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button onClick={handleSavePartial}
            className="text-primary-500 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Save size={20} />
          </button>
        }
      />

      {/* ── Barra de timer fija ── */}
      <div className="sticky top-14 z-20 bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isActive ? 'bg-primary-500/10' : 'bg-gray-800'}`}>
              <Timer size={24} className={isActive ? 'text-primary-500 animate-pulse' : 'text-gray-500'} />
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-white leading-none">{formatTime(seconds)}</div>
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Duración</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-[0.95] ${isActive ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-green-600 text-white'}`}>
              {isActive ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              {isActive ? 'Pausar' : 'Reanudar'}
            </button>
            <button onClick={() => setShowFinishModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-[0.95]">
              Finalizar
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 pb-32">
        {/* ── Lista de ejercicios ── */}
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Dumbbell size={48} className="text-gray-700" />
            <p className="text-gray-500 text-sm">Aún no hay ejercicios.</p>
            <p className="text-gray-600 text-xs">Tocá el botón para agregar el primero.</p>
          </div>
        ) : (
          results.map(r => (
            <ResultCard
              key={r.id}
              result={r}
              weightUnits={weightUnits}
              distanceUnits={distanceUnits}
              onUpdate={(field, value) => updateResult(r.id, field, value)}
              onDelete={() => handleDelete(r)}
              onInfo={() => { setInfoExerciseId(r.exercise_id); setInfoExerciseName(r.exercise_name ?? ''); }}
              onVideo={() => { setSelectedVideoUrl(r.exercise_video_url!); setVideoExerciseName(r.exercise_name ?? ''); }}
            />
          ))
        )}

        {/* ── Botón agregar ejercicio ── */}
        <button onClick={openExercisePicker}
          className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-700 hover:border-primary-600 text-gray-500 hover:text-primary-400 rounded-2xl transition-colors active:scale-[0.98]">
          <Plus size={20} />
          <span className="text-sm font-semibold">Agregar ejercicio</span>
        </button>
      </div>

      {/* ── Modal: selector de ejercicios ── */}
      <Modal isOpen={showExercisePicker} onClose={() => setShowExercisePicker(false)} title="Agregar ejercicio">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar ejercicio..."
              value={exerciseSearch}
              onChange={e => setExerciseSearch(e.target.value)}
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
            />
            {exerciseSearch && (
              <button onClick={() => setExerciseSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <X size={14} />
              </button>
            )}
          </div>

          {loadingExercises ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-primary-500" />
            </div>
          ) : filteredExercises.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-6">Sin resultados</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-[55vh] overflow-y-auto">
              {filteredExercises.map(ex => {
                const already = results.some(r => r.exercise_id === ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => !already && handleAddExercise(ex)}
                    disabled={already}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${already ? 'opacity-40 cursor-not-allowed bg-gray-800/50' : 'hover:bg-gray-800 active:bg-gray-700'}`}
                  >
                    <Dumbbell size={16} className="text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                      {(ex as any).primary_muscle_name && (
                        <p className="text-xs text-gray-500 truncate">{(ex as any).primary_muscle_name}</p>
                      )}
                    </div>
                    {already ? (
                      <CheckCircle2 size={16} className="text-primary-500 shrink-0" />
                    ) : (
                      <Plus size={16} className="text-gray-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modal: video ── */}
      <Modal isOpen={Boolean(selectedVideoUrl)} onClose={() => setSelectedVideoUrl(null)} title={videoExerciseName}>
        {selectedVideoUrl && <VideoEmbed url={selectedVideoUrl} />}
      </Modal>

      {/* ── Modal: info ejercicio ── */}
      <ExerciseInfoModal
        exerciseId={infoExerciseId}
        exerciseName={infoExerciseName}
        onClose={() => setInfoExerciseId(null)}
      />

      {/* ── Modal: finalizar ── */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Finalizar Entrenamiento"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setShowFinishModal(false)} disabled={saving}
              className="flex-1 border border-gray-700 text-gray-400 rounded-xl px-4 py-3 text-sm font-semibold">
              Seguir entrenando
            </button>
            <button onClick={handleFinalize} disabled={saving}
              className="flex-1 bg-primary-600 text-white rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">
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
            <p className="text-xl font-bold text-white">¡Buen trabajo!</p>
            <p className="text-sm text-gray-400">Completaste {formatTime(seconds)} de entrenamiento.</p>
          </div>

          {/* Sensación */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">¿Cómo te sentiste?</label>
            <div className="flex justify-between gap-2">
              {FEELINGS.map(f => (
                <button key={f.value} onClick={() => setFeeling(f.value)}
                  className={`flex-1 py-3 rounded-xl border text-xl transition-all ${feeling === f.value ? 'bg-primary-500/20 border-primary-500 scale-110' : 'bg-gray-900 border-gray-800 opacity-40 hover:opacity-100'}`}>
                  {f.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* RPE */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Esfuerzo (RPE)</label>
              <span className="text-xs font-bold text-primary-500">{effort}/10</span>
            </div>
            <input type="range" min="1" max="10" step="1" value={effort}
              onChange={e => setEffort(Number(e.target.value))}
              className="w-full accent-primary-500" />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Fácil</span><span>Moderado</span><span>Máximo</span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notas finales</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="¿Algo destacable del entrenamiento?"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none" />
          </div>
        </div>
      </Modal>
    </>
  );
}
