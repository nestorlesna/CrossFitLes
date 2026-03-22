// Servicio de datos semilla para la aplicación
// Se ejecuta UNA SOLA VEZ al inicializar la BD (controlado por localStorage)
// v2: agrega ejercicios básicos de CrossFit

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

const SEED_FLAG = 'seed_v1_done';
const SEED_EXERCISES_FLAG = 'seed_v2_exercises_done';

// Verifica si un seed ya fue ejecutado
function isFlagDone(flag: string): boolean {
  return localStorage.getItem(flag) === 'true';
}

let isSeeding = false;

// Marca un flag como completado
function markFlag(flag: string): void {
  localStorage.setItem(flag, 'true');
}

// Limpia todos los flags de seed (exportada para uso en seedService2)
export function clearSeedFlags(): void {
  localStorage.removeItem(SEED_FLAG);
  localStorage.removeItem(SEED_EXERCISES_FLAG);
}

// Inserta un registro de catálogo con manejo de errores individual
async function insertRecord(
  db: SQLiteDBConnection,
  table: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const id = generateUUID();
    const fields = { id, ...data };
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const placeholders = keys.map(() => '?').join(', ');

    await db.run(
      `INSERT OR IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
  } catch (err) {
    // Si falla un registro, loguear y continuar sin abortar el seed
    console.warn(`[Seed] Error al insertar en ${table}:`, data, err);
  }
}

// Busca el ID de un registro en una tabla por nombre
async function findIdByName(db: SQLiteDBConnection, table: string, name: string): Promise<string | null> {
  const result = await db.query(`SELECT id FROM ${table} WHERE name = ?`, [name]);
  return (result.values?.[0]?.id as string) ?? null;
}

// Ejecuta el seed completo si no fue ejecutado antes
export async function runSeed(db: SQLiteDBConnection): Promise<void> {
  if (isSeeding) {
    console.warn('[Seed] Ya hay una operación de seed en curso. Omitiendo.');
    return;
  }

  isSeeding = true;
  try {
    const esc = (val: string | number | null) => {
      if (val === null) return 'NULL';
      if (typeof val === 'number') return val.toString();
      return `'${val.toString().replace(/'/g, "''")}'`;
    };

    // Verificar si las tablas están realmente vacías
    let muscleGroupEmpty = true;
    let exerciseEmpty = true;
    try {
      const mgCheck = await db.query('SELECT count(*) as count FROM muscle_group');
      muscleGroupEmpty = (mgCheck.values?.[0]?.count ?? 0) === 0;
      
      const exCheck = await db.query('SELECT count(*) as count FROM exercise');
      exerciseEmpty = (exCheck.values?.[0]?.count ?? 0) === 0;
    } catch (e) {
      // Ignorar si las tablas no existen todavía
    }

    // ─── Seed v1: Catálogos ────────────────────────────────────────────────
    if (!isFlagDone(SEED_FLAG) || muscleGroupEmpty) {
      console.log('[Seed] Iniciando carga de datos semilla (catálogos)...');

      const seedCatalog = async (table: string, items: Record<string, any>[]) => {
        const sqlParts: string[] = [];
        for (const item of items) {
          const id = generateUUID();
          const fields = { id, ...item };
          const keys = Object.keys(fields);
          const values = Object.values(fields).map(v => esc(v as any));
          sqlParts.push(
            `INSERT OR IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${values.join(', ')})`
          );
        }
        if (sqlParts.length > 0) {
          await db.execute(sqlParts.join(';\n') + ';');
        }
      };

      await seedCatalog('muscle_group', [
        { name: 'Pectorales', body_zone: 'upper_body', sort_order: 1, is_active: 1 },
        { name: 'Dorsales', body_zone: 'upper_body', sort_order: 2, is_active: 1 },
        { name: 'Deltoides', body_zone: 'upper_body', sort_order: 3, is_active: 1 },
        { name: 'Bíceps', body_zone: 'upper_body', sort_order: 4, is_active: 1 },
        { name: 'Tríceps', body_zone: 'upper_body', sort_order: 5, is_active: 1 },
        { name: 'Trapecio', body_zone: 'upper_body', sort_order: 6, is_active: 1 },
        { name: 'Antebrazos', body_zone: 'upper_body', sort_order: 7, is_active: 1 },
        { name: 'Cuádriceps', body_zone: 'lower_body', sort_order: 8, is_active: 1 },
        { name: 'Isquiotibiales', body_zone: 'lower_body', sort_order: 9, is_active: 1 },
        { name: 'Glúteos', body_zone: 'lower_body', sort_order: 10, is_active: 1 },
        { name: 'Pantorrillas', body_zone: 'lower_body', sort_order: 11, is_active: 1 },
        { name: 'Core/Abdominales', body_zone: 'core', sort_order: 12, is_active: 1 },
      ]);

      await seedCatalog('equipment', [
        { name: 'Barra olímpica', category: 'barbell', sort_order: 1, is_active: 1 },
        { name: 'Mancuernas', category: 'dumbbell', sort_order: 2, is_active: 1 },
        { name: 'Kettlebell', category: 'kettlebell', sort_order: 3, is_active: 1 },
        { name: 'Anillas', category: 'bodyweight', sort_order: 4, is_active: 1 },
        { name: 'Pull-up bar', category: 'bodyweight', sort_order: 5, is_active: 1 },
        { name: 'Rower', category: 'cardio', sort_order: 6, is_active: 1 },
        { name: 'Assault bike', category: 'cardio', sort_order: 7, is_active: 1 },
        { name: 'Cuerda para saltar', category: 'cardio', sort_order: 8, is_active: 1 },
        { name: 'Box de salto', category: 'other', sort_order: 9, is_active: 1 },
        { name: 'Banda elástica', category: 'other', sort_order: 10, is_active: 1 },
        { name: 'Balón medicinal', category: 'other', sort_order: 11, is_active: 1 },
        { name: 'Wall ball', category: 'other', sort_order: 12, is_active: 1 },
        { name: 'Paralelas', category: 'bodyweight', sort_order: 13, is_active: 1 },
        { name: 'GHD', category: 'machine', sort_order: 14, is_active: 1 },
        { name: 'Sled', category: 'other', sort_order: 15, is_active: 1 },
      ]);

      await seedCatalog('measurement_unit', [
        { name: 'Kilogramos', abbreviation: 'kg', unit_type: 'weight', sort_order: 1, is_active: 1 },
        { name: 'Libras', abbreviation: 'lb', unit_type: 'weight', sort_order: 2, is_active: 1 },
        { name: 'Repeticiones', abbreviation: 'rep', unit_type: 'repetitions', sort_order: 3, is_active: 1 },
        { name: 'Calorías', abbreviation: 'cal', unit_type: 'calories', sort_order: 4, is_active: 1 },
        { name: 'Minutos', abbreviation: 'min', unit_type: 'time', sort_order: 5, is_active: 1 },
        { name: 'Segundos', abbreviation: 'seg', unit_type: 'time', sort_order: 6, is_active: 1 },
        { name: 'Metros', abbreviation: 'm', unit_type: 'distance', sort_order: 7, is_active: 1 },
        { name: 'Kilómetros', abbreviation: 'km', unit_type: 'distance', sort_order: 8, is_active: 1 },
        { name: 'Millas', abbreviation: 'mi', unit_type: 'distance', sort_order: 9, is_active: 1 },
      ]);

      await seedCatalog('difficulty_level', [
        { name: 'Básico', color: '#22c55e', numeric_value: 1, sort_order: 1, is_active: 1 },
        { name: 'Intermedio', color: '#f59e0b', numeric_value: 2, sort_order: 2, is_active: 1 },
        { name: 'Avanzado', color: '#ef4444', numeric_value: 3, sort_order: 3, is_active: 1 },
        { name: 'Experto', color: '#8b5cf6', numeric_value: 4, sort_order: 4, is_active: 1 },
      ]);

      await seedCatalog('tag', [
        { name: 'hombro', color: '#6366f1', sort_order: 1, is_active: 1 },
        { name: 'sentadilla', color: '#8b5cf6', sort_order: 2, is_active: 1 },
        { name: 'core', color: '#ec4899', sort_order: 3, is_active: 1 },
        { name: 'olímpico', color: '#f59e0b', sort_order: 4, is_active: 1 },
        { name: 'gimnástico', color: '#22c55e', sort_order: 5, is_active: 1 },
        { name: 'cardio', color: '#ef4444', sort_order: 6, is_active: 1 },
        { name: 'monoarticular', color: '#64748b', sort_order: 7, is_active: 1 },
        { name: 'press', color: '#0ea5e9', sort_order: 8, is_active: 1 },
        { name: 'pull', color: '#06b6d4', sort_order: 9, is_active: 1 },
        { name: 'push', color: '#0ea5e9', sort_order: 10, is_active: 1 },
        { name: 'bilateral', color: '#64748b', sort_order: 11, is_active: 1 },
        { name: 'unilateral', color: '#94a3b8', sort_order: 12, is_active: 1 },
        { name: 'isométrico', color: '#64748b', sort_order: 13, is_active: 1 },
        { name: 'pliométrico', color: '#f97316', sort_order: 14, is_active: 1 },
      ]);

      await seedCatalog('section_type', [
        { name: 'Entrada en calor', color: '#22c55e', icon: 'Flame', default_order: 1, sort_order: 1, is_active: 1 },
        { name: 'Activación', color: '#f59e0b', icon: 'Zap', default_order: 2, sort_order: 2, is_active: 1 },
        { name: 'Fuerza', color: '#ef4444', icon: 'Dumbbell', default_order: 3, sort_order: 3, is_active: 1 },
        { name: 'Habilidad', color: '#8b5cf6', icon: 'Star', default_order: 4, sort_order: 4, is_active: 1 },
        { name: 'WOD', color: '#f97316', icon: 'Timer', default_order: 5, sort_order: 5, is_active: 1 },
        { name: 'Vuelta a la calma', color: '#06b6d4', icon: 'Wind', default_order: 6, sort_order: 6, is_active: 1 },
        { name: 'Accesorio', color: '#64748b', icon: 'Plus', default_order: 7, sort_order: 7, is_active: 1 },
      ]);

      await seedCatalog('work_format', [
        { name: 'Por rondas', has_time_cap: 0, has_rounds: 1, sort_order: 1, is_active: 1 },
        { name: 'EMOM', has_time_cap: 1, has_rounds: 1, sort_order: 2, is_active: 1 },
        { name: 'AMRAP', has_time_cap: 1, has_rounds: 0, sort_order: 3, is_active: 1 },
        { name: 'For Time', has_time_cap: 1, has_rounds: 0, sort_order: 4, is_active: 1 },
        { name: 'Series fijas', has_time_cap: 0, has_rounds: 1, sort_order: 5, is_active: 1 },
        { name: 'Trabajo libre', has_time_cap: 0, has_rounds: 0, sort_order: 6, is_active: 1 },
        { name: 'Intervalos', has_time_cap: 1, has_rounds: 1, sort_order: 7, is_active: 1 },
        { name: 'Tabata', has_time_cap: 1, has_rounds: 1, sort_order: 8, is_active: 1 },
        { name: 'E2MOM', has_time_cap: 1, has_rounds: 1, sort_order: 9, is_active: 1 },
        { name: 'Escalera', has_time_cap: 0, has_rounds: 0, sort_order: 10, is_active: 1 },
      ]);

      markFlag(SEED_FLAG);
      console.log('[Seed v1] Catálogos cargados.');
    }

    // ─── Seed v2: Ejercicios básicos ───────────────────────────────────────
    if (!isFlagDone(SEED_EXERCISES_FLAG) || exerciseEmpty) {
      console.log('[Seed v2] Iniciando carga de ejercicios...');
      await seedExercises(db);
      markFlag(SEED_EXERCISES_FLAG);
      console.log('[Seed v2] Ejercicios cargados.');
    }

    // ─── Seed v3: Plantillas de ejemplo ────────────────────────────────────
    const SEED_TEMPLATES_FLAG = 'seed_v3_templates_done';
    if (!isFlagDone(SEED_TEMPLATES_FLAG)) {
      console.log('[Seed v3] Iniciando carga de plantillas...');
      await seedTemplates(db);
      markFlag(SEED_TEMPLATES_FLAG);
      console.log('[Seed v3] Plantillas cargadas.');
    }
  } catch (error) {
    console.error('[Seed] Error critico en runSeed:', error);
  } finally {
    isSeeding = false;
  }
}

