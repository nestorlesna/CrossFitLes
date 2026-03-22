import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

/**
 * Mapeo de ejercicios conocidos a sus grupos musculares (Primarios y Secundarios)
 * Los nombres de los músculos deben coincidir EXACTAMENTE con los del catálogo.
 */
const EXERCISE_MUSCLES: Record<string, { primary: string[], secondary?: string[] }> = {
  'Air Squat': {
    primary: ['Recto femoral', 'Vasto lateral', 'Vasto medial', 'Glúteo mayor'],
    secondary: ['Erectores espinales', 'Bíceps femoral', 'Semitendinoso']
  },
  'Thruster': {
    primary: ['Recto femoral', 'Deltoides anterior', 'Glúteo mayor'],
    secondary: ['Tríceps braquial', 'Recto abdominal', 'Vasto lateral', 'Trapecio (superior)']
  },
  'Pull-up': {
    primary: ['Dorsal ancho', 'Bíceps braquial'],
    secondary: ['Trapecio (medio)', 'Trapecio (inferior)', 'Braquiorradial', 'Romboides']
  },
  'Push-up': {
    primary: ['Pectoral mayor', 'Tríceps braquial', 'Deltoides anterior'],
    secondary: ['Recto abdominal', 'Oblicuo externo']
  },
  'Deadlift': {
    primary: ['Glúteo mayor', 'Bíceps femoral', 'Semitendinoso', 'Erectores espinales'],
    secondary: ['Dorsal ancho', 'Trapecio (superior)', 'Flexores antebrazo']
  },
  'Power Clean': {
    primary: ['Glúteo mayor', 'Bíceps femoral', 'Trapecio (superior)', 'Recto femoral'],
    secondary: ['Deltoides anterior', 'Gastrocnemio (gemelos)', 'Braquiorradial']
  },
  'Snatch': {
    primary: ['Glúteo mayor', 'Recto femoral', 'Deltoides anterior', 'Erectores espinales'],
    secondary: ['Trapecio (superior)', 'Bíceps femoral', 'Tríceps braquial', 'Dorsal ancho']
  },
  'Clean & Jerk': {
    primary: ['Glúteo mayor', 'Recto femoral', 'Deltoides anterior', 'Tríceps braquial'],
    secondary: ['Trapecio (superior)', 'Erectores espinales', 'Gastrocnemio (gemelos)']
  },
  'Overhead Squat': {
    primary: ['Recto femoral', 'Vasto lateral', 'Glúteo mayor', 'Deltoides anterior'],
    secondary: ['Erectores espinales', 'Trapecio (superior)', 'Deltoides lateral']
  },
  'Front Squat': {
    primary: ['Recto femoral', 'Vasto lateral', 'Glúteo mayor', 'Recto abdominal'],
    secondary: ['Erectores espinales', 'Vasto medial']
  },
  'Shoulder Press': {
    primary: ['Deltoides anterior', 'Deltoides lateral'],
    secondary: ['Tríceps braquial', 'Trapecio (superior)', 'Pectoral mayor']
  },
  'Push Press': {
    primary: ['Deltoides anterior', 'Tríceps braquial', 'Recto femoral'],
    secondary: ['Glúteo mayor', 'Deltoides lateral', 'Trapecio (superior)']
  },
  'Wall Ball Shot': {
    primary: ['Recto femoral', 'Glúteo mayor', 'Deltoides anterior'],
    secondary: ['Tríceps braquial', 'Recto abdominal', 'Vasto lateral']
  },
  'Box Jump': {
    primary: ['Glúteo mayor', 'Vasto lateral', 'Gastrocnemio (gemelos)'],
    secondary: ['Bíceps femoral', 'Recto femoral', 'Sóleo']
  },
  'Burpee': {
    primary: ['Pectoral mayor', 'Tríceps braquial', 'Recto femoral', 'Glúteo mayor', 'Deltoides anterior'],
    secondary: ['Recto abdominal', 'Erectores espinales']
  },
  'Double Under': {
    primary: ['Gastrocnemio (gemelos)', 'Sóleo'],
    secondary: ['Deltoides lateral', 'Flexores antebrazo', 'Bíceps braquial']
  },
  'Rowing': {
    primary: ['Dorsal ancho', 'Bíceps femoral', 'Glúteo mayor', 'Bíceps braquial'],
    secondary: ['Trapecio (medio)', 'Romboides', 'Erectores espinales', 'Braquiorradial', 'Recto femoral']
  },
  'Toes to Bar (T2B)': {
    primary: ['Recto abdominal', 'Oblicuo externo', 'Recto femoral'],
    secondary: ['Dorsal ancho', 'Flexores antebrazo', 'Pectoral mayor']
  },
  'Kettlebell Swing': {
    primary: ['Glúteo mayor', 'Bíceps femoral', 'Semitendinoso', 'Erectores espinales'],
    secondary: ['Trapecio (superior)', 'Deltoides anterior', 'Dorsal ancho']
  },
  'Wall Walk': {
    primary: ['Deltoides anterior', 'Trapecio (superior)', 'Pectoral mayor', 'Tríceps braquial'],
    secondary: ['Recto abdominal', 'Oblicuo externo', 'Deltoides posterior']
  },
  'Dips': {
    primary: ['Tríceps braquial', 'Pectoral mayor', 'Deltoides anterior'],
    secondary: ['Pectoral menor', 'Romboides']
  },
  'Hollow Hold': {
    primary: ['Recto abdominal', 'Oblicuo externo', 'Oblicuo interno'],
    secondary: ['Recto femoral', 'Pectoral mayor']
  },
  'Walking Lunge': {
    primary: ['Recto femoral', 'Glúteo mayor', 'Vasto lateral'],
    secondary: ['Bíceps femoral', 'Vasto medial', 'Recto abdominal']
  },
  'Back Squat': {
    primary: ['Recto femoral', 'Vasto lateral', 'Glúteo mayor', 'Erectores espinales'],
    secondary: ['Bíceps femoral', 'Aductores', 'Sóleo']
  },
  'Running': {
    primary: ['Recto femoral', 'Glúteo mayor', 'Gastrocnemio (gemelos)', 'Sóleo'],
    secondary: ['Bíceps femoral', 'Tibial anterior', 'Recto abdominal']
  },
  'Bench Press': {
    primary: ['Pectoral mayor', 'Tríceps braquial', 'Deltoides anterior'],
    secondary: ['Pectoral menor', 'Deltoides lateral']
  },
  'Bar Muscle-Up': {
    primary: ['Dorsal ancho', 'Pectoral mayor', 'Tríceps braquial', 'Bíceps braquial'],
    secondary: ['Recto abdominal', 'Trapecio (inferior)', 'Deltoides anterior']
  },
  'Ring Row': {
    primary: ['Dorsal ancho', 'Trapecio (medio)', 'Bíceps braquial'],
    secondary: ['Deltoides posterior', 'Braquiorradial', 'Romboides']
  },
  'Kettlebell Snatch': {
    primary: ['Glúteo mayor', 'Bíceps femoral', 'Deltoides anterior', 'Trapecio (superior)'],
    secondary: ['Recto abdominal', 'Flexores antebrazo', 'Recto femoral']
  },
  'Russian Twist': {
    primary: ['Oblicuo externo', 'Oblicuo interno', 'Recto abdominal'],
    secondary: ['Recto femoral']
  },
  'Hollow Rock': {
    primary: ['Recto abdominal', 'Oblicuo externo'],
    secondary: ['Recto femoral']
  },
  'Sit-Up': {
    primary: ['Recto abdominal', 'Oblicuo externo'],
    secondary: ['Recto femoral']
  },
  // ... (anteriores ejercicios se mantienen)
  'Handstand Push-Up': {
    primary: ['Deltoides anterior', 'Tríceps braquial', 'Trapecio (superior)'],
    secondary: ['Pectoral mayor', 'Recto abdominal']
  },
  'Kettlebell Clean and Jerk': {
    primary: ['Glúteo mayor', 'Recto femoral', 'Deltoides anterior', 'Tríceps braquial'],
    secondary: ['Bíceps femoral', 'Trapecio (superior)', 'Gastrocnemio (gemelos)']
  },
  'Kettlebell Front Squat': {
    primary: ['Recto femoral', 'Vasto lateral', 'Glúteo mayor', 'Recto abdominal'],
    secondary: ['Erectores espinales', 'Deltoides anterior']
  },
  'Kettlebell Push-Up': {
    primary: ['Pectoral mayor', 'Tríceps braquial', 'Deltoides anterior'],
    secondary: ['Recto abdominal', 'Oblicuo externo', 'Flexores antebrazo']
  },
  'Assault Bike': {
    primary: ['Recto femoral', 'Glúteo mayor', 'Deltoides anterior', 'Tríceps braquial', 'Dorsal ancho'],
    secondary: ['Gastrocnemio (gemelos)', 'Bíceps braquial', 'Recto abdominal']
  },
  'Box Jump-Over': {
    primary: ['Glúteo mayor', 'Vasto lateral', 'Gastrocnemio (gemelos)'],
    secondary: ['Recto femoral', 'Bíceps femoral', 'Erectores espinales']
  },
  'Chest-to-Bar Pull-Up': {
    primary: ['Dorsal ancho', 'Bíceps braquial', 'Pectoral mayor'],
    secondary: ['Trapecio (medio)', 'Romboides', 'Trapecio (inferior)']
  },
  'Burpee Over the Bar': {
    primary: ['Pectoral mayor', 'Tríceps braquial', 'Recto femoral', 'Glúteo mayor'],
    secondary: ['Deltoides anterior', 'Gastrocnemio (gemelos)']
  },
  'Rope Climb': {
    primary: ['Dorsal ancho', 'Bíceps braquial', 'Oblicuo externo', 'Flexores antebrazo'],
    secondary: ['Trapecio (medio)', 'Recto femoral']
  },
  'Shuttle Run': {
    primary: ['Recto femoral', 'Glúteo mayor', 'Gastrocnemio (gemelos)'],
    secondary: ['Bíceps femoral', 'Tibial anterior', 'Recto abdominal']
  },
  'Pistol Squat': {
    primary: ['Recto femoral', 'Glúteo mayor', 'Vasto lateral'],
    secondary: ['Gastrocnemio (gemelos)', 'Sóleo', 'Recto abdominal']
  },
  'GHD Back Extension': {
    primary: ['Erectores espinales', 'Glúteo mayor', 'Bíceps femoral'],
    secondary: ['Trapecio (inferior)', 'Semitendinoso']
  },
  'GHD Sit-Up': {
    primary: ['Recto abdominal', 'Recto femoral'],
    secondary: ['Oblicuo externo', 'Aductores']
  },
  'Hanging Knees to Elbows': {
    primary: ['Recto abdominal', 'Flexores antebrazo', 'Recto femoral'],
    secondary: ['Oblicuo externo', 'Dorsal ancho']
  },
  'Barbell Sumo Deadlift High Pull': {
    primary: ['Trapecio (superior)', 'Glúteo mayor', 'Deltoides lateral', 'Erectores espinales'],
    secondary: ['Bíceps femoral', 'Bíceps braquial', 'Gastrocnemio (gemelos)']
  },
  'Barbell Bent Over Row': {
    primary: ['Dorsal ancho', 'Trapecio (medio)', 'Bíceps braquial'],
    secondary: ['Deltoides posterior', 'Romboides', 'Erectores espinales']
  },
  'Barbell Upright Row': {
    primary: ['Trapecio (superior)', 'Deltoides lateral'],
    secondary: ['Bíceps braquial', 'Deltoides anterior', 'Braquiorradial']
  },
  'Nordic Hamstring Curl': {
    primary: ['Bíceps femoral', 'Semitendinoso', 'Semimembranoso'],
    secondary: ['Gastrocnemio (gemelos)', 'Erectores espinales']
  },
  'Dumbbell Bicep Curl': {
    primary: ['Bíceps braquial'],
    secondary: ['Braquial anterior', 'Braquiorradial', 'Flexores antebrazo']
  },
  'Dumbbell Devil\'s Press': {
    primary: ['Deltoides anterior', 'Glúteo mayor', 'Pectoral mayor', 'Erectores espinales'],
    secondary: ['Trapecio (superior)', 'Tríceps braquial', 'Bíceps femoral']
  },
  'Bodyweight Glute Bridge': {
    primary: ['Glúteo mayor', 'Bíceps femoral'],
    secondary: ['Recto abdominal', 'Erectores espinales']
  },
  'Superband Shoulder Dislocates': {
    primary: ['Deltoides anterior', 'Pectoral mayor', 'Trapecio (superior)'],
    secondary: ['Deltoides posterior', 'Romboides']
  }
};

