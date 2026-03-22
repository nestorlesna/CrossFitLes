// Sección de inicialización/reset — solo ejecución manual.
// "Inicializar Datos": borra todo y carga catálogos + ejercicios + plantillas + imágenes en un solo paso.
import { useState } from 'react';
import { RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { resetAndReSeedAll } from '../../services/seedService2';

export function ResetSection() {
  const [confirmInit, setConfirmInit] = useState(false);
  const [initBusy, setInitBusy] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);

  // ── Inicializar Datos ──────────────────────────────────────────────────────

  const handleInit = async () => {
    setConfirmInit(false);
    setInitBusy(true);
    setProgress({ loaded: 0, total: 3242 });

    try {
      await resetAndReSeedAll((loaded, total) => {
        setProgress({ loaded, total });
      });

      toast.success('Base de datos inicializada correctamente');
      // Recarga para reiniciar el estado React con la nueva BD
      setTimeout(() => { window.location.href = '/'; }, 800);
    } catch (error) {
      console.error('Error en inicialización:', error);
      toast.error(`Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setInitBusy(false);
      setProgress(null);
    }
  };

  // ── Progreso ───────────────────────────────────────────────────────────────

  const progressPct = progress
    ? Math.round((progress.loaded / progress.total) * 100)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Zona de Peligro ────────────────────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold text-red-500/70 uppercase tracking-wider mb-3 px-1">
          Zona de Peligro
        </h2>

        <div className="bg-gray-900 border border-red-900/20 rounded-2xl overflow-hidden">
          <button
            onClick={() => setConfirmInit(true)}
            disabled={initBusy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
              {initBusy
                ? <Loader2 size={16} className="text-red-400 animate-spin" />
                : <RotateCcw size={16} className="text-red-400" />
              }
            </div>
            <div className="flex-1">
              <span className="text-sm text-red-400 block">Inicializar Datos</span>
              {initBusy && progress ? (
                <div className="mt-1.5">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Ejercicios: {progress.loaded.toLocaleString()} / {progress.total.toLocaleString()} ({progressPct}%) — luego carga plantillas e imágenes…
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-500">
                  Borrar todo y cargar ejercicios + Open 26 + Girls + Heroes + WODs + imágenes SVG
                </span>
              )}
            </div>
          </button>
        </div>
      </section>

      {/* ── Modal: Inicializar Datos ────────────────────────────────────────── */}
      <Modal
        isOpen={confirmInit}
        onClose={() => setConfirmInit(false)}
        title="¿Inicializar base de datos?"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmInit(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInit}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
            >
              Sí, borrar todo
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-2">
              Se borrarán absolutamente todos los datos
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Se eliminarán sesiones, ejercicios personalizados, récords y configuraciones.
              Luego se cargarán los catálogos base,{' '}
              <span className="text-white font-medium">3.242 ejercicios</span>,{' '}
              plantillas del{' '}
              <span className="text-white font-medium">Open 26, Girls y Heroes</span>,{' '}
              WODs de{' '}
              <span className="text-white font-medium">Feb–Mar 2026</span>{' '}
              e imágenes SVG.{' '}
              La carga puede tardar <span className="text-white font-medium">~2–3 minutos</span>.
            </p>
            <p className="text-red-400 text-xs mt-4 font-semibold">
              ¡Esta acción no se puede deshacer!
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
