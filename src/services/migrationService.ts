// Servicio de migraciones de base de datos
// Ejecuta las migraciones pendientes al iniciar la app

import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface Migration {
  version: number;
  name: string;
  up: string[];
  down: string[];
}

// Crea la tabla de control de migraciones si no existe
async function ensureMigrationsTable(db: SQLiteDBConnection): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// Obtiene la versión actual de la base de datos
async function getCurrentVersion(db: SQLiteDBConnection): Promise<number> {
  const result = await db.query('SELECT MAX(version) as version FROM _migrations');
  const rows = result.values ?? [];
  if (rows.length === 0 || rows[0].version === null) return 0;
  return rows[0].version as number;
}

// Ejecuta todas las migraciones pendientes
export async function runMigrations(
  db: SQLiteDBConnection,
  migrations: Migration[]
): Promise<void> {
  await ensureMigrationsTable(db);
  const currentVersion = await getCurrentVersion(db);

  // Filtrar migraciones pendientes y ordenar por versión
  const pending = migrations
    .filter(m => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    console.log('[DB] Base de datos al día, versión:', currentVersion);
    return;
  }

  console.log(`[DB] Ejecutando ${pending.length} migración(es) pendiente(s)...`);

  for (const migration of pending) {
    console.log(`[DB] Aplicando migración v${migration.version}: ${migration.name}`);

    // Ejecutar cada sentencia SQL de la migración
    for (const sql of migration.up) {
      await db.execute(sql);
    }

    // Registrar la migración aplicada
    await db.run(
      'INSERT INTO _migrations (version, name) VALUES (?, ?)',
      [migration.version, migration.name]
    );

    console.log(`[DB] Migración v${migration.version} aplicada exitosamente`);
  }

  console.log('[DB] Todas las migraciones aplicadas. Versión actual:', pending[pending.length - 1].version);
}
