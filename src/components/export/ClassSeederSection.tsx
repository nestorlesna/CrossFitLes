// Botones para importar clases GOAT predefinidas. Idempotente por clase.
import { useState } from 'react';
import { CalendarDays, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  importClassGoat16052026,
  isClassGoat16052026ImportDone,
} from '../../services/class16052026ImportService';

interface ClassEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<{ exercisesCreated: number; exercisesReused: number; classCreated: boolean }>;
}

const CLASS_ENTRIES: ClassEntry[] = [
  {
    label: 'Clase GOAT 16/05/2026',
    description: 'Movilidad hombro/cadera + Activación KB (Bulgarian/Wall Squat/Plank) + WOD 3 rondas Run/Burpee/Carry/Box',
    isDone: isClassGoat16052026ImportDone,
    run: importClassGoat16052026,
  },
];

export function ClassSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const handleImport = async (entry: ClassEntry) => {
    setLoading(entry.label);
    try {
      const res = await entry.run();
      if (res.classCreated) {
        toast.success(
          `${entry.label}: ${res.exercisesCreated} ejercicios nuevos, ${res.exercisesReused} reutilizados`
        );
      } else {
        toast.info(`${entry.label} ya estaba importada`);
      }
      setTick((t) => t + 1);
    } catch (error) {
      toast.error(
        `Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Clases GOAT
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        {CLASS_ENTRIES.map((entry) => {
          const done = entry.isDone();
          const isLoading = loading === entry.label;
          return (
            <button
              key={entry.label}
              onClick={() => !done && handleImport(entry)}
              disabled={done || isLoading}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  done
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/50'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="text-violet-400 animate-spin" />
                ) : done ? (
                  <CheckCircle size={18} className="text-emerald-400" />
                ) : (
                  <CalendarDays size={18} className="text-violet-400" />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-bold block ${done ? 'text-gray-500' : 'text-white'}`}>
                  {entry.label}
                </span>
                <span className="text-[11px] text-gray-500">{entry.description}</span>
              </div>
              {done && (
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                  Listo
                </span>
              )}
              {isLoading && (
                <span className="text-[10px] text-violet-500 font-bold uppercase tracking-widest">
                  Importando…
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
