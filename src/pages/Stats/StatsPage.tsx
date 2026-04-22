import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Award, 
  Activity, 
  Search, 
  Calendar,
  AlertCircle,
  Dumbbell,
  Clock,
  RotateCw,
  Ruler,
  Flame,
  Weight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { ResolvedImage } from '../../components/ui/ResolvedImage';
import {
  getPersonalRecords,
  getWeeklyActivity,
  getSectionDistribution,
  getExerciseProgression,
  getCaloriesHistory,
  getExercisesWithProgression,
} from '../../db/repositories/statsRepo';
import {
  PersonalRecord,
  ExerciseProgressionPoint,
  WeeklyActivity,
  SectionDistribution,
  CaloriesDataPoint,
} from '../../models/Stats';
import { RecordType } from '../../types';

type TabType = 'summary' | 'records' | 'progression';

export function StatsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [loading, setLoading] = useState(true);

  // Datos de Estadísticas
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [activity, setActivity] = useState<WeeklyActivity[]>([]);
  const [distribution, setDistribution] = useState<SectionDistribution[]>([]);
  
  // Datos de Calorías
  const [calories, setCalories] = useState<CaloriesDataPoint[]>([]);

  // Datos para Progresión
  const [progressionExercises, setProgressionExercises] = useState<{ id: string; name: string }[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('max_weight');
  const [progressionData, setProgressionData] = useState<ExerciseProgressionPoint[]>([]);
  const [loadingProgression, setLoadingProgression] = useState(false);

  // 1. Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [prsRes, activityRes, distRes, calRes] = await Promise.all([
        getPersonalRecords(),
        getWeeklyActivity(12), // Últimos 3 meses
        getSectionDistribution(),
        getCaloriesHistory(12),
      ]);
      setPrs(prsRes);
      setActivity(activityRes);
      setDistribution(distRes);
      setCalories(calRes);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar datos estadísticos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Cargar ejercicios con datos suficientes al entrar al tab o cambiar tipo
  useEffect(() => {
    if (activeTab !== 'progression') return;

    const loadExercises = async () => {
      const exs = await getExercisesWithProgression(selectedRecordType);
      setProgressionExercises(exs);
      setSelectedExerciseId(prev => exs.find(e => e.id === prev) ? prev : (exs[0]?.id ?? ''));
    };
    loadExercises();
  }, [activeTab, selectedRecordType]);

  // 3. Cargar progresión cuando cambia el ejercicio o tipo
  useEffect(() => {
    if (!selectedExerciseId || activeTab !== 'progression') return;

    const loadProgression = async () => {
      setLoadingProgression(true);
      try {
        const data = await getExerciseProgression(selectedExerciseId, selectedRecordType);
        setProgressionData(data);
      } catch (error) {
        toast.error('Error al cargar historial del ejercicio');
      } finally {
        setLoadingProgression(false);
      }
    };
    loadProgression();
  }, [selectedExerciseId, selectedRecordType, activeTab]);

  // 4. Colores para el PieChart
  const COLORS = ['#primary-500', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#3b82f6'];
  const chartColors = ['#C1FF00', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6'];

  // 4. Formateador de fechas para gráficos
  const formatDate = (dateStr: unknown) => {
    try {
      return format(parseISO(String(dateStr)), 'd MMM', { locale: es });
    } catch {
      return String(dateStr);
    }
  };

  const recordTypeLabels: Record<RecordType, string> = {
    max_weight: 'Peso Máximo',
    max_reps: 'Repeticiones Máximas',
    min_time: 'Mejor Tiempo',
    max_distance: 'Distancia Máxima',
    max_calories: 'Calorías Máximas'
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'max_weight': return <Weight size={16} />;
      case 'max_reps': return <RotateCw size={16} />;
      case 'min_time': return <Clock size={16} />;
      case 'max_distance': return <Ruler size={16} />;
      case 'max_calories': return <Flame size={16} />;
      default: return <Award size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
        <p className="mt-4 text-gray-500 animate-pulse">Analizando tu progreso...</p>
      </div>
    );
  }

  return (
    <>
      <Header title="Estadísticas" />
      
      {/* ── Tabs Superiores ── */}
      <div className="sticky top-14 z-20 bg-black border-b border-gray-800 px-4 flex gap-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'summary', label: 'Resumen', icon: Activity },
          { id: 'records', label: 'Récords', icon: Award },
          { id: 'progression', label: 'Progresión', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 py-4 border-b-2 transition-all min-w-fit ${
              activeTab === tab.id 
                ? 'border-primary-500 text-primary-500 font-bold' 
                : 'border-transparent text-gray-500'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 pb-32 space-y-6">
        
        {/* ── CONTENIDO POR PESTAÑA ── */}

        {/* 1. RESUMEN */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Actividad Semanal */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Calendar size={18} className="text-primary-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Actividad Semanal</h3>
              </div>
              
              {activity.length === 0 ? (
                <EmptyStat message="Completa sesiones para ver tu historial semanal" />
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis 
                        dataKey="week" 
                        tickFormatter={formatDate} 
                        stroke="#737373" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis stroke="#737373" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '12px' }}
                        itemStyle={{ color: '#C1FF00', fontSize: '12px' }}
                        labelStyle={{ color: '#fff', fontSize: '10px', marginBottom: '4px' }}
                        labelFormatter={formatDate}
                      />
                      <Bar dataKey="count" fill="#C1FF00" radius={[4, 4, 0, 0]} barSize={20} name="Sesiones" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Calorías estimadas por sesión */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Flame size={18} className="text-orange-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Calorías Estimadas</h3>
                <span className="ml-auto text-[10px] text-gray-600 font-medium">últimas 12 semanas</span>
              </div>

              {calories.length === 0 ? (
                <EmptyStat message="Completa sesiones para ver tu gasto calórico estimado" />
              ) : (
                <>
                  {/* Totales rápidos */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
                      <p className="text-base font-black text-orange-400">
                        {calories.reduce((s, c) => s + c.calories, 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-600">kcal</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Promedio</p>
                      <p className="text-base font-black text-orange-400">
                        {Math.round(calories.reduce((s, c) => s + c.calories, 0) / calories.length).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-600">kcal/sesión</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Máximo</p>
                      <p className="text-base font-black text-orange-400">
                        {Math.max(...calories.map(c => c.calories)).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-600">kcal</p>
                    </div>
                  </div>

                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={calories} barSize={calories.length > 20 ? 6 : 12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          stroke="#737373"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          interval={Math.floor(calories.length / 6)}
                        />
                        <YAxis stroke="#737373" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '12px' }}
                          itemStyle={{ color: '#fb923c', fontSize: '12px' }}
                          labelStyle={{ color: '#fff', fontSize: '10px', marginBottom: '4px' }}
                          labelFormatter={formatDate}
                          formatter={(value: any, _name: any, props: any) => [
                            `${value} kcal${props.payload?.duration ? ` · ${props.payload.duration} min` : ''}`,
                            'Estimado'
                          ]}
                        />
                        <Bar dataKey="calories" fill="#fb923c" radius={[3, 3, 0, 0]} name="kcal estimadas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-[10px] text-gray-600 text-center mt-3 italic">
                    Valores estimados · MET × peso × duración × factor RPE
                  </p>
                </>
              )}
            </div>

            {/* Distribución por Tipo */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Dumbbell size={18} className="text-primary-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Enfoque Mensual</h3>
              </div>
              
              {distribution.length === 0 ? (
                <EmptyStat message="Registra ejercicios para ver tu enfoque de entrenamiento" />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                        >
                          {distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '12px' }}
                           itemStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                    {distribution.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || chartColors[idx % chartColors.length] }}></div>
                        <span className="text-[11px] text-gray-400 font-medium truncate">{item.name}</span>
                        <span className="text-[11px] text-gray-600 font-bold ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. RÉCORDS (PRs) */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Award size={14} className="text-primary-500" />
                Tus mejores marcas
              </h3>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{prs.length} logrados</span>
            </div>

            {prs.length === 0 ? (
              <EmptyStat message="Aún no tienes récords personales registrados" />
            ) : (
              <div className="flex flex-col gap-3">
                {prs.map((record) => (
                  <div key={record.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500 overflow-hidden">
                        <ResolvedImage
                          path={record.exercise_image_url}
                          alt={record.exercise_name}
                          className="w-full h-full object-contain"
                          fallback={getRecordIcon(record.record_type)}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">{record.exercise_name}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                          {recordTypeLabels[record.record_type]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono font-bold text-white leading-none">
                        {record.record_value}
                        <span className="text-[10px] text-primary-500 ml-1 uppercase">{record.record_unit_abbreviation}</span>
                      </p>
                      <p className="text-[10px] text-gray-600 font-medium mt-1">
                        {formatDate(record.achieved_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. PROGRESIÓN POR EJERCICIO */}
        {activeTab === 'progression' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex flex-col gap-4">
                {/* Selector de Ejercicio */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Ejercicio</label>
                  <div className="relative">
                    <Dumbbell size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <select
                      value={selectedExerciseId}
                      onChange={(e) => setSelectedExerciseId(e.target.value)}
                      disabled={progressionExercises.length === 0}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 appearance-none disabled:opacity-50"
                    >
                      {progressionExercises.length === 0 ? (
                        <option value="">Sin datos suficientes</option>
                      ) : (
                        progressionExercises.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Selector de Métrica */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Métrica analizada</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(recordTypeLabels) as RecordType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedRecordType(type)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                          selectedRecordType === type 
                          ? 'bg-primary-600 border-primary-500 text-white' 
                          : 'bg-gray-800 border-gray-700 text-gray-500'
                        }`}
                      >
                        {recordTypeLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gráfico de Progresión */}
              <div className="pt-4 border-t border-gray-800 min-h-[300px] flex items-center justify-center">
                {loadingProgression ? (
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-6 w-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Cargando historial...</span>
                  </div>
                ) : progressionData.length < 2 ? (
                  <EmptyStat message="Se necesitan al menos 2 registros para ver una tendencia" />
                ) : (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate} 
                          stroke="#737373" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis stroke="#737373" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '12px' }}
                          itemStyle={{ color: '#C1FF00', fontSize: '12px' }}
                          labelStyle={{ color: '#fff', fontSize: '10px', marginBottom: '4px' }}
                          labelFormatter={formatDate}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#C1FF00" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#C1FF00', strokeWidth: 0 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          name="Valor"
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tabla resumida de últimos registros */}
            {!loadingProgression && progressionData.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-gray-800/50 flex items-center justify-between border-b border-gray-800">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Historial Reciente</h4>
                   <TrendingUp size={12} className="text-primary-500" />
                </div>
                <div className="divide-y divide-gray-800">
                  {[...progressionData].reverse().slice(0, 5).map((point, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{formatDate(point.date)}</span>
                        <span className="text-[10px] text-gray-500 font-medium px-2 py-0.5 bg-gray-800 rounded-full w-fit mt-1 uppercase tracking-tighter">
                          {point.rx_or_scaled}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-bold text-primary-500">{point.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyStat({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
        <AlertCircle size={20} className="text-gray-600" />
      </div>
      <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed italic">{message}</p>
    </div>
  );
}

