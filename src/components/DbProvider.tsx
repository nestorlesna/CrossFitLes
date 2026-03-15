// Provider de base de datos - inicializa SQLite al montar la app
import { createContext, useContext, useEffect, useState } from 'react';
import { openDatabase } from '../db/database';
import { runSeed } from '../services/seedService';
import { Dumbbell } from 'lucide-react';

interface DbContextValue {
  isReady: boolean;
  error: string | null;
}

const DbContext = createContext<DbContextValue>({ isReady: false, error: null });

export function useDb() {
  return useContext(DbContext);
}

interface DbProviderProps {
  children: React.ReactNode;
}

export function DbProvider({ children }: DbProviderProps) {
  const [state, setState] = useState<DbContextValue>({ isReady: false, error: null });

  useEffect(() => {
    // jeep-sqlite ya fue inicializado en main.tsx antes de montar React
    openDatabase()
      .then(async (db) => {
        // Cargar datos semilla la primera vez (controlado por localStorage)
        await runSeed(db);
        setState({ isReady: true, error: null });
      })
      .catch((err: Error) => {
        console.error('[DB] Error al inicializar:', err);
        setState({ isReady: false, error: err.message ?? 'Error desconocido' });
      });
  }, []);

  // Pantalla de carga mientras inicializa la BD
  if (!state.isReady && !state.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-gray-950 text-white gap-4">
        <Dumbbell size={48} className="text-primary-500 animate-pulse" />
        <p className="text-gray-400">Iniciando base de datos...</p>
      </div>
    );
  }

  // Pantalla de error
  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-gray-950 text-white p-6 gap-4">
        <p className="text-red-400 font-semibold">Error al inicializar la base de datos</p>
        <p className="text-gray-500 text-sm text-center">{state.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <DbContext.Provider value={state}>
      {children}
    </DbContext.Provider>
  );
}
