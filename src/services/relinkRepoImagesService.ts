// Re-vincula ejercicios cuyas imágenes están guardadas como blob en SQLite
// (tabla exercise_image, ruta tipo exercises/uuid.svg) a su SVG equivalente
// del repositorio (/img/exercises/...), y elimina el blob huérfano.
//
// Se identifica cada caso por su image_url ACTUAL (la ruta uuid), lo que hace
// la operación idempotente: una vez re-vinculado, la ruta vieja ya no coincide
// y volver a ejecutar no produce cambios.
import { getDatabase, saveDatabase } from '../db/database';

interface RelinkEntry {
  label: string;     // nombre del ejercicio (solo para reporte)
  oldPath: string;   // image_url actual (blob en exercise_image)
  newPath: string;   // ruta estática en el repo
}

// Mapeo confirmado: cada SVG existe en public/img/exercises/.
const RELINK_ENTRIES: RelinkEntry[] = [
  {
    label: 'Ab Wheel Kneeling Rollout',
    oldPath: 'exercises/c29ae528-607a-4bd5-8992-ed3232786e49.svg',
    newPath: '/img/exercises/ab-wheel-kneeling-rollout.svg',
  },
  {
    label: 'Ab Wheel Standing Rollout',
    oldPath: 'exercises/9ac1a6db-9a52-4320-b708-cddc0894f2b1.svg',
    newPath: '/img/exercises/ab-wheel-standing-rollout.svg',
  },
  {
    label: 'Alternating Double Clubbell Front Flag Press',
    oldPath: 'exercises/9714a7cb-6c82-43f0-b0ae-c6a4b9b7a666.svg',
    newPath: '/img/exercises/alternating-double-clubbell-front-flag-press.svg',
  },
  {
    label: 'Barbell Hang Muscle Clean and Press',
    oldPath: 'exercises/8de7c4d6-f37a-4231-b2d6-22fe5a853f9d.svg',
    newPath: '/img/exercises/barbell-hang-muscle-clean-and-press.svg',
  },
  {
    label: 'Scapular Push-Up',
    oldPath: 'exercises/543a8cb1-9385-4332-bdf6-3de6d33e751e.svg',
    newPath: '/img/exercises/scapular-push-up.svg',
  },
  {
    label: 'Scapular Push-ups dinámicos',
    oldPath: 'exercises/508640b7-e311-4235-9eb5-027bfa987202.svg',
    newPath: '/img/exercises/scapular-push-up-dina.svg',
  },
];

export interface RelinkResult {
  relinked: number;  // ejercicios cuyo image_url se cambió al repo
  deleted: number;   // blobs eliminados de exercise_image
}

// Re-vincula todos los ejercicios del mapeo y borra sus blobs en una sola
// operación atómica.
export async function relinkRepoImages(): Promise<RelinkResult> {
  const db = getDatabase();

  const stmts: { statement: string; values: unknown[] }[] = [];
  for (const { oldPath, newPath } of RELINK_ENTRIES) {
    stmts.push({
      statement: 'UPDATE exercise SET image_url = ? WHERE image_url = ?',
      values: [newPath, oldPath],
    });
    stmts.push({
      statement: 'DELETE FROM exercise_image WHERE id = ?',
      values: [oldPath],
    });
  }

  // Conteo previo para reportar cuántos casos realmente seguían pendientes.
  let relinked = 0;
  let deleted = 0;
  for (const { oldPath } of RELINK_ENTRIES) {
    const exRes = await db.query(
      'SELECT 1 FROM exercise WHERE image_url = ?',
      [oldPath]
    );
    if ((exRes.values?.length ?? 0) > 0) relinked++;
    const imgRes = await db.query(
      'SELECT 1 FROM exercise_image WHERE id = ?',
      [oldPath]
    );
    if ((imgRes.values?.length ?? 0) > 0) deleted++;
  }

  // Ejecutar UPDATE + DELETE de forma atómica.
  await db.executeSet(stmts, true);
  await saveDatabase();

  return { relinked, deleted };
}
