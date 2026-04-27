// Botones para importar clases GOAT predefinidas. Idempotente por clase.
import { useState } from 'react';
import { CalendarDays, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  importClassGoat22042026,
  isClassGoat22042026ImportDone,
} from '../../services/class22042026ImportService';
import {
  importClassGoat25042026,
  isClassGoat25042026ImportDone,
} from '../../services/class25042026ImportService';

interface ClassEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<void>;
}

const CLASS_ENTRIES: ClassEntry[] = [
  {
    label: 'Clase GOAT 25/04/2026',
    description: 'Movilidad hombro/core + Overhead Squat E2MOM + WOD Intervalos A/B',
    isDone: isClassGoat25042026ImportDone,
    run: importClassGoat25042026,
  },
  {
    label: 'Clase GOAT 22/04/2026',
    description: 'Movilidad hombro/cadera + Snatch escalado + Chipper parejas',
    isDone: isClassGoat22042026ImportDone,
    run: importClassGoat22042026,
  },
];

export function ClassSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const handleImport = async (entry: ClassEntry) => {
    setLoading(entry.label);
    try {
      await entry.run();
      toast.success(`${entry.label} importada correctamente`);
      setTick(t => t + 1);
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                done
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/50'
              }`}>
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
