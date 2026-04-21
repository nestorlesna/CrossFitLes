import { useEffect, useState } from 'react';
import { Layers, ChevronLeft, Dumbbell, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { getDatabase } from '../../db/database';
import { Badge } from '../../components/ui/Badge';
import { MuscleMap } from '../../components/exercises/MuscleMap';

interface ExerciseMuscleRow {
  id: string;
  name: string;
  image_url: string;
  primary_muscles: string;
  secondary_muscles: string;
}

interface ExerciseWithoutMuscles {
  id: string;
  name: string;
  image_url: string;
  in_classes: number; // 1 si aparece en alguna clase, 0 si no
}

export function ExerciseMusclesPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'con' | 'sin'>('con');
  const [withRows, setWithRows] = useState<ExerciseMuscleRow[]>([]);
  const [withoutRows, setWithoutRows] = useState<ExerciseWithoutMuscles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    setLoading(true);
    Promise.all([
      db.query(
        `SELECT e.id, e.name, e.image_url,
         (SELECT GROUP_CONCAT(mg.name, '|') FROM exercise_muscle_group emg JOIN muscle_group mg ON emg.muscle_group_id = mg.id WHERE emg.exercise_id = e.id AND emg.is_primary = 1) as primary_muscles,
         (SELECT GROUP_CONCAT(mg.name, '|') FROM exercise_muscle_group emg JOIN muscle_group mg ON emg.muscle_group_id = mg.id WHERE emg.exercise_id = e.id AND emg.is_primary = 0) as secondary_muscles
         FROM exercise e
         WHERE e.is_active = 1 AND e.id IN (SELECT exercise_id FROM exercise_muscle_group)
         ORDER BY e.name ASC`
      ),
      db.query(
        `SELECT e.id, e.name, e.image_url,
         CASE WHEN EXISTS (SELECT 1 FROM section_exercise se WHERE se.exercise_id = e.id) THEN 1 ELSE 0 END as in_classes
         FROM exercise e
         WHERE e.is_active = 1 AND e.id NOT IN (SELECT exercise_id FROM exercise_muscle_group)
         ORDER BY in_classes DESC, e.name ASC`
      ),
    ]).then(([withRes, withoutRes]) => {
      setWithRows((withRes.values ?? []) as ExerciseMuscleRow[]);
      setWithoutRows((withoutRes.values ?? []) as ExerciseWithoutMuscles[]);
    }).finally(() => setLoading(false));
  }, []);

  const inClasses = withoutRows.filter(r => r.in_classes === 1);
  const notInClasses = withoutRows.filter(r => r.in_classes === 0);

  return (
    <>
      <Header
        title="Mapa Anatómico"
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="p-4 space-y-4">

        {/* Toggle con / sin */}
        <div className="flex bg-gray-900 border border-gray-800 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setMode('con')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === 'con'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Con grupos musculares
            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${mode === 'con' ? 'bg-white/20' : 'bg-gray-800'}`}>
              {withRows.length}
            </span>
          </button>
          <button
            onClick={() => setMode('sin')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === 'sin'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sin grupos musculares
            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${mode === 'sin' ? 'bg-white/20' : 'bg-gray-800'}`}>
              {withoutRows.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Escaneando anatomía...</p>
          </div>

        ) : mode === 'con' ? (
          <>
            {/* Resumen con */}
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center border border-primary-500/20">
                  <Layers size={20} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Cobertura Anatómica</p>
                  <p className="text-[11px] text-gray-500">Músculos asignados por ejercicio</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">{withRows.length}</span>
                <span className="text-[10px] text-gray-500 block uppercase tracking-widest">Ejercicios</span>
              </div>
            </div>

            {withRows.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
                <Dumbbell size={40} className="text-gray-800 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No hay ejercicios con músculos configurados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {withRows.map(row => (
                  <div
                    key={row.id}
                    onClick={() => navigate(`/ejercicios/${row.id}`)}
                    className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col hover:border-primary-500/50 transition-all group active:scale-[0.98]"
                  >
                    <div className="bg-black/40 flex items-center justify-center p-4 relative overflow-hidden h-48">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gray-950/80 p-1 rounded-md">
                        <ExternalLink size={12} className="text-primary-500" />
                      </div>
                      <div className="scale-75 origin-center transform transition-transform group-hover:scale-95 duration-500">
                        <MuscleMap
                          primaryMuscles={row.primary_muscles ? row.primary_muscles.split('|') : []}
                          secondaryMuscles={row.secondary_muscles ? row.secondary_muscles.split('|') : []}
                          size={300}
                          className="pointer-events-none"
                        />
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3 border-t border-gray-800/50">
                      <h3 className="text-white text-sm font-bold truncate">{row.name}</h3>
                      <div className="space-y-2">
                        {row.primary_muscles && (
                          <div className="flex flex-wrap gap-1">
                            {row.primary_muscles.split('|').map(m => (
                              <Badge key={m} label={m} color="#ef4444" size="sm" />
                            ))}
                          </div>
                        )}
                        {row.secondary_muscles && (
                          <div className="flex flex-wrap gap-1">
                            {row.secondary_muscles.split('|').map(m => (
                              <Badge key={m} label={m} color="#f59e0b" size="sm" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>

        ) : (
          <>
            {/* Resumen sin */}
            <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <AlertTriangle size={20} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Sin músculos asignados</p>
                  <p className="text-[11px] text-gray-500">
                    {inClasses.length} en clases · {notInClasses.length} sin uso
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">{withoutRows.length}</span>
                <span className="text-[10px] text-gray-500 block uppercase tracking-widest">Ejercicios</span>
              </div>
            </div>

            {withoutRows.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
                <Layers size={40} className="text-gray-800 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Todos los ejercicios tienen músculos asignados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* En clases */}
                {inClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest px-1 mb-2">
                      En clases ({inClasses.length})
                    </p>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
                      {inClasses.map(row => (
                        <button
                          key={row.id}
                          onClick={() => navigate(`/ejercicios/${row.id}/editar`)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left group"
                        >
                          {row.image_url ? (
                            <img src={row.image_url} alt={row.name} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-black/40" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                              <Dumbbell size={16} className="text-gray-600" />
                            </div>
                          )}
                          <span className="flex-1 text-sm text-white font-medium truncate">{row.name}</span>
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest shrink-0">
                            Asignar
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sin uso en clases */}
                {notInClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">
                      Sin uso en clases ({notInClasses.length})
                    </p>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
                      {notInClasses.map(row => (
                        <button
                          key={row.id}
                          onClick={() => navigate(`/ejercicios/${row.id}/editar`)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left group"
                        >
                          {row.image_url ? (
                            <img src={row.image_url} alt={row.name} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-black/40" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                              <Dumbbell size={16} className="text-gray-600" />
                            </div>
                          )}
                          <span className="flex-1 text-sm text-gray-400 truncate">{row.name}</span>
                          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest shrink-0">
                            Asignar
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

