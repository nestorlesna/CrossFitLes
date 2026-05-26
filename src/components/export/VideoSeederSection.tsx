// Botones para asignar videos a ejercicios. Idempotente por entrada.
// Se oculta automáticamente si no hay entradas configuradas.
import { useState } from 'react';
import { Video, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  updateVideosClase25052026,
  isVideosClase25052026UpdateDone,
} from '../../services/videosClase25052026UpdateService';

interface VideoEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skippedNoExercise: number; skippedNoVideo: number }>;
}

const VIDEO_ENTRIES: VideoEntry[] = [
  {
    label: 'Clase GOAT 25/05/2026 — videos',
    description: 'Squat Press-Out · Box Jump · Front Squat · Power Clean · T2B · Burpee Over the Bar · 11 estiramientos',
    isDone: isVideosClase25052026UpdateDone,
    run: updateVideosClase25052026,
  },
];

export function VideoSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);

  if (VIDEO_ENTRIES.length === 0) return null;

  const handleRun = async (entry: VideoEntry) => {
    setLoading(entry.label);
    try {
      const res = await entry.run();
      if (res.updated > 0) {
        toast.success(`${res.updated} video${res.updated !== 1 ? 's' : ''} asignado${res.updated !== 1 ? 's' : ''}`);
      } else {
        toast.info('No se actualizó ningún ejercicio');
      }
      if (res.skippedNoExercise > 0) {
        toast.error(`${res.skippedNoExercise} ejercicio${res.skippedNoExercise !== 1 ? 's' : ''} no encontrado${res.skippedNoExercise !== 1 ? 's' : ''} en la BD`);
      }
      setTick((t) => t + 1);
    } catch (error) {
      toast.error(
        `Error al asignar videos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Asignar videos
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        {VIDEO_ENTRIES.map((entry) => {
          const done = entry.isDone();
          const isLoading = loading === entry.label;
          return (
            <button
              key={entry.label}
              onClick={() => !done && handleRun(entry)}
              disabled={done || isLoading}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  done
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/50'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="text-blue-400 animate-spin" />
                ) : done ? (
                  <CheckCircle size={18} className="text-emerald-400" />
                ) : (
                  <Video size={18} className="text-blue-400" />
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
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                  Asignando…
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
