// Pantalla de inicio - dashboard principal con estadísticas resumidas
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  LayoutTemplate, 
  Calendar, 
  BarChart2, 
  Zap, 
  Trophy, 
  Clock,
  ChevronRight,
  TrendingUp,
  Play,
  CalendarRange,
  Moon,
  CheckCircle2
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { ResolvedImage } from '../../components/ui/ResolvedImage';
import { getHomeStats } from '../../db/repositories/statsRepo';
import { getActiveSession } from '../../db/repositories/trainingSessionRepo';
import * as planRepo from '../../db/repositories/trainingPlanRepo';
import { TrainingPlan, PlanDay } from '../../models/TrainingPlan';
import { toast } from 'sonner';
import { PersonalRecord } from '../../models/Stats';
import { TrainingSession } from '../../models/TrainingSession';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { onActivateKey } from '../../utils/a11y';

const quickActions = [
  { label: 'Nueva sesión',    icon: Calendar,       path: '/sesiones/nueva' },
  { label: 'Ejercicios',      icon: Dumbbell,       path: '/ejercicios'     },
  { label: 'Clases',          icon: LayoutTemplate, path: '/clases'         },
  { label: 'Planes',          icon: CalendarRange,  path: '/planes'         },
  { label: 'Estadísticas',    icon: BarChart2,      path: '/estadisticas'   },
];

export function HomePage() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [planToday, setPlanToday] = useState<{ plan: TrainingPlan; day: PlanDay } | null>(null);
  const [stats, setStats] = useState({
    sessionsThisMonth: 0,
    totalMinutesThisMonth: 0,
    recentPRs: [] as PersonalRecord[],
    streakDays: 0
  });

  const loadData = useCallback(async () => {
    try {
      const [statsData, currentSession, todayPlanDay] = await Promise.all([
        getHomeStats(),
        getActiveSession(),
        planRepo.getTodayDay()
      ]);
      setStats(statsData);
      setActiveSession(currentSession);
      setPlanToday(todayPlanDay);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Etiquetas del día del plan: hoy o la fecha del próximo entrenamiento
  const todayStr = new Date().toISOString().split('T')[0];
  const isPlanDayToday =
    !planToday?.day.scheduled_date || planToday.day.scheduled_date === todayStr;
  const planDayDateLabel = planToday?.day.scheduled_date
    ? format(parseISO(planToday.day.scheduled_date), "EEE d 'de' MMM", { locale: es })
    : '';

  // Arranca el día del plan reutilizando el ejecutor de clases
  const startPlanDay = async () => {
    if (!planToday) return;
    try {
      const { sessionId, hasVideo } = await planRepo.startDay(planToday.day.id);
      navigate(hasVideo ? `/sesiones/${sessionId}/video` : `/sesiones/${sessionId}/cronometro`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el día');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMM', { locale: es });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Header title="CrossFitLes Tracker" />

      <div className="p-4 space-y-6 pb-24">
        
        {/* ── SESIÓN ACTIVA (RESUMEN) ── */}
        {activeSession && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/sesiones/${activeSession.id}/ejecutar`)}
            onKeyDown={onActivateKey(() => navigate(`/sesiones/${activeSession.id}/ejecutar`))}
            className="bg-primary-600 rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-primary-900/30 cursor-pointer active:scale-[0.98] transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center">
                <Play size={24} className="text-white fill-white animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-primary-100 font-bold uppercase tracking-widest">Sesión en curso</span>
                <h3 className="text-white font-bold text-lg leading-tight uppercase truncate max-w-[150px]">
                  {activeSession.template_name || 'Sesión Libre'}
                </h3>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/80 text-[10px] font-bold uppercase mb-1">Retomar</span>
              <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                <ChevronRight size={20} className="text-white" />
              </div>
            </div>
          </div>
        )}

        {/* ── DÍA DE HOY DEL PLAN ── */}
        {!activeSession && planToday && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarRange size={14} className="text-primary-400" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {planToday.plan.name}
              </span>
              <button
                onClick={() => navigate(`/planes/${planToday.plan.id}`)}
                className="ml-auto text-[10px] text-primary-400 font-bold uppercase"
              >
                Ver plan
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase font-bold">
                  {planToday.day.day_type === 'rest'
                    ? 'Toca descansar'
                    : isPlanDayToday
                    ? 'Tu entrenamiento de hoy'
                    : `Próximo: ${planDayDateLabel}`}
                </span>
                <h3 className="text-white font-bold text-lg leading-tight truncate">
                  {planToday.day.title || planToday.day.template_name || 'Sin asignar'}
                </h3>
              </div>

              {planToday.day.day_type === 'rest' ? (
                <Moon size={24} className="text-gray-500 shrink-0" />
              ) : planToday.day.status === 'completed' ? (
                <CheckCircle2 size={24} className="text-green-500 shrink-0" />
              ) : planToday.day.class_template_id ? (
                <button
                  onClick={startPlanDay}
                  className="shrink-0 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 min-h-[44px]"
                >
                  <Play size={16} className="fill-white" />
                  Empezar
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/planes/${planToday.plan.id}/dias/${planToday.day.id}`)}
                  className="shrink-0 bg-gray-800 border border-gray-700 text-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px]"
                >
                  Asignar
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SECCIÓN DE BIENVENIDA / RESUMEN RÁPIDO ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-gray-800 shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-4">Tu progreso este mes</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center mb-2">
                  <Calendar size={18} className="text-primary-400" />
                </div>
                <span className="text-xl font-mono font-bold text-white">{stats.sessionsThisMonth}</span>
                <span className="text-[10px] text-gray-500 uppercase font-black">Sesiones</span>
              </div>
              
              <div className="flex flex-col items-center border-x border-gray-800">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                  <Clock size={18} className="text-blue-400" />
                </div>
                <span className="text-xl font-mono font-bold text-white">{stats.totalMinutesThisMonth}</span>
                <span className="text-[10px] text-gray-500 uppercase font-black">Minutos</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center mb-2">
                  <Zap size={18} className="text-amber-400" />
                </div>
                <span className="text-xl font-mono font-bold text-white">{stats.streakDays}</span>
                <span className="text-[10px] text-gray-500 uppercase font-black">Racha</span>
              </div>
            </div>
          </div>
          
          {/* Decoración de fondo */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* ── RÉCORDS RECIENTES ── */}
        {stats.recentPRs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" />
                Récords recientes
              </h3>
              <button 
                onClick={() => navigate('/estadisticas')}
                className="text-xs text-primary-500 font-medium flex items-center"
              >
                Ver todos <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {stats.recentPRs.map((pr) => (
                <div
                  key={pr.id}
                  className="min-w-[200px] bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col gap-2 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {pr.exercise_image_url && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-primary-500/10">
                        <ResolvedImage path={pr.exercise_image_url} alt={pr.exercise_name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{pr.exercise_name}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-mono font-bold text-white leading-none">
                      {pr.record_value}
                      <span className="text-[10px] text-primary-500 ml-1">{pr.record_unit_abbreviation}</span>
                    </span>
                    <TrendingUp size={16} className="text-primary-500 mb-0.5" />
                  </div>
                  <span className="text-[9px] text-gray-600 mt-1">{formatDate(pr.achieved_date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACCESOS RÁPIDOS ── */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
            Accesos directos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col items-center gap-3 hover:bg-gray-800/60 hover:border-gray-700 transition active:scale-95 shadow-sm"
              >
                <div className="w-12 h-12 bg-gray-950 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-primary-500 transition-colors">
                  <Icon size={24} className="text-primary-400" />
                </div>
                <span className="text-sm text-white font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