// ─── Definición de ejercicios semilla ─────────────────────────────────────────
// Cada ejercicio define:
//   name, description, difficulty (nombre), primaryMuscle (nombre),
//   is_compound, secondaryMuscles[], equipment[], tags[], sections[], units[]

interface SeedExercise {
  name: string;
  description: string;
  difficulty: string;
  primaryMuscle: string;
  is_compound: number;
  secondaryMuscles: string[];
  equipment: string[];
  tags: string[];
  sections: string[];
  units: string[];     // primera unidad es la default
}

const SEED_EXERCISES: SeedExercise[] = [
  // ─── Movimientos olímpicos ───────────────────────────────────────────
  {
    name: 'Clean & Jerk',
    description: 'Levantamiento olímpico completo: cargada desde el suelo + envión por encima de la cabeza.',
    difficulty: 'Avanzado', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Deltoides', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'push', 'bilateral'],
    sections: ['Fuerza', 'WOD', 'Habilidad'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Snatch',
    description: 'Arrancada olímpica: levantar la barra desde el suelo hasta overhead en un solo movimiento.',
    difficulty: 'Avanzado', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Deltoides', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'bilateral'],
    sections: ['Fuerza', 'WOD', 'Habilidad'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Power Clean',
    description: 'Cargada de potencia: levantar la barra desde el suelo hasta los hombros sin sentadilla completa.',
    difficulty: 'Intermedio', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Trapecio', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'pull', 'bilateral'],
    sections: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Thruster',
    description: 'Front Squat + Press en un solo movimiento fluido. Ejercicio fundamental en WODs como Fran.',
    difficulty: 'Intermedio', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Deltoides', 'Tríceps', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['push', 'sentadilla', 'bilateral'],
    sections: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },

  // ─── Sentadillas ─────────────────────────────────────────────────────
  {
    name: 'Back Squat',
    description: 'Sentadilla trasera con barra sobre los trapecios. Movimiento rey para fuerza de piernas.',
    difficulty: 'Intermedio', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['sentadilla', 'bilateral'],
    sections: ['Fuerza'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Front Squat',
    description: 'Sentadilla frontal con barra en rack position. Mayor demanda de core y cuádriceps.',
    difficulty: 'Intermedio', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['sentadilla', 'bilateral'],
    sections: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Overhead Squat',
    description: 'Sentadilla con barra sostenida por encima de la cabeza. Exige gran movilidad.',
    difficulty: 'Avanzado', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['sentadilla', 'bilateral', 'hombro'],
    sections: ['Fuerza', 'Habilidad'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Air Squat',
    description: 'Sentadilla sin peso (bodyweight). Base de todo movimiento de piernas en CrossFit.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Core/Abdominales'],
    equipment: [],
    tags: ['sentadilla', 'bilateral'],
    sections: ['Entrada en calor', 'WOD'],
    units: ['Repeticiones'],
  },

  // ─── Tracciones y empujes ────────────────────────────────────────────
  {
    name: 'Deadlift',
    description: 'Peso muerto: levantar la carga desde el suelo hasta la posición de pie. Ejercicio clave de cadena posterior.',
    difficulty: 'Intermedio', primaryMuscle: 'Isquiotibiales', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Dorsales', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['pull', 'bilateral'],
    sections: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Pull-up',
    description: 'Dominada estricta o con kipping. Fundamental para la fuerza de tracción del tren superior.',
    difficulty: 'Intermedio', primaryMuscle: 'Dorsales', is_compound: 1,
    secondaryMuscles: ['Bíceps', 'Core/Abdominales'],
    equipment: ['Pull-up bar'],
    tags: ['pull', 'gimnástico', 'bilateral'],
    sections: ['WOD', 'Habilidad'],
    units: ['Repeticiones'],
  },
  {
    name: 'Push-up',
    description: 'Flexión de brazos en el suelo. Ejercicio básico de empuje horizontal.',
    difficulty: 'Básico', primaryMuscle: 'Pectorales', is_compound: 1,
    secondaryMuscles: ['Tríceps', 'Deltoides'],
    equipment: [],
    tags: ['push', 'bilateral'],
    sections: ['Entrada en calor', 'WOD'],
    units: ['Repeticiones'],
  },
  {
    name: 'Shoulder Press',
    description: 'Press de hombros estricto con barra. Fuerza pura de empuje vertical.',
    difficulty: 'Intermedio', primaryMuscle: 'Deltoides', is_compound: 1,
    secondaryMuscles: ['Tríceps', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['push', 'hombro', 'bilateral'],
    sections: ['Fuerza'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Push Press',
    description: 'Press de hombros con ayuda del impulso de piernas (dip & drive).',
    difficulty: 'Intermedio', primaryMuscle: 'Deltoides', is_compound: 1,
    secondaryMuscles: ['Tríceps', 'Cuádriceps', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['push', 'hombro', 'bilateral'],
    sections: ['Fuerza', 'WOD'],
    units: ['Kilogramos', 'Libras', 'Repeticiones'],
  },
  {
    name: 'Dips',
    description: 'Fondos en anillas o paralelas. Gran exigencia para tríceps y pectorales.',
    difficulty: 'Avanzado', primaryMuscle: 'Tríceps', is_compound: 1,
    secondaryMuscles: ['Pectorales', 'Deltoides'],
    equipment: ['Anillas', 'Paralelas'],
    tags: ['push', 'gimnástico'],
    sections: ['WOD', 'Habilidad'],
    units: ['Repeticiones'],
  },

  // ─── Gimnásticos y Core ──────────────────────────────────────────────
  {
    name: 'Toes to Bar (T2B)',
    description: 'Colgado de la barra, llevar los pies hasta tocarla. Exige fuerza de core y agarre.',
    difficulty: 'Intermedio', primaryMuscle: 'Core/Abdominales', is_compound: 1,
    secondaryMuscles: ['Antebrazos', 'Dorsales'],
    equipment: ['Pull-up bar'],
    tags: ['core', 'gimnástico'],
    sections: ['WOD', 'Habilidad'],
    units: ['Repeticiones'],
  },
  {
    name: 'Hollow Hold',
    description: 'Posición isométrica fundamental de gimnasia para fortalecer el core.',
    difficulty: 'Básico', primaryMuscle: 'Core/Abdominales', is_compound: 0,
    secondaryMuscles: [],
    equipment: [],
    tags: ['core', 'isométrico', 'gimnástico'],
    sections: ['Entrada en calor', 'Activación'],
    units: ['Segundos', 'Minutos'],
  },
  {
    name: 'Wall Walk',
    description: 'Caminar por la pared hasta quedar en posición de pino de cara a la pared.',
    difficulty: 'Intermedio', primaryMuscle: 'Deltoides', is_compound: 1,
    secondaryMuscles: ['Tríceps', 'Core/Abdominales'],
    equipment: [],
    tags: ['push', 'hombro', 'gimnástico'],
    sections: ['WOD', 'Habilidad'],
    units: ['Repeticiones'],
  },
  {
    name: 'Box Jump',
    description: 'Salto al cajón. Ejercicio pliométrico clave para la potencia de piernas.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Pantorrillas'],
    equipment: ['Box de salto'],
    tags: ['pliométrico', 'bilateral'],
    sections: ['WOD'],
    units: ['Repeticiones'],
  },
  {
    name: 'Burpee',
    description: 'Lanzarse al suelo, pecho toca tierra, y levantarse con un pequeño salto. El rey del cardio funcional.',
    difficulty: 'Básico', primaryMuscle: 'Pectorales', is_compound: 1,
    secondaryMuscles: ['Cuádriceps', 'Deltoides', 'Tríceps'],
    equipment: [],
    tags: ['cardio', 'bilateral'],
    sections: ['WOD'],
    units: ['Repeticiones'],
  },

  // ─── Cardio y Metabólico ─────────────────────────────────────────────
  {
    name: 'Double Under',
    description: 'Saltos dobles de comba. Requiere coordinación y capacidad cardiovascular.',
    difficulty: 'Intermedio', primaryMuscle: 'Pantorrillas', is_compound: 0,
    secondaryMuscles: ['Hombro'],
    equipment: ['Cuerda para saltar'],
    tags: ['cardio'],
    sections: ['Entrada en calor', 'WOD', 'Habilidad'],
    units: ['Repeticiones'],
  },
  {
    name: 'Rowing',
    description: 'Remo indoor. Trabajo cardiovascular de cuerpo completo.',
    difficulty: 'Básico', primaryMuscle: 'Dorsales', is_compound: 1,
    secondaryMuscles: ['Cuádriceps', 'Bíceps', 'Core/Abdominales'],
    equipment: ['Rower'],
    tags: ['cardio', 'pull'],
    sections: ['Entrada en calor', 'WOD'],
    units: ['Metros', 'Kilómetros', 'Calorías', 'Minutos'],
  },
  {
    name: 'Assault Bike',
    description: 'Bicicleta de aire. Uno de los dispositivos de cardio más exigentes.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Deltoides', 'Tríceps'],
    equipment: ['Assault bike'],
    tags: ['cardio', 'push'],
    sections: ['WOD'],
    units: ['Calorías', 'Minutos', 'Kilómetros'],
  },
  {
    name: 'Wall Ball Shot',
    description: 'Lanzar un balón medicinal a una diana tras realizar una sentadilla completa.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Deltoides', 'Glúteos', 'Tríceps'],
    equipment: ['Wall ball'],
    tags: ['sentadilla', 'push', 'pliométrico'],
    sections: ['WOD'],
    units: ['Repeticiones', 'Kilogramos', 'Libras'],
  },
  {
    name: 'Kettlebell Swing',
    description: 'Balanceo de pesa rusa. Movimiento de bisagra de cadera fundamental.',
    difficulty: 'Básico', primaryMuscle: 'Glúteos', is_compound: 1,
    secondaryMuscles: ['Isquiotibiales', 'Dorsales', 'Core/Abdominales'],
    equipment: ['Kettlebell'],
    tags: ['pull', 'bilateral'],
    sections: ['WOD', 'Activación'],
    units: ['Repeticiones', 'Kilogramos', 'Libras'],
  },
  {
    name: 'Walking Lunge',
    description: 'Estocadas caminando. Gran trabajo de estabilidad y fuerza unilateral.',
    difficulty: 'Básico', primaryMuscle: 'Cuádriceps', is_compound: 1,
    secondaryMuscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: ['Mancuernas', 'Kettlebell'],
    tags: ['unilateral', 'sentadilla'],
    sections: ['Entrada en calor', 'WOD', 'Accesorio'],
    units: ['Repeticiones', 'Metros'],
  },
];

/**
 * Función que realiza el seed de ejercicios básicos
 */
async function seedExercises(db: SQLiteDBConnection): Promise<void> {
  console.info('[Seed v2] Iniciando seed de ejercicios...');

  try {
    // Obtener nombres de ejercicios existentes para evitar duplicados
    const existingResult = await db.query(`SELECT name FROM exercise WHERE is_active = 1`);
    const existingNames = new Set(
      ((existingResult.values ?? []) as { name: string }[]).map(r => r.name)
    );
    console.debug(`[Seed v2] Encontrados ${existingNames.size} ejercicios existentes.`);

    // Obtener mapas de IDs para relaciones (ahorrar queries en el loop)
    const [difficultyRows, muscleRows, equipRows, tagRows, sectionRows, unitRows] = await Promise.all([
      db.query('SELECT id, name FROM difficulty_level'),
      db.query('SELECT id, name FROM muscle_group'),
      db.query('SELECT id, name FROM equipment'),
      db.query('SELECT id, name FROM tag'),
      db.query('SELECT id, name FROM section_type'),
      db.query('SELECT id, name FROM measurement_unit'),
    ]);

    const difficultyMap = new Map((difficultyRows.values ?? []).map((r: any) => [r.name, r.id]));
    const muscleMap = new Map((muscleRows.values ?? []).map((r: any) => [r.name, r.id]));
    const equipmentMap = new Map((equipRows.values ?? []).map((r: any) => [r.name, r.id]));
    const tagMap = new Map((tagRows.values ?? []).map((r: any) => [r.name, r.id]));
    const sectionMap = new Map((sectionRows.values ?? []).map((r: any) => [r.name, r.id]));
    const unitMap = new Map((unitRows.values ?? []).map((r: any) => [r.name, r.id]));

    for (const ex of SEED_EXERCISES) {
      if (existingNames.has(ex.name)) {
        console.debug(`[Seed v2] Omitiendo ejercicio duplicado: ${ex.name}`);
        continue;
      }

      console.info(`[Seed v2] Creando ejercicio: "${ex.name}"`);

      // 1. Insertar ejercicio base
      const id = generateUUID();
      const difficulty_level_id = difficultyMap.get(ex.difficulty);
      const primary_muscle_group_id = muscleMap.get(ex.primaryMuscle);

      await db.run(
        `INSERT INTO exercise (id, name, description, difficulty_level_id, primary_muscle_group_id, is_compound) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, ex.name, ex.description, difficulty_level_id, primary_muscle_group_id, ex.is_compound]
      );

      // 2. Relaciones N:M
      // Músculos secundarios
      for (const mName of ex.secondaryMuscles) {
        const mId = muscleMap.get(mName);
        if (mId) {
          await db.run(
            'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
            [generateUUID(), id, mId]
          );
        }
      }

      // Equipamiento
      for (const eName of ex.equipment) {
        const eId = equipmentMap.get(eName);
        if (eId) {
          await db.run(
            'INSERT INTO exercise_equipment (id, exercise_id, equipment_id) VALUES (?, ?, ?)',
            [generateUUID(), id, eId]
          );
        }
      }

      // Tags
      for (const tName of ex.tags) {
        const tId = tagMap.get(tName);
        if (tId) {
          await db.run(
            'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?, ?, ?)',
            [generateUUID(), id, tId]
          );
        }
      }

      // Secciones
      for (const sName of ex.sections) {
        const sId = sectionMap.get(sName);
        if (sId) {
          await db.run(
            'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?, ?, ?)',
            [generateUUID(), id, sId]
          );
        }
      }

      // Unidades
      for (let i = 0; i < ex.units.length; i++) {
        const uId = unitMap.get(ex.units[i]);
        if (uId) {
          await db.run(
            'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?, ?, ?, ?)',
            [generateUUID(), id, uId, i === 0 ? 1 : 0]
          );
        }
      }
    }
    console.info('[Seed v2] Todos los ejercicios básicos procesados con éxito.');
  } catch (error) {
    console.error('[Seed v2] Error durante el proceso de seeding de ejercicios:', error);
  }
}

/**
 * Seed de plantillas de ejemplo
 */
async function seedTemplates(db: SQLiteDBConnection): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // 1. Obtener IDs necesarios
    const snatchEx = await findIdByName(db, 'exercise', 'Snatch');
    const thrusterEx = await findIdByName(db, 'exercise', 'Thruster');
    const burpeeEx = await findIdByName(db, 'exercise', 'Burpee');
    const airSquatEx = await findIdByName(db, 'exercise', 'Air Squat');
    
    if (!snatchEx || !thrusterEx) return; // Si no hay ejercicios, no podemos crear plantillas

    const warmupType = await findIdByName(db, 'section_type', 'Entrada en calor');
    const wodType = await findIdByName(db, 'section_type', 'WOD');
    const amrapFormat = await findIdByName(db, 'work_format', 'AMRAP');
    const forTimeFormat = await findIdByName(db, 'work_format', 'For Time');
    const kgUnit = await findIdByName(db, 'measurement_unit', 'Kilogramos');
    
    // 2. Crear Plantilla: "Metcon de Viernes"
    const templateId = generateUUID();
    await db.run(
      `INSERT INTO class_template (id, name, objective, is_favorite, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [templateId, 'Metcon de Viernes', 'Capacidad aeróbica y resistencia muscular', 1, 1, timestamp, timestamp]
    );

    // Sección 1: Warmup
    const s1Id = generateUUID();
    await db.run(
      `INSERT INTO class_section (id, class_template_id, section_type_id, sort_order, total_rounds, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s1Id, templateId, warmupType, 1, 3, timestamp, timestamp]
    );
    
    await db.run(
      `INSERT INTO section_exercise (id, class_section_id, exercise_id, sort_order, planned_repetitions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s1Id, airSquatEx, 1, 15, timestamp, timestamp]
    );

    // Sección 2: WOD (Fran-ish)
    const s2Id = generateUUID();
    await db.run(
      `INSERT INTO class_section (id, class_template_id, section_type_id, work_format_id, sort_order, time_cap_seconds, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s2Id, templateId, wodType, forTimeFormat, 2, 600, timestamp, timestamp]
    );

    await db.run(
      `INSERT INTO section_exercise (id, class_section_id, exercise_id, sort_order, planned_repetitions, planned_weight_value, planned_weight_unit_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s2Id, thrusterEx, 1, 21, 45, kgUnit, timestamp, timestamp]
    );
    
    await db.run(
      `INSERT INTO section_exercise (id, class_section_id, exercise_id, sort_order, planned_repetitions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), s2Id, burpeeEx, 2, 21, timestamp, timestamp]
    );

    console.info('[Seed v3] Plantilla "Metcon de Viernes" creada.');

  } catch (e) {
    console.error('[Seed v3] Error al crear plantillas semilla:', e);
  }
}

/**
 * Borra todas las tablas de la base de datos para un reset total
 */
export async function resetDatabase(db: SQLiteDBConnection): Promise<void> {
  try {
    console.warn('[Seed] Iniciando borrado total de la base de datos...');
    
    // Desactivar FKs para evitar errores de restricción al borrar
    await db.execute('PRAGMA foreign_keys = OFF;');

    // Obtener todas las tablas del usuario
    const tablesRes = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    const tables = (tablesRes.values ?? []).map((t: any) => t.name);

    console.info('[Seed] Tablas encontradas para borrar:', tables);

    // Borrar cada tabla
    for (const table of tables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table};`);
        console.info(`[Seed] Tabla ${table} borrada.`);
      } catch (e) {
        console.warn(`[Seed] Error al borrar tabla ${table}:`, e);
      }
    }

    // Reactivar FKs
    await db.execute('PRAGMA foreign_keys = ON;');
    
    console.log('[Seed] Todas las tablas han sido borradas.');
  } catch (err) {
    console.error('[Seed] Error critico en resetDatabase:', err);
    throw err;
  }
}

/**
 * Borra todo y permite que el próximo inicio ejecute el seed
 */
export async function resetAndReSeed(db: SQLiteDBConnection): Promise<void> {
  try {
    // 1. Borrar datos
    await resetDatabase(db);

    // 2. Limpiar flags de localStorage
    clearSeedFlags();

    // No ejecutamos runSeed aquí para evitar conflictos de estado.
    // Al recargar la página (desde la UI), el DbProvider detectará 
    // que los flags no están y ejecutará runSeed limpiamente.
    
    console.log('[Seed] Datos y flags limpiados. El seed se ejecutará en el próximo inicio.');
  } catch (err) {
    console.error('[Seed] Error en resetAndReSeed:', err);
    throw err;
  }
}
