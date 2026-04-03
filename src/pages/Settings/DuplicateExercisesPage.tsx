import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { getDuplicateExercises, isExerciseInClass, hardDelete } from '../../db/repositories/exerciseRepo';
import { formatDate } from '../../utils/formatters';

interface ExerciseDup {
  id: string;
  name: string;
  is_active: number;
  created_at: string;
}

interface DupGroup {
  normalized_name: string;
  count: number;
  exercises: ExerciseDup[];
}

export function DuplicateExercisesPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<DupGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDupes, setTotalDupes] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await getDuplicateExercises();
    setGroups(data);
    setTotalDupes(data.reduce((sum, g) => sum + g.count, 0));
    setLoading(false);
  }

  async function handleDeleteRequest(exerciseId: string) {
    if (deletingId) return;
    setPendingDelete(exerciseId);

    // Verificar si está en alguna clase
    const inClass = await isExerciseInClass(exerciseId);
    if (inClass) {
      toast.error('Este ejercicio está siendo usado en una clase y no se puede eliminar');
      setPendingDelete(null);
      return;
    }

    setShowConfirm(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete);
    setShowConfirm(false);

    try {
      await hardDelete(pendingDelete);
      toast.success('Ejercicio eliminado permanentemente');
      await loadData();
    } catch {
      toast.error('Error al eliminar el ejercicio');
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  const pendingExercise = groups
    .flatMap(g => g.exercises)
    .find(e => e.id === pendingDelete);

  return (
    <>
      <Header
        title="Ejercicios duplicados"
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="p-4 space-y-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Buscando duplicados...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-medium">No hay ejercicios duplicados</p>
            <p className="text-gray-600 text-xs mt-1">Todos los nombres son únicos</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="flex items-center justify-between bg-red-500/5 border border-red-500/20 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                  <Copy size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{groups.length} grupos duplicados</p>
                  <p className="text-[11px] text-gray-500">{totalDupes} ejercicios en total</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-red-400">{totalDupes}</span>
                <span className="text-[10px] text-gray-500 block uppercase tracking-widest">Ejercicios</span>
              </div>
            </div>

            {/* Grupos */}
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.normalized_name} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  {/* Header del grupo */}
                  <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-semibold capitalize">{group.normalized_name}</p>
                        <p className="text-gray-500 text-xs">{group.count} variantes encontradas</p>
                      </div>
                      <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg">
                        <Copy size={12} className="text-red-400" />
                        <span className="text-red-400 text-xs font-bold">{group.count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de ejercicios duplicados */}
                  <div className="divide-y divide-gray-800">
                    {group.exercises.map((ex) => {
                      const isDeleting = deletingId === ex.id;
                      const canDelete = ex.is_active === 0;

                      return (
                        <div
                          key={ex.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          {ex.is_active === 1 ? (
                            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                          ) : (
                            <XCircle size={14} className="text-gray-600 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{ex.name}</p>
                            <p className="text-gray-600 text-xs">{formatDate(ex.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${ex.is_active === 1 ? 'text-green-500' : 'text-gray-600'}`}>
                              {ex.is_active === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteRequest(ex.id)}
                                disabled={isDeleting}
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center disabled:opacity-50"
                                aria-label="Eliminar permanentemente"
                              >
                                {isDeleting ? (
                                  <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmación */}
      <Modal
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setPendingDelete(null); }}
        title="Eliminar permanentemente"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-white text-sm font-medium mb-1">
                ¿Eliminar "{pendingExercise?.name}"?
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Esta acción eliminará el ejercicio y todos sus datos de forma permanente. No se puede deshacer.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => { setShowConfirm(false); setPendingDelete(null); }}
              className="flex-1 bg-gray-800 text-white font-medium py-3 rounded-xl text-sm hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 bg-red-600 text-white font-medium py-3 rounded-xl text-sm hover:bg-red-700 transition-colors"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