/**
 * Mapeo de nombres alternativos para asegurar que los ejercicios compuestos 
 * o con variaciones también se actualicen.
 */
const ALIAS_MAP: Record<string, string> = {
  // Peso Corporal
  'Bodyweight Squat': 'Air Squat',
  'Bodyweight Pull Up': 'Pull-up',
  'Bar Pull Up': 'Pull-up',
  'Bodyweight Push Up': 'Push-up',
  'Bodyweight Sit Up': 'Sit-Up',
  'Bodyweight Handstand Push-Up': 'Handstand Push-Up',
  'Bodyweight Pistol Squat': 'Pistol Squat',
  'Bodyweight Walking Lunge': 'Walking Lunge',
  'Bodyweight Burpee': 'Burpee',
  'Bodyweight Hollow Body Hold': 'Hollow Hold',
  'Bodyweight Glute Bridge': 'Bodyweight Glute Bridge',

  // Barra (Barbell)
  'Barbell Deadlift': 'Deadlift',
  'Barbell Power Clean': 'Power Clean',
  'Barbell Power Snatch': 'Snatch',
  'Barbell Clean and Jerk': 'Clean & Jerk',
  'Barbell Overhead Squat': 'Overhead Squat',
  'Barbell Front Squat': 'Front Squat',
  'Barbell Strict Press': 'Shoulder Press',
  'Barbell Push Press': 'Push Press',
  'Barbell Push Jerk': 'Push Press',
  'Barbell Back Squat': 'Back Squat',
  'Barbell Bench Press': 'Bench Press',
  'Barbell Lunge': 'Walking Lunge',
  'Barbell Hang Power Clean': 'Power Clean',
  'Barbell Squat Clean': 'Clean & Jerk',
  'Barbell Hang Clean and Jerk': 'Clean & Jerk',
  'Barbell Romanian Deadlift': 'Deadlift',
  'Barbell Hang Muscle Clean and Press': 'Shoulder Press',
  'Barbell Muscle Snatch': 'Snatch',
  'Barbell Hang Power Snatch': 'Snatch',
  'Barbell Hang Clean': 'Power Clean',
  'Barbell Hang Power Cluster': 'Thruster',
  'Barbell Bent Over Row': 'Barbell Bent Over Row',
  'Barbell Upright Row': 'Barbell Upright Row',

  // Mancuernas (Dumbbell)
  'Dumbbell Bench Press': 'Bench Press',
  'Dumbbell Thruster': 'Thruster',
  'Dumbbell Front Rack Lunge': 'Walking Lunge',
  'Dumbbell One-Arm Overhead Lunge': 'Walking Lunge',
  'Dumbbell Bicep Curl': 'Dumbbell Bicep Curl',
  'Dumbbell Split Clean': 'Power Clean',
  'Dumbbell Alternating Bent Over Row': 'Barbell Bent Over Row',
  'Dumbbell Devil\'s Press': 'Dumbbell Devil\'s Press',
  'Alternating Single Arm Dumbbell Power Snatch': 'Snatch',
  'Double Dumbbell Overhead Walking Lunge': 'Walking Lunge',
  'Single-Leg Dumbbell Romanian Deadlift': 'Deadlift',
  'Weighted Box Step-Up': 'Box Jump-Over',

  // Otros
  'GHD Sit-Up': 'Sit-Up',
  'GHD Back Extension': 'GHD Back Extension',
  'Ring Muscle-Up': 'Bar Muscle-Up',
  'Ring Row': 'Ring Row',
  'Ring Dip': 'Dips',
  'Ring Handstand Push-Up': 'Handstand Push-Up',
  'Ring Strict Muscle Up': 'Bar Muscle-Up',
  'Hanging Toes to Bar': 'Toes to Bar (T2B)',
  'Hanging Knees to Elbows': 'Hanging Knees to Elbows',
  'Med-Ball Box Step-Over': 'Box Jump-Over',
  'Kettlebell Ground-to-Overhead': 'Clean & Jerk',
};

