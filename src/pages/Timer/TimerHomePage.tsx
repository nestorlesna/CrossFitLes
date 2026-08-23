import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Repeat, AlarmClock, Flame, Waves, SlidersHorizontal,
  Play, Pencil, Copy, Trash2, PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { FreeTimerPreset, FreeTimerTemplate, PRESET_LABELS } from '../../models/FreeTimer';
import { summarizeFreeTimerConfig } from '../../services/freeTimerEngine';
import { getAll, remove, duplicate } from '../../db/repositories/freeTimerTemplateRepo';
import { onActivateKey } from '../../utils/a11y';

interface PresetTile {
  preset: FreeTimerPreset;
  icon: ReactNode;
  description: string;
}

const PRESET_TILES: PresetTile[] = [
  { preset: 'for_time', icon: <Clock size={22} />, description: 'Cronómetro ascendente' },
  { preset: 'amrap', icon: <Repeat size={22} />, description: 'Máximas rondas posibles' },
  { preset: 'emom', icon: <AlarmClock size={22} />, description: 'Cada minuto en punto' },
  { preset: 'tabata', icon: <Flame size={22} />, description: '20s / 10s x 8' },
  { preset: 'intervals_fixed', icon: <Waves size={22} />, description: 'Trabajo/descanso fijo' },
  { preset: 'intervals_variable', icon: <SlidersHorizontal size={22} />, description: 'Rondas a medida' },
];

export function TimerHomePage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FreeTimerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<FreeTimerTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await getAll());
    } catch {
      toast.error('Error al cargar las plantillas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDuplicate = async (id: string) => {
    try {
      await duplicate(id);
      toast.success('Plantilla duplicada');
      load();
    } catch {
      toast.error('Error al duplicar');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      toast.success('Plantilla eliminada');
      setToDelete(null);
      load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <>
      <Header title="Timer" />

      <div className="p-4 flex flex-col gap-6 pb-24">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Arranque rápido
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_TILES.map((tile) => (
              <button
                key={tile.preset}
                onClick={() => navigate(`/timer/nueva?preset=${tile.preset}`)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-left flex flex-col gap-2 active:scale-95 transition-transform"
              >
                <span className="text-primary-500">{tile.icon}</span>
                <span className="font-bold text-white text-sm">{PRESET_LABELS[tile.preset]}</span>
                <span className="text-xs text-gray-500">{tile.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Plantillas guardadas
            </h2>
            <button
              onClick={() => navigate('/timer/nueva')}
              className="text-primary-500 flex items-center gap-1 text-xs font-bold"
            >
              <PlusCircle size={16} />
              Nueva
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No guardaste ninguna plantilla todavía. Elegí un preset arriba para arrancar.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {templates.map((tpl) => {
                const config = JSON.parse(tpl.config_json);
                return (
                  <div
                    key={tpl.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3"
                  >
                    <button
                      onClick={() => navigate(`/timer/${tpl.id}/correr`)}
                      className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                      aria-label="Correr"
                    >
                      <Play size={18} fill="currentColor" />
                    </button>

                    <div
                      className="flex-1 min-w-0"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/timer/${tpl.id}/correr`)}
                      onKeyDown={onActivateKey(() => navigate(`/timer/${tpl.id}/correr`))}
                    >
                      <p className="font-bold text-white text-sm truncate">{tpl.name}</p>
                      <p className="text-xs text-gray-500">
                        {PRESET_LABELS[tpl.preset]} · {summarizeFreeTimerConfig(config)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => navigate(`/timer/${tpl.id}/editar`)}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(tpl.id)}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white"
                        aria-label="Duplicar"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => setToDelete(tpl)}
                        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-400"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Eliminar plantilla"
        footer={
          <div className="flex gap-3 w-full">
            <button
              className="flex-1 border border-gray-700 text-gray-400 rounded-xl px-4 py-3 text-sm font-semibold"
              onClick={() => setToDelete(null)}
            >
              Cancelar
            </button>
            <button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 text-sm font-bold"
              onClick={handleDelete}
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-400">
          ¿Eliminar &quot;{toDelete?.name}&quot;? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  );
}
