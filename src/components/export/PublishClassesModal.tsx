// Selección de clases al publicar los canales de contenido, en una sola pantalla.
// Izquierda: contenido público; derecha: MI contenido (cifrado). En cada columna, arriba las
// clases locales que todavía no están en el canal (desmarcadas en el público, marcadas en
// "MI contenido") y abajo, colapsadas, las que ya están publicadas y van siempre.
// Un solo botón publica los canales presentes.
import { useEffect, useState } from 'react';
import { CheckSquare, ChevronDown, ChevronRight, Lock, Square } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { PublishDraft } from '../../services/contentPublishService';
import type { ContentChannel } from '../../services/contentFormat';

export type PublishDrafts = Partial<Record<ContentChannel, PublishDraft>>;
export type PublishSelection = Partial<Record<ContentChannel, string[]>>;

interface Props {
  drafts: PublishDrafts | null;
  onClose: () => void;
  onConfirm: (selection: PublishSelection) => void;
}

interface ColumnProps {
  draft: PublishDraft;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

function ChannelColumn({ draft, selected, onChange }: ColumnProps) {
  const [showPublished, setShowPublished] = useState(false);
  const isMine = draft.channel === 'mine';
  const allSelected = draft.newClasses.length > 0 && selected.size === draft.newClasses.length;

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  const toggleAll = () => onChange(allSelected ? new Set() : new Set(draft.newClasses.map((c) => c.key)));

  return (
    <div className="min-w-0">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-white mb-1">
        {isMine && <Lock size={14} className="text-amber-400" />}
        {isMine ? 'Publicar MI contenido' : 'Publicar contenido'}
      </h3>
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
    </div>
  );
}

export function PublishClassesModal({ drafts, onClose, onConfirm }: Props) {
  const [selection, setSelection] = useState<Record<ContentChannel, Set<string>>>({
    public: new Set(),
    mine: new Set(),
  });

  useEffect(() => {
    if (!drafts) return;
    setSelection({
      public: new Set(),
      mine: new Set(drafts.mine?.newClasses.map((c) => c.key) ?? []),
    });
  }, [drafts]);

  if (!drafts) return null;

  const channels = (['public', 'mine'] as ContentChannel[]).filter((ch) => drafts[ch]);
  const total = channels.reduce((n, ch) => n + selection[ch].size, 0);

  const confirm = () => {
    const result: PublishSelection = {};
    for (const ch of channels) result[ch] = [...selection[ch]];
    onConfirm(result);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={channels.length > 1 ? 'Publicar contenido y MI contenido' : 'Publicar contenido'}
      size="xl"
      maxHeightClass="max-h-[75vh]"
      footer={
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-gray-950 text-sm font-bold"
          >
            Publicar{total > 0 ? ` (+${total})` : ''}
          </button>
        </div>
      }
    >
      <div className={`grid gap-6 ${channels.length > 1 ? 'md:grid-cols-2 md:divide-x md:divide-gray-800' : ''}`}>
        {channels.map((ch) => (
          <div key={ch} className={ch === 'mine' && channels.length > 1 ? 'md:pl-6' : ''}>
            <ChannelColumn
              draft={drafts[ch]!}
              selected={selection[ch]}
              onChange={(next) => setSelection((prev) => ({ ...prev, [ch]: next }))}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
