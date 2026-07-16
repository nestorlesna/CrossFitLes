// Sección "Tiempos del cronómetro" en Configuración.
// Calcula y carga los tiempos de las clases que ya están en la app, a partir de sus
// reps/distancia/calorías y del tipo de sección. Re-ejecutable, sin flag one-time.
import { useState } from 'react';
import { TimerReset, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import {
  estimateTimersForAllClasses,
  TimerEstimationResult,
} from '../../services/timerEstimationService';

export function TimerEstimationSection() {
  const [busy, setBusy] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [result, setResult] = useState<TimerEstimationResult | null>(null);

  const run = async (overwrite: boolean) => {
    setConfirmOverwrite(false);
    setBusy(true);
    setResult(null);
    try {
      const data = await estimateTimersForAllClasses(overwrite);
      setResult(data);
      if (data.classes === 0) {
        toast.info('Todas las clases ya tenían sus tiempos cargados');
      } else {
        toast.success(
          `${data.classes} clases actualizadas · ${data.sections} secciones · ${data.exercises} ejercicios`
        );
      }
    } catch (error) {
      toast.error(
        `Error al estimar tiempos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
          Tiempos del cronómetro
        </h2>
        <p className="text-[11px] text-gray-600 mb-3 px-1">
          Completa los tiempos que faltan en las clases cargadas, estimándolos a partir de las
          repeticiones, la distancia o las calorías de cada ejercicio y del tipo de sección.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
          {/* Completar tiempos faltantes */}
          <button
            onClick={() => run(false)}
            disabled={busy}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center shrink-0 border border-primary-500/20 group-hover:border-primary-500/50 transition-colors">
              {busy ? (
                <Loader2 size={18} className="text-primary-500 animate-spin" />
              ) : (
                <TimerReset size={18} className="text-primary-500" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Completar tiempos faltantes</span>
              <span className="text-[11px] text-gray-500">No pisa los valores que ya cargaste</span>
            </div>
          </button>

          {/* Recalcular todo */}
          <button
            onClick={() => setConfirmOverwrite(true)}
            disabled={busy}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:border-amber-500/50 transition-colors">
              <RefreshCw size={18} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Recalcular todo</span>
              <span className="text-[11px] text-gray-500">Pisa todos los tiempos cargados, incluidos los ajustados a mano</span>
            </div>
          </button>
        </div>

        {result && result.classes > 0 && (
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 mt-3">
            <p className="text-xs text-gray-400">
              {result.sections} secciones y {result.exercises} ejercicios actualizados en:
            </p>
            <ul className="mt-1 space-y-0.5">
              {result.classNames.map((name) => (
                <li key={name} className="text-[11px] text-gray-500 truncate">
                  · {name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <Modal
        isOpen={confirmOverwrite}
        onClose={() => setConfirmOverwrite(false)}
        title="Recalcular todos los tiempos"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setConfirmOverwrite(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => run(true)}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Recalcular
            </button>
          </div>
        }
      >
        <p className="text-gray-300 text-sm">
          Se van a reemplazar los tiempos estimados y los descansos de todas las clases por los
          valores calculados, incluyendo los que hayas ajustado a mano.
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Los tiempos planificados de los ejercicios por tiempo no se tocan.
        </p>
      </Modal>
    </>
  );
}
