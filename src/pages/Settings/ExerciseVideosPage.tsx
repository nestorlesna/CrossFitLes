import { useEffect, useState } from 'react';
import { ChevronLeft, Dumbbell, Video, VideoOff, Play, ListTodo, ChevronRight, ChevronLeft as ChevronLeftIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Header } from '../../components/layout/Header';
import { getDatabase } from '../../db/database';
import { getImageDisplayUrl } from '../../services/mediaService';

type FilterType = 'noLong' | 'noShort' | 'all';

interface ExerciseRow {
  id: string;
  name: string;
  image_url: string;
  video_long_path: string;
  video_path: string;
  in_classes: number;
}

// Helper para obtener el ID de YouTube (incluye Shorts)
function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:shorts\/|v\/|embed\/)|youtu\.be\/|watch\?v=)([^#&?]+)/);
  return m ? m[1] : null;
}

// Helper para obtener el ID de Vimeo
function getVimeoId(url: string): string | null {
  const regExp = /vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\w+\/)?|showcase\/(?:\w+\/)?|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

// Miniatura de video embebido (misma técnica que el popup de clase)
function VideoThumb({ url }: { url: string }) {
  const youtubeId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);

  if (youtubeId) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-gray-800 bg-black" style={{ width: 240, height: 135 }}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
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
      <div className="relative rounded-lg overflow-hidden border border-gray-800 bg-black" style={{ width: 240, height: 135 }}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
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
      className="flex flex-col items-center justify-center gap-1 bg-gray-800 border border-dashed border-gray-700 rounded-lg text-center hover:bg-gray-700 transition-colors"
      style={{ width: 240, height: 135 }}
    >
      <Play size={24} className="text-gray-500" />
      <span className="text-xs text-gray-400 truncate w-full px-2">Enlace externo</span>
    </a>
  );
}

// Placeholder para video faltante
function NoVideo({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 bg-gray-800/30 border border-gray-800 rounded-lg" style={{ width: 240, height: 135 }}>
      <VideoOff size={24} className="text-gray-700" />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

// Miniatura de imagen de ejercicio
function ExerciseImageThumb({ imageUrl, name }: { imageUrl: string; name: string }) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getImageDisplayUrl(imageUrl).then(setResolvedUrl);
  }, [imageUrl]);

  if (!resolvedUrl || error) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-lg">
        <Dumbbell size={18} className="text-gray-600" />
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={name}
      className="w-full h-full object-cover rounded-lg"
      onError={() => setError(true)}
    />
  );
}

