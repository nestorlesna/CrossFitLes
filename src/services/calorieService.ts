// Servicio de estimación de calorías para sesiones de entrenamiento
// Fórmula base: kcal = MET × peso_kg × (minutos / 60)
// Ajuste RPE:   factor = 0.80 + (rpe / 10) × 0.40  → RPE 1→0.84, RPE 5→1.00, RPE 10→1.20
// El RPE captura la intensidad real percibida por el atleta ese día.
//
// Si no se dispone de peso corporal del usuario, se usa 75 kg como referencia estándar.
// Los MET asignados son conservadores: evitar sobreestimar (tendencia habitual en apps).

import { getDatabase } from '../db/database';
import { getLatestMeasurement } from '../db/repositories/userProfileRepo';
import { getProfile } from '../db/repositories/userProfileRepo';

// Peso por defecto cuando no hay dato del usuario
const DEFAULT_WEIGHT_KG = 75;

/**
 * Obtiene el peso corporal a usar: primero busca en la sesión,
 * luego en la última medición, y finalmente usa el default.
 */
export async function resolveWeightKg(sessionBodyWeight?: number | null): Promise<number> {
  if (sessionBodyWeight && sessionBodyWeight > 0) return sessionBodyWeight;
  try {
    const latest = await getLatestMeasurement();
    if (latest?.weight_kg && latest.weight_kg > 0) return latest.weight_kg;
  } catch { /* silencioso */ }
  return DEFAULT_WEIGHT_KG;
}

/**
 * Calcula las calorías estimadas para una sesión.
 *
 * @param sessionId     ID de la sesión (para obtener MET promedio de los ejercicios)
 * @param weightKg      Peso corporal en kg
 * @param durationMin   Duración total en minutos
 * @param rpe           Esfuerzo percibido 1-10 (default 5 = moderado)
 * @returns             Calorías estimadas redondeadas al entero
 */
export async function calculateSessionCalories(
  sessionId: string,
  weightKg: number,
  durationMin: number,
  rpe: number = 5
): Promise<number> {
  if (durationMin <= 0 || weightKg <= 0) return 0;

  const db = getDatabase();

  // Obtener el MET promedio de los ejercicios completados en la sesión
  // Ponderar por ejercicios completados; si no hay, usar MET genérico de CrossFit (8.5)
  const metResult = await db.query(
    `SELECT AVG(e.met_value) as avg_met
     FROM session_exercise_result ser
     JOIN exercise e ON ser.exercise_id = e.id
     WHERE ser.training_session_id = ?
       AND ser.is_completed = 1
       AND e.met_value IS NOT NULL`,
    [sessionId]
  );

  const avgMet: number = metResult.values?.[0]?.avg_met ?? 8.5;
  const effectiveMet = avgMet > 0 ? avgMet : 8.5;

  // Factor RPE: RPE=1→0.84, RPE=5→1.00, RPE=10→1.20
  const clampedRpe = Math.max(1, Math.min(10, rpe));
  const rpeFactor = 0.80 + (clampedRpe / 10) * 0.40;

  const kcal = effectiveMet * weightKg * (durationMin / 60) * rpeFactor;
  return Math.round(kcal);
}

/**
 * Versión simplificada para cuando no se tiene sessionId
 * (útil para previsualización antes de guardar).
 */
export function estimateCaloriesSimple(
  metValue: number,
  weightKg: number,
  durationMin: number,
  rpe: number = 5
): number {
  if (durationMin <= 0 || weightKg <= 0) return 0;
  const clampedRpe = Math.max(1, Math.min(10, rpe));
  const rpeFactor = 0.80 + (clampedRpe / 10) * 0.40;
  return Math.round(metValue * weightKg * (durationMin / 60) * rpeFactor);
}
