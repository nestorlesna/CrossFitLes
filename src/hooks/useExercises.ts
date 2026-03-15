// Hook para cargar y recargar la lista de ejercicios con filtros
import { useState, useEffect, useCallback } from 'react';
import { Exercise, ExerciseFilters } from '../models/Exercise';
import { getAll } from '../db/repositories/exerciseRepo';

export function useExercises(filters?: ExerciseFilters) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serializar filtros para detectar cambios como dependencia del useEffect
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAll(filters);
      setExercises(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar ejercicios');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { exercises, loading, error, reload: load };
}
