// Sección para asignar videos a ejercicios en lotes
// Mismo patrón que MuscleSeederSection — se ejecuta una sola vez por entrada.

import { useState } from 'react';
import { Video, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  updateVideosBatch001,
  isVideosBatch001UpdateDone,
} from '../../services/videosBatch001UpdateService';
import {
  updateVideosBatch002,
  isVideosBatch002UpdateDone,
} from '../../services/videosBatch002UpdateService';

interface VideoEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skippedNoExercise: number; skippedNoVideo: number }>;
}

const VIDEO_ENTRIES: VideoEntry[] = [
  {
    label: 'Batch 001 — Back Squat',
    description: 'Back Squat — Catalyst Athletics tutorial',
    isDone: isVideosBatch001UpdateDone,
    run: updateVideosBatch001,
  },
  {
    label: 'Batch 002 — 28 ejercicios principales',
    description: 'Clean & Jerk · Deadlift · Front Squat · Box Jump · Wall Ball · Double Under · Ring Dip…',
    isDone: isVideosBatch002UpdateDone,
    run: updateVideosBatch002,
  },
];

export function VideoSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);

  if (VIDEO_ENTRIES.length === 0) return null;

  const handleUpdate = async (entry: VideoEntry) => {
    setLoading(entry.label);
    try {
      const result = await entry.run();
      if (result.updated > 0) {
        let msg = `${result.updated} video${result.updated !== 1 ? 's' : ''} asignado${result.updated !== 1 ? 's' : ''}`;
        if (result.skippedNoExercise > 0) msg += ` · ${result.skippedNoExercise} ejercicios no encontrados`;
        if (result.skippedNoVideo > 0) msg += ` · ${result.skippedNoVideo} sin URL de video`;
        toast.success(msg);
      } else if (result.skippedNoExercise > 0) {
        toast.error(`${result.skippedNoExercise} ejercicios no encontrados en la BD`);
      } else {
        toast.info('No se procesaron videos');
      }
      setTick(t => t + 1);
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
              onClick={() => !done && handleUpdate(entry)}
              disabled={done || isLoading}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  done
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/50'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="text-blue-400 animate-spin" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-green-500" />
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
