// Botón para importar la Clase GOAT 22/04/2026 en la base de datos.
// Idempotente: muestra estado "ya importada" si ya se ejecutó.

import { useState } from 'react';
import { CalendarDays, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  importClassGoat22042026,
  isClassGoat22042026ImportDone,
} from '../../services/class22042026ImportService';

export function ClassSeederSection() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(isClassGoat22042026ImportDone());

  const handleImport = async () => {
    setLoading(true);
    try {
      await importClassGoat22042026();
      setDone(true);
      toast.success('Clase GOAT 22/04/2026 importada correctamente');
    } catch (error) {
      toast.error(
        `Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Clases GOAT
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <button
          onClick={handleImport}
          disabled={loading || done}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
            done
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/50'
          }`}>
            {loading ? (
              <Loader2 size={18} className="text-violet-400 animate-spin" />
            ) : done ? (
              <CheckCircle size={18} className="text-emerald-400" />
            ) : (
              <CalendarDays size={18} className="text-violet-400" />
            )}
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold block text-white">
              Clase GOAT 22/04/2026
            </span>
            <span className="text-[11px] text-gray-500">
              {done
                ? 'Ya importada — Movilidad hombro/cadera + Snatch escalado + Chipper parejas'
                : 'Importar clase con ejercicios, secciones y pesos'}
            </span>
          </div>
          {loading && (
            <span className="text-[10px] text-violet-500 font-bold uppercase tracking-widest">
              Importando…
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
