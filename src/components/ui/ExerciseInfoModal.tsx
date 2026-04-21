// Modal de información rápida de un ejercicio
// Muestra imagen, descripción, notas técnicas, músculos, equipamiento y más.
// Reutilizable desde la sesión en ejecución, detalle de clase y sesión registrada.
import { useState, useEffect } from 'react';
import { Dumbbell, Layers, Wrench, Tag, Info, Zap } from 'lucide-react';
import { Modal } from './Modal';
import { MuscleMap } from '../exercises/MuscleMap';
import { ExerciseWithRelations } from '../../models/Exercise';
import { getById } from '../../db/repositories/exerciseRepo';
import { getImageDisplayUrl } from '../../services/mediaService';

interface Props {
  exerciseId: string | null;
  exerciseName?: string;
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Principiante: 'text-green-400 bg-green-400/10',
  Intermedio:   'text-amber-400 bg-amber-400/10',
  Avanzado:     'text-red-400 bg-red-400/10',
  Élite:        'text-purple-400 bg-purple-400/10',
};

export function ExerciseInfoModal({ exerciseId, exerciseName, onClose }: Props) {
  const [exercise, setExercise] = useState<ExerciseWithRelations | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) {
      setExercise(null);
      setImageSrc(null);
      return;
    }
    setLoading(true);
    getById(exerciseId)
      .then(async ex => {
        setExercise(ex);
        const url = await getImageDisplayUrl(ex?.image_url || ex?.image_path);
        setImageSrc(url);
      })
      .catch(() => setExercise(null))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  const primaryMuscles = exercise?.relations.muscleGroups.filter(m => m.is_primary) ?? [];
  const secondaryMuscles = exercise?.relations.muscleGroups.filter(m => !m.is_primary) ?? [];
  const requiredEquip = exercise?.relations.equipment.filter(e => e.is_required) ?? [];
  const optionalEquip = exercise?.relations.equipment.filter(e => !e.is_required) ?? [];

  const difficultyClass = exercise?.difficulty_name
    ? DIFFICULTY_COLORS[exercise.difficulty_name] ?? 'text-gray-400 bg-gray-700/30'
    : '';

  return (
    <Modal
      isOpen={Boolean(exerciseId)}
      onClose={onClose}
      title={exercise?.name ?? exerciseName ?? ''}
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
        </div>
      ) : !exercise ? (
        <div className="flex flex-col items-center py-10 gap-2 text-gray-500">
          <Info size={28} />
          <p className="text-sm">No se encontró información del ejercicio.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* ── Imagen + badges ── */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-2xl bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
              {imageSrc
                ? <img src={imageSrc} alt={exercise.name} className="w-full h-full object-cover" />
                : <Dumbbell size={32} className="text-gray-600" />
              }
            </div>
            <div className="flex flex-col gap-2 pt-1">
              {exercise.difficulty_name && (
                <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full ${difficultyClass}`}>
                  {exercise.difficulty_name}
                </span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {exercise.is_compound === 1 && (
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full font-semibold">
                    Compuesto
                  </span>
                )}
                {exercise.relations.tags.map(t => (
                  <span
                    key={t.id}
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: t.color ? `${t.color}22` : '#374151', color: t.color ?? '#9ca3af' }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Descripción ── */}
          {exercise.description && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Info size={12} /> Descripción
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{exercise.description}</p>
            </div>
          )}

          {/* ── Notas técnicas ── */}
          {exercise.technical_notes && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 flex gap-2">
              <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Técnica / Consejos</p>
                <p className="text-xs text-amber-200/70 leading-relaxed">{exercise.technical_notes}</p>
              </div>
            </div>
          )}

          {/* ── Músculos ── */}
          {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} /> Músculos trabajados
              </p>
              <div className="bg-gray-950/50 rounded-xl p-3 border border-gray-800/50">
                <MuscleMap
                  primaryMuscles={primaryMuscles.map(m => m.name)}
                  secondaryMuscles={secondaryMuscles.map(m => m.name)}
                  size="100%"
                />
              </div>
              {primaryMuscles.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Principales</p>
                  <div className="flex flex-wrap gap-1.5">
                    {primaryMuscles.map(m => (
                      <span key={m.id} className="text-xs text-primary-400 bg-primary-400/10 px-2.5 py-1 rounded-full font-semibold">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {secondaryMuscles.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Secundarios</p>
                  <div className="flex flex-wrap gap-1.5">
                    {secondaryMuscles.map(m => (
                      <span key={m.id} className="text-xs text-gray-400 bg-gray-700/50 px-2.5 py-1 rounded-full font-semibold">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Equipamiento ── */}
          {(requiredEquip.length > 0 || optionalEquip.length > 0) && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench size={12} /> Equipamiento
              </p>
              <div className="flex flex-wrap gap-1.5">
                {requiredEquip.map(e => (
                  <span key={e.id} className="text-xs text-white bg-gray-700 px-2.5 py-1 rounded-full font-semibold">
                    {e.name}
                  </span>
                ))}
                {optionalEquip.map(e => (
                  <span key={e.id} className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
                    {e.name} <span className="text-gray-600">(opc.)</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Tipos de sección ── */}
          {exercise.relations.sectionTypes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={12} /> Usado en
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.relations.sectionTypes.map(s => (
                  <span key={s.id} className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </Modal>
  );
}
