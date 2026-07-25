// Listado de ejercicios con imagen SVG asignada — para verificar cobertura
import { useEffect, useState } from 'react';
import { ImagePlay, Dumbbell, ChevronLeft } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { getDatabase } from '../../db/database';
import { getImageDisplayUrl } from '../../services/mediaService';

type FilterMode = 'with_photo' | 'in_class_no_photo' | 'photo_no_class' | 'photo_not_in_repo';

interface ExerciseImageRow {
  id: string;
  name: string;
  image_url: string;
}

// Miniatura que resuelve tanto rutas estáticas como persistentes
function ExerciseImageThumb({ imageUrl, name }: { imageUrl: string; name: string }) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getImageDisplayUrl(imageUrl).then(setResolvedUrl);
  }, [imageUrl]);

  if (!resolvedUrl || error) {
    return <Dumbbell size={16} className="text-gray-700" />;
  }

  return (
    <img
      src={resolvedUrl}
      alt={name}
      className="w-full h-full object-contain"
      onError={() => setError(true)}
    />
  );
}

const QUERIES: Record<FilterMode, string> = {
  with_photo: `
    SELECT id, name, image_url
    FROM exercise
    WHERE image_url IS NOT NULL AND image_url != ''
    ORDER BY name ASC`,
  in_class_no_photo: `
    SELECT DISTINCT e.id, e.name, e.image_url
    FROM exercise e
    JOIN section_exercise se ON se.exercise_id = e.id
    WHERE (e.image_url IS NULL OR e.image_url = '')
    ORDER BY e.name ASC`,
  photo_no_class: `
    SELECT id, name, image_url
    FROM exercise
    WHERE (image_url IS NOT NULL AND image_url != '')
      AND id NOT IN (
        SELECT DISTINCT exercise_id FROM section_exercise
      )
    ORDER BY name ASC`,
  // Imágenes que NO están en el repositorio: la ruta no es estática (/img/...),
  // sino una imagen de usuario guardada en SQLite (ej: exercises/uuid.svg).
  photo_not_in_repo: `
    SELECT id, name, image_url
    FROM exercise
    WHERE (image_url IS NOT NULL AND image_url != '')
      AND image_url NOT LIKE '/img/%'
    ORDER BY name ASC`,
};

const FILTER_LABELS: Record<FilterMode, string> = {
  with_photo: 'Eje. con Fotos',
  in_class_no_photo: 'Eje. en Clase sin Foto',
  photo_no_class: 'Eje con F sin Clase',
  photo_not_in_repo: 'Fotos no en repo',
};

const EMPTY_MESSAGES: Record<FilterMode, string> = {
  with_photo: 'Ningún ejercicio tiene imagen asignada aún.',
  in_class_no_photo: 'Todos los ejercicios usados en clases tienen foto.',
  photo_no_class: 'Todos los ejercicios con foto están asignados a al menos una clase.',
  photo_not_in_repo: 'Todas las imágenes asignadas están en el repositorio (/img/...).',
};

export function ExerciseImagesPage() {
  const [filter, setFilter] = useState<FilterMode>('with_photo');
  const [rows, setRows] = useState<ExerciseImageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const db = getDatabase();
    db.query(QUERIES[filter]).then(res => {
      setRows((res.values ?? []) as ExerciseImageRow[]);
    }).finally(() => setLoading(false));
  }, [filter]);

  const showImage = filter !== 'in_class_no_photo';

  return (
    <>
      <Header
        title="Imágenes de ejercicios"
        leftAction={
          <button onClick={() => window.history.back()} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="p-4">
        {/* Botones de filtro */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(Object.keys(FILTER_LABELS) as FilterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === mode
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {FILTER_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* Contador */}
        <div className="flex items-center gap-2 mb-4">
          <ImagePlay size={16} className="text-primary-400" />
          <span className="text-sm text-gray-400">
            {loading ? '…' : (
              <><span className="text-white font-semibold">{rows.length}</span> ejercicios</>
            )}
          </span>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-500 text-sm">Cargando…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">
            {EMPTY_MESSAGES[filter]}
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
            {rows.map(row => (
              <div
                key={row.id}
                className="bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3 p-3 md:flex-col md:items-stretch md:text-center md:p-4"
              >
                {/* Miniatura */}
                {showImage && (
                  <div
                    className="shrink-0 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center w-14 h-14 md:w-24 md:h-24 md:mx-auto lg:w-28 lg:h-28"
                  >
                    <ExerciseImageThumb imageUrl={row.image_url} name={row.name} />
                  </div>
                )}

                {/* Nombre + ruta */}
                <div className="flex-1 min-w-0 md:flex-none md:mt-2">
                  <p className="text-white text-sm font-medium truncate">{row.name}</p>
                  {showImage && (
                    <p className="text-gray-500 text-xs truncate mt-0.5">{row.image_url}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
