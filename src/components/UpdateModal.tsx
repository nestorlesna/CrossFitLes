import { Download, X, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  version: string;
  downloading: boolean;
  progress: number;
  installError: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateModal({ version, downloading, progress, installError, onUpdate, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4 shadow-2xl">

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-900/40 rounded-xl flex items-center justify-center shrink-0">
            <RefreshCw size={20} className="text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white">Nueva versión disponible</h2>
            <p className="text-sm text-gray-400 mt-0.5">CrossFit Les v{version}</p>
          </div>
          {!downloading && (
            <button
              onClick={onDismiss}
              className="text-gray-600 p-1 hover:text-gray-400 transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {downloading ? (
          <div className="space-y-2 py-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Descargando actualización…</span>
              <span className="text-sm font-semibold text-primary-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center">No cierres la app</p>
          </div>
        ) : installError ? (
          <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80">
              Se abrió el navegador para descargar la APK. Instalá el archivo descargado desde tu carpeta de descargas.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-300">
            ¿Descargar e instalar la versión {version} ahora?
          </p>
        )}

        {!downloading && (
          <div className="flex gap-3 pt-1">
            <button
              onClick={onDismiss}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
            >
              <X size={15} />
              Más tarde
            </button>
            {!installError && (
              <button
                onClick={onUpdate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-sm text-white font-semibold hover:bg-primary-500 active:bg-primary-700 transition-colors"
              >
                <Download size={15} />
                Actualizar
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
