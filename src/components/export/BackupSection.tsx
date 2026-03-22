// Sección de Backup en la pantalla de configuración
// Permite exportar e importar datos como archivo JSON

import { useState, useRef } from 'react';
import { Download, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { exportData, importData } from '../../services/backupService';

export function BackupSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exportar datos a JSON
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData();
      toast.success('Backup exportado correctamente');
    } catch (error) {
      toast.error(
        `Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setExporting(false);
    }
  };

  // Seleccionar archivo JSON para importar
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Leer el archivo seleccionado y pedir confirmación
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar extensión
    if (!file.name.endsWith('.json')) {
      toast.error('Por favor seleccioná un archivo .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPendingFile(content);
      setPendingFileName(file.name);
      setConfirmImport(true);
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo');
    };
    reader.readAsText(file);

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  };

  // Confirmar e importar los datos
  const handleConfirmImport = async () => {
    if (!pendingFile) return;
    setConfirmImport(false);
    setImporting(true);

    try {
      const result = await importData(pendingFile);
      toast.success(`Datos importados: ${result.totalRecords} registros restaurados`);
    } catch (error) {
      toast.error(
        `Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setImporting(false);
      setPendingFile(null);
      setPendingFileName('');
    }
  };

  // Cancelar importación
  const handleCancelImport = () => {
    setConfirmImport(false);
    setPendingFile(null);
    setPendingFileName('');
  };

  return (
    <>
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Backup
        </h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
          {/* Botón Exportar */}
          <button
            onClick={handleExport}
            disabled={exporting || importing}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
              {exporting ? (
                <Loader2 size={16} className="text-primary-400 animate-spin" />
              ) : (
                <Download size={16} className="text-primary-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm text-white block">Exportar datos</span>
              <span className="text-xs text-gray-500">Descargar backup en archivo JSON</span>
            </div>
          </button>

          {/* Botón Importar */}
          <button
            onClick={handleFileSelect}
            disabled={exporting || importing}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
              {importing ? (
                <Loader2 size={16} className="text-primary-400 animate-spin" />
              ) : (
                <Upload size={16} className="text-primary-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm text-white block">Importar datos</span>
              <span className="text-xs text-gray-500">Restaurar desde archivo JSON</span>
            </div>
          </button>
        </div>

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </section>

      {/* Modal de confirmación de importación */}
      <Modal
        isOpen={confirmImport}
        onClose={handleCancelImport}
        title="Confirmar importación"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleCancelImport}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
            >
              Sí, importar
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
              ¿Estás seguro de importar este backup?
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Se reemplazarán <strong className="text-gray-300">todos los datos actuales</strong> con
              los del archivo:
            </p>
            <p className="text-primary-400 text-xs mt-2 font-mono">
              {pendingFileName}
            </p>
            <p className="text-red-400 text-xs mt-3">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
