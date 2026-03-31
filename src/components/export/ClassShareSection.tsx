// Sección "Compartir" en Configuración
// Permite exportar/importar clases y ejercicios como ZIP para compartir entre usuarios.
// El import es unificado: detecta automáticamente si el ZIP es de clase o de ejercicios.

import { useState, useRef, useMemo } from 'react';
import {
  Share2,
  Download,
  Loader2,
  Check,
  FileArchive,
  AlertCircle,
  Dumbbell,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import * as classTemplateRepo from '../../db/repositories/classTemplateRepo';
import * as exerciseRepo from '../../db/repositories/exerciseRepo';
import {
  exportClasses,
  exportExercises,
  importFromZip,
  type ImportFromZipResult,
} from '../../services/classShareService';
import type { ClassTemplate } from '../../models/ClassTemplate';
import type { Exercise } from '../../models/Exercise';
import { formatDate } from '../../utils/formatters';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ZipType = 'class' | 'exercise' | null;

// ─── Componente ──────────────────────────────────────────────────────────────

export function ClassShareSection() {
  // Modales de exportación
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);

  // Datos y selección — clases
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classes, setClasses] = useState<ClassTemplate[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());

  // Datos y selección — ejercicios
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Estado de operaciones
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Import unificado
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const [detectedZipType, setDetectedZipType] = useState<ZipType>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Clases: abrir modal ────────────────────────────────────────────────────

  const handleOpenClassExport = async () => {
    setSelectedClassIds(new Set());
    setClassModalOpen(true);
    setLoadingClasses(true);
    try {
      const all = await classTemplateRepo.getAll();
      setClasses(all);
    } catch {
      toast.error('Error al cargar las clases');
      setClassModalOpen(false);
    } finally {
      setLoadingClasses(false);
    }
  };

  const toggleClass = (id: string) =>
    setSelectedClassIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAllClasses = () =>
    setSelectedClassIds(prev =>
      prev.size === classes.length ? new Set() : new Set(classes.map(c => c.id))
    );

  const handleExportClasses = async () => {
    if (selectedClassIds.size === 0) return;
    setExporting(true);
    try {
      await exportClasses(Array.from(selectedClassIds));
      const n = selectedClassIds.size;
      toast.success(`${n} clase${n > 1 ? 's' : ''} exportada${n > 1 ? 's' : ''} correctamente`);
      setClassModalOpen(false);
    } catch (error) {
      toast.error(`Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setExporting(false);
    }
  };

  // ── Ejercicios: abrir modal ────────────────────────────────────────────────

  const handleOpenExerciseExport = async () => {
    setSelectedExerciseIds(new Set());
    setExerciseSearch('');
    setExerciseModalOpen(true);
    setLoadingExercises(true);
    try {
      const all = await exerciseRepo.getAll();
      setExercises(all);
    } catch {
      toast.error('Error al cargar los ejercicios');
      setExerciseModalOpen(false);
    } finally {
      setLoadingExercises(false);
    }
  };

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    return q ? exercises.filter(e => e.name.toLowerCase().includes(q)) : exercises;
  }, [exercises, exerciseSearch]);

  const toggleExercise = (id: string) =>
    setSelectedExerciseIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAllExercises = () =>
    setSelectedExerciseIds(prev =>
      prev.size === filteredExercises.length
        ? new Set()
        : new Set(filteredExercises.map(e => e.id))
    );

  const handleExportExercises = async () => {
    if (selectedExerciseIds.size === 0) return;
    setExporting(true);
    try {
      await exportExercises(Array.from(selectedExerciseIds));
      const n = selectedExerciseIds.size;
      toast.success(`${n} ejercicio${n > 1 ? 's' : ''} exportado${n > 1 ? 's' : ''} correctamente`);
      setExerciseModalOpen(false);
    } catch (error) {
      toast.error(`Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setExporting(false);
    }
  };

  // ── Importación unificada ─────────────────────────────────────────────────

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      toast.error('Por favor seleccioná un archivo .zip');
      return;
    }

    // Detectar tipo leyendo el JSON del ZIP sin importar aún
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      if (zip.file('class-share.json')) {
        setDetectedZipType('class');
      } else if (zip.file('exercise-share.json')) {
        setDetectedZipType('exercise');
      } else {
        toast.error('El archivo no es una exportación válida de CrossFit Session Tracker.');
        return;
      }
    } catch {
      toast.error('No se pudo leer el archivo ZIP.');
      return;
    }

    setPendingBlob(file);
    setPendingFileName(file.name);
    setConfirmImportOpen(true);
  };

  const handleConfirmImport = async () => {
    if (!pendingBlob) return;
    setConfirmImportOpen(false);
    setImporting(true);
    try {
      const imported: ImportFromZipResult = await importFromZip(pendingBlob);

      if (imported.type === 'class') {
        const { classesImported, exercisesCreated, exercisesReused } = imported.result;
        const parts = [
          `${classesImported} clase${classesImported !== 1 ? 's' : ''} importada${classesImported !== 1 ? 's' : ''}`,
        ];
        if (exercisesCreated > 0)
          parts.push(`${exercisesCreated} ejercicio${exercisesCreated !== 1 ? 's' : ''} nuevo${exercisesCreated !== 1 ? 's' : ''}`);
        if (exercisesReused > 0)
          parts.push(`${exercisesReused} ejercicio${exercisesReused !== 1 ? 's' : ''} reutilizado${exercisesReused !== 1 ? 's' : ''}`);
        toast.success(`Importación exitosa: ${parts.join(', ')}`);
      } else {
        const { exercisesCreated, exercisesReused } = imported.result;
        const parts: string[] = [];
        if (exercisesCreated > 0)
          parts.push(`${exercisesCreated} ejercicio${exercisesCreated !== 1 ? 's' : ''} nuevo${exercisesCreated !== 1 ? 's' : ''}`);
        if (exercisesReused > 0)
          parts.push(`${exercisesReused} ya existía${exercisesReused !== 1 ? 'n' : ''}`);
        toast.success(`Importación exitosa: ${parts.join(', ') || 'sin cambios'}`);
      }

      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error(`Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setImporting(false);
      setPendingBlob(null);
      setPendingFileName('');
      setDetectedZipType(null);
    }
  };

  const handleCancelImport = () => {
    setConfirmImportOpen(false);
    setPendingBlob(null);
    setPendingFileName('');
    setDetectedZipType(null);
  };

  // ── Helpers de estado ─────────────────────────────────────────────────────

  const allClassesSelected = classes.length > 0 && selectedClassIds.size === classes.length;
  const someClassesSelected = selectedClassIds.size > 0 && !allClassesSelected;

  const allExercisesSelected =
    filteredExercises.length > 0 && filteredExercises.every(e => selectedExerciseIds.has(e.id));
  const someExercisesSelected =
    selectedExerciseIds.size > 0 && !allExercisesSelected;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
          Compartir
        </h2>
        <p className="text-[11px] text-gray-600 mb-3 px-1">
          Exportá clases o ejercicios para enviárselos a tus alumnos. Al importar, los datos existentes no se modifican.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">

          {/* Exportar Clases */}
          <button
            onClick={handleOpenClassExport}
            disabled={exporting || importing}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
              <Share2 size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Exportar Clase(s)</span>
              <span className="text-[11px] text-gray-500">
                Genera un .zip con la clase y sus ejercicios para compartir
              </span>
            </div>
          </button>

          {/* Exportar Ejercicios */}
          <button
            onClick={handleOpenExerciseExport}
            disabled={exporting || importing}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center shrink-0 border border-sky-500/20 group-hover:border-sky-500/50 transition-colors">
              <Dumbbell size={18} className="text-sky-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Exportar Ejercicio(s)</span>
              <span className="text-[11px] text-gray-500">
                Genera un .zip con ejercicios, imágenes y catálogos asociados
              </span>
            </div>
          </button>

          {/* Importar (unificado) */}
          <button
            onClick={handleImportClick}
            disabled={exporting || importing}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:border-violet-500/50 transition-colors">
              {importing ? (
                <Loader2 size={18} className="text-violet-400 animate-spin" />
              ) : (
                <Download size={18} className="text-violet-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Importar</span>
              <span className="text-[11px] text-gray-500">
                Importa clases o ejercicios recibidos de otro usuario
              </span>
            </div>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip,application/x-zip-compressed"
          onChange={handleFileChange}
          className="hidden"
        />
      </section>

      {/* ── Modal: seleccionar CLASES a exportar ─────────────────────────── */}
      <Modal
        isOpen={classModalOpen}
        onClose={() => !exporting && setClassModalOpen(false)}
        title="Exportar Clase(s)"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setClassModalOpen(false)}
              disabled={exporting}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleExportClasses}
              disabled={exporting || selectedClassIds.size === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exporting ? (
                <><Loader2 size={14} className="animate-spin" /> Exportando…</>
              ) : (
                <><Share2 size={14} />{selectedClassIds.size > 0 ? `Exportar (${selectedClassIds.size})` : 'Exportar'}</>
              )}
            </button>
          </div>
        }
      >
        {loadingClasses ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="text-primary-500 animate-spin" />
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle size={32} className="text-gray-600" />
            <p className="text-gray-400 text-sm">No hay clases creadas todavía.</p>
          </div>
        ) : (
          <div className="space-y-1 -mx-1 px-1">
            <button
              onClick={toggleAllClasses}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-colors text-left"
            >
              <Checkbox checked={allClassesSelected} indeterminate={someClassesSelected} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {allClassesSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </span>
            </button>
            <div className="border-t border-gray-800 my-1" />
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => toggleClass(cls.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-colors text-left"
                >
                  <Checkbox checked={selectedClassIds.has(cls.id)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white block truncate">{cls.name}</span>
                    <span className="text-[11px] text-gray-500">
                      {cls.date ? formatDate(cls.date) : 'Sin fecha'}
                      {' · '}
                      {cls.exercise_count ?? 0} ejercicio{(cls.exercise_count ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: seleccionar EJERCICIOS a exportar ─────────────────────── */}
      <Modal
        isOpen={exerciseModalOpen}
        onClose={() => !exporting && setExerciseModalOpen(false)}
        title="Exportar Ejercicio(s)"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setExerciseModalOpen(false)}
              disabled={exporting}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleExportExercises}
              disabled={exporting || selectedExerciseIds.size === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exporting ? (
                <><Loader2 size={14} className="animate-spin" /> Exportando…</>
              ) : (
                <><Dumbbell size={14} />{selectedExerciseIds.size > 0 ? `Exportar (${selectedExerciseIds.size})` : 'Exportar'}</>
              )}
            </button>
          </div>
        }
      >
        {loadingExercises ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="text-primary-500 animate-spin" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle size={32} className="text-gray-600" />
            <p className="text-gray-400 text-sm">No hay ejercicios creados todavía.</p>
          </div>
        ) : (
          <div className="space-y-2 -mx-1 px-1">
            {/* Buscador */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                placeholder="Buscar ejercicio…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500"
              />
              {exerciseSearch && (
                <button
                  onClick={() => setExerciseSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Seleccionar todo (respeta búsqueda activa) */}
            {filteredExercises.length > 0 && (
              <>
                <button
                  onClick={toggleAllExercises}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-800/60 transition-colors text-left"
                >
                  <Checkbox checked={allExercisesSelected} indeterminate={someExercisesSelected} />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {allExercisesSelected ? 'Deseleccionar visibles' : 'Seleccionar visibles'}
                    {exerciseSearch && ` (${filteredExercises.length})`}
                  </span>
                </button>
                <div className="border-t border-gray-800" />
              </>
            )}

            {/* Lista de ejercicios */}
            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {filteredExercises.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Sin resultados</p>
              ) : (
                filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => toggleExercise(ex.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-colors text-left"
                  >
                    <Checkbox checked={selectedExerciseIds.has(ex.id)} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white block truncate">{ex.name}</span>
                      {(ex.primary_muscle_name || ex.difficulty_name) && (
                        <span className="text-[11px] text-gray-500 truncate block">
                          {[ex.primary_muscle_name, ex.difficulty_name].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Contador de seleccionados */}
            {selectedExerciseIds.size > 0 && (
              <p className="text-[11px] text-sky-400 text-center pt-1">
                {selectedExerciseIds.size} ejercicio{selectedExerciseIds.size !== 1 ? 's' : ''} seleccionado{selectedExerciseIds.size !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal: confirmar importación ──────────────────────────────────── */}
      <Modal
        isOpen={confirmImportOpen}
        onClose={handleCancelImport}
        title={detectedZipType === 'class' ? 'Importar clase' : 'Importar ejercicios'}
        size="md"
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
              className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Download size={14} />
              Sí, importar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20">
            {detectedZipType === 'class' ? (
              <Share2 size={28} className="text-violet-400" />
            ) : (
              <Dumbbell size={28} className="text-violet-400" />
            )}
          </div>
          <div>
            <p className="text-white text-base font-bold mb-2">
              {detectedZipType === 'class'
                ? '¿Importar esta clase?'
                : '¿Importar estos ejercicios?'}
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              {detectedZipType === 'class'
                ? 'Se agregarán las clases y ejercicios nuevos a tu aplicación.'
                : 'Se agregarán los ejercicios nuevos a tu biblioteca.'}
              {' '}
              <span className="text-gray-300 font-semibold">
                Los datos que ya tenés no se modificarán.
              </span>
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800">
              <FileArchive size={14} className="text-violet-400 shrink-0" />
              <span className="text-violet-400 text-xs font-mono truncate max-w-[200px]">
                {pendingFileName}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Sub-componente: Checkbox ─────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  return (
    <div
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked || indeterminate
          ? 'bg-emerald-500 border-emerald-500'
          : 'border-gray-600'
      }`}
    >
      {(checked || indeterminate) && (
        <Check size={12} className="text-white" strokeWidth={3} />
      )}
    </div>
  );
}
