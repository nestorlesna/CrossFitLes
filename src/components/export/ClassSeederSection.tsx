// Sección para cargar clases de muestra predefinidas (datos del profesor)
// Cada clase se importa una sola vez, controlado por flag en localStorage.

import { useState } from 'react';
import { CalendarPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  importClass30032026,
  isClass30032026ImportDone,
} from '../../services/class30032026ImportService';
import { saveDatabase } from '../../db/database';

interface ClassEntry {
  label: string;
  date: string;
  isDone: () => boolean;
  run: () => Promise<{ exercises: number; created: boolean }>;
}

const CLASS_ENTRIES: ClassEntry[] = [
  {
    label: 'Clase 30/03/2026',
    date: 'Movilidad · Activación · Back Squat E2MOM · WOD For Time',
    isDone: isClass30032026ImportDone,
    run: importClass30032026,
  },
];

export function ClassSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  // Forzar re-render tras importar para reflejar estado "ya importada"
  const [, setTick] = useState(0);

  const handleImport = async (entry: ClassEntry) => {
    setLoading(entry.label);
    try {
      const result = await entry.run();
      await saveDatabase();
      if (result.created) {
        toast.success(
          `Clase cargada correctamente (${result.exercises} ejercicio${result.exercises !== 1 ? 's' : ''} nuevo${result.exercises !== 1 ? 's' : ''})`
        );
      } else {
        toast.info('La clase ya estaba cargada');
      }
      setTick((t) => t + 1);
    } catch (error) {
      toast.error(
        `Error al cargar la clase: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Clases predefinidas
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
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/50'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="text-violet-400 animate-spin" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <CalendarPlus size={18} className="text-violet-400" />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`text-sm font-bold block ${done ? 'text-gray-500' : 'text-white'}`}
                >
                  {entry.label}
                </span>
                <span className="text-[11px] text-gray-500">{entry.date}</span>
              </div>
              {done && (
                <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                  Cargada
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
