// Aceptación del descargo de salud (app_setting): versión aceptada y fecha.
import { getDatabase, saveDatabase } from '../db/database';
import { getSetting, setSettingStmt } from '../db/repositories/appSettingRepo';
import { HEALTH_DISCLAIMER_VERSION } from '../data/healthDisclaimer';
import { nowSql } from './contentFormat';

const VERSION_SETTING = 'health_disclaimer_version';
const ACCEPTED_AT_SETTING = 'health_disclaimer_accepted_at';

/** true si nunca se aceptó o se aceptó una versión anterior del texto */
export async function needsDisclaimer(): Promise<boolean> {
  return Number((await getSetting(VERSION_SETTING)) ?? 0) < HEALTH_DISCLAIMER_VERSION;
}

export async function acceptDisclaimer(): Promise<void> {
  await getDatabase().executeSet(
    [
      setSettingStmt(VERSION_SETTING, String(HEALTH_DISCLAIMER_VERSION)),
      setSettingStmt(ACCEPTED_AT_SETTING, nowSql()),
    ],
    true
  );
  await saveDatabase();
}
