// Importa la Clase GOAT 16/05/2026 en la base de datos.
// Operación idempotente — se puede ejecutar varias veces sin duplicar datos.

import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_goat_16_05_2026_done';

export function isClassGoat16052026ImportDone(): boolean {
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
    name: 'Scapular Wall Slides',
    description: 'De pie con la espalda apoyada en la pared, codos y manos en contacto con la pared formando una W. Subir los brazos lentamente extendiéndolos hasta formar una Y/I, manteniendo contacto con la pared, y volver a la posición W.',
    technical_notes: 'Mantener la espalda baja pegada a la pared en todo momento. No despegar los codos ni las manos. Movimiento lento y controlado.',
    difficulty: 'Básico',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Trapecio', 'Dorsales'],
    equipment: [],
    tags: ['hombro', 'movilidad', 'activación'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/scapular-wall-slides.svg',
    is_compound: 0,
  },
  {
    name: 'Hip Rotations in Squat',
    description: 'Sentadilla profunda mantenida en la posición baja. Desde ahí, alternar la rotación interna y externa de cada cadera, dejando caer la rodilla hacia adentro y hacia afuera de forma controlada.',
    technical_notes: 'Mantener la cadera baja durante toda la serie. La rotación viene de la cadera, no del tobillo. Talones apoyados.',
    difficulty: 'Intermedio',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Cuádriceps', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'sentadilla', 'unilateral'],
    section_types: ['Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/uVhMR5r9NF8',
    video_long_path: 'https://www.youtube.com/watch?v=BWdOO8bxk34',
    image_url: '/img/exercises/hip-rotations-in-squat.svg',
    is_compound: 1,
  },
  {
    name: 'Y Raises',
    description: 'De pie con brazos relajados al costado del cuerpo (con o sin discos livianos). Elevar los brazos en diagonal hacia arriba formando una Y por encima de la cabeza, luego volver al costado de forma controlada.',
    technical_notes: 'Pulgares hacia arriba durante la elevación. Hombros relajados (no encogidos). Movimiento controlado sin rebote.',
    difficulty: 'Básico',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Trapecio'],
    equipment: [],
    tags: ['hombro', 'movilidad', 'activación', 'bilateral'],
    section_types: ['Entrada en calor', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
    video_path: 'https://www.youtube.com/shorts/qLN4BoglYv4',
    video_long_path: null,
    image_url: '/img/exercises/y-raises.svg',
    is_compound: 0,
  },

  // ─── Activación ─────────────────────────────────────────────────────────
  {
    name: 'Bulgarian Split Squat',
    description: 'De pie con un pie apoyado atrás sobre un banco. Sosteniendo dos kettlebells o mancuernas al costado, bajar flexionando la pierna delantera hasta que el muslo quede paralelo al piso, luego subir.',
    technical_notes: 'La rodilla delantera no debe pasar la punta del pie. Mantener el torso erguido. La pierna trasera es solo apoyo, todo el trabajo lo hace la delantera.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: ['Kettlebell', 'Box de salto'],
    tags: ['sentadilla', 'unilateral'],
    section_types: ['Activación', 'Fuerza'],
    units: ['Repeticiones', 'Kilogramos'],
    video_path: 'https://www.youtube.com/shorts/_HukgYk7lTw',
    video_long_path: 'https://www.youtube.com/shorts/or1frhkjBDc',
    image_url: '/img/exercises/bulgarian-split-squat.svg',
    is_compound: 1,
  },
  {
    name: 'Weighted Plank',
    description: 'Posición de plancha sobre antebrazos con un disco o pesa apoyada sobre la espalda baja. Mantener el cuerpo alineado de cabeza a talones durante el tiempo asignado.',
    technical_notes: 'Glúteos contraídos y core activo. Cadera ni muy alta ni muy baja. Respirar de forma controlada durante todo el aguante.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Deltoides', 'Glúteos'],
    equipment: ['Disco'],
    tags: ['core', 'isométrico', 'activación'],
    section_types: ['Activación'],
    units: ['Segundos', 'Kilogramos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/weighted-plank.svg',
    is_compound: 1,
  },
  {
    name: 'Wall Squat Hold',
    description: 'Sentadilla isométrica con la espalda apoyada en la pared, muslos paralelos al piso y rodillas a 90°. Sostener dos kettlebells al costado del cuerpo durante el tiempo asignado.',
    technical_notes: 'Espalda baja totalmente pegada a la pared. Rodillas alineadas con los pies (no caen hacia adentro). Hombros relajados, kettlebells colgando sin balancearse.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Core/Abdominales'],
    equipment: ['Kettlebell'],
    tags: ['sentadilla', 'isométrico', 'activación'],
    section_types: ['Activación'],
    units: ['Segundos', 'Kilogramos'],
    video_path: 'https://www.youtube.com/shorts/UZp11A98yyU',
    video_long_path: 'https://www.youtube.com/watch?v=qERN5CZz3us',
    image_url: '/img/exercises/wall-squat-hold.svg',
    is_compound: 1,
  },

  // ─── WOD ────────────────────────────────────────────────────────────────
  {
    name: 'Running',
    description: 'Carrera continua. Mantener postura erguida, brazos relajados y aterrizaje en metatarso.',
    technical_notes: 'Cadencia constante. Respiración rítmica. Distribuir el esfuerzo según la distancia del WOD.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Isquiotibiales', 'Glúteos', 'Pantorrillas'],
    equipment: [],
    tags: ['cardio', 'bilateral'],
    section_types: ['Entrada en calor', 'WOD'],
    units: ['Metros', 'Kilómetros', 'Minutos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/running.svg',
    is_compound: 1,
  },
  {
    name: 'Burpee Broad Jump',
    description: 'Burpee tradicional (bajar a plancha, hacer push-up opcional, volver a posición agrupada) pero en vez de saltar vertical, finalizar con un salto hacia adelante (broad jump) lo más lejos posible.',
    technical_notes: 'Aterrizar con rodillas semiflexionadas para absorber el impacto. Brazos al frente en el salto para generar impulso. Encadenar el burpee siguiente sin demorarse.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Pectorales', 'Core/Abdominales', 'Deltoides'],
    equipment: [],
    tags: ['cardio', 'pliométrico', 'bilateral'],
    section_types: ['WOD'],
    units: ['Repeticiones'],
    video_path: 'https://www.youtube.com/shorts/VnDbhYDmuLo',
    video_long_path: 'https://www.youtube.com/shorts/xaBTCkqiUKo',
    image_url: '/img/exercises/burpee-broad-jump.svg',
    is_compound: 1,
  },
  {
    name: 'Kettlebell Farmer Carry',
    description: 'Caminar una distancia determinada sosteniendo una kettlebell en cada mano con los brazos extendidos al costado del cuerpo, manteniendo postura firme y core activo.',
    technical_notes: 'Hombros bajos y atrás. Mirada al frente. Pasos cortos y firmes. No dejar que las kettlebells se balanceen.',
    difficulty: 'Básico',
    primary_muscle: 'Trapecio',
    secondary_muscles: ['Antebrazos', 'Core/Abdominales', 'Cuádriceps'],
    equipment: ['Kettlebell'],
    tags: ['cardio', 'bilateral'],
    section_types: ['WOD'],
    units: ['Metros', 'Kilogramos'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/kettlebell-farmer-carry.svg',
    is_compound: 1,
  },
  {
    name: 'Box Jump-Over',
    description: 'Salto pliométrico sobre un cajón, aterrizando sobre el cajón o pasándolo en un solo movimiento hasta el otro lado. Volver a la posición inicial saltando o pasando nuevamente.',
    technical_notes: 'Aterrizar con rodillas semiflexionadas. Extensión completa de cadera al subir. Mantener un ritmo constante.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Pantorrillas', 'Core/Abdominales'],
    equipment: ['Box de salto'],
    tags: ['cardio', 'pliométrico', 'bilateral'],
    section_types: ['WOD'],
    units: ['Repeticiones'],
    video_path: null,
    video_long_path: null,
    image_url: '/img/exercises/box-jump-over.svg',
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
  // 1. Calentamiento (sin ejercicios específicos)
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

  // 2. Movilidad (2 rondas de 30s)
  {
    sort_order: 2,
    section_type: 'Entrada en calor',
    work_format: 'Por rondas',
    visible_title: 'Movilidad',
    general_description: '2 rondas, todo 30 segundos',
    time_cap_seconds: null,
    total_rounds: 2,
    exercises: [
      { exerciseName: 'Scapular Wall Slides',  sort_order: 1, planned_time_seconds: 30 },
      { exerciseName: 'Hip Rotations in Squat', sort_order: 2, planned_time_seconds: 30 },
      { exerciseName: 'Y Raises',               sort_order: 3, planned_time_seconds: 30 },
    ],
  },

  // 3. Activación (3 rondas, EMOM 1 min cada uno, 4to minuto descanso = 12 min total)
  {
    sort_order: 3,
    section_type: 'Activación',
    work_format: 'EMOM',
    visible_title: 'Activación',
    general_description: '3 rondas — cada ejercicio 1 min, el 4to minuto es descanso',
    time_cap_seconds: 720,
    total_rounds: 3,
    rest_between_rounds_seconds: 60,
    exercises: [
      {
        exerciseName: 'Bulgarian Split Squat',
        sort_order: 1,
        planned_time_seconds: 60,
        planned_weight_value: 10,
        planned_weight_unit: 'Kilogramos',
        coach_notes: '2 kettlebells de 10kg',
      },
      {
        exerciseName: 'Weighted Plank',
        sort_order: 2,
        planned_time_seconds: 40,
        planned_weight_value: 10,
        planned_weight_unit: 'Kilogramos',
        coach_notes: '40s de trabajo, 20s de descanso, 1 pesa de 10kg',
      },
      {
        exerciseName: 'Wall Squat Hold',
        sort_order: 3,
        planned_time_seconds: 60,
        planned_weight_value: 10,
        planned_weight_unit: 'Kilogramos',
        coach_notes: '2 kettlebells de 10kg',
      },
    ],
  },

  // 4. WOD (3 rondas, máximo 18 minutos = 1080s)
  {
    sort_order: 4,
    section_type: 'WOD',
    work_format: 'Por rondas',
    visible_title: 'WOD',
    general_description: '3 rondas — máximo 18 minutos',
    time_cap_seconds: 1080,
    total_rounds: 3,
    exercises: [
      {
        exerciseName: 'Running',
        sort_order: 1,
        planned_distance_value: 200,
        planned_distance_unit: 'Metros',
      },
      {
        exerciseName: 'Burpee Broad Jump',
        sort_order: 2,
        planned_repetitions: 12,
      },
      {
        exerciseName: 'Kettlebell Farmer Carry',
        sort_order: 3,
        planned_distance_value: 200,
        planned_distance_unit: 'Metros',
        planned_weight_value: 10,
        planned_weight_unit: 'Kilogramos',
        coach_notes: '2 kettlebells de 10kg',
      },
      {
        exerciseName: 'Box Jump-Over',
        sort_order: 4,
        planned_repetitions: 12,
      },
    ],
  },

  // 5. Estiramiento (cada ejercicio 20-30s)
  {
    sort_order: 5,
    section_type: 'Vuelta a la calma',
    work_format: 'Trabajo libre',
    visible_title: 'Estiramiento',
    general_description: 'Cada ejercicio 20-30 segundos',
    exercises: [
      { exerciseName: 'Supine Spinal Twist',           sort_order: 1,  planned_time_seconds: 30 },
      { exerciseName: 'Seated Forward Fold',           sort_order: 2,  planned_time_seconds: 30 },
      { exerciseName: 'Seated Quad Stretch',           sort_order: 3,  planned_time_seconds: 30 },
      { exerciseName: 'Pigeon Pose',                   sort_order: 4,  planned_time_seconds: 30 },
      { exerciseName: 'Supine Abdominal Stretch',      sort_order: 5,  planned_time_seconds: 30 },
      { exerciseName: 'Cobra Pose',                    sort_order: 6,  planned_time_seconds: 30 },
      { exerciseName: 'Child\'s Pose',                 sort_order: 7,  planned_time_seconds: 30 },
      { exerciseName: 'Half Kneeling Hip Flexor Stretch', sort_order: 8,  planned_time_seconds: 30 },
      { exerciseName: 'Standing Biceps Stretch',       sort_order: 9,  planned_time_seconds: 30 },
      { exerciseName: 'Overhead Triceps Stretch',      sort_order: 10, planned_time_seconds: 30 },
      { exerciseName: 'Wrist Extensor Stretch',        sort_order: 11, planned_time_seconds: 30 },
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
export async function importClassGoat16052026(): Promise<{
  exercisesCreated: number;
  exercisesReused: number;
  classCreated: boolean;
}> {
  const db = await openDatabase();

  // Guardia: clase ya importada
  const existing = await db.query(
    "SELECT id FROM class_template WHERE name = 'Clase GOAT 16/05/2026' AND is_active = 1"
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
    [classId, '2026-05-16', 'Clase GOAT 16/05/2026',
     'Activación con cargas + WOD de resistencia (cardio, pliométrico y carry) en 3 rondas',
     null, 60, now, now]
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
        console.warn(`[GOAT 16/05] Ejercicio no encontrado: ${ex.exerciseName}`);
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
