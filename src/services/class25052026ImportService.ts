// Importa la Clase GOAT 25/05/2026 en la base de datos.
// Operación idempotente — se puede ejecutar varias veces sin duplicar datos.

import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_goat_25_05_2026_done';

export function isClassGoat25052026ImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

// ── Mapeo simplificado → granular (post "Cargar Datos Base") ──────────────────
const SIMPLIFIED_TO_GRANULAR: Record<string, string> = {
  'Deltoides':        'Deltoides anterior',
  'Cuádriceps':       'Recto femoral',
  'Isquiotibiales':   'Bíceps femoral',
  'Glúteos':          'Glúteo mayor',
  'Dorsales':         'Dorsal ancho',
  'Trapecio':         'Trapecio (superior)',
  'Bíceps':           'Bíceps braquial',
  'Tríceps':          'Tríceps braquial',
  'Pantorrillas':     'Gastrocnemio (gemelos)',
  'Core/Abdominales': 'Recto abdominal',
  'Antebrazos':       'Flexores antebrazo',
  'Pectorales':       'Pectoral mayor',
};

function toDbName(name: string): string {
  return SIMPLIFIED_TO_GRANULAR[name] ?? name;
}

// ── Definición de ejercicios ─────────────────────────────────────────────────
interface ExerciseDef {
  name: string;
  description: string;
  technical_notes: string;
  difficulty: string;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string[];
  tags: string[];
  section_types: string[];
  units: string[];
  video_path?: string | null;
  video_long_path?: string | null;
  image_url: string;
  is_compound: number;
}

