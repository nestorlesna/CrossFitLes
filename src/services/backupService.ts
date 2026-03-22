// Servicio de backup: exportar e importar datos de la BD como JSON
// Permite migrar datos entre dispositivos descargando/cargando un archivo .json

import { getDatabase } from '../db/database';
import { APP_VERSION } from '../utils/constants';

// Orden de tablas respetando dependencias (padres primero)
const TABLE_ORDER = [
  'muscle_group',
  'equipment',
  'measurement_unit',
  'difficulty_level',
  'tag',
  'section_type',
  'work_format',
  'exercise',
  'exercise_muscle_group',
  'exercise_equipment',
  'exercise_section_type',
  'exercise_unit',
  'exercise_tag',
  'class_template',
  'class_section',
  'section_exercise',
  'training_session',
  'session_exercise_result',
  'personal_record',
] as const;

// Estructura del JSON exportado
interface BackupData {
  meta: {
    app: string;
    version: string;
    exportDate: string;
    schemaVersion: number;
    tables: number;
    totalRecords: number;
  };
  data: Record<string, Record<string, unknown>[]>;
}

// Exporta todos los datos de la BD y descarga como archivo .json
export async function exportData(): Promise<void> {
  const db = getDatabase();

  // Obtener la versión del schema desde la tabla de migraciones
  const versionResult = await db.query('SELECT MAX(version) as version FROM _migrations');
  const schemaVersion = (versionResult.values?.[0]?.version as number) ?? 0;

  const data: Record<string, Record<string, unknown>[]> = {};
  let totalRecords = 0;

  // Leer cada tabla
  for (const table of TABLE_ORDER) {
    const result = await db.query(`SELECT * FROM ${table}`);
    const rows = (result.values ?? []) as Record<string, unknown>[];
    data[table] = rows;
    totalRecords += rows.length;
  }

  const backup: BackupData = {
    meta: {
      app: 'CrossFit Session Tracker',
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      schemaVersion,
      tables: TABLE_ORDER.length,
      totalRecords,
    },
    data,
  };

  // Generar archivo y descargar
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const fileName = `crossfit-backup-${formatDateForFile(new Date())}.json`;
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Importa datos desde un string JSON, reemplazando todos los datos existentes
export async function importData(jsonString: string): Promise<{ totalRecords: number }> {
  // Validar estructura del JSON
  let backup: BackupData;
  try {
    backup = JSON.parse(jsonString) as BackupData;
  } catch {
    throw new Error('El archivo no contiene JSON válido.');
  }

  if (!backup.meta || !backup.data) {
    throw new Error('El archivo no tiene el formato de backup esperado (falta meta o data).');
  }

  if (backup.meta.app !== 'CrossFit Session Tracker') {
    throw new Error('El archivo no pertenece a CrossFit Session Tracker.');
  }

  const db = getDatabase();
  let totalRecords = 0;

  // Orden inverso para borrar (hijos primero, padres después)
  const deleteOrder = [...TABLE_ORDER].reverse();

  // Desactivar foreign keys para permitir el borrado e inserción libre
  await db.execute('PRAGMA foreign_keys = OFF;');

  try {
    // 1. Borrar todos los datos existentes (hijos → padres)
    for (const table of deleteOrder) {
      await db.execute(`DELETE FROM ${table}`);
    }

    // 2. Insertar datos nuevos (padres → hijos)
    for (const table of TABLE_ORDER) {
      const rows = backup.data[table];
      if (!rows || rows.length === 0) continue;

      for (const row of rows) {
        const keys = Object.keys(row);
        const values = Object.values(row);
        const placeholders = keys.map(() => '?').join(', ');

        await db.run(
          `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
          values as (string | number | null)[]
        );
      }

      totalRecords += rows.length;
    }
  } catch (error) {
    // Reactivar FKs incluso si falla
    await db.execute('PRAGMA foreign_keys = ON;');
    throw new Error(
      `Error al importar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }

  // Reactivar foreign keys
  await db.execute('PRAGMA foreign_keys = ON;');

  return { totalRecords };
}

// Cuenta los registros totales en la BD para mostrar en la UI
export async function countRecords(): Promise<Record<string, number>> {
  const db = getDatabase();
  const counts: Record<string, number> = {};

  for (const table of TABLE_ORDER) {
    const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
    counts[table] = (result.values?.[0]?.count as number) ?? 0;
  }

  return counts;
}

// Formatea una fecha para usar en el nombre del archivo
function formatDateForFile(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
