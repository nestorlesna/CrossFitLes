import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  Save, 
  Clock, 
  ChevronRight, 
  Timer, 
  Info,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Dumbbell,
  RotateCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { getById as getSessionById, saveResults, finalize, updateSessionDuration } from '../../db/repositories/trainingSessionRepo';
import { getById as getTemplateById } from '../../db/repositories/classTemplateRepo';
import { SessionWithRelations, SessionExerciseResult } from '../../models/TrainingSession';
import { ClassTemplateWithSections, SectionExercise } from '../../models/ClassTemplate';
import { RxScaled, GeneralFeeling } from '../../types';
import { getImageDisplayUrl } from '../../services/mediaService';

// Helper para obtener el ID de YouTube
function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper para obtener el ID de Vimeo
function getVimeoId(url: string): string | null {
  const regExp = /vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\w+\/)?|showcase\/(?:\w+\/)?|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

// Componente para embeber video
function VideoEmbed({ url }: { url: string }) {
  const youtubeId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);

  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-800">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-800">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          title="Vimeo video player"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors group"
    >
      <span className="text-sm text-gray-200 truncate max-w-[200px]">{url}</span>
      <span className="text-xs text-primary-500 font-medium">Ver enlace</span>
    </a>
  );
}

function ExerciseImage({ 
  imagePath, 
  imageUrl: initialImageUrl, 
  name 
}: { 
  imagePath?: string | null; 
  imageUrl?: string | null;
  name: string 
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialImageUrl) {
      setResolvedUrl(initialImageUrl);
    } else if (imagePath) {
      getImageDisplayUrl(imagePath).then(setResolvedUrl);
    } else {
      setResolvedUrl(null);
    }
  }, [imagePath, initialImageUrl]);

  return (
    <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
      {resolvedUrl ? (
        <img src={resolvedUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Dumbbell size={18} className="text-gray-600" />
      )}
    </div>
  );
}

