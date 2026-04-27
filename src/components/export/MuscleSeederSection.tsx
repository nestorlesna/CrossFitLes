// Sección para asignar grupos musculares a ejercicios desde servicios de actualización
import { useState } from 'react';
import { Dumbbell, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  isMusclesClase22042026UpdateDone,
  updateMusclesClase22042026,
} from '../../services/musclesClase22042026UpdateService';
import {
  isMusclesClase25042026UpdateDone,
  updateMusclesClase25042026,
} from '../../services/musclesClase25042026UpdateService';

interface MuscleEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skipped: number }>;
}

const MUSCLE_ENTRIES: MuscleEntry[] = [
  {
    label: 'Clase GOAT 25/04/2026 — músculos',
    description: 'Wall Lat Stretch · Wall Shoulder CAR · Goblet Squat · Overhead Squat · Dual DB Snatch…',
    isDone: isMusclesClase25042026UpdateDone,
    run: updateMusclesClase25042026,
  },
  {
    label: 'Clase GOAT 22/04/2026 — músculos',
    description: 'Band Pull-Apart · Plank Hold · Barbell Power Snatch · Box Jump-Over · estiramientos…',
    isDone: isMusclesClase22042026UpdateDone,
    run: updateMusclesClase22042026,
  },
];

export function MuscleSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);

  if (MUSCLE_ENTRIES.length === 0) return null;

  const handleUpdate = async (entry: MuscleEntry) => {
    setLoading(entry.label);
    try {
      const result = await entry.run();
      if (result.updated > 0) {
        let msg = `${result.updated} ejercicio${result.updated !== 1 ? 's' : ''} actualizado${result.updated !== 1 ? 's' : ''}`;
        if (result.skipped > 0) msg += ` · ${result.skipped} ya tenían músculos o no se encontraron`;
        toast.success(msg);
      } else if (result.skipped > 0) {
        toast.info('Todos los ejercicios ya tenían músculos asignados');
      } else {
        toast.info('No se actualizó ningún ejercicio');
      }
      setTick(t => t + 1);
    } catch (error) {
      toast.error(
        `Error al asignar músculos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Actualizar músculos
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        {MUSCLE_ENTRIES.map((entry) => {
          const done = entry.isDone();
          const isLoading = loading === entry.label;
          return (
            <button
              key={entry.label}
              onClick={() => !done && handleUpdate(entry)}
              disabled={done || isLoading}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  done
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/50'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="text-violet-400 animate-spin" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <Dumbbell size={18} className="text-violet-400" />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-bold block ${done ? 'text-gray-500' : 'text-white'}`}>
                  {entry.label}
                </span>
                <span className="text-[11px] text-gray-500">{entry.description}</span>
              </div>
              {done && (
                <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                  Listo
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
