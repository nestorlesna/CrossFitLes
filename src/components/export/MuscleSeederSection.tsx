// Sección para asignar grupos musculares a ejercicios en lotes
// Cada entrada cubre los ejercicios de una clase o conjunto específico.
// Mismo patrón que ClassSeederSection — se ejecuta una sola vez por entrada.

import { useState } from 'react';
import { Dumbbell, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  updateMusclesClase01042026,
  isMusclesClase01042026UpdateDone,
} from '../../services/musclesClase01042026UpdateService';
import {
  updateMusclesClase30032026,
  isMusclesClase30032026UpdateDone,
} from '../../services/musclesClase30032026UpdateService';
import {
  updateMusclesBatch001,
  isMusclesBatch001UpdateDone,
} from '../../services/musclesBatch001UpdateService';
import {
  updateMusclesBatch002,
  isMusclesBatch002UpdateDone,
} from '../../services/musclesBatch002UpdateService';

interface MuscleEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skippedNoExercise: number; skippedNoMuscle: number }>;
}

const MUSCLE_ENTRIES: MuscleEntry[] = [
  {
    label: 'Clase GOAT 01/04/2026 — músculos',
    description: 'Band Pull-Apart · Snatch Grip DL · Snatch High Pull · Dumbbell DL · Push Press…',
    isDone: isMusclesClase01042026UpdateDone,
    run: updateMusclesClase01042026,
  },
  {
    label: 'Clase GOAT 30/03/2026 — músculos',
    description: 'Cossack Squat · Back Squat · Overhead Squat · Burpee Over The Bar · Shuttle Run…',
    isDone: isMusclesClase30032026UpdateDone,
    run: updateMusclesClase30032026,
  },
  {
    label: 'Batch 001 — Lateral Raise to Overhead',
    description: 'Deltoides (primario) · Trapecio (secundario)',
    isDone: isMusclesBatch001UpdateDone,
    run: updateMusclesBatch001,
  },
  {
    label: 'Batch 002 — Clase 28/03 + Barbell Thruster',
    description: 'Thruster · Bent-Over Lateral · Burpee · Front Raise · Farmer\'s Carry · Hollow Roll…',
    isDone: isMusclesBatch002UpdateDone,
    run: updateMusclesBatch002,
  },
];

export function MuscleSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const handleUpdate = async (entry: MuscleEntry) => {
    setLoading(entry.label);
    try {
      const result = await entry.run();
      if (result.updated > 0) {
        let msg = `${result.updated} ejercicio${result.updated !== 1 ? 's' : ''} actualizado${result.updated !== 1 ? 's' : ''}`;
        if (result.skippedNoExercise > 0) msg += ` · ${result.skippedNoExercise} no encontrados en BD`;
        if (result.skippedNoMuscle > 0) msg += ` · ${result.skippedNoMuscle} sin catálogo de músculo`;
        toast.success(msg);
      } else if (result.skippedNoExercise > 0) {
        toast.error(`${result.skippedNoExercise} ejercicios no encontrados en la BD. ¿Importaste la clase primero?`);
      } else if (result.skippedNoMuscle > 0) {
        toast.error(`Catálogo de músculos vacío o con nombres distintos (${result.skippedNoMuscle} sin coincidencia)`);
      } else {
        toast.info('No se procesaron ejercicios');
      }
      setTick(t => t + 1);
    } catch (error) {
      toast.error(
        `Error al actualizar: ${error instanceof Error ? error.message : 'Error desconocido'}`
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
