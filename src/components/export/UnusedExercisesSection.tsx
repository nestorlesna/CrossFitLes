// Sección para limpiar el catálogo: borra los ejercicios que no se usan en ninguna
// clase, sesión ni récord personal. El borrado es físico y no se puede deshacer,
// por eso primero se lista todo lo que se va a eliminar y se puede desmarcar.
import { useState } from 'react';
import { Trash2, Search, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { getUnusedExercises, deleteUnusedExercises, UnusedExerciseRow } from '../../db/repositories/exerciseRepo';

export function UnusedExercisesSection() {
  const [unused, setUnused] = useState<UnusedExerciseRow[] | null>(null);
  const [ignoreInactiveClasses, setIgnoreInactiveClasses] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleScan() {
    setScanning(true);
    try {
      const rows = await getUnusedExercises(ignoreInactiveClasses);
      setUnused(rows);
      setSelected(new Set(rows.map((r) => r.id)));
      if (rows.length === 0) toast.success('No hay ejercicios sin uso: el catálogo ya está limpio');
    } catch (error) {
      toast.error(`Error al analizar: ${error instanceof Error ? error.message : 'Desconocido'}`);
    } finally {
      setScanning(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!unused) return;
    setSelected((prev) => (prev.size === unused.length ? new Set() : new Set(unused.map((u) => u.id))));
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const deleted = await deleteUnusedExercises([...selected], ignoreInactiveClasses);
      toast.success(`${deleted} ejercicio${deleted === 1 ? '' : 's'} eliminado${deleted === 1 ? '' : 's'}`);
      const remaining = (unused ?? []).filter((u) => !selected.has(u.id));
      setUnused(remaining);
      setSelected(new Set(remaining.map((r) => r.id)));
      setConfirmOpen(false);
    } catch (error) {
      toast.error(`Error al eliminar: ${error instanceof Error ? error.message : 'Desconocido'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="mt-6">
        <h2 className="text-xs font-semibold text-primary-400/80 uppercase tracking-wider mb-3 px-1">
          Limpiar ejercicios sin uso
        </h2>
        <p className="text-[11px] text-gray-500 px-1 mb-3 leading-relaxed">
          Busca los ejercicios que no aparecen en ninguna clase, sesión ni récord personal y los
          elimina del catálogo. El borrado es definitivo: conviene exportar un backup antes.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <label className="flex items-start gap-3 px-1 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreInactiveClasses}
              onChange={(e) => {
                setIgnoreInactiveClasses(e.target.checked);
                setUnused(null);
                setSelected(new Set());
              }}
              className="w-4 h-4 accent-primary-500 shrink-0 mt-0.5"
            />
            <span className="text-[11px] text-gray-400 leading-relaxed">
              Ignorar las clases inactivas: los ejercicios que sólo figuran en clases dadas de baja
              también se consideran sin uso (se borran junto con esas apariciones).
            </span>
          </label>

          <button
            onClick={handleScan}
            disabled={scanning || busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-700 hover:border-primary-600 transition-colors text-sm font-semibold text-gray-200 disabled:opacity-50"
          >
            {scanning ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {unused === null ? 'Analizar catálogo' : 'Volver a analizar'}
          </button>

          {unused !== null && unused.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400 px-1">
              <CheckCircle2 size={16} className="text-primary-500 shrink-0" />
              Todos los ejercicios están en uso.
            </div>
          )}

          {unused !== null && unused.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-gray-400">
                  <span className="text-white font-bold">{unused.length}</span> sin uso ·{' '}
                  <span className="text-white font-bold">{selected.size}</span> seleccionado
                  {selected.size === 1 ? '' : 's'}
                </p>
                <button
                  onClick={toggleAll}
                  className="text-[11px] font-bold uppercase tracking-wider text-primary-400"
                >
                  {selected.size === unused.length ? 'Ninguno' : 'Todos'}
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-800 border border-gray-800 rounded-xl">
                {unused.map((ex) => (
                  <label
                    key={ex.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-800/40"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(ex.id)}
                      onChange={() => toggle(ex.id)}
                      className="w-4 h-4 accent-primary-500 shrink-0"
                    />
                    {ex.image_url ? (
                      <img src={ex.image_url} alt="" className="w-8 h-8 rounded-lg bg-gray-950 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-950 shrink-0" />
                    )}
                    <span className="text-sm text-gray-200 truncate flex-1">{ex.name}</span>
                    {ex.inactive_class_count > 0 && (
                      <span className="text-[10px] font-bold uppercase text-amber-500/80 shrink-0">
                        {ex.inactive_class_count} clase{ex.inactive_class_count === 1 ? '' : 's'} inactiva
                        {ex.inactive_class_count === 1 ? '' : 's'}
                      </span>
                    )}
                    {ex.is_active === 0 && (
                      <span className="text-[10px] font-bold uppercase text-gray-600 shrink-0">Inactivo</span>
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={() => setConfirmOpen(true)}
                disabled={selected.size === 0 || busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-40"
              >
                <Trash2 size={16} />
                Eliminar {selected.size} ejercicio{selected.size === 1 ? '' : 's'}
              </button>
            </>
          )}
        </div>
      </section>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Eliminar ejercicios sin uso"
        footer={
          <div className="flex gap-3 w-full">
            <button
              className="flex-1 border border-gray-700 text-gray-400 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              onClick={() => setConfirmOpen(false)}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 leading-relaxed">
              Se van a borrar <span className="font-bold text-white">{selected.size}</span> ejercicios
              con sus músculos, equipamiento, tags, unidades e imágenes asociadas. No se puede deshacer.
            </p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Ninguno figura en sesiones ni récords, así que no se pierde nada del historial de
            entrenamiento.{' '}
            {ignoreInactiveClasses
              ? 'Los que aparecen en clases inactivas se borran también de esas clases.'
              : 'Tampoco figuran en ninguna clase.'}{' '}
            Si alguno pasó a usarse desde el análisis, se saltea.
          </p>
        </div>
      </Modal>
    </>
  );
}
