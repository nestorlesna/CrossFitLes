// Sección de Backup en la pantalla de configuración
// Permite exportar e importar datos (BD + Media) como archivo ZIP

import { useState, useRef } from 'react';
import { Download, Upload, Loader2, AlertTriangle, FileArchive, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { exportData, importDataFromZip } from '../../services/backupService';
import { importNestorSession } from '../../services/nestorImportService';

export function BackupSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingNestor, setImportingNestor] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exportar datos a ZIP
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData();
      toast.success('Copia de seguridad generada correctamente');
    } catch (error) {
      toast.error(
        `Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setExporting(false);
    }
  };

  // Seleccionar archivo ZIP para importar
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Leer el archivo seleccionado y pedir confirmación
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar extensión
    if (!file.name.endsWith('.zip')) {
      toast.error('Por favor seleccioná un archivo .zip');
      return;
    }

    setPendingBlob(file);
    setPendingFileName(file.name);
    setConfirmImport(true);

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  };

  // Confirmar e importar los datos
  const handleConfirmImport = async () => {
    if (!pendingBlob) return;
    setConfirmImport(false);
    setImporting(true);

    try {
      const result = await importDataFromZip(pendingBlob);
      toast.success(`Restauración exitosa: ${result.totalRecords} registros e imágenes importadas`);
      
      // Forzar recarga ligera para que los cambios en la BD se reflejen
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error(
        `Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setImporting(false);
      setPendingBlob(null);
      setPendingFileName('');
    }
  };

  // Cancelar importación
  const handleCancelImport = () => {
    setConfirmImport(false);
    setPendingBlob(null);
    setPendingFileName('');
  };

  // Importar clase de Nestor 28/03/2026
  const handleImportNestor = async () => {
    setImportingNestor(true);
    try {
      const result = await importNestorSession();
      if (result.created) {
        toast.success(
          `Importación exitosa: ${result.exercises} ejercicio${result.exercises !== 1 ? 's' : ''} nuevo${result.exercises !== 1 ? 's' : ''} y clase "Nestor - 28/03/2026" creada`
        );
      } else {
        toast.success(
          `${result.exercises > 0 ? `${result.exercises} ejercicio${result.exercises !== 1 ? 's' : ''} nuevo${result.exercises !== 1 ? 's' : ''} creado${result.exercises !== 1 ? 's' : ''}. ` : ''}La clase "Nestor - 28/03/2026" ya existía`
        );
      }
    } catch (error) {
      toast.error(
        `Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setImportingNestor(false);
    }
  };

  return (
    <>
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Copia de Seguridad
        </h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
          {/* Botón Exportar */}
          <button
            onClick={handleExport}
            disabled={exporting || importing}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center shrink-0 border border-primary-500/20 group-hover:border-primary-500/50 transition-colors">
              {exporting ? (
                <Loader2 size={18} className="text-primary-500 animate-spin" />
              ) : (
                <Download size={18} className="text-primary-500" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Generar Backup</span>
              <span className="text-[11px] text-gray-500">Exporta toda la BD e imágenes en un .zip</span>
            </div>
          </button>

          {/* Botón Importar Nestor */}
          <button
            onClick={handleImportNestor}
            disabled={exporting || importing || importingNestor}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
              {importingNestor ? (
                <Loader2 size={18} className="text-emerald-500 animate-spin" />
              ) : (
                <Dumbbell size={18} className="text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Importar Clase Nestor 28/03/2026</span>
              <span className="text-[11px] text-gray-500">Crea 10 ejercicios y la plantilla de clase del entrenamiento</span>
            </div>
          </button>

          {/* Botón Importar */}
          <button
            onClick={handleFileSelect}
            disabled={exporting || importing || importingNestor}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
              {importing ? (
                <Loader2 size={18} className="text-blue-500 animate-spin" />
              ) : (
                <Upload size={18} className="text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Restaurar Backup</span>
              <span className="text-[11px] text-gray-500">Importa desde un archivo .zip generado previamente</span>
            </div>
          </button>
        </div>

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip,application/x-zip-compressed,application/octet-stream"
          onChange={handleFileChange}
          className="hidden"
        />
      </section>

      {/* Modal de confirmación de importación */}
      <Modal
        isOpen={confirmImport}
        onClose={handleCancelImport}
        title="Confirmar restauración"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleCancelImport}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
            >
              Sí, restaurar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <div>
            <p className="text-white text-base font-bold mb-2">
              ¿Estás seguro de restaurar los datos?
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Esta acción eliminará <strong className="text-red-400">TODOS</strong> los datos y fotos actuales para reemplazarlos por los del archivo:
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800">
               <FileArchive size={14} className="text-primary-500" />
               <span className="text-primary-400 text-xs font-mono truncate max-w-[200px]">
                 {pendingFileName}
               </span>
            </div>
            <p className="text-gray-500 text-[10px] mt-4 uppercase font-bold tracking-widest italic">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