/**
 * Actualiza la tabla exercise_muscle_group cruzando los nombres de ejercicios 
 * y de grupos musculares.
 */
export async function seedExerciseMuscleGroups(db: SQLiteDBConnection): Promise<number> {
  let count = 0;

  // 1. Obtener todos los ejercicios y grupos musculares para tener sus IDs
  const exerciseRows = await db.query('SELECT id, name FROM exercise');
  const muscleRows = await db.query('SELECT id, name FROM muscle_group');

  const exerciseMap = new Map((exerciseRows.values || []).map((ex: any) => [ex.name, ex.id]));
  const muscleMap = new Map((muscleRows.values || []).map((m: any) => [m.name, m.id]));

  const stmts: { statement: string; values: unknown[] }[] = [];

  // 2. Por cada ejercicio conocido en nuestro mapeo
  for (const exName of (exerciseRows.values || []).map((ex: any) => ex.name)) {
    const originalName = exName;
    const lookupName = ALIAS_MAP[originalName] || originalName;
    const muscleData = EXERCISE_MUSCLES[lookupName];

    if (muscleData) {
      const exId = exerciseMap.get(originalName);
      if (!exId) continue;

      // Primarios
      for (const mName of muscleData.primary) {
        const mId = muscleMap.get(mName);
        if (mId) {
          stmts.push({
            statement: 'INSERT OR IGNORE INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 1)',
            values: [generateUUID(), exId, mId]
          });
        }
      }

      // Secundarios
      if (muscleData.secondary) {
        for (const mName of muscleData.secondary) {
          const mId = muscleMap.get(mName);
          if (mId) {
            stmts.push({
              statement: 'INSERT OR IGNORE INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
              values: [generateUUID(), exId, mId]
            });
          }
        }
      }
      count++;
    }
  }

  // 3. Ejecutar en lotes para no saturar
  if (stmts.length > 0) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
      await db.executeSet(stmts.slice(i, i + BATCH_SIZE), true);
    }
  }

  return count;
}
