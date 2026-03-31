// Página de detalle de una plantilla de clase con secciones y ejercicios
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Pencil,
  Star,
  Copy,
  Trash2,
  Clock,
  Calendar,
  Target,
  Play,
  AlertTriangle,
  Dumbbell,
  Info,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { ExerciseInfoModal } from '../../components/ui/ExerciseInfoModal';
import { ClassTemplateWithSections, SectionExercise } from '../../models/ClassTemplate';
import * as classTemplateRepo from '../../db/repositories/classTemplateRepo';
import { getImageDisplayUrl } from '../../services/mediaService';

// Formatea una duración en segundos a "Xm Ys"
function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

// Genera el texto de los parámetros planificados de un ejercicio
function buildExerciseParams(exercise: SectionExercise): string {
  const parts: string[] = [];

  if (exercise.planned_rounds) parts.push(`${exercise.planned_rounds} rondas`);
  if (exercise.planned_repetitions) parts.push(`${exercise.planned_repetitions} reps`);
  if (exercise.planned_weight_value) {
    const unit = exercise.weight_unit_abbreviation ?? '';
    parts.push(`${exercise.planned_weight_value}${unit ? ' ' + unit : ''}`);
  }
  if (exercise.rm_percentage) parts.push(`${exercise.rm_percentage}% RM`);
  if (exercise.planned_time_seconds) parts.push(formatSeconds(exercise.planned_time_seconds));
  if (exercise.planned_distance_value) {
    const unit = exercise.distance_unit_abbreviation ?? '';
    parts.push(`${exercise.planned_distance_value}${unit ? ' ' + unit : ''}`);
  }
  if (exercise.planned_calories) parts.push(`${exercise.planned_calories} cal`);
  if (exercise.planned_rest_seconds) {
    parts.push(`desc: ${formatSeconds(exercise.planned_rest_seconds)}`);
  }

  return parts.join(' · ');
}

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
  imageUrl,
  imagePath,
  name,
}: {
  imageUrl?: string | null;
  imagePath?: string | null;
  name: string;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageUrl) {
      setResolvedUrl(imageUrl);
    } else if (imagePath) {
      getImageDisplayUrl(imagePath).then(setResolvedUrl);
    } else {
      setResolvedUrl(null);
    }
  }, [imageUrl, imagePath]);

  return (
    <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
      {resolvedUrl ? (
        <img src={resolvedUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Dumbbell size={20} className="text-gray-600" />
      )}
    </div>
  );
}

