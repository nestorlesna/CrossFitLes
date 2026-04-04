import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, CheckCircle2, AlertTriangle, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { getInactiveClasses, isClassInSession, hardDeleteClass } from '../../db/repositories/classTemplateRepo';
import { formatDate } from '../../utils/formatters';

interface InactiveClass {
  id: string;
  name: string;
  objective?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  section_count?: number;
  exercise_count?: number;
}

export function InactiveClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<InactiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await getInactiveClasses();
    setClasses(data);
    setLoading(false);
  }

  async function handleDeleteRequest(classId: string) {
    if (deletingId) return;
    setPendingDelete(classId);

    // Verificar si está asociada a alguna sesión de entrenamiento
    const inSession = await isClassInSession(classId);
    if (inSession) {
      toast.error('Esta clase está asociada a una sesión de entrenamiento y no se puede eliminar');
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
      await hardDeleteClass(pendingDelete);
      toast.success('Clase eliminada permanentemente');
      await loadData();
    } catch {
      toast.error('Error al eliminar la clase');
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  const pendingClass = classes.find(c => c.id === pendingDelete);

  return (
    <>
      <Header
        title="Clases inactivas"
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
            <p className="text-gray-500 text-sm">Cargando clases inactivas...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-medium">No hay clases inactivas</p>
            <p className="text-gray-600 text-xs mt-1">Todas las clases están activas</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="flex items-center justify-between bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                  <Archive size={20} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{classes.length} clases inactivas</p>
                  <p className="text-[11px] text-gray-500">Puedes eliminar las que no necesites</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-yellow-400">{classes.length}</span>
                <span className="text-[10px] text-gray-500 block uppercase tracking-widest">Clases</span>
              </div>
            </div>

            {/* Lista de clases */}
            <div className="space-y-3">
              {classes.map((cls) => {
                const isDeleting = deletingId === cls.id;

                return (
                  <div
                    key={cls.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Archive size={14} className="text-yellow-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate font-medium">{cls.name}</p>
                        <p className="text-gray-600 text-xs">
                          {cls.section_count} sección{cls.section_count !== 1 ? 'es' : ''} · {cls.exercise_count} ejercicio{cls.exercise_count !== 1 ? 's' : ''} · {formatDate(cls.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDeleteRequest(cls.id)}
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
                      </div>
                    </div>
                  </div>
                );
              })}
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
                ¿Eliminar "{pendingClass?.name}"?
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Esta acción eliminará la clase, sus secciones y ejercicios de sección de forma permanente. No se puede deshacer.
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
