// Sección "Clases predefinidas" en Configuración.
// Carga clases generadas con BKP/CREO_CLASE.md (ejercicios + secciones + tiempos).
// Cada entrada se ejecuta una sola vez (flag en localStorage) y es idempotente:
// si la clase ya existe por nombre, no vuelve a insertarla.
import { useState } from 'react';
import { CalendarPlus, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  importClass13072026,
  isClass13072026ImportDone,
} from '../../services/class13072026ImportService';

interface ClassEntry {
  label: string;
  date: string;
  isDone: () => boolean;
  run: () => Promise<{ exercises: number; created: boolean }>;
}

// Más reciente primero
const CLASS_ENTRIES: ClassEntry[] = [
  {
    label: 'Clase GOAT 13/07/2026',
    date: 'Calentamiento · Movilidad · Activación · Complex de cargadas · AMRAP 10\' · Estiramiento',
    isDone: isClass13072026ImportDone,
    run: importClass13072026,
  },
];

export function ClassSeederSection() {
  const [doneFlags, setDoneFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CLASS_ENTRIES.map((e) => [e.label, e.isDone()]))
  );
  const [runningLabel, setRunningLabel] = useState<string | null>(null);

  if (CLASS_ENTRIES.length === 0) return null;

  const handleRun = async (entry: ClassEntry) => {
    setRunningLabel(entry.label);
    try {
      const { exercises, created } = await entry.run();
      setDoneFlags((prev) => ({ ...prev, [entry.label]: true }));
      if (created) {
        toast.success(
          exercises > 0
            ? `${entry.label} cargada · ${exercises} ejercicios nuevos`
            : `${entry.label} cargada`
        );
      } else {
        toast.info(`${entry.label} ya estaba cargada`);
      }
    } catch (error) {
      toast.error(
        `Error al cargar la clase: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setRunningLabel(null);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarPlus size={16} className="text-primary-400" />
        <h3 className="text-sm font-bold text-white">Clases predefinidas</h3>
      </div>

      <div className="space-y-2">
        {CLASS_ENTRIES.map((entry) => {
          const done = doneFlags[entry.label];
          const busy = runningLabel === entry.label;

          return (
            <button
              key={entry.label}
              onClick={() => handleRun(entry)}
              disabled={done || busy}
              className="w-full flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-xl px-3 py-3 text-left disabled:opacity-60 hover:border-gray-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                {busy ? (
                  <Loader2 size={16} className="text-primary-400 animate-spin" />
                ) : done ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <CalendarPlus size={16} className="text-violet-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white block truncate">{entry.label}</span>
                <span className="text-[11px] text-gray-600 block truncate">{entry.date}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
