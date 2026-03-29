import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Activity,
  Trophy,
  StickyNote,
  Dumbbell,
  CheckCircle2,
  TrendingUp,
  Scale,
  Info,
  Play,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ExerciseInfoModal } from '../../components/ui/ExerciseInfoModal';
import { getById as getSessionById } from '../../db/repositories/trainingSessionRepo';
import { getById as getTemplateById } from '../../db/repositories/classTemplateRepo';
import { SessionWithRelations } from '../../models/TrainingSession';
import { ClassTemplateWithSections } from '../../models/ClassTemplate';
import { formatDate } from '../../utils/formatters';
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

export function SessionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [template, setTemplate] = useState<ClassTemplateWithSections | null>(null);

  // Video Modal
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [exerciseNameForVideo, setExerciseNameForVideo] = useState('');
  const [infoExerciseId, setInfoExerciseId] = useState<string | null>(null);
  const [infoExerciseName, setInfoExerciseName] = useState('');

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
      
      if (sess.class_template_id) {
        const templ = await getTemplateById(sess.class_template_id);
        setTemplate(templ);
      }
    } catch (e) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
    </div>
  );

  if (!session) return null;

  const getFeelingEmoji = (f?: string) => {
    switch (f) {
      case 'terrible': return '😫';
      case 'bad': return '😕';
      case 'normal': return '😐';
      case 'good': return '😊';
      case 'excellent': return '🔥';
      default: return '😐';
    }
  };

  const getFeelingLabel = (f?: string) => {
    switch (f) {
      case 'terrible': return 'Terrible';
      case 'bad': return 'Mal';
      case 'normal': return 'Normal';
      case 'good': return 'Bien';
      case 'excellent': return 'Excelente';
      default: return 'Normal';
    }
  };

  return (
    <>
      <Header
        title="Resumen de Sesión"
        leftAction={
          <button onClick={() => navigate('/sesiones')} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-6 p-4 pb-24">
        {/* ── Encabezado de Sesión ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <CheckCircle2 size={120} className="text-primary-500" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{formatDate(session.session_date)}</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-4 leading-tight">
              {session.template_name || 'Sesión Libre'}
            </h2>
            
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <Clock size={16} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Duración</p>
                  <p className="text-sm text-white font-bold">{session.actual_duration_minutes || '--'}m</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                   <span className="text-base">{getFeelingEmoji(session.general_feeling)}</span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Sensación</p>
                  <p className="text-sm text-white font-bold">{getFeelingLabel(session.general_feeling)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Activity size={16} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">RPE (Esfuerzo)</p>
                  <p className="text-sm text-white font-bold">{session.perceived_effort || '--'}/10</p>
                </div>
              </div>

              {session.estimated_calories != null && session.estimated_calories > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Flame size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Calorías est.</p>
                    <p className="text-sm text-white font-bold">{session.estimated_calories.toLocaleString()} kcal</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Notas Finales ── */}
        {session.final_notes && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex gap-3">
            <StickyNote size={20} className="text-gray-600 shrink-0" />
            <p className="text-gray-300 text-sm leading-relaxed italic">{session.final_notes}</p>
          </div>
        )}

        {/* ── Resultados por Sección ── */}
        <div className="flex flex-col gap-8 mt-2">
          {/* Sesión libre: sin plantilla, mostrar todos los resultados directamente */}
          {!template && session.results.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-white font-bold text-base px-1">Ejercicios realizados</h3>
              <div className="flex flex-col gap-3">
                {session.results.map((result) => (
                    <div key={result.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <ExerciseImage
                            imagePath={result.exercise_image_path}
                            imageUrl={result.exercise_image_url}
                            name={result.exercise_name ?? ''}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setInfoExerciseId(result.exercise_id);
                                  setInfoExerciseName(result.exercise_name ?? '');
                                }}
                                className="text-white font-bold text-sm leading-tight text-left hover:text-primary-400 transition-colors"
                              >
                                {result.exercise_name}
                              </button>
                              <button
                                onClick={() => {
                                  setInfoExerciseId(result.exercise_id);
                                  setInfoExerciseName(result.exercise_name ?? '');
                                }}
                                className="p-1 rounded-full text-gray-600 hover:text-gray-300 transition-colors shrink-0"
                              >
                                <Info size={13} />
                              </button>
                              {result.exercise_video_url && (
                                <button
                                  onClick={() => {
                                    setSelectedVideoUrl(result.exercise_video_url!);
                                    setExerciseNameForVideo(result.exercise_name ?? '');
                                  }}
                                  className="p-1.5 rounded-full bg-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors shrink-0"
                                >
                                  <Play size={10} fill="currentColor" />
                                </button>
                              )}
                            </div>
                            <Badge label={result.rx_or_scaled.toUpperCase()} size="sm" color={result.rx_or_scaled === 'rx' ? '#10b981' : '#f59e0b'} />
                          </div>
                        </div>
                        {result.is_personal_record === 1 && (
                          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-1 rounded-lg flex items-center gap-1">
                            <Trophy size={14} fill="currentColor" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">¡NUEVO PR!</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {result.actual_weight_value && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1"><Scale size={12} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Peso</span></div>
                            <span className="text-base font-black text-white">{result.actual_weight_value} <span className="text-[10px] font-normal text-gray-500">{result.weight_unit_abbreviation || 'kg'}</span></span>
                          </div>
                        )}
                        {result.actual_repetitions && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={12} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Reps</span></div>
                            <span className="text-base font-black text-white">{result.actual_repetitions}</span>
                          </div>
                        )}
                        {result.actual_rounds && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1"><Activity size={12} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Rondas</span></div>
                            <span className="text-base font-black text-white">{result.actual_rounds}</span>
                          </div>
                        )}
                        {result.actual_time_seconds && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1"><Clock size={12} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Tiempo</span></div>
                            <span className="text-base font-black text-white">{Math.floor(result.actual_time_seconds / 60)}:{(result.actual_time_seconds % 60).toString().padStart(2, '0')}</span>
                          </div>
                        )}
                        {result.actual_distance_value && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1"><Activity size={12} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Distancia</span></div>
                            <span className="text-base font-black text-white">{result.actual_distance_value} <span className="text-[10px] font-normal text-gray-500">{result.distance_unit_abbreviation || 'm'}</span></span>
                          </div>
                        )}
                        {result.result_text && (
                          <div className="col-span-2 bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1"><Info size={12} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Resultado</span></div>
                            <p className="text-sm text-gray-300 italic">"{result.result_text}"</p>
                          </div>
                        )}
                        {result.notes && (
                          <div className="col-span-2 bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1"><StickyNote size={12} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Notas</span></div>
                            <p className="text-sm text-gray-300">{result.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sesión con plantilla: agrupar por sección */}
          {template?.sections.map((section) => {
            const sectionResults = session.results.filter(r => r.section_type_id === section.section_type_id);
            if (sectionResults.length === 0) return null;

            return (
              <div key={section.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Badge label={section.section_type_name || ''} color={section.section_type_color} size="sm" />
                    <h3 className="text-white font-bold text-base">{section.visible_title || 'Sección'}</h3>
                  </div>
                  {section.work_format_name && (
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{section.work_format_name}</span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {sectionResults.map((result) => (
                    <div key={result.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <ExerciseImage
                            imagePath={result.exercise_image_path}
                            imageUrl={result.exercise_image_url}
                            name={result.exercise_name ?? ''}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setInfoExerciseId(result.exercise_id);
                                  setInfoExerciseName(result.exercise_name ?? '');
                                }}
                                className="text-white font-bold text-sm leading-tight text-left hover:text-primary-400 transition-colors"
                              >
                                {result.exercise_name}
                              </button>
                              <button
                                onClick={() => {
                                  setInfoExerciseId(result.exercise_id);
                                  setInfoExerciseName(result.exercise_name ?? '');
                                }}
                                className="p-1 rounded-full text-gray-600 hover:text-gray-300 transition-colors shrink-0"
                                aria-label="Ver información del ejercicio"
                              >
                                <Info size={13} />
                              </button>
                              {result.exercise_video_url && (
                                <button
                                  onClick={() => {
                                    setSelectedVideoUrl(result.exercise_video_url!);
                                    setExerciseNameForVideo(result.exercise_name ?? '');
                                  }}
                                  className="p-1.5 rounded-full bg-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors shrink-0"
                                  aria-label="Ver video"
                                >
                                  <Play size={10} fill="currentColor" />
                                </button>
                              )}
                            </div>
                            <Badge label={result.rx_or_scaled.toUpperCase()} size="sm" color={result.rx_or_scaled === 'rx' ? '#10b981' : '#f59e0b'} />
                          </div>
                        </div>
                        {result.is_personal_record === 1 && (
                          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-1 rounded-lg flex items-center gap-1 animate-bounce">
                            <Trophy size={14} fill="currentColor" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">¡NUEVO PR!</span>
                          </div>
                        )}
                      </div>

                      {/* Grilla de Resultados */}
                      <div className="grid grid-cols-2 gap-4">
                        {result.actual_weight_value && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Scale size={12} className="text-gray-600" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Peso</span>
                            </div>
                            <span className="text-base font-black text-white">
                              {result.actual_weight_value} <span className="text-[10px] font-normal text-gray-500">{result.weight_unit_abbreviation || 'kg'}</span>
                            </span>
                          </div>
                        )}

                        {result.actual_repetitions && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingUp size={12} className="text-gray-600" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Reps</span>
                            </div>
                            <span className="text-base font-black text-white">{result.actual_repetitions}</span>
                          </div>
                        )}

                        {result.actual_time_seconds && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Clock size={12} className="text-gray-600" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Tiempo</span>
                            </div>
                            <span className="text-base font-black text-white">
                              {Math.floor(result.actual_time_seconds / 60)}:{(result.actual_time_seconds % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}

                        {result.actual_distance_value && (
                          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Activity size={12} className="text-gray-600" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Distancia</span>
                            </div>
                            <span className="text-base font-black text-white">
                              {result.actual_distance_value} <span className="text-[10px] font-normal text-gray-500">{result.distance_unit_abbreviation || 'm'}</span>
                            </span>
                          </div>
                        )}

                        {result.result_text && (
                          <div className="col-span-2 bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                             <div className="flex items-center gap-1.5 mb-1">
                              <Info size={12} className="text-gray-600" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Resultado</span>
                            </div>
                            <p className="text-sm text-gray-300 italic">"{result.result_text}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Botón Volver ── */}
        <button
          onClick={() => navigate('/sesiones')}
          className="w-full bg-gray-900 border border-gray-800 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-colors active:scale-[0.98]"
        >
          Volver al Historial
        </button>
      </div>

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
            Podes cerrar este video para volver al resumen.
          </p>
        </div>
      </Modal>

      {/* Modal de Información del Ejercicio */}
      <ExerciseInfoModal
        exerciseId={infoExerciseId}
        exerciseName={infoExerciseName}
        onClose={() => setInfoExerciseId(null)}
      />
    </>
  );
}
