// Repositorio genérico para todas las tablas de catálogos
// Provee operaciones CRUD y reordenamiento para cualquier tabla de catálogo

import { getDatabase, saveDatabase } from '../database';
import { generateUUID } from '../../utils/formatters';
import { CatalogRecord } from '../../models/catalogs';

// Obtiene todos los registros de una tabla, ordenados por sort_order
export async function getAll(
  table: string,
  activeOnly = true
): Promise<CatalogRecord[]> {
  const db = getDatabase();
  const whereClause = activeOnly ? 'WHERE is_active = 1' : '';
  const result = await db.query(
    `SELECT * FROM ${table} ${whereClause} ORDER BY sort_order ASC, name ASC`
  );
  return (result.values ?? []) as CatalogRecord[];
}

// Obtiene un registro por ID
export async function getById(
  table: string,
  id: string
): Promise<CatalogRecord | null> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM ${table} WHERE id = ?`,
    [id]
  );
  const rows = result.values ?? [];
  return rows.length > 0 ? (rows[0] as CatalogRecord) : null;
}

// Crea un nuevo registro con UUID generado automáticamente
export async function create(
  table: string,
  data: Omit<CatalogRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Determinar sort_order: máximo actual + 1
  const orderResult = await db.query(
    `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM ${table}`
  );
  const nextOrder = (orderResult.values?.[0] as { next_order: number })?.next_order ?? 1;

  const fields = { id, ...data, sort_order: data.sort_order ?? nextOrder, created_at: now, updated_at: now };
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const placeholders = keys.map(() => '?').join(', ');

  await db.run(
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
    values
  );

  await saveDatabase();
  return id;
}

// Actualiza un registro por ID con updated_at automático
export async function update(
  table: string,
  id: string,
  data: Partial<CatalogRecord>
): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const fields = { ...data, updated_at: now };
  const sets = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(', ');
  const values = [...Object.values(fields), id];

  await db.run(
    `UPDATE ${table} SET ${sets} WHERE id = ?`,
    values
  );
  await saveDatabase();
}

// Borrado lógico: marca is_active = 0
export async function softDelete(table: string, id: string): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  await db.run(
    `UPDATE ${table} SET is_active = 0, updated_at = ? WHERE id = ?`,
    [now, id]
  );
  await saveDatabase();
}

// Intercambia el sort_order del item con el anterior (sube en la lista)
export async function moveUp(table: string, id: string): Promise<void> {
  const db = getDatabase();

  // Obtener el registro actual
  const current = await db.query(
    `SELECT id, sort_order FROM ${table} WHERE id = ? AND is_active = 1`,
    [id]
  );
  if (!current.values || current.values.length === 0) return;

  const currentRow = current.values[0] as { id: string; sort_order: number };

  // Buscar el anterior (sort_order menor más cercano)
  const prev = await db.query(
    `SELECT id, sort_order FROM ${table} WHERE is_active = 1 AND sort_order < ? ORDER BY sort_order DESC LIMIT 1`,
    [currentRow.sort_order]
  );
  if (!prev.values || prev.values.length === 0) return;

  const prevRow = prev.values[0] as { id: string; sort_order: number };

  // Intercambiar sort_order
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  await db.run(
    `UPDATE ${table} SET sort_order = ?, updated_at = ? WHERE id = ?`,
    [prevRow.sort_order, now, currentRow.id]
  );
  await db.run(
    `UPDATE ${table} SET sort_order = ?, updated_at = ? WHERE id = ?`,
    [currentRow.sort_order, now, prevRow.id]
  );
  await saveDatabase();
}

// Intercambia el sort_order del item con el siguiente (baja en la lista)
export async function moveDown(table: string, id: string): Promise<void> {
  const db = getDatabase();

  // Obtener el registro actual
  const current = await db.query(
    `SELECT id, sort_order FROM ${table} WHERE id = ? AND is_active = 1`,
    [id]
  );
  if (!current.values || current.values.length === 0) return;

  const currentRow = current.values[0] as { id: string; sort_order: number };

  // Buscar el siguiente (sort_order mayor más cercano)
  const next = await db.query(
    `SELECT id, sort_order FROM ${table} WHERE is_active = 1 AND sort_order > ? ORDER BY sort_order ASC LIMIT 1`,
    [currentRow.sort_order]
  );
  if (!next.values || next.values.length === 0) return;

  const nextRow = next.values[0] as { id: string; sort_order: number };

  // Intercambiar sort_order
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  await db.run(
    `UPDATE ${table} SET sort_order = ?, updated_at = ? WHERE id = ?`,
    [nextRow.sort_order, now, currentRow.id]
  );
  await db.run(
    `UPDATE ${table} SET sort_order = ?, updated_at = ? WHERE id = ?`,
    [currentRow.sort_order, now, nextRow.id]
  );
  await saveDatabase();
}
