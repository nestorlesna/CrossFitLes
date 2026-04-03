// Listado de ejercicios con imagen SVG asignada — para verificar cobertura
import { useEffect, useState } from 'react';
import { ImagePlay, Dumbbell, ChevronLeft } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { getDatabase } from '../../db/database';
import { getImageDisplayUrl } from '../../services/mediaService';

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

export function ExerciseImagesPage() {
  const [rows, setRows] = useState<ExerciseImageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    db.query(
      `SELECT id, name, image_url
       FROM exercise
       WHERE image_url IS NOT NULL AND image_url != ''
       ORDER BY name ASC`
    ).then(res => {
      const data = (res.values ?? []) as ExerciseImageRow[];
      setRows(data);
      setTotal(data.length);
    }).finally(() => setLoading(false));
  }, []);

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
        {/* Contador */}
        <div className="flex items-center gap-2 mb-4">
          <ImagePlay size={16} className="text-primary-400" />
          <span className="text-sm text-gray-400">
            {loading ? '…' : (
              <><span className="text-white font-semibold">{total}</span> ejercicios con imagen</>
            )}
          </span>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-500 text-sm">Cargando…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">
            Ningún ejercicio tiene imagen asignada aún.
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-2">
            {rows.map(row => (
              <div
                key={row.id}
                className="bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3 p-3"
              >
                {/* Miniatura SVG */}
                <div
                  className="shrink-0 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center"
                  style={{ width: 56, height: 56 }}
                >
                  <ExerciseImageThumb imageUrl={row.image_url} name={row.name} />
                </div>

                {/* Nombre + ruta */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{row.name}</p>
                  <p className="text-gray-500 text-xs truncate mt-0.5">{row.image_url}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