export function ClassTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<ClassTemplateWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sessionCounts, setSessionCounts] = useState<{ total: number; active: number } | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [exerciseNameForVideo, setExerciseNameForVideo] = useState('');
  const [infoExerciseId, setInfoExerciseId] = useState<string | null>(null);
  const [infoExerciseName, setInfoExerciseName] = useState('');
  const [duplicating, setDuplicating] = useState(false);

  // Carga la plantilla y sus secciones desde la base de datos
  const loadTemplate = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await classTemplateRepo.getById(id);
      if (!data) {
        toast.error('Plantilla no encontrada');
        navigate('/clases');
        return;
      }
      setTemplate(data);
    } catch (err) {
      toast.error('Error al cargar la clase');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // Alterna el estado de favorita con actualización optimista
  const handleToggleFavorite = async () => {
    if (!template) return;
    const newValue = template.is_favorite === 1 ? 0 : 1;
    setTemplate((prev) => (prev ? { ...prev, is_favorite: newValue } : prev));
    try {
      await classTemplateRepo.toggleFavorite(template.id);
    } catch {
      setTemplate((prev) =>
        prev ? { ...prev, is_favorite: template.is_favorite } : prev
      );
      toast.error('Error al actualizar favorito');
    }
  };

  // Duplica la plantilla y navega al detalle de la nueva
  const handleDuplicate = async () => {
    if (!template) return;
    setDuplicating(true);
    try {
      const newId = await classTemplateRepo.duplicate(template.id);
      toast.success('Plantilla duplicada');
      navigate(`/clases/${newId}`);
    } catch {
      toast.error('Error al duplicar la plantilla');
    } finally {
      setDuplicating(false);
    }
  };

  // Abre el modal de confirmación y pre-carga el conteo de sesiones vinculadas
  const handleOpenDeleteConfirm = async () => {
    if (!template) return;
    setSessionCounts(null);
    setShowDeleteConfirm(true);
    try {
      const counts = await classTemplateRepo.countLinkedSessions(template.id);
      setSessionCounts(counts);
    } catch {
      // Si falla la consulta igual mostramos el modal, sin info de sesiones
    }
  };

  // Elimina lógicamente la plantilla y vuelve al listado
  const handleDelete = async () => {
    if (!template) return;
    setDeleting(true);
    try {
      await classTemplateRepo.softDelete(template.id);
      toast.success('Clase eliminada');
      navigate('/clases');
    } catch {
      toast.error('Error al eliminar la clase');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header
          title="Clase"
          leftAction={
            <button
              onClick={() => navigate('/clases')}
              className="text-gray-400 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </button>
          }
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </>
    );
  }

  if (!template) return null;

  return (
    <>
      <Header
        title={template.name}
        leftAction={
          <button
            onClick={() => navigate('/clases')}
            className="text-gray-400 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Volver"
          >
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button
            onClick={() => navigate(`/clases/${template.id}/editar`)}
            className="text-primary-500 hover:text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Editar"
          >
            <Pencil size={20} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-52">
        {/* Tarjeta de datos generales */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          {/* Meta información */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {template.date && (
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <Calendar size={14} className="text-gray-500" />
                <span>
                  {format(parseISO(template.date), "EEEE d 'de' MMMM yyyy", { locale: es })}
                </span>
              </div>
            )}
            {template.estimated_duration_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <Clock size={14} className="text-gray-500" />
                <span>{template.estimated_duration_minutes} min</span>
              </div>
            )}
          </div>

          {/* Objetivo */}
          {template.objective && (
            <div className="flex items-start gap-2">
              <Target size={14} className="text-gray-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-300">{template.objective}</p>
            </div>
          )}

          {/* Observaciones */}
          {template.general_notes && (
            <div className="border-t border-gray-800 pt-3">
              <p className="text-xs text-gray-500 mb-1">Observaciones</p>
              <p className="text-sm text-gray-400">{template.general_notes}</p>
            </div>
          )}
        </div>

        {/* Secciones */}
        {template.sections.length === 0 ? (
          <div className="text-center py-10 text-gray-600 text-sm">
            Esta plantilla no tiene secciones.
          </div>
        ) : (
          <div className="space-y-4">
            {template.sections.map((section) => (
              <div
                key={section.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Header de la sección con color */}
                <div
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-800"
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: section.section_type_color ?? '#6b7280',
                    borderLeftStyle: 'solid',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">
                        {section.visible_title || section.section_type_name || 'Sección'}
                      </span>
                      {section.work_format_name && (
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {section.work_format_name}
                        </span>
                      )}
                    </div>
                    {/* Info rondas y time cap */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {section.total_rounds && (
                        <span className="text-xs text-gray-500">
                          {section.total_rounds} rondas
                        </span>
                      )}
                      {section.time_cap_seconds && (
                        <span className="text-xs text-gray-500">
                          Time cap: {formatSeconds(section.time_cap_seconds)}
                        </span>
                      )}
                      {section.rest_between_rounds_seconds && (
                        <span className="text-xs text-gray-500">
                          Desc: {formatSeconds(section.rest_between_rounds_seconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción de la sección */}
                {section.general_description && (
                  <div className="px-4 py-2 bg-gray-800/50">
                    <p className="text-xs text-gray-400">{section.general_description}</p>
                  </div>
                )}

                {/* Lista de ejercicios */}
                {section.exercises.length > 0 ? (
                  <div className="divide-y divide-gray-800">
                    {section.exercises.map((exercise, idx) => {
                      const params = buildExerciseParams(exercise);
                      return (
                        <div key={exercise.id} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            {/* Número de orden */}
                            <span className="text-xs text-gray-600 mt-1 w-4 shrink-0 text-right">
                              {idx + 1}.
                            </span>
                            {/* Imagen del ejercicio limpia */}
                            <ExerciseImage
                              imageUrl={exercise.exercise_image_url}
                              imagePath={exercise.exercise_image_path}
                              name={exercise.exercise_name ?? ''}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setInfoExerciseId(exercise.exercise_id);
                                    setInfoExerciseName(exercise.exercise_name ?? '');
                                  }}
                                  className="text-sm font-medium text-white truncate text-left hover:text-primary-400 transition-colors"
                                >
                                  {exercise.exercise_name}
                                </button>
                                <button
                                  onClick={() => {
                                    setInfoExerciseId(exercise.exercise_id);
                                    setInfoExerciseName(exercise.exercise_name ?? '');
                                  }}
                                  className="p-1 rounded-full text-gray-600 hover:text-gray-300 transition-colors shrink-0"
                                  aria-label="Ver información del ejercicio"
                                >
                                  <Info size={13} />
                                </button>
                                {exercise.exercise_video_url && (
                                  <button
                                    onClick={() => {
                                      if (exercise.exercise_video_url) {
                                        setSelectedVideoUrl(exercise.exercise_video_url);
                                        setExerciseNameForVideo(exercise.exercise_name ?? '');
                                      }
                                    }}
                                    className="p-1 rounded-full bg-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors shrink-0"
                                    aria-label="Ver video"
                                  >
                                    <Play size={10} fill="currentColor" />
                                  </button>
                                )}
                              </div>
                              {params && (
                                <p className="text-xs text-primary-400 mt-0.5">{params}</p>
                              )}
                              {exercise.suggested_scaling && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Escalado: {exercise.suggested_scaling}
                                </p>
                              )}
                              {exercise.coach_notes && (
                                <p className="text-xs text-gray-500 mt-0.5 italic">
                                  {exercise.coach_notes}
                                </p>
                              )}
                              {exercise.notes && (
                                <p className="text-xs text-gray-600 mt-0.5">{exercise.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-600">Sin ejercicios</div>
                )}

                {/* Notas de la sección */}
                {section.notes && (
                  <div className="px-4 py-2 border-t border-gray-800 bg-gray-800/30">
                    <p className="text-xs text-gray-500 italic">{section.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra de acciones fija al pie — encima del BottomNav (bottom-16 = 64px) */}
      <div className="fixed bottom-16 left-0 right-0 bg-gray-950 border-t border-gray-800 px-4 py-3 z-40">
        {/* Botón iniciar sesión */}
        <button
          onClick={() => navigate(`/sesiones/nueva?templateId=${template.id}`)}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-2 min-h-[44px] transition-colors"
        >
          <Play size={16} />
          Iniciar sesión
        </button>

        <div className="flex gap-2">
          {/* Favorita */}
          <button
            onClick={handleToggleFavorite}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 min-h-[44px] border transition-colors ${
              template.is_favorite === 1
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <Star
              size={15}
              className={template.is_favorite === 1 ? 'fill-yellow-400' : ''}
            />
            {template.is_favorite === 1 ? 'Favorita' : 'Favorita'}
          </button>

          {/* Duplicar */}
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 min-h-[44px] bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors disabled:opacity-50"
          >
            <Copy size={15} />
            Duplicar
          </button>

          {/* Eliminar */}
          <button
            onClick={handleOpenDeleteConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 min-h-[44px] bg-gray-900 border border-gray-800 text-red-500 hover:text-red-400 hover:border-red-900 transition-colors"
          >
            <Trash2 size={15} />
            Eliminar
          </button>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !deleting && setShowDeleteConfirm(false)}
        title="Eliminar clase"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-sm font-medium min-h-[44px] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || (sessionCounts?.active ?? 0) > 0}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 py-1">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">{template.name}</p>
              <p className="text-gray-400 text-sm mt-0.5">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Info de sesiones vinculadas */}
          {sessionCounts === null ? (
            <div className="h-10 bg-gray-800/50 rounded-lg animate-pulse" />
          ) : sessionCounts.active > 0 ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-1">
              <p className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                <AlertTriangle size={13} />
                No se puede eliminar — hay sesiones activas
              </p>
              <p className="text-gray-400 text-xs">
                Tenés {sessionCounts.active} sesión{sessionCounts.active !== 1 ? 'es' : ''} planificada{sessionCounts.active !== 1 ? 's' : ''} o en curso vinculada{sessionCounts.active !== 1 ? 's' : ''} a esta clase.
                Finalizalas o cancelalas antes de eliminar.
              </p>
            </div>
          ) : sessionCounts.total > 0 ? (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-1">
              <p className="text-gray-300 text-xs font-semibold">
                {sessionCounts.total} sesión{sessionCounts.total !== 1 ? 'es' : ''} registrada{sessionCounts.total !== 1 ? 's' : ''} con esta clase
              </p>
              <p className="text-gray-500 text-xs">
                El historial de esas sesiones se conserva. Solo se elimina la plantilla.
              </p>
            </div>
          ) : (
            <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Esta clase no tiene sesiones registradas.</p>
            </div>
          )}
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
            Podes cerrar este video para volver a la clase.
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
