// Provider de base de datos - inicializa SQLite al montar la app
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { openDatabase, getDatabase, saveDatabase } from '../db/database';
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
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    // jeep-sqlite ya fue inicializado en main.tsx antes de montar React
    openDatabase()
      .then(() => {
        // Migrar imágenes de localStorage a SQLite (una sola vez)
        return migrateImagesFromLocalStorage();
      })
      .then(() => {
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

// Migrar imágenes de localStorage a SQLite (se ejecuta una sola vez)
async function migrateImagesFromLocalStorage(): Promise<void> {
  const prefix = 'media_';
  const db = getDatabase();

  // Verificar si la tabla existe (por si la migración aún no corrió)
  try {
    const tableCheck = await db.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='exercise_image'`
    );
    if (!(tableCheck.values?.length)) return;
  } catch {
    return;
  }

  let migrated = 0;

  // Iterar por todas las claves de localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;

    // Solo migrar imágenes de ejercicios (no muscles/equipment)
    const subPath = key.substring(prefix.length);
    if (!subPath.startsWith('exercises/')) continue;

    const dataUrl = localStorage.getItem(key);
    if (!dataUrl) continue;

    // Verificar si ya existe en SQLite
    const existing = await db.query(
      `SELECT id FROM exercise_image WHERE id = ?`,
      [key]
    );
    if ((existing.values?.length ?? 0) > 0) continue;

    // Extraer exercise_id del path (ej: exercises/uuid.svg -> uuid.svg)
    const exerciseId = subPath;

    // Guardar en SQLite
    await db.run(
      `INSERT OR REPLACE INTO exercise_image (id, exercise_id, data_url) VALUES (?, ?, ?)`,
      [key, exerciseId, dataUrl]
    );
    migrated++;
  }

  if (migrated > 0) {
    await saveDatabase();
    console.log(`[MediaMigration] Migradas ${migrated} imágenes de localStorage a SQLite`);
  }
}
