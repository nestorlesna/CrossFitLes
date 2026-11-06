// Provider de base de datos - inicializa SQLite al montar la app
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { openDatabase, getDatabase, saveDatabase } from '../db/database';
import { Dumbbell } from 'lucide-react';
import { loadRemoteChallenges } from '../services/challengeCatalogService';
import { loadBaseContent, needsBaseContent } from '../services/baseContentService';
import { syncContent } from '../services/contentSyncService';
import { toast } from 'sonner';
import { acceptDisclaimer, needsDisclaimer } from '../services/disclaimerService';
import { WelcomeScreen } from './WelcomeScreen';

interface DbContextValue {
  isReady: boolean;
  error: string | null;
}

const DbContext = createContext<DbContextValue>({ isReady: false, error: null });

// Hook de acceso al contexto: convive con el componente a proposito, es la
// API publica del provider
// eslint-disable-next-line react-refresh/only-export-components
export function useDb() {
  return useContext(DbContext);
}

interface DbProviderProps {
  children: React.ReactNode;
}

// Carga base del primer arranque; si falla, la app sigue usable vacía y se reintenta al reabrir
async function tryLoadBaseContent(): Promise<boolean> {
  try {
    const summary = await loadBaseContent();
    console.log(`[DB] Datos base cargados: ${summary.exercisesAdded} ejercicios, ${summary.classesAdded} clases`);
    return true;
  } catch (err) {
    console.error('[DB] No se pudieron cargar los datos base:', err);
    return false;
  }
}

// Después de la carga base, "Actualizar contenido" automático en segundo plano: suma lo publicado
// después de compilar el APK. Sin internet no pasa nada: queda el botón manual en Configuración.
function autoSyncContent(): void {
  syncContent(false, 'public')
    .then((summary) => {
      if (summary.upToDate) return;
      console.log(`[DB] Contenido actualizado a la versión ${summary.contentVersion}`);
      toast.success('Contenido actualizado');
    })
    .catch((err) => console.warn('[DB] No se pudo actualizar el contenido automáticamente:', err));
}

export function DbProvider({ children }: DbProviderProps) {
  const [state, setState] = useState<DbContextValue>({ isReady: false, error: null });
  // Descargo pendiente: firstRun = además hay que cargar los datos base
  const [welcome, setWelcome] = useState<{ firstRun: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const initStarted = useRef(false);

  const fail = (err: Error) => {
    console.error('[DB] Error al inicializar:', err);
    setState({ isReady: false, error: err.message ?? 'Error desconocido' });
  };

  // Últimos pasos comunes: challenges bajados con "Actualizar contenido" (se suman a los del APK)
  // autoSync = recién se cargaron los datos base: buscar contenido más nuevo en segundo plano
  const finish = async (autoSync = false) => {
    await loadRemoteChallenges();
    setWelcome(null);
    setState({ isReady: true, error: null });
    if (autoSync) autoSyncContent();
  };

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    // jeep-sqlite ya fue inicializado en main.tsx antes de montar React
    (async () => {
      await openDatabase();
      // Migrar imágenes de localStorage a SQLite (una sola vez)
      await migrateImagesFromLocalStorage();
      const baseNeeded = await needsBaseContent();
      if (await needsDisclaimer()) {
        setWelcome({ firstRun: baseNeeded });
        return; // sigue en handleAccept
      }
      let baseLoaded = false;
      if (baseNeeded) {
        setBusy(true);
        baseLoaded = await tryLoadBaseContent();
      }
      await finish(baseLoaded);
    })().catch(fail);
  }, []);

  const handleAccept = () => {
    if (!welcome) return;
    setBusy(true);
    (async () => {
      await acceptDisclaimer();
      const baseLoaded = welcome.firstRun && (await tryLoadBaseContent());
      await finish(baseLoaded);
    })().catch(fail);
  };

  // Bienvenida + descargo de salud (primer arranque o texto nuevo)
  if (welcome && !state.error) {
    return <WelcomeScreen firstRun={welcome.firstRun} busy={busy} onAccept={handleAccept} />;
  }

  // Pantalla de carga mientras inicializa la BD
  if (!state.isReady && !state.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-gray-950 text-white gap-4">
        <Dumbbell size={48} className="text-primary-500 animate-pulse" />
        <p className="text-gray-400">
          {busy ? 'Preparando ejercicios y clases…' : 'Iniciando base de datos...'}
        </p>
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
