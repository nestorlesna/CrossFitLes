// Módulo de inicialización de SQLite
// Maneja la conexión y ciclo de vida de la base de datos

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { DB_NAME } from '../utils/constants';
import { runMigrations } from '../services/migrationService';
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

  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  if (ret.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  }

  await db.open();
  await db.execute('PRAGMA foreign_keys = ON;');
  await runMigrations(db, migrations);

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
    await sqlite.closeConnection(DB_NAME, false);
    db = null;
    initPromise = null;
  }
}
