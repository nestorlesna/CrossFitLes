// Sección de inicialización/reset — solo ejecución manual.
// "Inicializar Datos": borra todo y carga catálogos + ejercicios + plantillas + imágenes en un solo paso.
import { useState } from 'react';
import { RotateCcw, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { cleanDatabase, reSeedAll, SeedResult } from '../../services/seedService2';

export function ResetSection() {
  const [confirmInit, setConfirmInit] = useState(false);
  const [confirmClean, setConfirmClean] = useState(false);
  const [initBusy, setInitBusy] = useState(false);
  const [cleanBusy, setCleanBusy] = useState(false);
  const [cleanDone, setCleanDone] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [result, setResult] = useState<SeedResult | null>(null);

  // ── Borrar Todo ───────────────────────────────────────────────────────────

  const handleClean = async () => {
    setConfirmClean(false);
    setCleanBusy(true);
    setCleanDone(false);
    setResult(null);
    try {
      await cleanDatabase();
      setCleanDone(true);
      setCleanBusy(false);
      toast.success('Base de datos borrada correctamente');
    } catch (error) {
       toast.error('Error al borrar');
       setCleanBusy(false);
    }
  };

  // ── Cargar Datos ────────────────────────────────────────────────────────────

  const handleInit = async () => {
    setConfirmInit(false);
    setInitBusy(true);
    setResult(null);
    setCleanDone(false);
    setProgress({ loaded: 0, total: 3242 });

    try {
      const res = await reSeedAll((loaded, total) => {
        setProgress({ loaded, total });
      });

      setResult(res);
      setInitBusy(false);
      toast.success('Carga base completada');
    } catch (error) {
      console.error('Error en carga:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
      setInitBusy(false);
      setProgress(null);
    }
  };

  const handleRestart = () => {
    window.location.href = '/';
  };

  // ── Progreso ───────────────────────────────────────────────────────────────

  const progressPct = progress
    ? Math.round((progress.loaded / progress.total) * 100)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <section className="mt-6">
        <h2 className="text-xs font-semibold text-red-500/70 uppercase tracking-wider mb-3 px-1">
          Zona de Peligro (Reset)
        </h2>

        <div className="bg-gray-900 border border-red-900/20 rounded-2xl overflow-hidden divide-y divide-gray-800">
          {/* Botón 1: Borrar todo */}
          <button
            onClick={() => setConfirmClean(true)}
            disabled={cleanBusy || initBusy}
            className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-red-500/5 transition-colors text-left ${cleanDone ? 'bg-green-500/5' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cleanDone ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {cleanBusy ? <Loader2 size={16} className="text-red-400 animate-spin" /> : 
               cleanDone ? <Trash2 size={16} className="text-green-500" /> :
               <Trash2 size={16} className="text-red-400" />}
            </div>
            <div className="flex-1">
              <span className={`text-sm font-semibold block ${cleanDone ? 'text-green-500' : 'text-red-400'}`}>
                {cleanDone ? 'Base de Datos Limpia' : 'Limpiar Base de Datos'}
              </span>
              <span className="text-[11px] text-gray-500">
                {cleanDone ? 'Ya puedes proceder con la Carga Base' : 'Borra absolutamente todo (Tablas y registros)'}
              </span>
            </div>
          </button>

          {/* Botón 2: Cargar datos */}
          {result ? (
            <div className="p-4 bg-green-500/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <RotateCcw size={20} className="text-green-500" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-bold">¡Carga completa!</h3>
                  <p className="text-[11px] text-gray-500">Resumen de inicialización:</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-black/20 p-2 rounded-xl border border-gray-800 text-center">
                  <span className="text-white text-lg font-black block leading-none">{result.exercises.toLocaleString()}</span>
                  <span className="text-[8px] text-gray-500 uppercase">Ejercicios</span>
                </div>
                <div className="bg-black/20 p-2 rounded-xl border border-gray-800 text-center">
                  <span className="text-white text-lg font-black block leading-none">{result.updatedImages}</span>
                  <span className="text-[8px] text-gray-500 uppercase">Imágenes</span>
                </div>
                <div className="bg-black/20 p-2 rounded-xl border border-gray-800 text-center">
                  <span className="text-white text-lg font-black block leading-none">{result.mappedMuscles}</span>
                  <span className="text-[8px] text-gray-500 uppercase">Anatomía</span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
              >
                Reiniciar Aplicación para aplicar cambios
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmInit(true)}
              disabled={initBusy || cleanBusy}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-primary-500/5 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center shrink-0">
                {initBusy ? <Loader2 size={16} className="text-primary-400 animate-spin" /> : <RotateCcw size={16} className="text-primary-400" />}
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-primary-400 block">Cargar Datos Base</span>
                {initBusy && progress ? (
                  <div className="mt-1.5">
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden w-full max-w-[200px]">
                      <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Cargando {progress.loaded.toLocaleString()} / {progress.total.toLocaleString()}...</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-500">Cargar ejercicios base, plantillas e imágenes</span>
                )}
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Modal: Confirmación Carga Base */}
      <Modal
        isOpen={confirmInit}
        onClose={() => setConfirmInit(false)}
        title="¿Cargar datos base?"
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={() => setConfirmInit(false)} className="flex-1 py-2 text-sm text-gray-400">Cancelar</button>
            <button onClick={handleInit} className="flex-2 py-2 px-6 bg-primary-600 text-white rounded-lg text-sm font-bold">Empezar Carga</button>
          </div>
        }
      >
        <p className="text-gray-400 text-xs leading-relaxed">
          Se insertarán más de 3.200 ejercicios y plantillas. Se recomienda haber limpiado la base de datos previamente para evitar duplicados.
        </p>
      </Modal>

      {/* Modal: Confirmación Limpieza Total */}
      <Modal
        isOpen={confirmClean}
        onClose={() => setConfirmClean(false)}
        title="¿Limpiar base de datos?"
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={() => setConfirmClean(false)} className="flex-1 py-2 text-sm text-gray-400">Cancelar</button>
            <button onClick={handleClean} className="flex-2 py-2 px-6 bg-red-600 text-white rounded-lg text-sm font-bold text-center">Borrar TODO</button>
          </div>
        }
      >
         <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <p className="text-gray-300 text-xs leading-relaxed font-medium">
              Esta acción eliminará permanentemente todas las tablas, ejercicios personalizados, sesiones y récords. La app se reiniciará.
            </p>
         </div>
      </Modal>
    </>
  );
}
