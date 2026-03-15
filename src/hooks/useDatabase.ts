// Hook para acceder al estado de inicialización de la base de datos

import { useState, useEffect } from 'react';
import { openDatabase } from '../db/database';

interface DatabaseState {
  isReady: boolean;
  error: string | null;
}

export function useDatabase(): DatabaseState {
  const [state, setState] = useState<DatabaseState>({
    isReady: false,
    error: null,
  });

  useEffect(() => {
    openDatabase()
      .then(() => {
        setState({ isReady: true, error: null });
      })
      .catch((err) => {
        console.error('[DB] Error al inicializar la base de datos:', err);
        setState({ isReady: false, error: err.message ?? 'Error desconocido' });
      });
  }, []);

  return state;
}
