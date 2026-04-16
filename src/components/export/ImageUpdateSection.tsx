// Sección para asociar SVGs a ejercicios desde imageUpdateService.
// Re-ejecutable: no hay flag one-time, siempre se puede volver a correr.

import { useState } from 'react';
import { ImagePlay, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { runImageUpdate } from '../../services/imageUpdateService';

export function ImageUpdateSection() {
  const [loading, setLoading] = useState(false);
  const [lastCount, setLastCount] = useState<number | null>(null);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updated = await runImageUpdate();
      setLastCount(updated);
      if (updated > 0) {
        toast.success(`${updated} ejercicio${updated !== 1 ? 's' : ''} actualizado${updated !== 1 ? 's' : ''} con imagen`);
      } else {
        toast.info('Todos los ejercicios ya tenían imagen asignada');
      }
    } catch (error) {
      toast.error(
        `Error al actualizar imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Imágenes de ejercicios
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">
            {loading ? (
              <Loader2 size={18} className="text-cyan-400 animate-spin" />
            ) : (
              <ImagePlay size={18} className="text-cyan-400" />
            )}
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold block text-white">
              Asociar SVGs a ejercicios
            </span>
            <span className="text-[11px] text-gray-500">
              {lastCount !== null
                ? `Última ejecución: ${lastCount} ejercicio${lastCount !== 1 ? 's' : ''} actualizado${lastCount !== 1 ? 's' : ''}`
                : 'Asigna las imágenes animadas a todos los ejercicios'}
            </span>
          </div>
          {loading && (
            <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">
              Procesando…
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
