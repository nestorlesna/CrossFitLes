// Pantalla de detalle de un ejercicio con historial de uso
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Edit2, Trash2, Dumbbell, Star, CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ExerciseWithRelations } from '../../models/Exercise';
import { getById, softDelete, getHistory } from '../../db/repositories/exerciseRepo';
import { getImageDisplayUrl } from '../../services/mediaService';
import { formatDate } from '../../utils/formatters';

// Tipo mínimo para una entrada del historial
interface HistoryEntry {
  session_date: string;
  actual_reps?: number;
  actual_weight?: number;
  actual_time?: number;
  actual_distance?: number;
  weight_unit?: string;
  distance_unit?: string;
}

export function ExerciseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [exercise, setExercise] = useState<ExerciseWithRelations | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cargar datos del ejercicio e historial
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getById(id);
      if (!data) {
        toast.error('Ejercicio no encontrado');
        navigate('/ejercicios');
        return;
      }
      setExercise(data);

      // Cargar imagen si existe
      if (data.image_path) {
        const url = await getImageDisplayUrl(data.image_path);
        setImageUrl(url);
      }

      // Cargar historial (últimas 10 entradas)
      const hist = (await getHistory(id)) as HistoryEntry[];
      setHistory(hist.slice(0, 10));
    } catch (e) {
      toast.error('Error al cargar el ejercicio');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Confirmar y ejecutar eliminación lógica
  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await softDelete(id);
      toast.success('Ejercicio eliminado');
      navigate('/ejercicios');
    } catch (e) {
      toast.error('Error al eliminar el ejercicio');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  // Formatear el resumen de una entrada del historial
  function formatHistoryEntry(entry: HistoryEntry): string {
    const parts: string[] = [];
    if (entry.actual_reps) parts.push(`${entry.actual_reps} reps`);
    if (entry.actual_weight) {
      parts.push(`${entry.actual_weight} ${entry.weight_unit ?? 'kg'}`);
    }
    if (entry.actual_time) parts.push(`${entry.actual_time}s`);
    if (entry.actual_distance) {
      parts.push(`${entry.actual_distance} ${entry.distance_unit ?? 'm'}`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'Sin datos registrados';
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Header
          title="Ejercicio"
          leftAction={
            <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft size={24} />
            </button>
          }
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </>
    );
  }

  if (!exercise) return null;

  const { relations } = exercise;

  return (
    <>
      <Header
        title={exercise.name}
        leftAction={
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Volver"
          >
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button
            onClick={() => navigate(`/ejercicios/${id}/editar`)}
            className="text-primary-500 hover:text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Editar"
          >
            <Edit2 size={20} />
          </button>
        }
      />

      <div className="flex flex-col gap-0 pb-10">
        {/* Imagen grande */}
        {imageUrl ? (
          <div className="w-full h-52 bg-gray-900">
            <img src={imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-36 bg-gray-900 flex items-center justify-center border-b border-gray-800">
            <Dumbbell size={48} className="text-gray-700" />
          </div>
        )}

        <div className="flex flex-col gap-5 p-4">
          {/* ── Información general ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
            <h2 className="text-white font-semibold text-base">Información</h2>

            {/* Dificultad */}
            {exercise.difficulty_name && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Dificultad</span>
                <Badge label={exercise.difficulty_name} color={exercise.difficulty_color} size="sm" />
              </div>
            )}

            {/* Compuesto / Aislado */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Tipo</span>
              <Badge
                label={exercise.is_compound ? 'Compuesto' : 'Aislado'}
                size="sm"
              />
            </div>

            {/* Músculo principal */}
            {exercise.primary_muscle_name && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Músculo principal</span>
                <span className="text-white text-sm">{exercise.primary_muscle_name}</span>
              </div>
            )}
          </div>

          {/* ── Grupos musculares ── */}
          {relations.muscleGroups.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-white font-semibold text-base mb-3">Músculos trabajados</h2>
              <div className="flex flex-wrap gap-2">
                {relations.muscleGroups.map((mg) => (
                  <div key={mg.id} className="flex items-center gap-1.5">
                    <Badge
                      label={mg.name}
                      color={mg.is_primary ? '#f97316' : undefined}
                      size="sm"
                    />
                    {mg.is_primary ? (
                      <Star size={10} className="text-primary-500" fill="currentColor" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Equipamiento ── */}
          {relations.equipment.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-white font-semibold text-base mb-3">Equipamiento</h2>
              <div className="flex flex-wrap gap-2">
                {relations.equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center gap-1.5">
                    {eq.is_required ? (
                      <CheckCircle size={14} className="text-primary-500 shrink-0" />
                    ) : (
                      <Circle size={14} className="text-gray-500 shrink-0" />
                    )}
                    <span className="text-sm text-white">{eq.name}</span>
                    <span className="text-xs text-gray-500">
                      {eq.is_required ? '(requerido)' : '(opcional)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tipos de sección ── */}
          {relations.sectionTypes.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-white font-semibold text-base mb-3">Tipos de sección</h2>
              <div className="flex flex-wrap gap-2">
                {relations.sectionTypes.map((st) => (
                  <Badge key={st.id} label={st.name} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* ── Unidades de medida ── */}
          {relations.units.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-white font-semibold text-base mb-3">Unidades de medida</h2>
              <div className="flex flex-wrap gap-2">
                {relations.units.map((unit) => (
                  <div key={unit.id} className="flex items-center gap-1">
                    {unit.is_default ? (
                      <Star size={12} className="text-primary-500" fill="currentColor" />
                    ) : null}
                    <Badge
                      label={`${unit.name} (${unit.abbreviation})`}
                      color={unit.is_default ? '#f97316' : undefined}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tags ── */}
          {relations.tags.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-white font-semibold text-base mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {relations.tags.map((tag) => (
                  <Badge key={tag.id} label={tag.name} color={tag.color} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* ── Descripción ── */}
          {exercise.description && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-white font-semibold text-base mb-2">Descripción</h2>
              <p className="text-gray-300 text-sm leading-relaxed">{exercise.description}</p>
            </div>
          )}

          {/* ── Notas técnicas ── */}
          {exercise.technical_notes && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-white font-semibold text-base mb-2">Notas técnicas</h2>
              <p className="text-gray-300 text-sm leading-relaxed">{exercise.technical_notes}</p>
            </div>
          )}

          {/* ── Historial de uso ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-white font-semibold text-base mb-3">Historial reciente</h2>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Sin historial de uso</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-800">
                {history.map((entry, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{formatDate(entry.session_date)}</span>
                    <span className="text-white text-sm">{formatHistoryEntry(entry)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Botón eliminar ── */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600/20 rounded-xl py-3.5 font-medium text-sm min-h-[52px] transition-colors"
          >
            <Trash2 size={18} />
            Eliminar ejercicio
          </button>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar ejercicio"
        footer={
          <div className="flex gap-3">
            <button
              className="flex-1 border border-gray-700 text-gray-400 rounded-lg px-4 py-2.5 text-sm min-h-[44px]"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancelar
            </button>
            <button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium min-h-[44px] disabled:opacity-50"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        }
      >
        <p className="text-gray-300 text-sm">
          ¿Estás seguro de que querés eliminar <span className="text-white font-medium">{exercise.name}</span>?
          El ejercicio no aparecerá más en la biblioteca, pero el historial de sesiones se conservará.
        </p>
      </Modal>
    </>
  );
}
