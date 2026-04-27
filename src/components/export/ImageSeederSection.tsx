// Sección para registrar image_url de ejercicios con SVG nuevo
import { useState } from 'react';
import { ImagePlay, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  isImagesClase22042026UpdateDone,
  updateImagesClase22042026,
} from '../../services/imagesClase22042026UpdateService';
import {
  isImagesClase25042026UpdateDone,
  updateImagesClase25042026,
} from '../../services/imagesClase25042026UpdateService';

interface ImageEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skippedNoExercise: number }>;
}

const IMAGE_ENTRIES: ImageEntry[] = [
  {
    label: 'Clase GOAT 25/04/2026 — imágenes',
    description: '6 ejercicios: Wall Lat Stretch, Wall Shoulder CAR, Goblet Squat, Core Side Bend, Wall Sit, Dual DB Snatch',
    isDone: isImagesClase25042026UpdateDone,
    run: updateImagesClase25042026,
  },
  {
    label: 'Clase GOAT 22/04/2026 — imágenes',
    description: '18 ejercicios: movilidad hombro/cadera, activación isométrica, estiramientos',
    isDone: isImagesClase22042026UpdateDone,
    run: updateImagesClase22042026,
  },
];

export function ImageSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);

  if (IMAGE_ENTRIES.length === 0) return null;

  const handleUpdate = async (entry: ImageEntry) => {
    setLoading(entry.label);
    try {
      const result = await entry.run();
      if (result.updated > 0) {
        let msg = `${result.updated} imagen${result.updated !== 1 ? 'es' : ''} registrada${result.updated !== 1 ? 's' : ''}`;
        if (result.skippedNoExercise > 0) msg += ` · ${result.skippedNoExercise} ejercicios no encontrados`;
        toast.success(msg);
      } else if (result.skippedNoExercise > 0) {
        toast.error(`${result.skippedNoExercise} ejercicios no encontrados en la BD`);
      } else {
        toast.info('No se registraron imágenes');
      }
      setTick(t => t + 1);
    } catch (error) {
      toast.error(
        `Error al registrar imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Registrar imágenes
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        {IMAGE_ENTRIES.map((entry) => {
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
                    : 'bg-orange-500/10 border-orange-500/20 group-hover:border-orange-500/50'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="text-orange-400 animate-spin" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <ImagePlay size={18} className="text-orange-400" />
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
