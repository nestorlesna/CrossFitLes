// Página interactiva para seleccionar videos cortos (Batch 003)
// Muestra 2 videos por ejercicio lado a lado, el usuario elige cuál asignar a video_path.

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Play, Save, Loader2, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateVideosBatch003 } from '../../services/videosBatch003UpdateService';
import { BATCH_003_VIDEO_PAIRS } from '../../data/batch003VideoPairs';
import { Modal } from '../../components/ui/Modal';

// Extraer ID de YouTube de una URL
function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([\w-]{11})/);
  return match?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

function VideoEmbed({ url }: { url: string }) {
  const youtubeId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);

  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-800">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-800">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          title="Vimeo video player"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors group"
    >
      <span className="text-sm text-gray-200 truncate max-w-[200px]">{url}</span>
      <span className="text-xs text-primary-500 font-medium">Ver enlace</span>
    </a>
  );
}

function VideoThumb({ url, label, selected, onSelect, onPreview }: {
  url: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const ytId = getYoutubeId(url);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border-2 transition-all ${
        selected
          ? 'border-primary-400 shadow-lg shadow-primary-500/20 scale-[1.02]'
          : 'border-gray-700 hover:border-gray-500'
      }`}
    >
      {/* Click para seleccionar */}
      <button
        onClick={onSelect}
        className="w-full block"
      >
        {ytId ? (
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt={label}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
            <Play size={32} className="text-gray-600" />
          </div>
        )}
      </button>

      {/* Overlay con badge */}
      <div className="absolute top-1.5 left-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          selected ? 'bg-primary-500 text-white' : 'bg-gray-900/80 text-gray-300'
        }`}>
          {label}
        </span>
      </div>

      {/* Botón de play para preview */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
        className="absolute bottom-1.5 right-1.5 bg-gray-900/80 hover:bg-primary-500 rounded-full p-1.5 transition-colors"
      >
        <Play size={12} className="text-white" fill="currentColor" />
      </button>

      {/* Check cuando está seleccionado */}
      {selected && (
        <div className="absolute top-1.5 right-1.5">
          <div className="bg-primary-500 rounded-full p-1">
            <Check size={12} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseVideoRow({ exerciseName, videoA, videoB, selection, onSelection, onPreview }: {
  exerciseName: string;
  videoA: string;
  videoB: string;
  selection: 'A' | 'B' | null;
  onSelection: (choice: 'A' | 'B') => void;
  onPreview: (url: string, label: string) => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 space-y-2.5">
      {/* Nombre del ejercicio */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-white truncate">{exerciseName}</span>
        {selection && (
          <span className="text-[10px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full shrink-0">
            Video {selection}
          </span>
        )}
      </div>

      {/* Videos lado a lado */}
      <div className="grid grid-cols-2 gap-2">
        <VideoThumb
          url={videoA}
          label="A"
          selected={selection === 'A'}
          onSelect={() => onSelection('A')}
          onPreview={() => onPreview(videoA, 'A')}
        />
        <VideoThumb
          url={videoB}
          label="B"
          selected={selection === 'B'}
          onSelect={() => onSelection('B')}
          onPreview={() => onPreview(videoB, 'B')}
        />
      </div>
    </div>
  );
}

export function VideoBatch003Page() {
  const navigate = useNavigate();
  const [selections, setSelections] = useState<Record<string, 'A' | 'B'>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoLabel, setPreviewVideoLabel] = useState('');

  const handleSelection = useCallback((exerciseName: string, choice: 'A' | 'B') => {
    setSelections(prev => ({ ...prev, [exerciseName]: choice }));
  }, []);

  const selectedCount = Object.keys(selections).length;
  const totalCount = BATCH_003_VIDEO_PAIRS.length;

  const filteredPairs = search
    ? BATCH_003_VIDEO_PAIRS.filter(p =>
        p.exerciseName.toLowerCase().includes(search.toLowerCase())
      )
    : BATCH_003_VIDEO_PAIRS;

  const handleSave = async () => {
    if (selectedCount === 0) {
      toast.error('Selecciona al menos un video');
      return;
    }

    const unselected = BATCH_003_VIDEO_PAIRS.filter(p => !selections[p.exerciseName]);
    if (unselected.length > 0) {
      toast.warning(
        `${unselected.length} ejercicio${unselected.length !== 1 ? 's' : ''} sin seleccionar. Se omitirán.`,
        { duration: 4000 }
      );
    }

    setSaving(true);
    try {
      const result = await updateVideosBatch003(selections);

      let msg = `${result.updated} video${result.updated !== 1 ? 's' : ''} asignado${result.updated !== 1 ? 's' : ''}`;
      if (result.skippedNoExercise > 0) msg += ` · ${result.skippedNoExercise} no encontrados`;
      if (result.skippedNoVideo > 0) msg += ` · ${result.skippedNoVideo} omitidos`;
      toast.success(msg);

      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      toast.error(
        `Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (choice: 'A' | 'B') => {
    const newSelections: Record<string, 'A' | 'B'> = {};
    for (const pair of BATCH_003_VIDEO_PAIRS) {
      newSelections[pair.exerciseName] = choice;
    }
    setSelections(newSelections);
  };

  const handleClearAll = () => {
    setSelections({});
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <h1 className="text-base font-bold text-white">Seleccionar Videos Cortos</h1>
        <span className="text-xs text-gray-500 ml-auto">{selectedCount}/{totalCount}</span>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Barra de búsqueda */}
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
        />

        {/* Acciones rápidas */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSelectAll('A')}
            className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors"
          >
            Todos A
          </button>
          <button
            onClick={() => handleSelectAll('B')}
            className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors"
          >
            Todos B
          </button>
          <button
            onClick={handleClearAll}
            className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors"
          >
            Limpiar
          </button>
        </div>

        {/* Warning si hay sin seleccionar */}
        {selectedCount > 0 && selectedCount < totalCount && (
          <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{totalCount - selectedCount} ejercicio{totalCount - selectedCount !== 1 ? 's' : ''} sin seleccionar</span>
          </div>
        )}

        {/* Lista de ejercicios */}
        <div className="space-y-3">
          {filteredPairs.map(pair => (
            <ExerciseVideoRow
              key={pair.exerciseName}
              exerciseName={pair.exerciseName}
              videoA={pair.videoA}
              videoB={pair.videoB}
              selection={selections[pair.exerciseName] ?? null}
              onSelection={(choice) => handleSelection(pair.exerciseName, choice)}
              onPreview={(url, label) => {
                setPreviewVideoUrl(url);
                setPreviewVideoLabel(`${pair.exerciseName} — Video ${label}`);
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom bar fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-3 z-[60]">
        <button
          onClick={handleSave}
          disabled={saving || selectedCount === 0}
          className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />
              Aplicar {selectedCount} video{selectedCount !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* Modal de preview de video */}
      <Modal
        isOpen={Boolean(previewVideoUrl)}
        onClose={() => setPreviewVideoUrl(null)}
        title={previewVideoLabel}
        size="md"
      >
        <div className="flex flex-col gap-4">
          {previewVideoUrl && <VideoEmbed url={previewVideoUrl} />}
          <p className="text-xs text-gray-500 text-center">
            Tocá fuera del video o la ✕ para volver a la selección.
          </p>
        </div>
      </Modal>
    </>
  );
}
