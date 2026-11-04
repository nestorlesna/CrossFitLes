// Carga base del primer arranque.
// Con la BD vacía se importa public/base-content.json (el contenido publicado sin GOAT ni planes,
// que viaja dentro del APK y funciona sin internet) con la misma función que "Actualizar
// contenido". Así quedan global_key, origin y remote_hash, y el próximo "Actualizar contenido"
// sólo suma lo que falta (las GOAT), sin duplicar.
//
// Estado en app_setting.base_content:
//   null        → nunca se evaluó (instalación nueva o app actualizada desde una versión vieja)
//   'v<N>'      → se cargó el snapshot de la versión N del contenido
//   'existing'  → la BD ya tenía datos: no se cargó nada
// Nunca carga datos personales: sesiones, resultados, récords, planes, perfil, medidas ni fotos.

import { getDatabase } from '../db/database';
import { getSetting, setSetting, setSettingStmt } from '../db/repositories/appSettingRepo';
import { isKnownAppName } from '../utils/constants';
import { applyContent, SyncSummary } from './contentSyncService';
import { BASE_CONTENT_FILE, CONTENT_FORMAT, ContentFile } from './contentFormat';

const BASE_CONTENT_SETTING = 'base_content';

async function count(sql: string): Promise<number> {
  const res = await getDatabase().query(sql);
  return Number(res.values?.[0]?.n ?? 0);
}

// La BD no tiene nada propio ni bajado: ni ejercicios, ni clases, ni sesiones
async function isDatabaseEmpty(): Promise<boolean> {
  const total =
    (await count(`SELECT count(*) AS n FROM exercise`)) +
    (await count(`SELECT count(*) AS n FROM class_template`)) +
    (await count(`SELECT count(*) AS n FROM training_session`));
  return total === 0;
}

/**
 * ¿Hay que cargar los datos base? Si la BD ya tiene datos (instalación existente),
 * lo deja marcado para no volver a preguntar y devuelve false.
 */
export async function needsBaseContent(): Promise<boolean> {
  if ((await getSetting(BASE_CONTENT_SETTING)) !== null) return false;
  if (await isDatabaseEmpty()) return true;
  await setSetting(BASE_CONTENT_SETTING, 'existing');
  return false;
}

/** Importa el snapshot empaquetado con la app, en una sola transacción */
export async function loadBaseContent(): Promise<SyncSummary> {
  const res = await fetch(`/${BASE_CONTENT_FILE}`, { cache: 'no-store' });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || type.includes('text/html')) {
    throw new Error('No se encontraron los datos base dentro de la app');
  }
  const content = (await res.json()) as ContentFile;
  if (!isKnownAppName(content.app) || content.format > CONTENT_FORMAT) {
    throw new Error('Los datos base no son compatibles con esta versión de la app');
  }
  return applyContent(content, null, [setSettingStmt(BASE_CONTENT_SETTING, `v${content.contentVersion}`)]);
}
