// Selección de clases al publicar un canal de contenido.
// Arriba, las clases locales que todavía no están en el canal (desmarcadas en el público,
// marcadas en "MI contenido"); abajo, colapsadas, las que ya están publicadas y van siempre.
import { useEffect, useState } from 'react';
import { CheckSquare, ChevronDown, ChevronRight, Square } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { PublishDraft } from '../../services/contentPublishService';

interface Props {
  draft: PublishDraft | null;
  onClose: () => void;
  onConfirm: (selectedKeys: string[]) => void;
}

export function PublishClassesModal({ draft, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPublished, setShowPublished] = useState(false);

  useEffect(() => {
    if (!draft) return;
    setSelected(new Set(draft.channel === 'mine' ? draft.newClasses.map((c) => c.key) : []));
    setShowPublished(false);
  }, [draft]);

  if (!draft) return null;

  const isMine = draft.channel === 'mine';
  const allSelected = draft.newClasses.length > 0 && selected.size === draft.newClasses.length;

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(draft.newClasses.map((c) => c.key)));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isMine ? 'Publicar MI contenido' : 'Publicar contenido'}
      footer={
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm([...selected])}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-gray-950 text-sm font-bold"
          >
            Publicar{selected.size > 0 ? ` (+${selected.size})` : ''}
          </button>
        </div>
      }
    >
      <p className="text-[11px] text-gray-500 mb-3">
        Ejercicios, catálogos y challenges van siempre. Elegí qué clases nuevas se suman a{' '}
        {isMine ? 'tu contenido (cifrado)' : 'el contenido público'}.
      </p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Clases nuevas ({draft.newClasses.length})
        </span>
        {draft.newClasses.length > 0 && (
          <button onClick={toggleAll} className="text-xs text-primary-400 font-semibold">
            {allSelected ? 'Desmarcar todas' : 'Marcar todas'}
          </button>
        )}
      </div>

      {draft.newClasses.length === 0 ? (
        <p className="text-xs text-gray-600 mb-4">No hay clases nuevas: se publican los cambios de las ya publicadas.</p>
      ) : (
        <div className="bg-gray-950 border border-gray-800 rounded-xl divide-y divide-gray-800 mb-4">
          {draft.newClasses.map((c) => (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left min-h-[44px]"
            >
              {selected.has(c.key) ? (
                <CheckSquare size={18} className="text-amber-400 shrink-0" />
              ) : (
                <Square size={18} className="text-gray-600 shrink-0" />
              )}
              <span className="text-sm text-white">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowPublished((v) => !v)}
        className="w-full flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider py-1"
      >
        {showPublished ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Ya publicadas ({draft.publishedClasses.length})
      </button>
      {showPublished && draft.publishedClasses.length > 0 && (
        <div className="mt-2 space-y-1">
          {draft.publishedClasses.map((c) => (
            <p key={c.key} className="text-xs text-gray-500 px-1">
              {c.name}
            </p>
          ))}
        </div>
      )}
    </Modal>
  );
}