export function SessionExecutorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Estados de carga y datos
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [template, setTemplate] = useState<ClassTemplateWithSections | null>(null);
  const [results, setResults] = useState<SessionExerciseResult[]>([]);
  
  // Estado del temporizador
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Navegación de secciones
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // Modales
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Datos de finalización
  const [feeling, setFeeling] = useState<GeneralFeeling>('normal');
  const [effort, setEffort] = useState(5);
  const [notes, setNotes] = useState('');
  
  // Video Modal
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [exerciseNameForVideo, setExerciseNameForVideo] = useState('');

  // 1. Cargar datos
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const sess = await getSessionById(id);
      if (!sess) {
        toast.error('Sesión no encontrada');
        navigate('/sesiones');
        return;
      }
      setSession(sess);
      setResults(sess.results);
      
      if (sess.class_template_id) {
        const templ = await getTemplateById(sess.class_template_id);
        setTemplate(templ);
      }
      
      // Si la sesión ya tiene duración, inicializar timer
      if (sess.actual_duration_minutes) {
        setSeconds(sess.actual_duration_minutes * 60);
      }
      
      // Auto-iniciar si está en progreso (o por defecto si es nueva)
      if (sess.status === 'in_progress' || sess.status === 'planned') {
        setIsActive(true);
      }
    } catch (e) {
      toast.error('Error al cargar la sesión');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Lógica del Temporizador y Auto-guardado de Duración
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      // Guardar duración parcial en la BD al pausar para no perder tiempo en caso de recarga
      if (id && seconds > 0) {
        saveResults(id, results); // Guardar resultados actuales
        // También guardamos la duración en la tabla training_session
        updateSessionDuration(id, Math.floor(seconds / 60)).catch(console.error);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, id]); // Depende de id y isActive

  // Auto-guardado de resultados con debounce (3 segundos)
  useEffect(() => {
    if (!id || results.length === 0 || loading) return;

    const timer = setTimeout(() => {
      saveResults(id, results).catch(console.error);
      // No mostramos toast para no interrumpir el flujo del usuario
    }, 3000);

    return () => clearTimeout(timer);
  }, [results, id, loading]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 3. Gestión de resultados
  const updateResult = (resultId: string, field: keyof SessionExerciseResult, value: any) => {
    setResults(current => 
      current.map(r => r.id === resultId ? { ...r, [field]: value, is_completed: 1 } : r)
    );
  };

  const handleSavePartial = async () => {
    if (!id) return;
    try {
      await saveResults(id, results);
      toast.success('Progreso guardado');
    } catch (e) {
      toast.error('Error al guardar progreso');
    }
  };

  const handleFinalize = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // 1. Guardar resultados finales
      await saveResults(id, results);
      
      // 2. Finalizar sesión
      await finalize(id, {
        durationMinutes: Math.floor(seconds / 60),
        feeling,
        effort,
        notes
      });
      
      toast.success('¡Entrenamiento completado!');
      navigate(`/sesiones/${id}`);
    } catch (e) {
      toast.error('Error al finalizar sesión');
    } finally {
      setSaving(false);
      setShowFinishModal(false);
    }
  };

  // 4. Render Helpers
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
    </div>
  );

  if (!session) return null;

  const currentSection = template?.sections[activeSectionIdx];
  const sectionResults = results.filter(r => 
    currentSection ? r.section_type_id === currentSection.section_type_id : true
  );

  return (
    <>
      <Header
        title={session.template_name || 'Sesión Libre'}
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button 
            onClick={handleSavePartial}
            className="text-primary-500 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Guardar parcial"
          >
            <Save size={20} />
          </button>
        }
      />

      {/* ── Barra de Control Superior ── */}
      <div className="sticky top-14 z-20 bg-gray-950 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isActive ? 'bg-primary-500/10' : 'bg-gray-800'}`}>
              <Timer size={24} className={isActive ? 'text-primary-500 animate-pulse' : 'text-gray-500'} />
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-white leading-none">
                {formatTime(seconds)}
              </div>
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Duración total</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-[0.95] ${
                isActive ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-green-600 text-white'
              }`}
            >
              {isActive ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              {isActive ? 'Pausar' : 'Reanudar'}
            </button>
            <button
              onClick={() => setShowFinishModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-[0.95]"
            >
              Finalizar
            </button>
          </div>
        </div>

        {/* ── Tabs de Secciones ── */}
        {template?.sections && template.sections.length > 1 && (
          <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar pb-1">
            {template.sections.map((s, idx) => (
              <button
                key={s.id}
                onClick={async () => {
                  // Guardar progreso actual antes de cambiar de pestaña
                  if (id) await saveResults(id, results);
                  setActiveSectionIdx(idx);
                }}
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  activeSectionIdx === idx
                    ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/40'
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
              >
                {s.visible_title || s.section_type_name || `Sección ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 p-4 pb-32">
        {/* ── Info de Sección Actual ── */}
        {currentSection && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge label={currentSection.section_type_name || ''} color={currentSection.section_type_color} />
              {currentSection.work_format_name && (
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{currentSection.work_format_name}</span>
              )}
            </div>
            {currentSection.general_description && (
              <p className="text-gray-300 text-sm leading-relaxed mb-3 italic">"{currentSection.general_description}"</p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-800">
              {currentSection.time_cap_seconds && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-800 rounded-lg"><Clock size={14} className="text-gray-400" /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Time Cap</p>
                    <p className="text-xs text-white font-bold">{Math.floor(currentSection.time_cap_seconds / 60)}:00</p>
                  </div>
                </div>
              )}
              {currentSection.total_rounds && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-800 rounded-lg"><RotateCw size={14} className="text-gray-400" /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Rondas</p>
                    <p className="text-xs text-white font-bold">{currentSection.total_rounds} vueltas</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Listado de Ejercicios y Resultados ── */}
        <div className="flex flex-col gap-4">
          {sectionResults.map((result) => {
            // Buscar planificación correspondiente en el template
            const planned = currentSection?.exercises.find(e => e.id === result.section_exercise_id);
            
            return (
              <div key={result.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-900/40 border-b border-gray-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <ExerciseImage
                      imagePath={result.exercise_image_path}
                      imageUrl={result.exercise_image_url}
                      name={result.exercise_name ?? ''}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-base truncate">{result.exercise_name}</h3>
                        {result.exercise_video_url && (
                          <button
                            onClick={() => {
                              setSelectedVideoUrl(result.exercise_video_url!);
                              setExerciseNameForVideo(result.exercise_name ?? '');
                            }}
                            className="p-1.5 rounded-full bg-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors"
                            aria-label="Ver video"
                          >
                            <Play size={10} fill="currentColor" />
                          </button>
                        )}
                      </div>
                      {planned?.coach_notes && (
                        <div className="flex items-start gap-1.5 text-amber-500/80">
                          <Info size={12} className="mt-0.5 shrink-0" />
                          <span className="text-[11px] leading-tight">{planned.coach_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 self-start">
                    {(['rx', 'scaled', 'rx+'] as RxScaled[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateResult(result.id, 'rx_or_scaled', mode)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                          result.rx_or_scaled === mode
                            ? 'bg-primary-600 border-primary-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-500'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* Inputs dinámicos según lo planificado */}
                  {/* Peso */}
                  {(planned?.planned_weight_value || result.actual_weight_value) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Peso ({planned?.weight_unit_abbreviation || 'kg'})</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={`${planned?.planned_weight_value || '0'}`}
                          value={result.actual_weight_value || ''}
                          onChange={(e) => updateResult(result.id, 'actual_weight_value', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                        />
                        {planned?.planned_weight_value && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-700 pointer-events-none">Objetivo: {planned.planned_weight_value}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Repeticiones */}
                  {(planned?.planned_repetitions || result.actual_repetitions) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Repeticiones</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={`${planned?.planned_repetitions || '0'}`}
                          value={result.actual_repetitions || ''}
                          onChange={(e) => updateResult(result.id, 'actual_repetitions', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                        />
                         {planned?.planned_repetitions && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-700 pointer-events-none">Objetivo: {planned.planned_repetitions}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tiempo (Segundos) */}
                  {(planned?.planned_time_seconds || result.actual_time_seconds) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tiempo (seg)</label>
                      <input
                        type="number"
                        placeholder={`${planned?.planned_time_seconds || '0'}`}
                        value={result.actual_time_seconds || ''}
                        onChange={(e) => updateResult(result.id, 'actual_time_seconds', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  )}

                  {/* Distancia */}
                  {(planned?.planned_distance_value || result.actual_distance_value) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Distancia ({planned?.distance_unit_abbreviation || 'm'})</label>
                      <input
                        type="number"
                        placeholder={`${planned?.planned_distance_value || '0'}`}
                        value={result.actual_distance_value || ''}
                        onChange={(e) => updateResult(result.id, 'actual_distance_value', e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  )}

                  {/* Resumen Texto / Resultado Libre */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Detalle del resultado (ej: 5+15)</label>
                    <input
                      type="text"
                      placeholder="Anota rondas extras, desgloses, etc..."
                      value={result.result_text || ''}
                      onChange={(e) => updateResult(result.id, 'result_text', e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal de Finalización ── */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Finalizar Entrenamiento"
        footer={
          <div className="flex gap-3 w-full">
            <button
              className="flex-1 border border-gray-700 text-gray-400 rounded-xl px-4 py-3 text-sm font-semibold"
              onClick={() => setShowFinishModal(false)}
              disabled={saving}
            >
              Seguir entrenando
            </button>
            <button
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-3 text-sm font-bold shadow-lg shadow-primary-900/20 disabled:opacity-50"
              onClick={handleFinalize}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar y Cerrar'}
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

          <div className="flex flex-col gap-4">
            {/* Sensación */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3">¿Cómo te sentiste?</label>
              <div className="flex justify-between gap-2">
                {(['terrible', 'bad', 'normal', 'good', 'excellent'] as GeneralFeeling[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFeeling(f)}
                    className={`flex-1 py-3 rounded-xl border text-xl transition-all ${
                      feeling === f ? 'bg-primary-500/20 border-primary-500 active:scale-110' : 'bg-gray-900 border-gray-800 opacity-40 hover:opacity-100'
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

            {/* Esfuerzo Percibido (RPE) */}
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
              <div className="flex justify-between mt-1 text-[10px] text-gray-600 font-bold uppercase">
                <span>Tranqui</span>
                <span>A tope</span>
              </div>
            </div>

            {/* Notas finales */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notas de la sesión</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="¿Algo para recordar de hoy? (ej: 'Sentí molestias en el hombro', 'Me costó mucho el cardio')"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 min-h-[100px] resize-none"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Video */}
      <Modal
        isOpen={Boolean(selectedVideoUrl)}
        onClose={() => setSelectedVideoUrl(null)}
        title={exerciseNameForVideo}
        size="md"
      >
        <div className="flex flex-col gap-4">
          {selectedVideoUrl && <VideoEmbed url={selectedVideoUrl} />}
          <p className="text-xs text-gray-500 text-center">
            Podes cerrar este video para volver al cronómetro.
          </p>
        </div>
      </Modal>
    </>
  );
}
