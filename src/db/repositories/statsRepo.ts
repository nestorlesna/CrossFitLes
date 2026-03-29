import { getDatabase } from '../database';
import {
  PersonalRecord,
  ExerciseProgressionPoint,
  WeeklyActivity,
  SectionDistribution,
  CaloriesDataPoint,
} from '../../models/Stats';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Obtiene todos los PRs del usuario con nombres de ejercicios
 */
export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const db = getDatabase();
  const query = `
    SELECT pr.*, e.name as exercise_name, mu.abbreviation as record_unit_abbreviation
    FROM personal_record pr
    JOIN exercise e ON pr.exercise_id = e.id
    LEFT JOIN measurement_unit mu ON pr.record_unit_id = mu.id
    ORDER BY pr.achieved_date DESC
  `;
  const result = await db.query(query);
  return result.values || [];
}

/**
 * Obtiene la progresión histórica para un ejercicio y tipo de récord específicos
 */
export async function getExerciseProgression(
  exerciseId: string, 
  recordType: string
): Promise<ExerciseProgressionPoint[]> {
  const db = getDatabase();
  
  let valueColumn = '';
  switch (recordType) {
    case 'max_weight': valueColumn = 'actual_weight_value'; break;
    case 'max_reps': valueColumn = 'actual_repetitions'; break;
    case 'min_time': valueColumn = 'actual_time_seconds'; break;
    case 'max_distance': valueColumn = 'actual_distance_value'; break;
    case 'max_calories': valueColumn = 'actual_calories'; break;
    default: return [];
  }

  const query = `
    SELECT 
      ts.session_date as date, 
      ser.${valueColumn} as value, 
      ser.rx_or_scaled,
      ser.training_session_id
    FROM session_exercise_result ser
    JOIN training_session ts ON ser.training_session_id = ts.id
    WHERE ser.exercise_id = ? 
      AND ser.is_completed = 1 
      AND ser.${valueColumn} IS NOT NULL
      AND ts.status = 'completed'
    ORDER BY ts.session_date ASC
  `;
  
  const result = await db.query(query, [exerciseId]);
  return result.values || [];
}

/**
 * Obtiene la actividad semanal de las últimas N semanas
 */
export async function getWeeklyActivity(weeks: number = 8): Promise<WeeklyActivity[]> {
  const db = getDatabase();
  const startDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');

  // SQLite no tiene funciones de semana potentes, agrupamos por fecha y procesamos en JS
  const query = `
    SELECT
      ts.session_date,
      COUNT(DISTINCT ts.id) as session_count,
      SUM(ts.actual_duration_minutes) as total_duration,
      SUM(COALESCE(ts.estimated_calories, 0)) as total_calories
    FROM training_session ts
    WHERE ts.session_date >= ? AND ts.status = 'completed'
    GROUP BY ts.session_date
    ORDER BY ts.session_date ASC
  `;
  
  const result = await db.query(query, [startDate]);
  const rows = result.values || [];

  // Agrupar por semana en JS
  const weeklyMap = new Map<string, WeeklyActivity>();

  rows.forEach(row => {
    const date = new Date(row.session_date);
    const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    if (!weeklyMap.has(weekStart)) {
      weeklyMap.set(weekStart, { week: weekStart, count: 0, total_minutes: 0, total_calories: 0 });
    }

    const weekData = weeklyMap.get(weekStart)!;
    weekData.count += row.session_count;
    weekData.total_minutes += row.total_duration || 0;
    weekData.total_calories += row.total_calories || 0;  // suma estimated_calories de las sesiones
  });

  return Array.from(weeklyMap.values());
}

/**
 * Distribución de tipos de sección (WOD, Fuerza, etc) en el último mes
 */
export async function getSectionDistribution(): Promise<SectionDistribution[]> {
  const db = getDatabase();
  const query = `
    SELECT 
      st.name,
      COUNT(ser.id) as value,
      st.color
    FROM session_exercise_result ser
    JOIN section_type st ON ser.section_type_id = st.id
    JOIN training_session ts ON ser.training_session_id = ts.id
    WHERE ts.session_date >= date('now', '-30 days')
      AND ts.status = 'completed'
    GROUP BY st.id
    ORDER BY value DESC
  `;
  
  const result = await db.query(query);
  return result.values || [];
}

/**
 * Historial de calorías estimadas por sesión (últimas N semanas)
 */
export async function getCaloriesHistory(weeks: number = 12): Promise<CaloriesDataPoint[]> {
  const db = getDatabase();
  const startDate = format(subDays(new Date(), weeks * 7), 'yyyy-MM-dd');

  const result = await db.query(
    `SELECT
       session_date as date,
       estimated_calories as calories,
       COALESCE(actual_duration_minutes, 0) as duration,
       general_feeling as feeling
     FROM training_session
     WHERE session_date >= ?
       AND status = 'completed'
       AND estimated_calories IS NOT NULL
       AND estimated_calories > 0
     ORDER BY session_date ASC`,
    [startDate]
  );
  return (result.values ?? []) as CaloriesDataPoint[];
}

/**
 * Obtiene un resumen rápido para el dashboard (Home)
 */
export async function getHomeStats(): Promise<{
  sessionsThisMonth: number;
  totalMinutesThisMonth: number;
  recentPRs: PersonalRecord[];
  streakDays: number;
}> {
  const db = getDatabase();
  
  // 1. Sesiones y minutos del mes actual
  const monthStart = format(new Date(), 'yyyy-MM-01');
  const monthStats = await db.query(`
    SELECT COUNT(*) as count, SUM(actual_duration_minutes) as total_minutes
    FROM training_session
    WHERE session_date >= ? AND status = 'completed'
  `, [monthStart]);

  // 2. PRs recientes (últimos 3)
  const recentPRs = await db.query(`
    SELECT pr.*, e.name as exercise_name, mu.abbreviation as record_unit_abbreviation
    FROM personal_record pr
    JOIN exercise e ON pr.exercise_id = e.id
    LEFT JOIN measurement_unit mu ON pr.record_unit_id = mu.id
    ORDER BY pr.achieved_date DESC
    LIMIT 3
  `);

  // 3. Racha actual (días consecutivos de entrenamiento o sesiones por semana)
  // Simplificado: sesiones en los últimos 7 días
  const last7Days = await db.query(`
    SELECT COUNT(DISTINCT session_date) as active_days
    FROM training_session
    WHERE session_date >= date('now', '-7 days') AND status = 'completed'
  `);

  return {
    sessionsThisMonth: monthStats.values?.[0]?.count || 0,
    totalMinutesThisMonth: monthStats.values?.[0]?.total_minutes || 0,
    recentPRs: recentPRs.values || [],
    streakDays: last7Days.values?.[0]?.active_days || 0
  };
}