const EXERCISES: ExerciseDef[] = [
  // ─── Movilidad ──────────────────────────────────────────────────────────
  {
    name: 'Kettlebell Good Morning to Squat',
    description: 'Sosteniendo una kettlebell a la altura del pecho con ambas manos, realizar un good morning (bisagra de cadera con la espalda recta) y luego enlazar una sentadilla profunda. Volver a la posición de pie pasando por el good morning.',
    technical_notes: 'En el good morning, la espalda debe permanecer neutra y las piernas casi extendidas. En la sentadilla, el torso erguido y el peso en los talones. Transición fluida entre ambos movimientos.',
    difficulty: 'Básico',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Glúteos', 'Cuádriceps', 'Core/Abdominales', 'Dorsales'],
    equipment: ['Kettlebell'],
    tags: ['movilidad', 'sentadilla', 'activación'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Segundos', 'Repeticiones', 'Kilogramos'],
    video_path: 'https://www.youtube.com/watch?v=jyV_TwPdbKM',
    video_long_path: null,
    image_url: '/img/exercises/kettlebell-good-morning-to-squat.svg',
    is_compound: 1,
  },
  {
    name: 'Ankle Mobility Rock',
    description: 'Desde una posición de medio arrodillado (una rodilla apoyada en el suelo y la otra pierna al frente flexionada a 90°), llevar la rodilla delantera hacia adelante por encima de los dedos del pie y luego volver. Trabaja la dorsiflexión del tobillo.',
    technical_notes: 'Mantener el talón delantero apoyado en el piso durante todo el movimiento. Movimiento controlado, sin rebotes. Cambiar de pierna luego del tiempo asignado.',
    difficulty: 'Básico',
    primary_muscle: 'Pantorrillas',
    secondary_muscles: ['Cuádriceps'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
    video_path: 'https://www.youtube.com/watch?v=QmqVoWqXe8w',
    video_long_path: 'https://www.youtube.com/shorts/sFAv_qdQUAE',
    image_url: '/img/exercises/ankle-mobility-rock.svg',
    is_compound: 0,
  },

  // ─── Activación ─────────────────────────────────────────────────────────
  {
    name: 'Squat Press-Out',
    description: 'De pie con un disco o pesa sostenida con ambas manos cerca del pecho. Bajar a sentadilla y, mientras se desciende, extender los brazos al frente alejando el peso del cuerpo. Recoger los brazos al subir.',
    technical_notes: 'Mantener la espalda recta y los talones apoyados. Los brazos se extienden a la altura de los hombros. Movimiento coordinado entre piernas y brazos.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Disco'],
    tags: ['sentadilla', 'activación', 'bilateral'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Kilogramos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/squat-press-out.svg',
    is_compound: 1,
  },
  {
    name: 'Box Step-Up',
    description: 'De pie frente a un cajón. Apoyar un pie completo sobre el cajón y empujar para subir extendiendo la pierna, llevando la otra pierna arriba. Bajar de forma controlada apoyando primero la pierna trasera.',
    technical_notes: 'El pie de subida debe quedar totalmente apoyado en el cajón. Empujar con el talón. Mantener el torso erguido. Alternar la pierna líder en cada repetición.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Pantorrillas', 'Core/Abdominales'],
    equipment: ['Box de salto'],
    tags: ['unilateral', 'activación', 'cardio'],
    section_types: ['Entrada en calor', 'Activación', 'WOD'],
    units: ['Repeticiones'],
    video_path: 'https://www.youtube.com/shorts/j8KN0jwWaRA',
    video_long_path: 'https://www.youtube.com/shorts/mw6iqu9K8DY',
    image_url: '/img/exercises/box-step-up.svg',
    is_compound: 1,
  },
  {
    name: 'Toe Touch Crunch',
    description: 'Acostado boca arriba con las piernas extendidas hacia arriba en posición vertical. Realizar una contracción abdominal levantando los hombros del piso y tratando de tocar los dedos de los pies con las manos.',
    technical_notes: 'La zona lumbar permanece apoyada en el piso. Movimiento controlado del torso, no de los brazos. Exhalar al subir, inhalar al bajar.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Isquiotibiales'],
    equipment: [],
    tags: ['core', 'activación', 'isométrico'],
    section_types: ['Activación'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/WShPlCySyfk',
    video_long_path: 'https://www.youtube.com/watch?v=wekvo3XXTzI',
    image_url: '/img/exercises/toe-touch-crunch.svg',
    is_compound: 0,
  },
  {
    name: 'Split Squat Calf Raise',
    description: 'En posición de split squat (una pierna adelante, una atrás), elevar ambos talones del piso quedándose en puntillas, mantener brevemente y bajar. Trabaja pantorrillas y estabilidad en posición unilateral.',
    technical_notes: 'Mantener el torso erguido y el equilibrio. Elevación máxima del talón. Movimiento controlado. Cambiar de pierna luego de completar las repeticiones.',
    difficulty: 'Básico',
    primary_muscle: 'Pantorrillas',
    secondary_muscles: ['Cuádriceps', 'Glúteos', 'Core/Abdominales'],
    equipment: [],
    tags: ['unilateral', 'activación'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/27zsxZxgUd0',
    video_long_path: 'https://www.youtube.com/shorts/to95AIOmdbY',
    image_url: '/img/exercises/split-squat-calf-raise.svg',
    is_compound: 1,
  },

  // ─── Fuerza ─────────────────────────────────────────────────────────────
  {
    name: 'Box Jump',
    description: 'Salto pliométrico vertical sobre un cajón. Aterrizar con ambos pies en el cajón con rodillas semiflexionadas y extender completamente la cadera arriba. Bajar caminando o saltando.',
    technical_notes: 'Aterrizar suave con rodillas semiflexionadas para absorber el impacto. Extensión completa de cadera al subir. Brazos generan impulso.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Pantorrillas', 'Core/Abdominales'],
    equipment: ['Box de salto'],
    tags: ['pliométrico', 'cardio', 'bilateral'],
    section_types: ['Fuerza', 'WOD'],
    units: ['Repeticiones'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/box-jump.svg',
    is_compound: 1,
  },
  {
    name: 'Barbell Front Squat',
    description: 'Sentadilla con la barra apoyada en la parte frontal de los hombros (front rack). Bajar hasta que el muslo esté paralelo al piso (o más abajo) y volver a subir manteniendo el torso erguido.',
    technical_notes: 'Codos altos al frente, barra apoyada en deltoides anteriores. Torso erguido durante todo el movimiento. Talones apoyados.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Core/Abdominales', 'Deltoides'],
    equipment: ['Barra olímpica'],
    tags: ['sentadilla', 'bilateral'],
    section_types: ['Fuerza'],
    units: ['Repeticiones', 'Kilogramos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/barbell-front-squat.svg',
    is_compound: 1,
  },

  // ─── WOD ────────────────────────────────────────────────────────────────
  {
    name: 'Jump Rope',
    description: 'Salto con cuerda. Saltos simples con ambos pies, manteniendo un ritmo constante.',
    technical_notes: 'Saltos pequeños y rítmicos. Codos cerca del cuerpo, el movimiento de la cuerda viene de las muñecas. Aterrizar sobre los metatarsos.',
    difficulty: 'Básico',
    primary_muscle: 'Pantorrillas',
    secondary_muscles: ['Cuádriceps', 'Antebrazos'],
    equipment: ['Cuerda para saltar'],
    tags: ['cardio', 'bilateral', 'pliométrico'],
    section_types: ['Entrada en calor', 'WOD'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/BCkR1R6lPcc',
    video_long_path: 'https://www.youtube.com/shorts/y2RrklqngKs',
    image_url: '/img/exercises/jump-rope.svg',
    is_compound: 1,
  },
  {
    name: 'Power Clean',
    description: 'Levantamiento olímpico: desde el suelo, tirar la barra hacia arriba con una extensión explosiva de cadera y recibirla en la posición de front rack (sobre los hombros) con una sentadilla parcial.',
    technical_notes: 'La barra debe rozar las piernas. Extensión triple (tobillo, rodilla, cadera). Recepción rápida con codos altos. Mantener la espalda neutra.',
    difficulty: 'Avanzado',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Trapecio', 'Deltoides', 'Core/Abdominales'],
    equipment: ['Barra olímpica'],
    tags: ['olímpico', 'bilateral', 'pull'],
    section_types: ['Fuerza', 'WOD'],
    units: ['Repeticiones', 'Kilogramos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/power-clean.svg',
    is_compound: 1,
  },
  {
    name: 'Hanging Toes-to-Bar',
    description: 'Colgado de la barra de dominadas, llevar los pies a tocar la barra realizando una flexión de cadera completa. Bajar de forma controlada.',
    technical_notes: 'Mantener el cuerpo hueco (hollow). Usar el kipping para los movimientos repetitivos. Volver a la posición de hollow al bajar.',
    difficulty: 'Avanzado',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Dorsales', 'Antebrazos'],
    equipment: ['Pull-up bar'],
    tags: ['gimnástico', 'core', 'pull'],
    section_types: ['WOD'],
    units: ['Repeticiones'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/hanging-toes-to-bar.svg',
    is_compound: 1,
  },
  {
    name: 'Burpee Over the Bar',
    description: 'Realizar un burpee (bajar a plancha, push-up opcional, volver a posición agrupada) y saltar lateralmente por encima de la barra. Encadenar el siguiente burpee del otro lado.',
    technical_notes: 'Saltar con ambos pies sobre la barra. Aterrizar con rodillas semiflexionadas. Mantener un ritmo constante.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Pectorales', 'Glúteos', 'Core/Abdominales', 'Deltoides'],
    equipment: ['Barra olímpica'],
    tags: ['cardio', 'pliométrico', 'bilateral'],
    section_types: ['WOD'],
    units: ['Repeticiones'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/burpee-over-the-bar.svg',
    is_compound: 1,
  },

  // ─── Estiramiento ──────────────────────────────────────────────────────
  {
    name: 'Supine Spinal Twist',
    description: 'Acostado boca arriba, llevar una rodilla flexionada cruzándola hacia el lado contrario manteniendo los hombros pegados al piso. Mantener el estiramiento y cambiar de lado.',
    technical_notes: 'Respiración profunda y relajada. Mantener ambos hombros en contacto con el piso. Sin forzar el rango de movimiento.',
    difficulty: 'Básico',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Core/Abdominales', 'Dorsales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/supine-spinal-twist.svg',
    is_compound: 0,
  },
  {
    name: 'Seated Forward Fold',
    description: 'Sentado en el piso con piernas extendidas al frente. Inclinar el torso hacia adelante intentando alcanzar los pies, manteniendo la espalda lo más recta posible.',
    technical_notes: 'Doblar desde la cadera, no desde la espalda. Sin rebotes. Mantener relajado el cuello.',
    difficulty: 'Básico',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Pantorrillas', 'Dorsales'],
    equipment: [],
    tags: ['movilidad', 'bilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/seated-forward-fold.svg',
    is_compound: 0,
  },
  {
    name: 'Seated Quad Stretch',
    description: 'Sentado con una pierna extendida y la otra flexionada con el talón cerca del glúteo. Inclinar el torso hacia atrás para estirar el cuádriceps de la pierna flexionada.',
    technical_notes: 'Mantener la rodilla pegada al piso. Sin forzar si hay dolor. Cambiar de pierna luego del tiempo asignado.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: [],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/seated-quad-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Pigeon Pose',
    description: 'Postura de yoga: desde plancha alta, llevar una rodilla hacia adelante apoyándola debajo del torso mientras la pierna trasera queda extendida. Inclinar el torso hacia adelante.',
    technical_notes: 'Cadera alineada. No forzar la apertura. Respiración profunda y mantenida.',
    difficulty: 'Básico',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/pigeon-pose.svg',
    is_compound: 0,
  },
  {
    name: 'Supine Abdominal Stretch',
    description: 'Acostado boca arriba con los brazos extendidos por encima de la cabeza y piernas estiradas. Estirar todo el cuerpo en línea, alargando abdominales y cadera.',
    technical_notes: 'Respiración lenta y profunda. Mantener los talones y manos en contacto con el piso.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Dorsales'],
    equipment: [],
    tags: ['movilidad', 'core'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/supine-abdominal-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Cobra Pose',
    description: 'Postura de yoga: acostado boca abajo, apoyar las manos al costado del pecho y empujar el torso hacia arriba extendiendo los brazos, manteniendo la cadera en el piso.',
    technical_notes: 'Hombros lejos de las orejas. No forzar la extensión lumbar. Mirada al frente o ligeramente arriba.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Dorsales', 'Deltoides'],
    equipment: [],
    tags: ['movilidad'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/cobra-pose.svg',
    is_compound: 0,
  },
  {
    name: 'Child\'s Pose',
    description: 'Postura de yoga: sentado sobre los talones, inclinar el torso hacia adelante extendiendo los brazos por delante hasta apoyar la frente en el piso.',
    technical_notes: 'Relajar hombros y caderas. Respiración profunda. Mantener glúteos sobre los talones.',
    difficulty: 'Básico',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Glúteos', 'Deltoides'],
    equipment: [],
    tags: ['movilidad'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/childs-pose.svg',
    is_compound: 0,
  },
  {
    name: 'Half Kneeling Hip Flexor Stretch',
    description: 'En posición de medio arrodillado (una rodilla en el piso, la otra pierna al frente flexionada a 90°), llevar la cadera hacia adelante manteniendo el torso erguido para estirar el flexor de cadera.',
    technical_notes: 'Glúteo de la pierna apoyada contraído. Torso erguido, no inclinarse. Cambiar de lado luego del tiempo asignado.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/half-kneeling-hip-flexor-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Standing Biceps Stretch',
    description: 'De pie, llevar un brazo extendido hacia atrás apoyando la mano contra la pared o un poste. Girar levemente el cuerpo hacia el lado opuesto para estirar el bíceps.',
    technical_notes: 'Brazo totalmente extendido. Sin forzar el hombro. Cambiar de lado.',
    difficulty: 'Básico',
    primary_muscle: 'Bíceps',
    secondary_muscles: ['Pectorales', 'Deltoides'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/standing-biceps-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Overhead Triceps Stretch',
    description: 'De pie o sentado, llevar un brazo por encima de la cabeza y flexionar el codo dejando que la mano caiga hacia atrás. Con la otra mano, tirar suavemente del codo hacia el lado opuesto.',
    technical_notes: 'Mantener el codo alto. Sin elevar el hombro de soporte. Cambiar de lado.',
    difficulty: 'Básico',
    primary_muscle: 'Tríceps',
    secondary_muscles: ['Deltoides', 'Dorsales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/overhead-triceps-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Wrist Extensor Stretch',
    description: 'De pie con un brazo extendido al frente y la palma hacia abajo. Con la otra mano, tirar suavemente de los dedos hacia abajo y hacia el cuerpo para estirar los extensores del antebrazo.',
    technical_notes: 'Codo del brazo extendido bloqueado. Sin tirones bruscos. Cambiar de lado.',
    difficulty: 'Básico',
    primary_muscle: 'Antebrazos',
    secondary_muscles: [],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/wrist-extensor-stretch.svg',
    is_compound: 0,
  },
];

// ── Definición de secciones ──────────────────────────────────────────────────
interface SectionExDef {
  exerciseName: string;
  sort_order: number;
  planned_repetitions?: number | null;
  planned_weight_value?: number | null;
  planned_weight_unit?: string | null;
  planned_distance_value?: number | null;
  planned_distance_unit?: string | null;
  planned_time_seconds?: number | null;
  planned_calories?: number | null;
  coach_notes?: string | null;
}

interface SectionDef {
  sort_order: number;
  section_type: string;
  work_format: string | null;
  visible_title: string;
  general_description?: string | null;
  time_cap_seconds?: number | null;
  total_rounds?: number | null;
  rest_between_rounds_seconds?: number | null;
  notes?: string | null;
  exercises: SectionExDef[];
}

const SECTIONS: SectionDef[] = [
  // 1. Calentamiento (6 min libre, sin ejercicios específicos)
  {
    sort_order: 1,
    section_type: 'Entrada en calor',
    work_format: 'Trabajo libre',
    visible_title: 'Calentamiento',
    general_description: '6 minutos de calentamiento general',
    time_cap_seconds: 360,
    total_rounds: null,
    exercises: [],
  },

  // 2. Movilidad (2 rondas, todo 30s)
  {
    sort_order: 2,
    section_type: 'Entrada en calor',
    work_format: 'Por rondas',
    visible_title: 'Movilidad',
    general_description: '2 rondas, todo 30 segundos',
    time_cap_seconds: null,
    total_rounds: 2,
    exercises: [
      {
        exerciseName: 'Kettlebell Good Morning to Squat',
        sort_order: 1,
        planned_time_seconds: 30,
        planned_weight_value: 10,
        planned_weight_unit: 'Kilogramos',
        coach_notes: '1 kettlebell de 10kg',
      },
      {
        exerciseName: 'Ankle Mobility Rock',
        sort_order: 2,
        planned_time_seconds: 30,
        coach_notes: 'Pie derecho',
      },
      {
        exerciseName: 'Ankle Mobility Rock',
        sort_order: 3,
        planned_time_seconds: 30,
        coach_notes: 'Pie izquierdo',
      },
    ],
  },

  // 3. Activación (For Time — máximo 6 min)
  {
    sort_order: 3,
    section_type: 'Activación',
    work_format: 'For Time',
    visible_title: 'Activación',
    general_description: 'Máximo en 6 minutos',
    time_cap_seconds: 360,
    total_rounds: null,
    exercises: [
      {
        exerciseName: 'Squat Press-Out',
        sort_order: 1,
        planned_repetitions: 10,
        planned_weight_value: 10,
        planned_weight_unit: 'Kilogramos',
      },
      {
        exerciseName: 'Box Step-Up',
        sort_order: 2,
        planned_repetitions: 12,
        coach_notes: '6 con cada pierna',
      },
      {
        exerciseName: 'Toe Touch Crunch',
        sort_order: 3,
        planned_repetitions: 10,
      },
      {
        exerciseName: 'Split Squat Calf Raise',
        sort_order: 4,
        planned_repetitions: 12,
        coach_notes: '6 con cada pie',
      },
    ],
  },

  // 4. Fuerza (E2MOM — 5 rondas, cada ejercicio 1 min)
  {
    sort_order: 4,
    section_type: 'Fuerza',
    work_format: 'E2MOM',
    visible_title: 'Fuerza',
    general_description: '5 rondas, 2 ejercicios alternados, cada uno 1 minuto',
    time_cap_seconds: 600,
    total_rounds: 5,
    exercises: [
      {
        exerciseName: 'Box Jump',
        sort_order: 1,
        planned_repetitions: 5,
        planned_time_seconds: 60,
      },
      {
        exerciseName: 'Barbell Front Squat',
        sort_order: 2,
        planned_repetitions: 4,
        planned_weight_value: 60,
        planned_weight_unit: 'Kilogramos',
        planned_time_seconds: 60,
      },
    ],
  },

  // 5. WOD (3 rondas, todos los ejercicios en 3 min + 1.5 min de descanso al final)
  {
    sort_order: 5,
    section_type: 'WOD',
    work_format: 'Por rondas',
    visible_title: 'WOD',
    general_description: '3 rondas — todos los ejercicios en 3 min, 1.5 min de descanso al final',
    time_cap_seconds: 810,
    total_rounds: 3,
    rest_between_rounds_seconds: 90,
    exercises: [
      {
        exerciseName: 'Jump Rope',
        sort_order: 1,
        planned_repetitions: 110,
      },
      {
        exerciseName: 'Power Clean',
        sort_order: 2,
        planned_repetitions: 6,
      },
      {
        exerciseName: 'Hanging Toes-to-Bar',
        sort_order: 3,
        planned_repetitions: 12,
      },
      {
        exerciseName: 'Burpee Over the Bar',
        sort_order: 4,
        planned_repetitions: 8,
      },
    ],
  },

  // 6. Estiramiento (cada uno 20-30s)
  {
    sort_order: 6,
    section_type: 'Vuelta a la calma',
    work_format: 'Trabajo libre',
    visible_title: 'Estiramiento',
    general_description: 'Cada ejercicio 20-30 segundos',
    exercises: [
      { exerciseName: 'Supine Spinal Twist',              sort_order: 1,  planned_time_seconds: 30 },
      { exerciseName: 'Seated Forward Fold',              sort_order: 2,  planned_time_seconds: 30 },
      { exerciseName: 'Seated Quad Stretch',              sort_order: 3,  planned_time_seconds: 30 },
      { exerciseName: 'Pigeon Pose',                      sort_order: 4,  planned_time_seconds: 30 },
      { exerciseName: 'Supine Abdominal Stretch',         sort_order: 5,  planned_time_seconds: 30 },
      { exerciseName: 'Cobra Pose',                       sort_order: 6,  planned_time_seconds: 30 },
      { exerciseName: 'Child\'s Pose',                    sort_order: 7,  planned_time_seconds: 30 },
      { exerciseName: 'Half Kneeling Hip Flexor Stretch', sort_order: 8,  planned_time_seconds: 30 },
      { exerciseName: 'Standing Biceps Stretch',          sort_order: 9,  planned_time_seconds: 30 },
      { exerciseName: 'Overhead Triceps Stretch',         sort_order: 10, planned_time_seconds: 30 },
      { exerciseName: 'Wrist Extensor Stretch',           sort_order: 11, planned_time_seconds: 30 },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
type AnyDb = Awaited<ReturnType<typeof openDatabase>>;

interface CatalogMaps {
  difficulty: Map<string, string>;
  muscle: Map<string, string>;
  equipment: Map<string, string>;
  tag: Map<string, string>;
  sectionType: Map<string, string>;
  workFormat: Map<string, string>;
  unit: Map<string, string>;
}

async function getOrCreateExercise(
  db: AnyDb,
  def: ExerciseDef,
  maps: CatalogMaps
): Promise<{ id: string; created: boolean }> {
  const existing = await db.query(
    'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?)) AND is_active = 1',
    [def.name]
  );
  if (existing.values?.length) {
    return { id: existing.values[0].id as string, created: false };
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const id = generateUUID();
  const diffId = maps.difficulty.get(def.difficulty) ?? null;
  const primaryId = maps.muscle.get(toDbName(def.primary_muscle)) ?? null;

  await db.run(
    `INSERT INTO exercise
       (id, name, description, technical_notes, difficulty_level_id,
        primary_muscle_group_id, image_url, video_path, video_long_path,
        is_compound, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [id, def.name, def.description, def.technical_notes, diffId, primaryId,
     def.image_url, def.video_path ?? null, def.video_long_path ?? null,
     def.is_compound, now, now]
  );

  // Músculo primario
  if (primaryId) {
    await db.run(
      'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,1)',
      [generateUUID(), id, primaryId]
    );
  }

  // Músculos secundarios
  for (const secName of def.secondary_muscles) {
    const secId = maps.muscle.get(toDbName(secName));
    if (secId) {
      await db.run(
        'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,0)',
        [generateUUID(), id, secId]
      );
    }
  }

  // Equipamiento
  for (const eqName of def.equipment) {
    const eqId = maps.equipment.get(eqName);
    if (eqId) {
      await db.run(
        'INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?,?,?,1)',
        [generateUUID(), id, eqId]
      );
    }
  }

  // Tags
  for (const tagName of def.tags) {
    const tagId = maps.tag.get(tagName);
    if (tagId) {
      await db.run(
        'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?,?,?)',
        [generateUUID(), id, tagId]
      );
    }
  }

  // Tipos de sección
  for (const stName of def.section_types) {
    const stId = maps.sectionType.get(stName);
    if (stId) {
      await db.run(
        'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?,?,?)',
        [generateUUID(), id, stId]
      );
    }
  }

  // Unidades (primera = default)
  for (let i = 0; i < def.units.length; i++) {
    const uId = maps.unit.get(def.units[i]);
    if (uId) {
      await db.run(
        'INSERT INTO exercise_unit (id, exercise_id, measurement_unit_id, is_default) VALUES (?,?,?,?)',
        [generateUUID(), id, uId, i === 0 ? 1 : 0]
      );
    }
  }

  return { id, created: true };
}

// ── Función principal ────────────────────────────────────────────────────────
export async function importClassGoat25052026(): Promise<{
  exercisesCreated: number;
  exercisesReused: number;
  classCreated: boolean;
}> {
  const db = await openDatabase();

  // Guardia: clase ya importada
  const existing = await db.query(
    "SELECT id FROM class_template WHERE name = 'Clase GOAT 25/05/2026' AND is_active = 1"
  );
  if (existing.values?.length) {
    markDone();
    return { exercisesCreated: 0, exercisesReused: 0, classCreated: false };
  }

  // Cargar mapas de catálogos
  const rows = async (sql: string) => (await db.query(sql)).values ?? [];
  const toMap = (arr: any[]) => new Map(arr.map((r) => [r.name as string, r.id as string]));

  const maps: CatalogMaps = {
    difficulty:  toMap(await rows('SELECT id, name FROM difficulty_level WHERE is_active = 1')),
    muscle:      toMap(await rows('SELECT id, name FROM muscle_group WHERE is_active = 1')),
    equipment:   toMap(await rows('SELECT id, name FROM equipment WHERE is_active = 1')),
    tag:         toMap(await rows('SELECT id, name FROM tag WHERE is_active = 1')),
    sectionType: toMap(await rows('SELECT id, name FROM section_type WHERE is_active = 1')),
    workFormat:  toMap(await rows('SELECT id, name FROM work_format WHERE is_active = 1')),
    unit:        toMap(await rows('SELECT id, name FROM measurement_unit WHERE is_active = 1')),
  };

  // Crear/reusar ejercicios
  let exercisesCreated = 0;
  let exercisesReused = 0;
  const exerciseIds: Record<string, string> = {};
  for (const def of EXERCISES) {
    const { id, created } = await getOrCreateExercise(db, def, maps);
    exerciseIds[def.name] = id;
    if (created) exercisesCreated++; else exercisesReused++;
  }

  // Crear la plantilla de clase
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const classId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, date, name, objective, general_notes, estimated_duration_minutes,
        is_favorite, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,0,1,?,?)`,
    [classId, '2026-05-25', 'Clase GOAT 25/05/2026',
     'Movilidad de tobillo + activación de tren inferior + fuerza con Box Jump y Front Squat + WOD metabólico con Jump Rope, Power Clean y Burpee Over the Bar',
     null, 50, now, now]
  );

  // Crear secciones y ejercicios de sección
  for (const sec of SECTIONS) {
    const sectionId = generateUUID();
    const sectionTypeId = maps.sectionType.get(sec.section_type) ?? null;
    const workFormatId = sec.work_format ? (maps.workFormat.get(sec.work_format) ?? null) : null;

    await db.run(
      `INSERT INTO class_section
         (id, class_template_id, section_type_id, work_format_id, sort_order,
          visible_title, general_description, time_cap_seconds, total_rounds,
          rest_between_rounds_seconds, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [sectionId, classId, sectionTypeId, workFormatId, sec.sort_order,
       sec.visible_title, sec.general_description ?? null,
       sec.time_cap_seconds ?? null, sec.total_rounds ?? null,
       sec.rest_between_rounds_seconds ?? null, sec.notes ?? null,
       now, now]
    );

    for (const ex of sec.exercises) {
      const exId = exerciseIds[ex.exerciseName];
      if (!exId) {
        console.warn(`[GOAT 25/05] Ejercicio no encontrado: ${ex.exerciseName}`);
        continue;
      }
      const weightUnitId = ex.planned_weight_unit ? (maps.unit.get(ex.planned_weight_unit) ?? null) : null;
      const distanceUnitId = ex.planned_distance_unit ? (maps.unit.get(ex.planned_distance_unit) ?? null) : null;

      await db.run(
        `INSERT INTO section_exercise
           (id, class_section_id, exercise_id, sort_order, coach_notes,
            planned_repetitions, planned_weight_value, planned_weight_unit_id,
            planned_time_seconds, planned_distance_value, planned_distance_unit_id,
            planned_calories, planned_rest_seconds, planned_rounds,
            rm_percentage, suggested_scaling, notes, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), sectionId, exId, ex.sort_order, ex.coach_notes ?? null,
         ex.planned_repetitions ?? null, ex.planned_weight_value ?? null, weightUnitId,
         ex.planned_time_seconds ?? null, ex.planned_distance_value ?? null, distanceUnitId,
         ex.planned_calories ?? null, null, null,
         null, null, null, now, now]
      );
    }
  }

  await saveDatabase();
  markDone();
  return { exercisesCreated, exercisesReused, classCreated: true };
}
