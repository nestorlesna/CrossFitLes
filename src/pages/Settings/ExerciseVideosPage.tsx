import { useEffect, useState } from 'react';
import { ChevronLeft, Dumbbell, ExternalLink, Video, VideoOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { getDatabase } from '../../db/database';

interface ExerciseWithVideo {
  id: string;
  name: string;
  image_url: string;
  video_url: string;      // video_long_path o video_path
  in_classes: number;
}

interface ExerciseWithoutVideo {
  id: string;
  name: string;
  image_url: string;
  in_classes: number;
}

// Extrae el ID de YouTube de una URL (shorts o watch)
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const m =
    url.match(/youtube\.com\/shorts\/([^?&/]+)/) ??
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ??
    url.match(/youtu\.be\/([^?&/]+)/);
  return m?.[1] ?? null;
}

function YouTubeThumbnail({ url, name }: { url: string; name: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <img
        src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return <Video size={20} className="text-gray-600" />;
}

export function ExerciseVideosPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'con' | 'sin'>('con');
  const [withRows, setWithRows] = useState<ExerciseWithVideo[]>([]);
  const [withoutRows, setWithoutRows] = useState<ExerciseWithoutVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    setLoading(true);
    Promise.all([
      // Con video: primero los que están en clases, luego los que no
      db.query(
        `SELECT e.id, e.name, e.image_url,
         COALESCE(NULLIF(e.video_long_path, ''), NULLIF(e.video_path, '')) as video_url,
         CASE WHEN EXISTS (SELECT 1 FROM section_exercise se WHERE se.exercise_id = e.id) THEN 1 ELSE 0 END as in_classes
         FROM exercise e
         WHERE e.is_active = 1
           AND (NULLIF(e.video_long_path, '') IS NOT NULL OR NULLIF(e.video_path, '') IS NOT NULL)
         ORDER BY in_classes DESC, e.name ASC`
      ),
      // Sin video: primero los que están en clases, luego los que no
      db.query(
        `SELECT e.id, e.name, e.image_url,
         CASE WHEN EXISTS (SELECT 1 FROM section_exercise se WHERE se.exercise_id = e.id) THEN 1 ELSE 0 END as in_classes
         FROM exercise e
         WHERE e.is_active = 1
           AND NULLIF(e.video_long_path, '') IS NULL
           AND NULLIF(e.video_path, '') IS NULL
         ORDER BY in_classes DESC, e.name ASC`
      ),
    ]).then(([withRes, withoutRes]) => {
      setWithRows((withRes.values ?? []) as ExerciseWithVideo[]);
      setWithoutRows((withoutRes.values ?? []) as ExerciseWithoutVideo[]);
    }).finally(() => setLoading(false));
  }, []);

  const withInClasses    = withRows.filter(r => r.in_classes === 1);
  const withNotInClasses = withRows.filter(r => r.in_classes === 0);
  const withoutInClasses    = withoutRows.filter(r => r.in_classes === 1);
  const withoutNotInClasses = withoutRows.filter(r => r.in_classes === 0);

  return (
    <>
      <Header
        title="Videos de ejercicios"
        leftAction={
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="p-4 space-y-4">

        {/* Toggle con / sin */}
        <div className="flex bg-gray-900 border border-gray-800 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setMode('con')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === 'con'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Con video
            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${mode === 'con' ? 'bg-white/20' : 'bg-gray-800'}`}>
              {withRows.length}
            </span>
          </button>
          <button
            onClick={() => setMode('sin')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === 'sin'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sin video
            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${mode === 'sin' ? 'bg-white/20' : 'bg-gray-800'}`}>
              {withoutRows.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando videos...</p>
          </div>

        ) : mode === 'con' ? (
          <>
            {/* Resumen con video */}
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center border border-primary-500/20">
                  <Video size={20} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Ejercicios con video</p>
                  <p className="text-[11px] text-gray-500">
                    {withInClasses.length} en clases · {withNotInClasses.length} sin uso
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">{withRows.length}</span>
                <span className="text-[10px] text-gray-500 block uppercase tracking-widest">Ejercicios</span>
              </div>
            </div>

            {withRows.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
                <VideoOff size={40} className="text-gray-800 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Ningún ejercicio tiene video cargado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withInClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-primary-500 uppercase tracking-widest px-1 mb-2">
                      En clases ({withInClasses.length})
                    </p>
                    <VideoGrid rows={withInClasses} onNavigate={navigate} />
                  </div>
                )}
                {withNotInClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">
                      Sin uso en clases ({withNotInClasses.length})
                    </p>
                    <VideoGrid rows={withNotInClasses} onNavigate={navigate} />
                  </div>
                )}
              </div>
            )}

          </>

        ) : (
          <>
            {/* Resumen sin video */}
            <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <VideoOff size={20} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Sin video asignado</p>
                  <p className="text-[11px] text-gray-500">
                    {withoutInClasses.length} en clases · {withoutNotInClasses.length} sin uso
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">{withoutRows.length}</span>
                <span className="text-[10px] text-gray-500 block uppercase tracking-widest">Ejercicios</span>
              </div>
            </div>

            {withoutRows.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
                <Video size={40} className="text-gray-800 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Todos los ejercicios tienen video.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withoutInClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest px-1 mb-2">
                      En clases ({withoutInClasses.length})
                    </p>
                    <NoVideoList rows={withoutInClasses} onNavigate={navigate} />
                  </div>
                )}
                {withoutNotInClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">
                      Sin uso en clases ({withoutNotInClasses.length})
                    </p>
                    <NoVideoList rows={withoutNotInClasses} onNavigate={navigate} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function VideoGrid({
  rows,
  onNavigate,
}: {
  rows: ExerciseWithVideo[];
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {rows.map(row => (
        <div
          key={row.id}
          onClick={() => onNavigate(`/ejercicios/${row.id}/editar`)}
          className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col hover:border-primary-500/50 transition-all group active:scale-[0.98] cursor-pointer"
        >
          {/* Thumbnail YouTube */}
          <div className="relative h-24 bg-black/60 flex items-center justify-center overflow-hidden">
            <YouTubeThumbnail url={row.video_url} name={row.name} />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={16} className="text-white" />
            </div>
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1 py-0.5">
              <Video size={10} className="text-red-400" />
            </div>
          </div>
          {/* Nombre */}
          <div className="px-3 py-2">
            <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{row.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NoVideoList({
  rows,
  onNavigate,
}: {
  rows: ExerciseWithoutVideo[];
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
      {rows.map(row => (
        <button
          key={row.id}
          onClick={() => onNavigate(`/ejercicios/${row.id}/editar`)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left group"
        >
          {row.image_url ? (
            <img
              src={row.image_url}
              alt={row.name}
              className="w-10 h-10 rounded-lg object-cover shrink-0 bg-black/40"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
              <Dumbbell size={16} className="text-gray-600" />
            </div>
          )}
          <span className={`flex-1 text-sm font-medium truncate ${row.in_classes ? 'text-white' : 'text-gray-400'}`}>
            {row.name}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${row.in_classes ? 'text-amber-500' : 'text-gray-600'}`}>
            Agregar
          </span>
        </button>
      ))}
    </div>
  );
}
