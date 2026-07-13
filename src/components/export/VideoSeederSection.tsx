// Sección "Asignar videos" en Configuración
// Asigna video_path (corto, popup de sesión) y video_long_path (tutorial) a los
// ejercicios de un lote. Cada entrada se ejecuta una vez (flag en localStorage).
import { useState } from 'react';
import { Video, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  updateVideosPlanIsometrico,
  isVideosPlanIsometricoUpdateDone,
} from '../../services/videosPlanIsometricoUpdateService';

interface VideoEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skippedNoExercise: number; skippedNoVideo: number }>;
}

// Más reciente primero
const VIDEO_ENTRIES: VideoEntry[] = [
  {
    label: 'Plan Isométrico — videos',
    description: '32 ejercicios de Isometrico-1 a 4 · video corto + tutorial explicativo',
    isDone: isVideosPlanIsometricoUpdateDone,
    run: updateVideosPlanIsometrico,
  },
];

export function VideoSeederSection() {
  const [doneFlags, setDoneFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(VIDEO_ENTRIES.map((e) => [e.label, e.isDone()]))
  );
  const [runningLabel, setRunningLabel] = useState<string | null>(null);

  if (VIDEO_ENTRIES.length === 0) return null;

  const handleRun = async (entry: VideoEntry) => {
    setRunningLabel(entry.label);
    try {
      const result = await entry.run();
      toast.success(`${result.updated} videos asignados`);
      if (result.skippedNoExercise > 0) {
        toast.error(`${result.skippedNoExercise} ejercicios no encontrados en la BD`);
      }
      setDoneFlags((prev) => ({ ...prev, [entry.label]: true }));
    } catch (error) {
      toast.error(
        `Error al asignar videos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setRunningLabel(null);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Asignar videos
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        {VIDEO_ENTRIES.map((entry) => {
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
                    : 'bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/50'
                }`}
              >
                {running ? (
                  <Loader2 size={18} className="text-blue-400 animate-spin" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <Video size={18} className="text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white font-bold block">{entry.label}</span>
                <span className="text-[11px] text-gray-500">{entry.description}</span>
              </div>
              {done && (
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider shrink-0">
                  Asignados
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
