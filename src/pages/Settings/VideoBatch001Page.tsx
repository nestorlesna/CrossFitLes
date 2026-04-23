// Selección interactiva de videos cortos — Batch 001 / GOAT 22/04/2026
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateVideosBatch001 } from '../../services/videosBatch001UpdateService';
import { BATCH_001_VIDEO_PAIRS, ExerciseVideoPair } from '../../data/batch001VideoPairs';
import { Modal } from '../../components/ui/Modal';

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const shorts = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shorts) return shorts[1];
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return watch[1];
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const embed = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embed) return embed[1];
  return null;
}

function getThumbnailUrl(url: string): string {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
}

function getEmbedUrl(url: string): string {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : '';
}

// ── Sub-componente: tarjeta de un ejercicio con 2 videos ───────────────────────

function VideoPairCard({
  pair,
  selected,
  onSelect,
  onPreview,
}: {
  pair: ExerciseVideoPair;
  selected: 'A' | 'B' | undefined;
  onSelect: (choice: 'A' | 'B') => void;
  onPreview: (url: string) => void;
}) {
  const thumbA = getThumbnailUrl(pair.videoA);
  const thumbB = getThumbnailUrl(pair.videoB);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white">{pair.exerciseName}</span>
        {selected && (
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            Video {selected} ✓
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(['A', 'B'] as const).map((choice) => {
          const thumb = choice === 'A' ? thumbA : thumbB;
          const url = choice === 'A' ? pair.videoA : pair.videoB;
          const isSelected = selected === choice;

          return (
            <div key={choice} className="relative">
              <button
                onClick={() => onSelect(choice)}
                className={`w-full relative rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500 shadow-emerald-500/20 shadow-lg'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={`Video ${choice}`}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Sin thumbnail</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {choice}
                </div>
                {isSelected && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <div className="bg-emerald-500 rounded-full p-1">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>

              {/* Botón preview */}
              <button
                onClick={(e) => { e.stopPropagation(); onPreview(url); }}
                className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-lg p-1 transition-colors"
              >
                <Play size={12} fill="white" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export function VideoBatch001Page() {
  const navigate = useNavigate();
  const [selections, setSelections] = useState<Record<string, 'A' | 'B'>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCount = Object.keys(selections).length;
  const total = BATCH_001_VIDEO_PAIRS.length;

  const filtered = filter
    ? BATCH_001_VIDEO_PAIRS.filter(p =>
        p.exerciseName.toLowerCase().includes(filter.toLowerCase())
      )
    : BATCH_001_VIDEO_PAIRS;

  const handleSelect = (name: string, choice: 'A' | 'B') => {
    setSelections(prev => ({ ...prev, [name]: choice }));
  };

  const handleSelectAll = (choice: 'A' | 'B') => {
    const all: Record<string, 'A' | 'B'> = {};
    BATCH_001_VIDEO_PAIRS.forEach(p => { all[p.exerciseName] = choice; });
    setSelections(all);
  };

  const handleApply = async () => {
    if (selectedCount === 0) return;
    setLoading(true);
    try {
      const result = await updateVideosBatch001(selections);
      let msg = `${result.updated} video${result.updated !== 1 ? 's' : ''} asignado${result.updated !== 1 ? 's' : ''}`;
      if (result.skippedNoExercise > 0) msg += ` · ${result.skippedNoExercise} ejercicios no encontrados`;
      toast.success(msg);
      navigate(-1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-gray-950 border-b border-gray-800 flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-white leading-tight">Videos cortos — GOAT 22/04</h1>
          <p className="text-[11px] text-gray-500">Asignar video_path</p>
        </div>
        <span className="text-sm font-semibold text-gray-400">
          {selectedCount}<span className="text-gray-600">/{total}</span>
        </span>
      </div>

      <div className="px-4 pt-3 pb-36 space-y-3">
        {/* Búsqueda */}
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar ejercicio…"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
        />

        {/* Acciones rápidas */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSelectAll('A')}
            className="flex-1 py-2 text-xs font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-xl hover:border-primary-500/50 transition-colors"
          >
            Todos A
          </button>
          <button
            onClick={() => handleSelectAll('B')}
            className="flex-1 py-2 text-xs font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-xl hover:border-primary-500/50 transition-colors"
          >
            Todos B
          </button>
          <button
            onClick={() => setSelections({})}
            className="flex-1 py-2 text-xs font-bold text-gray-400 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            Limpiar
          </button>
        </div>

        {/* Lista de pares */}
        {filtered.map(pair => (
          <VideoPairCard
            key={pair.exerciseName}
            pair={pair}
            selected={selections[pair.exerciseName]}
            onSelect={(choice) => handleSelect(pair.exerciseName, choice)}
            onPreview={setPreviewUrl}
          />
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-8">Sin resultados</p>
        )}
      </div>

      {/* Botón fijo inferior */}
      <div className="fixed bottom-16 left-0 right-0 z-[60] px-4 py-3 bg-gray-950/90 backdrop-blur-sm border-t border-gray-800">
        <button
          onClick={handleApply}
          disabled={selectedCount === 0 || loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {loading ? 'Aplicando…' : `Aplicar ${selectedCount} video${selectedCount !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Modal preview */}
      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Preview de video"
        size="md"
      >
        {previewUrl && (
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={getEmbedUrl(previewUrl)}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        )}
      </Modal>
    </>
  );
}
