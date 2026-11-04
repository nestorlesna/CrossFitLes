// Zona de peligro: borrar todos los datos y volver al estado de instalación nueva.
// Al reiniciar, el primer arranque vuelve a cargar los datos base (ver baseContentService).
import { useState } from 'react';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { cleanDatabase } from '../../services/resetService';

export function ResetSection() {
  const [confirmClean, setConfirmClean] = useState(false);
  const [cleanBusy, setCleanBusy] = useState(false);

  const handleClean = async () => {
    setConfirmClean(false);
    setCleanBusy(true);
    try {
      await cleanDatabase();
      toast.success('Datos borrados. Reiniciando la app…');
      // Recarga completa: migraciones desde cero y primer arranque
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch (error) {
      console.error('[Reset] Error al borrar:', error);
      toast.error('Error al borrar los datos');
      setCleanBusy(false);
    }
  };

  return (
    <>
      <section className="mt-6">
        <h2 className="text-xs font-semibold text-red-500/70 uppercase tracking-wider mb-3 px-1">
          Zona de peligro
        </h2>

        <div className="bg-gray-900 border border-red-900/20 rounded-2xl overflow-hidden">
          <button
            onClick={() => setConfirmClean(true)}
            disabled={cleanBusy}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-500/5 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-500/10">
              {cleanBusy ? (
                <Loader2 size={16} className="text-red-400 animate-spin" />
              ) : (
                <Trash2 size={16} className="text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold block text-red-400">Borrar todos los datos</span>
              <span className="text-[11px] text-gray-500">
                Deja la app como recién instalada, con los datos base
              </span>
            </div>
          </button>
        </div>
      </section>

      <Modal
        isOpen={confirmClean}
        onClose={() => setConfirmClean(false)}
        title="¿Borrar todos los datos?"
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={() => setConfirmClean(false)} className="flex-1 py-2 text-sm text-gray-400">
              Cancelar
            </button>
            <button
              onClick={handleClean}
              className="flex-2 py-2 px-6 bg-red-600 text-white rounded-lg text-sm font-bold text-center"
            >
              Borrar todo
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <p className="text-gray-300 text-xs leading-relaxed font-medium">
            Se eliminan para siempre tus sesiones, récords, planes, challenges, perfil, medidas, fotos y
            todo lo que hayas creado o editado. La app se reinicia y vuelve a cargar los datos base.
            Si querés conservar algo, exportá un backup antes.
          </p>
        </div>
      </Modal>
    </>
  );
}
