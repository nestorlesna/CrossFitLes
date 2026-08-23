// Lista de planes de entrenamiento con su avance
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  CalendarRange,
  Copy,
  Trash2,
  Play,
  CheckCircle2,
  Archive,
  ListOrdered,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { PlansTabs } from '../../components/plans/PlansTabs';
import { TrainingPlan, PlanStatus } from '../../models/TrainingPlan';
import * as planRepo from '../../db/repositories/trainingPlanRepo';
import { onActivateKey } from '../../utils/a11y';

// Etiqueta y color de cada estado
const STATUS_META: Record<PlanStatus, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-primary-600/20 text-primary-400 border-primary-700' },
  draft: { label: 'Borrador', className: 'bg-gray-800 text-gray-400 border-gray-700' },
  completed: { label: 'Completado', className: 'bg-green-900/30 text-green-400 border-green-800' },
  archived: { label: 'Archivado', className: 'bg-gray-800 text-gray-500 border-gray-700' },
};

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), "d 'de' MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

export function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [planToDelete, setPlanToDelete] = useState<TrainingPlan | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await planRepo.getAll());
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar los planes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Activa un plan (archiva el que estuviera activo)
  const handleActivate = async (e: React.MouseEvent, plan: TrainingPlan) => {
    e.stopPropagation();
    try {
      await planRepo.setStatus(plan.id, 'active');
      toast.success(`"${plan.name}" es tu plan activo`);
      await loadPlans();
    } catch {
      toast.error('Error al activar el plan');
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, plan: TrainingPlan) => {
    e.stopPropagation();
    try {
      const newId = await planRepo.duplicatePlan(plan.id, new Date().toISOString().split('T')[0]);
      toast.success('Plan duplicado como borrador');
      navigate(`/planes/${newId}`);
    } catch {
      toast.error('Error al duplicar el plan');
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await planRepo.softDelete(planToDelete.id);
      toast.success('Plan eliminado');
      setPlanToDelete(null);
      await loadPlans();
    } catch {
      toast.error('Error al eliminar el plan');
    }
  };

  return (
    <>
      <Header
        title="Planes"
        rightAction={
          <button
            onClick={() => navigate('/planes/nuevo')}
            className="text-primary-500 hover:text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Nuevo plan"
          >
            <Plus size={24} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-24">
        <PlansTabs active="plans" />

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
                <div className="h-2 bg-gray-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarRange size={48} className="text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-400">Todavía no tenés planes</p>
            <p className="text-sm text-gray-600 mt-1 mb-6 max-w-xs">
              Armá un plan con las clases de cada día y seguí tu avance en el calendario.
            </p>
            <button
              onClick={() => navigate('/planes/nuevo')}
              className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-medium transition-colors min-h-[44px]"
            >
              Crear mi primer plan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const total = plan.training_days ?? 0;
              const done = plan.completed_days ?? 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const meta = STATUS_META[plan.status] ?? STATUS_META.draft;

              return (
                <div
                  key={plan.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/planes/${plan.id}`)}
                  onKeyDown={onActivateKey(() => navigate(`/planes/${plan.id}`))}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold truncate">{plan.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        <span className="flex items-center gap-1">
                          {plan.schedule_mode === 'sequence' ? (
                            <>
                              <ListOrdered size={11} /> Secuencial
                            </>
                          ) : (
                            <>
                              <CalendarDays size={11} /> {formatShortDate(plan.start_date)}
                            </>
                          )}
                        </span>
                        {plan.goal && <span className="truncate">{plan.goal}</span>}
                      </div>
                    </div>

                    <div className="flex shrink-0">
                      {plan.status !== 'active' && plan.status !== 'completed' && (
                        <button
                          onClick={(e) => handleActivate(e, plan)}
                          className="p-2 text-gray-500 hover:text-primary-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Activar plan"
                          title="Activar plan"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDuplicate(e, plan)}
                        className="p-2 text-gray-500 hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Duplicar plan"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToDelete(plan);
                        }}
                        className="p-2 text-gray-600 hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Eliminar plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Barra de avance */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                      {done}/{total}
                    </span>
                    {plan.status === 'completed' ? (
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    ) : plan.status === 'archived' ? (
                      <Archive size={14} className="text-gray-600 shrink-0" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmación de borrado */}
      <Modal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        title="Eliminar plan"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setPlanToDelete(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-sm font-medium min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium min-h-[44px] transition-colors"
            >
              Eliminar
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3 py-1">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-medium">{planToDelete?.name}</p>
            <p className="text-gray-400 text-sm mt-0.5">
              Se elimina el plan y sus días. Las sesiones ya realizadas se conservan.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
