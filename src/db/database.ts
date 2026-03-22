// Módulo de inicialización de SQLite
// Maneja la conexión y ciclo de vida de la base de datos

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { DB_NAME } from '../utils/constants';
import { runMigrations } from '../services/migrationService';
import { getCurrentVersion } from '../services/migrationService';
import { migrations } from './migrations';

// Singleton de conexión SQLite
let sqlite: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;
// Mutex: evita que StrictMode (dev) lance dos inicializaciones en paralelo
let initPromise: Promise<SQLiteDBConnection> | null = null;

// Inicializa el store web de SQLite (jeep-sqlite ya fue registrado en main.tsx)
async function initWebStore(): Promise<void> {
  if (Capacitor.getPlatform() === 'web') {
    await CapacitorSQLite.initWebStore();
  }
}



// Inicialización interna (llamada una sola vez vía el mutex)
async function _initDatabase(): Promise<SQLiteDBConnection> {
  await initWebStore();

  sqlite = new SQLiteConnection(CapacitorSQLite);

  // En web, asegurar que jeep-sqlite esté completamente listo
  if (Capacitor.getPlatform() === 'web') {
    await customElements.whenDefined('jeep-sqlite');
    // Esperar a que el custom element esté montado y listo
    await new Promise(r => setTimeout(r, 100));
  }

  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  if (ret.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  }

  // En web, cargar desde store si existe
  if (Capacitor.getPlatform() === 'web') {
    try {
      // Intentar recuperar datos del store
      await (sqlite as any).loadFromStore(DB_NAME);
    } catch (e) {
      // Si falla, es primera vez o no hay datos guardados
      console.log('[DB] No hay datos previos en store o primera vez');
    }
  }

  await db.open();
  await db.execute('PRAGMA foreign_keys = ON;');

  await runMigrations(db, migrations);

  // Sincronizar user_version de jeep-sqlite con nuestra tabla _migrations
  const currentVersion = await getCurrentVersion(db);
  await db.execute(`PRAGMA user_version = ${currentVersion}`);

  return db;
}

// Abre la conexión a la base de datos (con mutex para llamadas concurrentes en dev/StrictMode)
export function openDatabase(): Promise<SQLiteDBConnection> {
  if (db) return Promise.resolve(db);
  if (!initPromise) initPromise = _initDatabase();
  return initPromise;
}

// Obtiene la conexión actual (debe haber sido abierta antes)
export function getDatabase(): SQLiteDBConnection {
  if (!db) {
    throw new Error('[DB] La base de datos no está inicializada. Llamar a openDatabase() primero.');
  }
  return db;
}

// Cierra la conexión (usar al destruir la app)
export async function closeDatabase(): Promise<void> {
  if (db && sqlite) {
    // Guardar antes de cerrar en web
    if (Capacitor.getPlatform() === 'web') {
      try {
        await sqlite.saveToStore(DB_NAME);
      } catch (e) {
        console.warn('[DB] Error guardando al cerrar:', e);
      }
    }
    await sqlite.closeConnection(DB_NAME, false);
    db = null;
    initPromise = null;
  }
}

// Persiste la BD en memoria al store de IndexedDB (jeep-sqlite web)
// IMPORTANTE: Debe llamarse después de CUALQUIER operación de escritura en web
export async function saveDatabase(): Promise<void> {
  if (Capacitor.getPlatform() === 'web' && sqlite) {
    try {
      // Verificar que tenemos conexión antes de intentar guardar
      const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
      if (isConn) {
        await sqlite.saveToStore(DB_NAME);
      }
    } catch (e) {
      // Solo loggear error si no es "no connection"
      const msg = String(e);
      if (!msg.includes('No available connection')) {
        console.warn('[DB] saveToStore error:', e);
      }
    }
  }
}
