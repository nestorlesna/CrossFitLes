// Catálogo remoto de challenges: se guarda en app_setting (JSON) al actualizar el
// contenido y se carga en memoria al abrir la app (ver DbProvider).
import { getSetting } from '../db/repositories/appSettingRepo';
import { setRemoteChallenges } from '../data/challenges';

export const CHALLENGE_CATALOG_SETTING = 'challenge_catalog';

export async function loadRemoteChallenges(): Promise<void> {
  try {
    const raw = await getSetting(CHALLENGE_CATALOG_SETTING);
    setRemoteChallenges(raw ? (JSON.parse(raw) as unknown[]) : []);
  } catch (e) {
    console.warn('[Challenges] No se pudo cargar el catálogo remoto', e);
    setRemoteChallenges([]);
  }
}
