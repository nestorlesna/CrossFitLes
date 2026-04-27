// Listado de sesiones en Configuración → edición de datos cargados por error
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Timer,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { getAll } from '../../db/repositories/trainingSessionRepo';
import { TrainingSession } from '../../models/TrainingSession';
import { formatDate } from '../../utils/formatters';

const FEELING_EMOJI: Record<string, string> = {
  terrible: '😫',
  bad: '😕',
  normal: '😐',
  good: '😊',
  excellent: '🔥',
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'Completada',
  cancelled: 'Cancelada',
  planned: 'Planificada',
  in_progress: 'En progreso',
};

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-400',
  cancelled: 'text-red-400',
  planned: 'text-blue-400',
  in_progress: 'text-amber-400',
};

export function SessionsListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAll();
      setSessions(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <Header
        title="Sesiones"
        leftAction={
          <button
            onClick={() => navigate('/configuracion')}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="p-4 pb-24 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Timer size={40} className="text-gray-700" />
            <p className="text-gray-500 text-sm">No hay sesiones registradas</p>
          </div>
        )}

        {!loading && sessions.map(session => (
          <button
            key={session.id}
            onClick={() => navigate(`/configuracion/sesiones/${session.id}/editar`)}
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3 hover:bg-gray-800/60 active:scale-[0.98] transition-all text-left"
          >
            {/* Ícono de estado */}
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
              {session.status === 'completed'
                ? <CheckCircle2 size={20} className="text-emerald-400" />
                : session.status === 'cancelled'
                ? <XCircle size={20} className="text-red-400" />
                : <Activity size={20} className="text-amber-400" />
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar size={11} className="text-gray-600 shrink-0" />
                <span className="text-[11px] text-gray-500 font-medium">{formatDate(session.session_date)}</span>
                <span className={`text-[10px] font-bold ml-1 ${STATUS_COLOR[session.status] ?? 'text-gray-500'}`}>
                  · {STATUS_LABEL[session.status] ?? session.status}
                </span>
              </div>
              <p className="text-sm font-bold text-white truncate">
                {session.template_name || 'Sesión Libre'}
              </p>
              <div className="flex items-center gap-3 mt-1">
                {session.actual_duration_minutes != null && (
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-gray-600" />
                    <span className="text-xs text-gray-400">{session.actual_duration_minutes}m</span>
                  </div>
                )}
                {session.general_feeling && (
                  <span className="text-sm leading-none">{FEELING_EMOJI[session.general_feeling] ?? ''}</span>
                )}
                {session.perceived_effort != null && (
                  <span className="text-xs text-gray-500">RPE {session.perceived_effort}/10</span>
                )}
              </div>
            </div>

            <ChevronRight size={16} className="text-gray-600 shrink-0" />
          </button>
        ))}
      </div>
    </>
  );
}
