// Sección "Clases predefinidas" en Configuración
// Permite cargar clases GOAT predefinidas (ejercicios + secciones) a la BD.
// Cada entrada se ejecuta una sola vez (controlado por flag en localStorage).
import { useState } from 'react';
import { CalendarPlus, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  importClass01062026,
  isClass01062026ImportDone,
} from '../../services/class01062026ImportService';
import {
  importClass08062026,
  isClass08062026ImportDone,
} from '../../services/class08062026ImportService';
import {
  importClass13062026,
  isClass13062026ImportDone,
} from '../../services/class13062026ImportService';

interface ClassEntry {
  label: string;
  date: string;
  isDone: () => boolean;
  run: () => Promise<{ exercises: number; created: boolean }>;
}

// Más reciente primero
const CLASS_ENTRIES: ClassEntry[] = [
  {
    label: 'Clase GOAT 13/06/2026',
    date: 'Calentamiento · Movilidad · Activación (Tabata) · WOD Bloque A · WOD Bloque B',
    isDone: isClass13062026ImportDone,
    run: importClass13062026,
  },
  {
    label: 'Clase GOAT 08/06/2026',
    date: 'Calentamiento · Movilidad · Activación · Fuerza · WOD',
    isDone: isClass08062026ImportDone,
    run: importClass08062026,
  },
  {
    label: 'Clase GOAT 01/06/2026',
    date: 'Calentamiento · Movilidad · Activación · Fuerza · WOD',
    isDone: isClass01062026ImportDone,
    run: importClass01062026,
  },
];

export function ClassSeederSection() {
  // Estado local para refrescar el "hecho" tras ejecutar
  const [doneFlags, setDoneFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CLASS_ENTRIES.map((e) => [e.label, e.isDone()]))
  );
  const [runningLabel, setRunningLabel] = useState<string | null>(null);

  const handleRun = async (entry: ClassEntry) => {
    setRunningLabel(entry.label);
    try {
      const result = await entry.run();
      if (result.created) {
        toast.success(
          `${entry.label} importada (${result.exercises} ejercicios nuevos)`
        );
      } else {
        toast.info(`${entry.label} ya estaba cargada`);
      }
      setDoneFlags((prev) => ({ ...prev, [entry.label]: true }));
      // Refrescar para que la clase aparezca en /clases
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error(
        `Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setRunningLabel(null);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Clases predefinidas
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        {CLASS_ENTRIES.map((entry) => {
          const done = doneFlags[entry.label];
          const running = runningLabel === entry.label;
          return (
            <button
              key={entry.label}
              onClick={() => handleRun(entry)}
              disabled={done || running}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  done
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/50'
                }`}
              >
                {running ? (
                  <Loader2 size={18} className="text-purple-400 animate-spin" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <CalendarPlus size={18} className="text-purple-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white font-bold block">{entry.label}</span>
                <span className="text-[11px] text-gray-500">{entry.date}</span>
              </div>
              {done && (
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider shrink-0">
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
