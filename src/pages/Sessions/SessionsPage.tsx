import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  PlayCircle, 
  CalendarDays, 
  XCircle,
  TrendingUp,
  History,
  Activity
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { TrainingSession } from '../../models/TrainingSession';
import { getAll } from '../../db/repositories/trainingSessionRepo';
import { formatDate } from '../../utils/formatters';
import { SessionStatus } from '../../types';

export function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');

  // Cargar sesiones
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAll({ 
        status: statusFilter === 'all' ? undefined : statusFilter as SessionStatus 
      });
      setSessions(data);
    } catch (e) {
      console.error('Error al cargar sesiones:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Filtrar localmente por nombre de plantilla si hay búsqueda
  const filteredSessions = sessions.filter(s => 
    !search || 
    (s.template_name?.toLowerCase().includes(search.toLowerCase())) ||
    (s.session_date.includes(search))
  );

  // Estadísticas rápidas
  const completedThisMonth = sessions.filter(s => 
    s.status === 'completed' && 
    new Date(s.session_date).getMonth() === new Date().getMonth()
  ).length;

  const totalDuration = sessions
    .filter(s => s.status === 'completed' && s.actual_duration_minutes)
    .reduce((acc, s) => acc + (s.actual_duration_minutes || 0), 0);

  // Icono según estado
  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={18} className="text-green-500" />;
      case 'in_progress': return <PlayCircle size={18} className="text-amber-500" />;
      case 'planned': return <CalendarDays size={18} className="text-blue-500" />;
      case 'cancelled': return <XCircle size={18} className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status: SessionStatus) => {
    switch (status) {
      case 'completed': return 'Terminada';
      case 'in_progress': return 'En curso';
      case 'planned': return 'Planificada';
      case 'cancelled': return 'Cancelada';
    }
  };

  return (
    <>
      <Header
        title="Sesiones"
        rightAction={
          <button 
            onClick={() => navigate('/sesiones/nueva')}
            className="text-primary-500 hover:text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Nueva sesión"
          >
            <Plus size={26} />
          </button>
        }
      />

      <div className="flex flex-col gap-5 p-4 pb-24">
        {/* ── Estadísticas rápidas ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary-500 mb-1">
              <TrendingUp size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Este mes</span>
            </div>
            <span className="text-2xl font-bold text-white">{completedThisMonth}</span>
            <span className="text-xs text-gray-500">Sesiones completadas</span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Clock size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tiempo total</span>
            </div>
            <span className="text-2xl font-bold text-white">{totalDuration}m</span>
            <span className="text-xs text-gray-500">Invertidos en salud</span>
          </div>
        </div>

        {/* ── Buscador y Filtros ── */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por fecha o plantilla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'planned', 'in_progress', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-900 text-gray-400 border border-gray-800'
                }`}
              >
                {s === 'all' ? 'Todas' : getStatusLabel(s as SessionStatus)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Listado de Sesiones ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-center px-10">
            <History size={48} className="mb-4 opacity-20" />
            <p className="text-base font-medium">No hay sesiones</p>
            <p className="text-sm mt-1">
              {search || statusFilter !== 'all' 
                ? 'No se encontraron resultados para los filtros aplicados.' 
                : 'Empezá a entrenar hoy para ver tu progreso aquí.'}
            </p>
            {!search && statusFilter === 'all' && (
              <button 
                onClick={() => navigate('/sesiones/nueva')}
                className="mt-6 bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
              >
                Nueva Sesión
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(
                  session.status === 'completed' 
                    ? `/sesiones/${session.id}` 
                    : `/sesiones/${session.id}/ejecutar`
                )}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-gray-700 shadow-sm"
              >
                {/* Indicador de estado */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  session.status === 'completed' ? 'bg-green-500/10' :
                  session.status === 'in_progress' ? 'bg-amber-500/10 animate-pulse' :
                  'bg-blue-500/10'
                }`}>
                  {getStatusIcon(session.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      {formatDate(session.session_date)}
                    </span>
                    {session.status === 'in_progress' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-base truncate">
                    {session.template_name || 'Sesión libre'}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                      <Badge 
                        label={getStatusLabel(session.status)} 
                        size="sm"
                        color={session.status === 'completed' ? '#10b981' : undefined}
                      />
                    </div>
                    {session.actual_duration_minutes && (
                      <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                        <Clock size={10} />
                        <span>{session.actual_duration_minutes}m</span>
                      </div>
                    )}
                    {session.perceived_effort && (
                      <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                        <Activity size={10} />
                        <span>RPE {session.perceived_effort}</span>
                      </div>
                    )}
                  </div>
                </div>

                <ChevronRight className="text-gray-700 shrink-0" size={20} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
