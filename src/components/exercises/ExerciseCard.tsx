// Tarjeta compacta para mostrar un ejercicio en el listado
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronRight } from 'lucide-react';
import { Exercise } from '../../models/Exercise';
import { Badge } from '../ui/Badge';
import { getImageDisplayUrl } from '../../services/mediaService';
import { VideoEmbed } from '../ui/VideoEmbed';

interface ExerciseCardProps {
  exercise: Exercise;
  // Tags pre-cargados para mostrar en la tarjeta (opcional, máximo 3)
  tags?: Array<{ id: string; name: string; color?: string }>;
  // Muestra los videos del ejercicio (corto y explicativo) debajo de los datos
  showVideos?: boolean;
}

export function ExerciseCard({ exercise, tags = [], showVideos = false }: ExerciseCardProps) {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Cargar imagen: resolver tanto rutas estáticas como persistentes
  useEffect(() => {
    if (exercise.image_url) {
      getImageDisplayUrl(exercise.image_url).then(setImageUrl);
    } else if (exercise.image_path) {
      getImageDisplayUrl(exercise.image_path).then(setImageUrl);
    }
  }, [exercise.image_url, exercise.image_path]);

  const visibleTags = tags.slice(0, 3);

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3">
      <div className="flex flex-wrap gap-3 items-start">
        {/* Zona clickeable: navega al detalle del ejercicio */}
        <button
          className="flex-1 min-w-0 max-w-sm flex gap-3 text-left active:opacity-80 transition-opacity"
          onClick={() => navigate(`/ejercicios/${exercise.id}`)}
        >
          {/* Thumbnail 60x60 */}
          <div className="w-15 h-15 shrink-0 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center" style={{ width: 60, height: 60 }}>
            {imageUrl ? (
              <img src={imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
            ) : (
              <Dumbbell size={24} className="text-gray-600" />
            )}
          </div>

          {/* Información del ejercicio */}
          <div className="flex-1 min-w-0">
            {/* Nombre */}
            <p className="text-white font-medium text-sm truncate">{exercise.name}</p>

            {/* Badges: dificultad y músculo principal */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {exercise.difficulty_name && (
                <Badge label={exercise.difficulty_name} color={exercise.difficulty_color} size="sm" />
              )}
              {exercise.primary_muscle_name && (
                <Badge label={exercise.primary_muscle_name} size="sm" />
              )}
              {/* Indicador compuesto/aislado */}
              <Badge
                label={exercise.is_compound ? 'Compuesto' : 'Aislado'}
                size="sm"
              />
            </div>

            {/* Tags (máximo 3) */}
            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {visibleTags.map((tag) => (
                  <Badge key={tag.id} label={tag.name} color={tag.color} size="sm" />
                ))}
              </div>
            )}
          </div>
        </button>

        {/* Videos al costado de los datos: corto y explicativo, mismo tamano.
            No auto-reproducen. */}
        {showVideos && (exercise.video_path || exercise.video_long_path) && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {exercise.video_path && (
              <div className="video-thumb">
                <VideoEmbed url={exercise.video_path} autoplay={false} />
              </div>
            )}
            {exercise.video_long_path && (
              <div className="video-thumb">
                <VideoEmbed url={exercise.video_long_path} autoplay={false} />
              </div>
            )}
          </div>
        )}

        {/* Chevron: siempre pegado al borde derecho, despues de los videos */}
        <button
          className="self-center shrink-0 ml-auto p-1 active:opacity-80 transition-opacity"
          aria-label={`Ver detalle de ${exercise.name}`}
          onClick={() => navigate(`/ejercicios/${exercise.id}`)}
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

    </div>
  );
}
