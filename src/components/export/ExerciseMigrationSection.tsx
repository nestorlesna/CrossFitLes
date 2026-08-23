// Sección para fusionar ejercicios duplicados: reasigna clases, sesiones y récords
// del ejercicio origen al destino, y elimina el origen.
import { useEffect, useState } from 'react';
import { GitMerge, Search, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { getAll, getUsageCounts, getSharedUsage, migrateExercise } from '../../db/repositories/exerciseRepo';
import { Exercise } from '../../models/Exercise';

type PickerTarget = 'source' | 'target' | null;

export function ExerciseMigrationSection() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [source, setSource] = useState<Exercise | null>(null);
  const [target, setTarget] = useState<Exercise | null>(null);
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [search, setSearch] = useState('');
  const [usage, setUsage] = useState<{ sectionExerciseCount: number; sessionResultCount: number; personalRecordCount: number } | null>(null);
  const [shared, setShared] = useState<{ sharedSections: number; sharedSessions: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAll().then(setExercises);
  }, []);

  useEffect(() => {
    if (!source) {
      setUsage(null);
      return;
    }
    getUsageCounts(source.id).then(setUsage);
  }, [source]);

  useEffect(() => {
    if (!source || !target) {
      setShared(null);
      return;
    }
    getSharedUsage(source.id, target.id).then(setShared);
  }, [source, target]);

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  function openPicker(which: Exclude<PickerTarget, null>) {
    setSearch('');
    setPicker(which);
  }

  function handleSelect(exercise: Exercise) {
    if (picker === 'source') {
      setSource(exercise);
      if (target?.id === exercise.id) setTarget(null);
    } else if (picker === 'target') {
      setTarget(exercise);
      if (source?.id === exercise.id) setSource(null);
    }
    setPicker(null);
  }

  async function handleMigrate() {
    if (!source || !target) return;
    setBusy(true);
    try {
      const result = await migrateExercise(source.id, target.id);
      toast.success(
        `"${source.name}" fusionado en "${target.name}" (${result.sectionExerciseCount} clases, ${result.sessionResultCount} sesiones, ${result.personalRecordCount} récords reasignados)`
      );
      setExercises((prev) => prev.filter((e) => e.id !== source.id));
      setSource(null);
      setTarget(null);
      setUsage(null);
      setShared(null);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(`Error al migrar: ${error instanceof Error ? error.message : 'Desconocido'}`);
    } finally {
      setBusy(false);
    }
  }

  const totalAffected = usage
    ? usage.sectionExerciseCount + usage.sessionResultCount + usage.personalRecordCount
    : 0;

  return (
    <>
      <section className="mt-6">
        <h2 className="text-xs font-semibold text-primary-400/80 uppercase tracking-wider mb-3 px-1">
          Migrar / fusionar ejercicios
        </h2>
        <p className="text-[11px] text-gray-500 px-1 mb-3 leading-relaxed">
          Para unificar ejercicios duplicados o similares: elegí un ejercicio de origen y uno de destino.
          Todas las clases, sesiones y récords que usan el origen pasarán a usar el destino, y el origen se eliminará.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          {/* Selector origen */}
          <button
            onClick={() => openPicker('source')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-700 hover:border-primary-600 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 text-red-400 text-[10px] font-bold uppercase">
              De
            </div>
            <div className="flex-1 min-w-0">
              {source ? (
                <span className="text-sm text-white block truncate">{source.name}</span>
              ) : (
                <span className="text-sm text-gray-500">Elegir ejercicio origen...</span>
              )}
            </div>
          </button>

          <div className="flex justify-center">
            <ArrowRight size={16} className="text-gray-600" />
          </div>

          {/* Selector destino */}
          <button
            onClick={() => openPicker('target')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-700 hover:border-primary-600 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 text-green-400 text-[10px] font-bold uppercase">
              A
            </div>
            <div className="flex-1 min-w-0">
              {target ? (
                <span className="text-sm text-white block truncate">{target.name}</span>
              ) : (
                <span className="text-sm text-gray-500">Elegir ejercicio destino...</span>
              )}
            </div>
          </button>

          {/* Resumen de uso del origen */}
          {source && usage && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-black/20 p-2 rounded-xl border border-gray-800 text-center">
                <span className="text-white text-sm font-black block leading-none">{usage.sectionExerciseCount}</span>
                <span className="text-[8px] text-gray-500 uppercase">Clases</span>
              </div>
              <div className="bg-black/20 p-2 rounded-xl border border-gray-800 text-center">
                <span className="text-white text-sm font-black block leading-none">{usage.sessionResultCount}</span>
                <span className="text-[8px] text-gray-500 uppercase">Sesiones</span>
              </div>
              <div className="bg-black/20 p-2 rounded-xl border border-gray-800 text-center">
                <span className="text-white text-sm font-black block leading-none">{usage.personalRecordCount}</span>
                <span className="text-[8px] text-gray-500 uppercase">Récords</span>
              </div>
            </div>
          )}

          {/* Aviso: origen y destino ya coexisten en la misma sección/sesión */}
          {shared && (shared.sharedSections > 0 || shared.sharedSessions > 0) && (
            <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-xl">
              <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-200/80 leading-relaxed">
                Origen y destino ya aparecen juntos en {shared.sharedSections} sección(es) de clase y {shared.sharedSessions} sesión(es).
                Ahí quedará el ejercicio duplicado dos veces tras la fusión — convendrá revisar y borrar la fila sobrante a mano.
              </p>
            </div>
          )}

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!source || !target || busy}
            className="w-full flex items-center justify-center gap-2 py-3 mt-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl text-sm font-bold transition active:scale-[0.98]"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <GitMerge size={16} />}
            Fusionar ejercicios
          </button>
        </div>
      </section>

      {/* Modal: selector de ejercicio */}
      <Modal
        isOpen={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === 'source' ? 'Elegir ejercicio origen' : 'Elegir ejercicio destino'}
      >
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input aria-label="Buscar ejercicio"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
              // El modal acaba de abrirse: el foco pertenece al campo de busqueda
              // react-doctor-disable-next-line react-doctor/no-autofocus
              autoFocus
            />
          </div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Sin resultados</div>
            ) : (
              filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-colors min-h-[44px] flex items-center gap-3 border border-transparent hover:border-gray-700"
                >
                  <span className="text-sm text-white truncate">{exercise.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: confirmación de fusión */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Fusionar ejercicios?"
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={() => setConfirmOpen(false)} className="flex-1 py-2 text-sm text-gray-400">Cancelar</button>
            <button
              onClick={handleMigrate}
              disabled={busy}
              className="flex-2 py-2 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold text-center"
            >
              {busy ? 'Fusionando...' : 'Sí, fusionar y eliminar origen'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            <span className="text-white font-semibold">"{source?.name}"</span> será eliminado permanentemente.
            {totalAffected > 0 ? (
              <> Sus {usage?.sectionExerciseCount} clases, {usage?.sessionResultCount} sesiones y {usage?.personalRecordCount} récords pasarán a usar{' '}
                <span className="text-white font-semibold">"{target?.name}"</span>.</>
            ) : (
              <> No tiene clases, sesiones ni récords asociados.</>
            )}
            {' '}Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>
    </>
  );
}
