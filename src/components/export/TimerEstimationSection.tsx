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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TimerReset size={16} className="text-primary-400" />
          <h3 className="text-sm font-bold text-white">Tiempos del cronómetro</h3>
        </div>
        <p className="text-xs text-gray-500">
          Completa los tiempos que faltan en las clases cargadas, estimándolos a partir de las
          repeticiones, la distancia o las calorías de cada ejercicio y del tipo de sección. No pisa
          los valores que ya cargaste.
        </p>

        <button
          onClick={() => run(false)}
          disabled={busy}
          className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <TimerReset size={16} />}
          Completar tiempos faltantes
        </button>

        <button
          onClick={() => setConfirmOverwrite(true)}
          disabled={busy}
          className="w-full text-xs text-gray-500 hover:text-gray-300 disabled:opacity-60 flex items-center justify-center gap-1.5 py-1 transition-colors"
        >
          <RefreshCw size={12} />
          Recalcular todo (pisa los tiempos cargados)
        </button>

        {result && result.classes > 0 && (
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-3">
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
      </div>

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
