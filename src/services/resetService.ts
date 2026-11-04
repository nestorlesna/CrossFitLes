// Borrado total de la base de datos ("Borrar todos los datos" en Configuración).
// Elimina todas las tablas; al reiniciar, las migraciones recrean el esquema y el primer
// arranque vuelve a ofrecer la carga base, como en una instalación nueva.

import { closeDatabase, getDatabase, saveDatabase } from '../db/database';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function dropAllTables(): Promise<void> {
  const db = getDatabase();
  // Varias pasadas: con FKs entre tablas puede quedar alguna en la primera
  for (let pass = 1; pass <= 10; pass++) {
    await db.execute('PRAGMA foreign_keys = OFF;');
    const res = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    const tables = (res.values ?? []).map((t) => t.name as string);
    if (tables.length === 0) break;
    for (const table of tables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table};`);
      } catch (e) {
        console.warn(`[Reset] No se pudo borrar ${table} (pasada ${pass}):`, e);
      }
    }
  }
  try {
    await db.execute('DELETE FROM sqlite_sequence;');
  } catch {
    // sqlite_sequence no existe si nunca hubo AUTOINCREMENT
  }
  await db.execute('PRAGMA foreign_keys = ON;');
  await db.execute('PRAGMA user_version = 0;');
}

/** Borra absolutamente todo, lo persiste y cierra la conexión (después hay que recargar la app) */
export async function cleanDatabase(): Promise<void> {
  await dropAllTables();
  await saveDatabase();
  await delay(500);
  await closeDatabase();
}
