import { useEffect, useState } from 'react';
import { Layers, ChevronLeft, Dumbbell, ExternalLink } from 'lucide-react';
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

export function ExerciseMusclesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ExerciseMuscleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    db.query(
      `SELECT e.id, e.name, e.image_url,
       (SELECT GROUP_CONCAT(mg.name, '|') FROM exercise_muscle_group emg JOIN muscle_group mg ON emg.muscle_group_id = mg.id WHERE emg.exercise_id = e.id AND emg.is_primary = 1) as primary_muscles,
       (SELECT GROUP_CONCAT(mg.name, '|') FROM exercise_muscle_group emg JOIN muscle_group mg ON emg.muscle_group_id = mg.id WHERE emg.exercise_id = e.id AND emg.is_primary = 0) as secondary_muscles
       FROM exercise e
       WHERE e.id IN (SELECT exercise_id FROM exercise_muscle_group)
       ORDER BY e.name ASC`
    ).then(res => {
      setRows((res.values ?? []) as ExerciseMuscleRow[]);
    }).finally(() => setLoading(false));
  }, []);

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

      <div className="p-4">
        {/* Resumen */}
        <div className="flex items-center justify-between mb-6 bg-gray-900/50 border border-gray-800 p-4 rounded-2xl">
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
             <span className="text-2xl font-black text-white">{rows.length}</span>
             <span className="text-[10px] text-gray-500 block uppercase tracking-widest">Ejercicios</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Escaneando anatomía...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
            <Dumbbell size={40} className="text-gray-800 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No hay ejercicios con mapas configurados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rows.map(row => (
              <div 
                key={row.id}
                onClick={() => navigate(`/ejercicios/${row.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col hover:border-primary-500/50 transition-all group active:scale-[0.98]"
              >
                {/* Mapa Anatómico (MuscleMap) */}
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

                {/* Info */}
                <div className="p-4 flex flex-col gap-3 border-t border-gray-800/50">
                  <h3 className="text-white text-sm font-bold truncate">{row.name}</h3>
                  
                  <div className="space-y-2">
                    {/* Primarios */}
                    {row.primary_muscles && (
                       <div className="flex flex-wrap gap-1">
                          {row.primary_muscles.split('|').map(m => (
                            <Badge key={m} label={m} color="#ef4444" size="sm" />
                          ))}
                       </div>
                    )}
                    
                    {/* Secundarios */}
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
      </div>
    </>
  );
}

