// Sección "Re-vincular imágenes al repo" en Configuración.
// Cambia los ejercicios que apuntan a un blob de SQLite (exercises/uuid.svg)
// por su SVG equivalente del repositorio y elimina el blob huérfano.
import { useState } from 'react';
import { ImageDown, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { relinkRepoImages } from '../../services/relinkRepoImagesService';

export function RelinkRepoImagesSection() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleRun = async () => {
    setBusy(true);
    try {
      const { relinked, deleted } = await relinkRepoImages();
      setDone(true);
      if (relinked === 0 && deleted === 0) {
        toast.info('No había imágenes pendientes de re-vincular');
      } else {
        toast.success(
          `${relinked} ejercicios re-vinculados, ${deleted} blobs eliminados`
        );
      }
      // Refrescar para que las miniaturas usen la ruta del repo
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error(
        `Error al re-vincular: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Imágenes
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <button
          onClick={handleRun}
          disabled={busy || done}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              done
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-primary-500/10 border-primary-500/20 group-hover:border-primary-500/50'
            }`}
          >
            {busy ? (
              <Loader2 size={18} className="text-primary-400 animate-spin" />
            ) : done ? (
              <CheckCircle2 size={18} className="text-green-500" />
            ) : (
              <ImageDown size={18} className="text-primary-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white font-bold block">
              Re-vincular imágenes al repositorio
            </span>
            <span className="text-[11px] text-gray-500">
              Reapunta los SVG guardados en la BD a /img/exercises y borra el blob
            </span>
          </div>
          {done && (
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider shrink-0">
              Hecho
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