export function ExerciseVideosPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('noLong');
  const [rows, setRows] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    setLoading(true);
    db.query(
      `SELECT e.id, e.name, e.image_url, e.video_long_path, e.video_path,
       CASE WHEN EXISTS (SELECT 1 FROM section_exercise se WHERE se.exercise_id = e.id) THEN 1 ELSE 0 END as in_classes
       FROM exercise e
       WHERE e.is_active = 1
       ORDER BY in_classes DESC, e.name ASC`
    ).then(res => {
      setRows((res.values ?? []) as ExerciseRow[]);
    }).finally(() => setLoading(false));
  }, []);

  // Filtrado y ordenamiento según el filtro seleccionado
  const getFilteredRows = (): ExerciseRow[] => {
    if (filter === 'noLong') return rows.filter(r => !r.video_long_path);
    if (filter === 'noShort') return rows.filter(r => !r.video_path);
    // 'all': ordenar por disponibilidad de videos
    return [...rows].sort((a, b) => {
      // Score: ambos videos = 3, solo corto = 2, solo explicativo = 1, ninguno = 0
      const scoreA = (a.video_path ? 2 : 0) + (a.video_long_path ? 1 : 0);
      const scoreB = (b.video_path ? 2 : 0) + (b.video_long_path ? 1 : 0);
      return scoreB - scoreA;
    });
  };

  const filteredRows = getFilteredRows();

  const inClasses = filteredRows.filter(r => r.in_classes === 1);
  const notInClasses = filteredRows.filter(r => r.in_classes === 0);

  const noLongCount = rows.filter(r => !r.video_long_path).length;
  const noShortCount = rows.filter(r => !r.video_path).length;

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

      <div className="p-4 space-y-4 pb-24">
        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('noLong')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              filter === 'noLong'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Video size={14} />
            Sin explicativo ({noLongCount})
          </button>
          <button
            onClick={() => setFilter('noShort')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              filter === 'noShort'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Video size={14} />
            Sin corto ({noShortCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <ListTodo size={14} />
            Todos
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando...</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            {filter !== 'all' && (
              <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                    <VideoOff size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">
                      {filter === 'noLong' ? 'Sin video explicativo' : 'Sin video corto'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {inClasses.length} en clases · {notInClasses.length} sin uso
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-400">{filteredRows.length}</span>
                  <span className="text-[10px] text-gray-500 block uppercase tracking-widest">Ejercicios</span>
                </div>
              </div>
            )}

            {filteredRows.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
                <Video size={40} className="text-gray-800 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">
                  {filter === 'noLong' ? 'Todos tienen video explicativo' : 'Todos tienen video corto'}
                </p>
              </div>
            ) : filter === 'all' ? (
              /* ── Vista "Todos": tabla de 3 columnas ── */
              <div className="space-y-4">
                {inClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest px-1 mb-2">
                      En clases ({inClasses.length})
                    </p>
                    <AllExercisesTable rows={inClasses} onNavigate={navigate} />
                  </div>
                )}
                {notInClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest px-1 mb-2">
                      Sin uso en clases ({notInClasses.length})
                    </p>
                    <AllExercisesTable rows={notInClasses} onNavigate={navigate} />
                  </div>
                )}
              </div>
            ) : (
              /* ── Vista con filtros: lista simple ── */
              <div className="space-y-4">
                {inClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest px-1 mb-2">
                      En clases ({inClasses.length})
                    </p>
                    <ExerciseList rows={inClasses} onNavigate={navigate} />
                  </div>
                )}
                {notInClasses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest px-1 mb-2">
                      Sin uso en clases ({notInClasses.length})
                    </p>
                    <ExerciseList rows={notInClasses} onNavigate={navigate} />
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

/* ── Tabla de 3 columnas para vista "Todos" con paginación ── */
function AllExercisesTable({
  rows,
  onNavigate,
}: {
  rows: ExerciseRow[];
  onNavigate: (path: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = rows.slice(start, end);
  const isNative = Capacitor.getPlatform() !== 'web';

  useEffect(() => {
    setPage(1);
  }, [rows]);

  // Layout nativo: columna vertical
  if (isNative) {
    return (
      <div>
        <div className="flex flex-col gap-4">
          {pageRows.map(row => (
            <button
              key={row.id}
              onClick={() => onNavigate(`/ejercicios/${row.id}/editar`)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 active:bg-gray-800 transition-colors text-left"
            >
              {/* Nombre + Imagen */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-[60px] h-[60px] bg-gray-800 rounded-lg overflow-hidden shrink-0">
                  <ExerciseImageThumb imageUrl={row.image_url} name={row.name} />
                </div>
                <p className="text-white text-sm font-semibold truncate flex-1">{row.name}</p>
              </div>

              {/* Video corto */}
              <div className="mb-2">
                {row.video_path ? (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-500 uppercase font-medium">Corto</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-600 uppercase font-medium">Sin video corto</span>
                  </div>
                )}
                {row.video_path ? (
                  <VideoThumb url={row.video_path} />
                ) : (
                  <NoVideo label="Sin video" />
                )}
              </div>

              {/* Video explicativo */}
              <div>
                {row.video_long_path ? (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-500 uppercase font-medium">Explicativo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-600 uppercase font-medium">Sin video explicativo</span>
                  </div>
                )}
                {row.video_long_path ? (
                  <VideoThumb url={row.video_long_path} />
                ) : (
                  <NoVideo label="Sin video" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-xs text-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ChevronLeftIcon size={14} />
              Anterior
            </button>
            <span className="text-xs text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 text-xs text-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Siguiente
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Layout web: 3 columnas
  return (
    <div>
      <div className="flex flex-col gap-3">
        {pageRows.map(row => (
          <button
            key={row.id}
            onClick={() => onNavigate(`/ejercicios/${row.id}/editar`)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 active:bg-gray-800 transition-colors text-left"
          >
            {/* Nombre del ejercicio */}
            <p className="text-white text-sm font-semibold mb-3 truncate">{row.name}</p>

            {/* Grid de 3 columnas */}
            <div className="grid grid-cols-3 gap-3">
              {/* Columna 1: Imagen */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-[60px] h-[60px] bg-gray-800 rounded-lg overflow-hidden shrink-0">
                  <ExerciseImageThumb imageUrl={row.image_url} name={row.name} />
                </div>
                <span className="text-[9px] text-gray-500 uppercase">Foto</span>
              </div>

              {/* Columna 2: Video corto */}
              <div className="flex flex-col items-center gap-1">
                {row.video_path ? (
                  <VideoThumb url={row.video_path} />
                ) : (
                  <NoVideo label="Sin video" />
                )}
                <span className="text-[9px] text-gray-500 uppercase">Corto</span>
              </div>

              {/* Columna 3: Video explicativo */}
              <div className="flex flex-col items-center gap-1">
                {row.video_long_path ? (
                  <VideoThumb url={row.video_long_path} />
                ) : (
                  <NoVideo label="Sin video" />
                )}
                <span className="text-[9px] text-gray-500 uppercase">Explicativo</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 text-xs text-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ChevronLeftIcon size={14} />
            Anterior
          </button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 text-xs text-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Siguiente
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Lista simple para filtros ── */
function ExerciseList({
  rows,
  onNavigate,
}: {
  rows: ExerciseRow[];
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
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/40">
            <ExerciseImageThumb imageUrl={row.image_url} name={row.name} />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-medium truncate block ${row.in_classes ? 'text-white' : 'text-gray-400'}`}>
              {row.name}
            </span>
            <div className="flex gap-1.5 mt-1">
              {row.video_long_path ? (
                <span className="text-[10px] text-green-400">Explicativo</span>
              ) : (
                <span className="text-[10px] text-gray-600">Sin explicativo</span>
              )}
              {row.video_path ? (
                <span className="text-[10px] text-red-400">Corto</span>
              ) : (
                <span className="text-[10px] text-gray-600">Sin corto</span>
              )}
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${row.in_classes ? 'text-amber-500' : 'text-gray-600'}`}>
            Agregar
          </span>
        </button>
      ))}
    </div>
  );
}
