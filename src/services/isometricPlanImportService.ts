// Servicio de importación del Plan Isométrico (docs/plan-isometrico.html)
// Crea las 4 clases "Isometrico-1..4" (un día de circuito cada una) con sus
// ejercicios, músculos, equipo, tags, secciones y unidades.
//
// Dosis: se cargan las de la FASE 1 escaladas ×1.5 (el plan original tope en
// 1 min; acá el tope es 1.5 min). Las dosis de Fase 2 y Fase 3 —también ×1.5—
// van en coach_notes de cada ejercicio, para no multiplicar las plantillas.
//
// Idempotente: getOrCreate no duplica ejercicios y la clase se verifica por nombre.
import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_plan_isometrico_done';
const CLASS_NAMES = ['Isometrico-1', 'Isometrico-2', 'Isometrico-3', 'Isometrico-4'];

export function isIsometricPlanImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

// ── Mapeo simplificado → granular (post "Cargar Datos Base") ──────────────────
const SIMPLIFIED_TO_GRANULAR: Record<string, string> = {
  'Deltoides': 'Deltoides anterior',
  'Cuádriceps': 'Recto femoral',
  'Isquiotibiales': 'Bíceps femoral',
  'Glúteos': 'Glúteo mayor',
  'Dorsales': 'Dorsal ancho',
  'Trapecio': 'Trapecio (superior)',
  'Bíceps': 'Bíceps braquial',
  'Tríceps': 'Tríceps braquial',
  'Pantorrillas': 'Gastrocnemio (gemelos)',
  'Core/Abdominales': 'Recto abdominal',
  'Antebrazos': 'Flexores antebrazo',
  'Pectorales': 'Pectoral mayor',
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

// Incluye ejercicios nuevos y existentes. getOrCreate busca por nombre y solo
// crea los que falten, por lo que el servicio es autosuficiente e idempotente.
const EXERCISES: ExerciseDef[] = [
  // ══ Entrada en calor (compartida por los 4 días) ══════════════════════════
  {
    name: 'March in Place',
    description:
      'Caminata enérgica sin desplazamiento, levantando las rodillas hasta la altura de la cadera y acompañando con braceo amplio. Sube el pulso sin ningún impacto en las rodillas.',
    technical_notes:
      'Mantener el tronco vertical: no inclinarse hacia atrás al subir la rodilla. Aumentar el ritmo progresivamente sin llegar a trotar (el objetivo es cero impacto).',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Core/Abdominales'],
    equipment: [],
    tags: ['cardio', 'activación', 'bilateral'],
    section_types: ['Entrada en calor'],
    units: ['Segundos', 'Minutos'],
    image_url: '/img/exercises/march-in-place.svg',
    is_compound: 1,
  },
  {
    name: 'Arm Circles',
    description:
      'Círculos amplios con los brazos extendidos en cruz: la mitad del tiempo hacia adelante y la otra mitad hacia atrás. Prepara los hombros para planchas, flexiones y pike.',
    technical_notes:
      'Buscar amplitud, no velocidad: círculos grandes y lentos. No encoger los hombros hacia las orejas. Abdomen firme para no arquear la espalda.',
    difficulty: 'Básico',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Trapecio', 'Dorsales'],
    equipment: [],
    tags: ['movilidad', 'hombro', 'bilateral'],
    section_types: ['Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/arm-circles.svg',
    is_compound: 0,
  },
  {
    name: 'Cat-Cow',
    description:
      'Movilidad de columna en cuadrupedia: se alterna redondear la espalda hacia el techo (gato) con hundirla suavemente dejando caer el abdomen (camello).',
    technical_notes:
      'Que se mueva toda la columna, no sólo la zona lumbar. Movimiento lento y fluido. No forzar el cuello en la extensión.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Dorsales', 'Trapecio'],
    equipment: [],
    tags: ['movilidad', 'core'],
    section_types: ['Entrada en calor', 'Vuelta a la calma'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/cat-cow.svg',
    is_compound: 0,
  },
  {
    name: 'Air Squat',
    description:
      'Sentadilla al peso corporal a rango cómodo, con bajada lenta, para lubricar rodillas y cadera antes del trabajo principal.',
    technical_notes:
      'Talones siempre apoyados. Bajar sólo hasta donde la rodilla esté cómoda: es calentamiento, no un test de rango.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['sentadilla', 'bilateral', 'movilidad'],
    section_types: ['Entrada en calor'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/air-squat.svg',
    is_compound: 1,
  },

  // ══ Día 1 · Core isométrico ═══════════════════════════════════════════════
  {
    name: 'Plank Hold',
    description:
      'Apoyado en antebrazos y puntas de pie, el cuerpo forma una línea recta de tobillos a cabeza y se sostiene la posición respirando. El isométrico de referencia para el core.',
    technical_notes:
      'La cadera ni cae (arquea la lumbar) ni sube en carpa. Codos justo debajo de los hombros, hombros lejos de las orejas. Cabeza neutra mirando al piso. Nunca contener la respiración.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Deltoides', 'Glúteos'],
    equipment: [],
    tags: ['core', 'isométrico', 'bilateral'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/plank-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Side Plank',
    description:
      'De costado, apoyado en un antebrazo y el borde del pie, se sostiene el cuerpo en línea recta. Trabaja oblicuos y estabiliza la cadera, clave para proteger rodillas y lumbar.',
    technical_notes:
      'La cadera no baja hacia el piso ni el tronco rota hacia adelante o atrás. Codo debajo del hombro. Versión más fácil: apoyar la rodilla de abajo.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Deltoides', 'Glúteos'],
    equipment: [],
    tags: ['core', 'isométrico', 'unilateral'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/side-plank.svg',
    is_compound: 0,
  },
  {
    name: 'Hollow Hold',
    description:
      'Boca arriba, se despegan hombros y piernas del piso formando una "banana" con la lumbar pegada al suelo. Clásico de gimnasia y del CrossFit.',
    technical_notes:
      'La lumbar NUNCA se despega del piso: si se arquea, subir más las piernas. No tirar del cuello con las manos. Progresión: rodillas flexionadas → piernas extendidas.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Cuádriceps', 'Deltoides'],
    equipment: [],
    tags: ['core', 'isométrico', 'gimnástico'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/hollow-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Bird Dog Hold',
    description:
      'En cuadrupedia se extienden brazo y pierna contrarios hasta quedar en línea con el tronco y se sostiene. Fortalece la faja lumbar sin comprimir la columna.',
    technical_notes:
      'No levantar la pierna por encima de la cadera arqueando la lumbar. La cadera no rota: imaginar un vaso de agua apoyado en la zona lumbar que no debe volcarse.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Glúteos', 'Dorsales'],
    equipment: [],
    tags: ['core', 'isométrico', 'unilateral'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/bird-dog-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Superman Hold',
    description:
      'Boca abajo, se despegan brazos, pecho y piernas del piso a la vez y se sostiene. Es la contracara del hollow: fortalece toda la cadena posterior.',
    technical_notes:
      'La altura no importa, la tensión sí: no buscar amplitud. Mirada al piso para no forzar el cuello. Glúteos apretados todo el tiempo y piernas quietas.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Glúteos', 'Dorsales', 'Deltoides'],
    equipment: [],
    tags: ['core', 'isométrico', 'bilateral'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/superman-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Dead Bug',
    description:
      'Boca arriba con brazos y piernas al techo, se bajan lentamente brazo y pierna contrarios sin despegar la lumbar del piso. Anti-extensión puro.',
    technical_notes:
      'Si la lumbar se despega al bajar la pierna, bajar menos. El valor está en la lentitud: 3 segundos por repetición.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Cuádriceps'],
    equipment: [],
    tags: ['core', 'unilateral', 'activación'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/dead-bug.svg',
    is_compound: 0,
  },
  {
    name: 'Ab Wheel Kneeling Rollout',
    description:
      'De rodillas con la rueda abdominal bajo los hombros, se rueda hacia adelante manteniendo el abdomen firme y se vuelve traccionando con abdomen y dorsales. Es un plank en movimiento.',
    technical_notes:
      'Arquear la lumbar al final del recorrido es la lesión típica: menos rango, más control. Apretar abdomen y glúteos ANTES de moverse. Volver con el abdomen, no sólo con los brazos.',
    difficulty: 'Intermedio',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Dorsales', 'Deltoides'],
    equipment: ['Rueda abdominal'],
    tags: ['core', 'bilateral'],
    section_types: ['Accesorio', 'Fuerza'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/ab-wheel-kneeling-rollout.svg',
    is_compound: 1,
  },

  // ══ Día 2 · Piernas sin impacto ═══════════════════════════════════════════
  {
    name: 'Wall Sit',
    description:
      'Con toda la espalda apoyada en la pared, se desliza hacia abajo hasta que los muslos quedan cerca de paralelos al piso y se sostiene. Isométrico de cuádriceps muy usado en rehabilitación de dolor patelofemoral.',
    technical_notes:
      'Las rodillas no pasan las puntas de los pies (alejar los pies de la pared). No apoyar las manos en los muslos. No ponerse en puntas de pie. Si molesta la rodilla, quedarse más arriba: 60° también sirve.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Core/Abdominales'],
    equipment: [],
    tags: ['isométrico', 'sentadilla', 'bilateral'],
    section_types: ['Accesorio', 'Fuerza'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/wall-squat-hold.svg',
    is_compound: 1,
  },
  {
    name: 'Bodyweight Glute Bridge',
    description:
      'Boca arriba con rodillas flexionadas, se empuja el piso con los talones y se levanta la cadera hasta alinear hombros, cadera y rodillas, sosteniendo arriba.',
    technical_notes:
      'La altura la dan los glúteos, no la espalda: no arquear la lumbar para subir más. Empujar con el talón, no con la punta del pie. Las rodillas no se abren hacia afuera.',
    difficulty: 'Básico',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['isométrico', 'activación', 'bilateral'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/bodyweight-glute-bridge.svg',
    is_compound: 1,
  },
  {
    name: 'Isometric Lunge',
    description:
      'Posición de zancada sostenida a media altura, sin subir ni bajar. Fuerza unilateral sin impacto, ideal como transición hacia subir escaleras sin dolor.',
    technical_notes:
      'Rodilla delantera sobre el tobillo, que no se vaya hacia adentro. Tronco vertical. No hace falta bajar profundo: la altura la regula la rodilla. Es normal que la pierna tiemble al final.',
    difficulty: 'Intermedio',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Core/Abdominales'],
    equipment: [],
    tags: ['isométrico', 'unilateral'],
    section_types: ['Accesorio', 'Fuerza'],
    units: ['Segundos', 'Repeticiones', 'Kilogramos'],
    image_url: '/img/exercises/isometric-lunge.svg',
    is_compound: 1,
  },
  {
    name: 'Clamshell Hold',
    description:
      'De costado con rodillas flexionadas y pies juntos, se abre la rodilla de arriba como una almeja y se sostiene. El glúteo medio débil es una de las causas más comunes de dolor de rodilla en escaleras.',
    technical_notes:
      'No rotar la pelvis hacia atrás para abrir más: quedarse "de perfil perfecto". Apertura corta y sostenida, sin impulso. Los pies no se separan.',
    difficulty: 'Básico',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Core/Abdominales'],
    equipment: [],
    tags: ['isométrico', 'activación', 'unilateral'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/clamshell-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Calf Raise Hold',
    description:
      'Se sube a puntas de pie lo más alto posible y se sostiene arriba. Gemelos y sóleo absorben carga que de otro modo pasa a la rodilla.',
    technical_notes:
      'Subir bien arriba, no sostener a media altura. El peso sobre el dedo gordo, sin dejarlo caer al borde externo del pie. Bajar lento (3 s) al terminar.',
    difficulty: 'Básico',
    primary_muscle: 'Pantorrillas',
    secondary_muscles: ['Core/Abdominales'],
    equipment: [],
    tags: ['isométrico', 'monoarticular', 'bilateral'],
    section_types: ['Accesorio', 'Activación'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/calf-raise-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Tempo Squat 3-1-3',
    description:
      'Sentadilla al peso corporal ultra lenta: 3 segundos para bajar, 1 de pausa abajo y 3 para subir. La pausa abajo es un mini-isométrico en el punto que más fortalece.',
    technical_notes:
      'No acelerar en la bajada: ahí está el estímulo. No rebotar abajo. Talones apoyados durante todo el recorrido. Bajar sólo hasta rango cómodo para la rodilla.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos', 'Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['sentadilla', 'bilateral'],
    section_types: ['Fuerza', 'Accesorio'],
    units: ['Repeticiones', 'Kilogramos', 'Segundos'],
    image_url: '/img/exercises/tempo-squat.svg',
    is_compound: 1,
  },

  // ══ Día 3 · Tren superior ═════════════════════════════════════════════════
  {
    name: 'Isometric Push-Up Hold',
    description:
      'Se queda congelado a mitad de una flexión, con los codos a 90°. Sostener en el punto más difícil construye fuerza en pecho y tríceps sin necesidad de peso.',
    technical_notes:
      'Codos apuntando ~45° hacia atrás, nunca abiertos en cruz (castiga el hombro). Cuerpo rígido como tabla: la cadera ni cae ni sube. Si no se llega al tiempo, apoyar las rodillas manteniendo la misma posición de brazos.',
    difficulty: 'Intermedio',
    primary_muscle: 'Pectorales',
    secondary_muscles: ['Tríceps', 'Deltoides', 'Core/Abdominales'],
    equipment: [],
    tags: ['isométrico', 'push', 'bilateral'],
    section_types: ['Accesorio', 'Fuerza'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/isometric-push-up-hold.svg',
    is_compound: 1,
  },
  {
    name: 'Tempo Push-Up',
    description:
      'Flexión completa bajando en 3 segundos, con 1 segundo de pausa abajo y subida en 1 segundo. Menos repeticiones, mucho más estímulo, cero impacto.',
    technical_notes:
      'No bajar rápido ni rebotar. El pecho baja antes que la cadera, no al revés. Buscar rango completo (pecho cerca del piso) aunque salgan menos repeticiones. Si es muy exigente: manos apoyadas en una mesa o banco.',
    difficulty: 'Intermedio',
    primary_muscle: 'Pectorales',
    secondary_muscles: ['Tríceps', 'Deltoides', 'Core/Abdominales'],
    equipment: [],
    tags: ['push', 'press', 'bilateral'],
    section_types: ['Fuerza', 'Accesorio'],
    units: ['Repeticiones', 'Segundos'],
    image_url: '/img/exercises/tempo-push-up.svg',
    is_compound: 1,
  },
  {
    name: 'Scapular Plank Hold',
    description:
      'En plancha alta, sin flexionar los codos, se empuja el piso al máximo separando los omóplatos (protracción) y se sostiene. Estabilidad de hombro para flexiones, pike y CrossFit.',
    technical_notes:
      'Los codos permanecen extendidos: el movimiento es sólo de los omóplatos. No dejar caer la cadera. Empujar el piso, no hundirse entre los hombros.',
    difficulty: 'Básico',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Dorsales', 'Core/Abdominales', 'Pectorales'],
    equipment: [],
    tags: ['isométrico', 'hombro', 'gimnástico'],
    section_types: ['Activación', 'Accesorio'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/scapular-plank-hold.svg',
    is_compound: 0,
  },
  {
    name: 'Pike Hold',
    description:
      'Cuerpo en "V" invertida con gran parte del peso sobre los hombros, empujando el piso para alejarlo. Es el press de hombros en casa, sin una sola mancuerna.',
    technical_notes:
      'Si la espalda se redondea, flexionar más las rodillas. Llevar el peso a las manos, no a los pies. Cabeza entre los brazos, mirada a los pies. Empujar fuerte sin tensar el cuello.',
    difficulty: 'Intermedio',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Trapecio', 'Tríceps', 'Core/Abdominales'],
    equipment: [],
    tags: ['isométrico', 'hombro', 'gimnástico'],
    section_types: ['Accesorio', 'Fuerza'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/pike-hold.svg',
    is_compound: 1,
  },
  {
    name: 'Towel Isometric Row',
    description:
      'Sentado en el piso con una toalla pasada por las plantas de los pies, se tira como remando sin que la toalla ceda. Tensión máxima en la espalda sin equipamiento.',
    technical_notes:
      'Trabajar al 70-80% de la fuerza, nunca al 100%. Espalda derecha, pecho orgulloso: no encorvarse. Pensar en "llevar los codos atrás y juntar omóplatos", no en tirar sólo con los brazos. MUY IMPORTANTE: respirar corto y seguido, nunca aguantar el aire.',
    difficulty: 'Básico',
    primary_muscle: 'Dorsales',
    secondary_muscles: ['Bíceps', 'Trapecio', 'Antebrazos'],
    equipment: ['Toalla'],
    tags: ['isométrico', 'pull', 'bilateral'],
    section_types: ['Accesorio', 'Fuerza'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/towel-isometric-row.svg',
    is_compound: 1,
  },
  {
    name: 'Towel Isometric Curl',
    description:
      'De pie, se pisa un extremo de la toalla y se tira hacia arriba con el codo a 90° sin que la toalla ceda. Curl de bíceps isométrico sin mancuernas.',
    technical_notes:
      'El codo se mantiene pegado al cuerpo. No balancearse hacia atrás. Tirar al 70-80% de la fuerza, sin apretar tanto como para aguantar la respiración.',
    difficulty: 'Básico',
    primary_muscle: 'Bíceps',
    secondary_muscles: ['Antebrazos'],
    equipment: ['Toalla'],
    tags: ['isométrico', 'monoarticular', 'unilateral'],
    section_types: ['Accesorio'],
    units: ['Segundos', 'Repeticiones', 'Kilogramos'],
    image_url: '/img/exercises/towel-isometric-curl.svg',
    is_compound: 0,
  },

  // ══ Día 4 · Cardio suave ══════════════════════════════════════════════════
  {
    name: 'Step Jack',
    description:
      'El jumping jack amigable con las rodillas: en vez de saltar, se abre una pierna por vez al costado apoyando el pie mientras los brazos suben overhead. Mismo pulso, cero impacto.',
    technical_notes:
      'Buscar ritmo: si se hace demasiado suave no sube el pulso. Cuidado con terminar saltando sin querer al entusiasmarse: el punto es no impactar.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Deltoides', 'Glúteos', 'Pantorrillas'],
    equipment: [],
    tags: ['cardio', 'bilateral'],
    section_types: ['Entrada en calor', 'WOD'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/step-jack.svg',
    is_compound: 1,
  },
  {
    name: 'Mountain Climbers',
    description:
      'Desde plancha alta se lleva una rodilla al pecho por vez con paso apoyado (sin saltito de cambio). Core y pulso a la vez, sin impacto.',
    technical_notes:
      'Es un "paso", no un salto: el pie se apoya y vuelve. La cadera no sube como carpa. Hombros sobre las manos y sin rebotar. Ritmo constante.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: ['Deltoides', 'Cuádriceps', 'Glúteos'],
    equipment: [],
    tags: ['cardio', 'core', 'unilateral'],
    section_types: ['WOD', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/mountain-climbers.svg',
    is_compound: 1,
  },
  {
    name: 'Shadow Boxing',
    description:
      'Boxeo contra el aire: jab, directo y ganchos, moviéndose suave sobre los pies. Sube el pulso, trabaja hombros y coordinación, y no golpea las rodillas.',
    technical_notes:
      'Golpear "al 80%", con control: no extender el codo con latigazo al 100%. Pies siempre vivos con pasos cortos, sin saltar. La potencia sale de la rotación de cadera, no del brazo.',
    difficulty: 'Básico',
    primary_muscle: 'Deltoides',
    secondary_muscles: ['Core/Abdominales', 'Pectorales', 'Cuádriceps'],
    equipment: [],
    tags: ['cardio', 'hombro', 'unilateral'],
    section_types: ['WOD', 'Entrada en calor'],
    units: ['Segundos', 'Minutos'],
    image_url: '/img/exercises/shadow-boxing.svg',
    is_compound: 1,
  },
  {
    name: 'Jump Rope',
    description:
      'Salto a la cuerda con saltos mínimos (2-3 cm), sobre superficie que no sea baldosa dura. Alternativa sin impacto: "cuerda fantasma", el mismo gesto de muñecas sin despegar los pies.',
    technical_notes:
      'Saltos mínimos: los pies apenas despegan y se aterriza en la punta del pie con rodillas blandas. El giro sale de las muñecas, no de los brazos. Frenar ante cualquier molestia de rodilla.',
    difficulty: 'Intermedio',
    primary_muscle: 'Pantorrillas',
    secondary_muscles: ['Cuádriceps', 'Antebrazos', 'Core/Abdominales'],
    equipment: ['Cuerda para saltar'],
    tags: ['cardio', 'pliométrico', 'bilateral'],
    section_types: ['WOD', 'Entrada en calor'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/jump-rope.svg',
    is_compound: 1,
  },

  // ══ Vuelta a la calma ═════════════════════════════════════════════════════
  {
    name: 'Standing Quad Stretch',
    description:
      'De pie con apoyo en la pared, se toma el empeine y se lleva el talón hacia la cola. Cuadríceps flexibles descargan directamente la rótula.',
    technical_notes:
      'No arquear la lumbar: cadera levemente hacia adelante y rodillas juntas. Tensión suave, no dolor. Sin tirones ni rebotes.',
    difficulty: 'Básico',
    primary_muscle: 'Cuádriceps',
    secondary_muscles: ['Glúteos'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/standing-quad-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Standing Hamstring Stretch',
    description:
      'Con el talón apoyado adelante en un escalón bajo y la pierna estirada, se inclina el tronco desde la cadera manteniendo la espalda larga.',
    technical_notes:
      'No redondear la espalda para "llegar más lejos": el estiramiento sale de la bisagra de cadera. No bloquear la rodilla en hiperextensión.',
    difficulty: 'Básico',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Pantorrillas', 'Glúteos'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/standing-hamstring-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Supine Figure-4 Stretch',
    description:
      'Boca arriba, se cruza un tobillo sobre la rodilla contraria formando un 4 y se trae la pierna hacia el pecho. Libera la cadera después del trabajo de glúteos.',
    technical_notes:
      'No levantar la cabeza haciendo fuerza con el cuello. Tracción suave, sin violencia: es un estiramiento, hay que aflojar.',
    difficulty: 'Básico',
    primary_muscle: 'Glúteos',
    secondary_muscles: ['Isquiotibiales', 'Core/Abdominales'],
    equipment: [],
    tags: ['movilidad', 'unilateral'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/supine-figure-4-stretch.svg',
    is_compound: 0,
  },
  {
    name: 'Doorway Chest Stretch',
    description:
      'Con el antebrazo apoyado en el marco de una puerta, se rota el cuerpo alejándose hasta sentir el estiramiento en el pecho. Contrarresta las horas de escritorio y el trabajo de empuje.',
    technical_notes:
      'El codo a la altura del hombro, no por encima (molesta la articulación). No encoger el hombro. Se puede hacer un lado por vez o ambos a la vez en el marco.',
    difficulty: 'Básico',
    primary_muscle: 'Pectorales',
    secondary_muscles: ['Deltoides', 'Bíceps'],
    equipment: [],
    tags: ['movilidad', 'hombro'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos', 'Repeticiones'],
    image_url: '/img/exercises/doorway-chest-stretch.svg',
    is_compound: 0,
  },
  {
    name: '4-6 Breathing',
    description:
      'Cierre de sesión: se inhala por la nariz contando 4 segundos inflando el abdomen y se exhala por la boca contando 6. Acelera la recuperación y baja las pulsaciones.',
    technical_notes:
      'Respirar con el abdomen, no sólo con el pecho: una mano apoyada en la panza para controlarlo. No apurar la exhalación, que sea más larga que la inhalación.',
    difficulty: 'Básico',
    primary_muscle: 'Core/Abdominales',
    secondary_muscles: [],
    equipment: [],
    tags: ['movilidad'],
    section_types: ['Vuelta a la calma'],
    units: ['Segundos', 'Minutos'],
    image_url: '/img/exercises/breathing-4-6.svg',
    is_compound: 0,
  },
];

// ── Helper: crear ejercicio si no existe ─────────────────────────────────────
interface Maps {
  difficulty: Map<string, string>;
  muscle: Map<string, string>;
  equipment: Map<string, string>;
  tag: Map<string, string>;
  sectionType: Map<string, string>;
  workFormat: Map<string, string>;
  unit: Map<string, string>;
}

async function getOrCreate(
  db: any,
  exerciseDef: ExerciseDef,
  maps: Maps
): Promise<{ id: string; created: boolean }> {
  const existing = await db.query(
    'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?)) AND is_active = 1',
    [exerciseDef.name]
  );
  if (existing.values?.length) {
    return { id: existing.values[0].id, created: false };
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const id = generateUUID();
  const diffId = maps.difficulty.get(exerciseDef.difficulty) ?? null;
  const primaryId = maps.muscle.get(toDbName(exerciseDef.primary_muscle)) ?? null;

  await db.run(
    `INSERT INTO exercise
       (id, name, description, technical_notes, difficulty_level_id,
        primary_muscle_group_id, image_url, video_path, video_long_path,
        is_compound, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [id, exerciseDef.name, exerciseDef.description, exerciseDef.technical_notes,
     diffId, primaryId, exerciseDef.image_url,
     exerciseDef.video_path ?? null, exerciseDef.video_long_path ?? null,
     exerciseDef.is_compound, now, now]
  );

  if (primaryId) {
    await db.run(
      'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,1)',
      [generateUUID(), id, primaryId]
    );
  }

  for (const secName of exerciseDef.secondary_muscles) {
    const secId = maps.muscle.get(toDbName(secName));
    if (secId) {
      await db.run(
        'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,0)',
        [generateUUID(), id, secId]
      );
    }
  }

  for (const eqName of exerciseDef.equipment) {
    const eqId = maps.equipment.get(eqName);
    if (eqId) {
      await db.run(
        'INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?,?,?,1)',
        [generateUUID(), id, eqId]
      );
    }
  }

  for (const tagName of exerciseDef.tags) {
    const tagId = maps.tag.get(tagName);
    if (tagId) {
      await db.run(
        'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?,?,?)',
        [generateUUID(), id, tagId]
      );
    }
  }

  for (const stName of exerciseDef.section_types) {
    const stId = maps.sectionType.get(stName);
    if (stId) {
      await db.run(
        'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?,?,?)',
        [generateUUID(), id, stId]
      );
    }
  }

  for (let i = 0; i < exerciseDef.units.length; i++) {
    const uId = maps.unit.get(exerciseDef.units[i]);
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
export async function importIsometricPlan(): Promise<{ exercises: number; created: boolean }> {
  const db = await openDatabase();

  // Guardia: si ya existe cualquiera de las 4 clases, no se vuelve a importar.
  const existing = await db.query(
    `SELECT id FROM class_template
      WHERE name IN (?,?,?,?) AND is_active = 1`,
    CLASS_NAMES
  );
  if (existing.values?.length) {
    markDone();
    return { exercises: 0, created: false };
  }

  const rows = async (sql: string) => (await db.query(sql)).values ?? [];
  const toMap = (arr: any[]) => new Map(arr.map((r) => [r.name as string, r.id as string]));

  const maps: Maps = {
    difficulty: toMap(await rows('SELECT id, name FROM difficulty_level WHERE is_active = 1')),
    muscle:     toMap(await rows('SELECT id, name FROM muscle_group WHERE is_active = 1')),
    equipment:  toMap(await rows('SELECT id, name FROM equipment WHERE is_active = 1')),
    tag:        toMap(await rows('SELECT id, name FROM tag WHERE is_active = 1')),
    sectionType:toMap(await rows('SELECT id, name FROM section_type WHERE is_active = 1')),
    workFormat: toMap(await rows('SELECT id, name FROM work_format WHERE is_active = 1')),
    unit:       toMap(await rows('SELECT id, name FROM measurement_unit WHERE is_active = 1')),
  };

  // Equipamiento propio del plan que puede no estar en el catálogo base.
  const extraEquipment: [string, string, number][] = [
    ['Rueda abdominal', 'other', 20],
    ['Toalla', 'other', 21],
  ];
  for (const [name, category, sortOrder] of extraEquipment) {
    if (!maps.equipment.has(name)) {
      const eqId = generateUUID();
      await db.run(
        'INSERT INTO equipment (id, name, category, sort_order, is_active) VALUES (?,?,?,?,1)',
        [eqId, name, category, sortOrder]
      );
      maps.equipment.set(name, eqId);
    }
  }

  let exercisesCreated = 0;
  const ex: Record<string, string> = {};
  for (const def of EXERCISES) {
    const { id, created } = await getOrCreate(db, def, maps);
    ex[def.name] = id;
    if (created) exercisesCreated++;
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // ── Helpers de creación de clase/sección/ejercicio ─────────────────────────
  const addClass = async (
    name: string,
    date: string,
    objective: string,
    notes: string
  ): Promise<string> => {
    const id = generateUUID();
    await db.run(
      `INSERT INTO class_template
         (id, date, name, objective, general_notes, estimated_duration_minutes,
          is_favorite, is_active, created_at, updated_at)
       VALUES (?,?,?,?,?,?,0,1,?,?)`,
      [id, date, name, objective, notes, 40, now, now]
    );
    return id;
  };

  const addSection = async (
    classId: string,
    sortOrder: number,
    opts: {
      sectionType: string;
      workFormat: string;
      visibleTitle: string;
      description: string;
      timeCap?: number | null;
      rounds?: number | null;
      restBetweenRounds?: number | null;
    }
  ): Promise<string> => {
    const id = generateUUID();
    await db.run(
      `INSERT INTO class_section
         (id, class_template_id, section_type_id, work_format_id, sort_order,
          visible_title, general_description, time_cap_seconds, total_rounds,
          rest_between_rounds_seconds, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, classId,
       maps.sectionType.get(opts.sectionType) ?? null,
       maps.workFormat.get(opts.workFormat) ?? null,
       sortOrder, opts.visibleTitle, opts.description,
       opts.timeCap ?? null, opts.rounds ?? null,
       opts.restBetweenRounds ?? null, null, now, now]
    );
    return id;
  };

  const addEx = async (
    sectionId: string,
    exerciseName: string,
    sortOrder: number,
    opts: {
      reps?: number | null;
      timeSeconds?: number | null;
      restSeconds?: number | null;
      coachNotes?: string | null;
    } = {}
  ): Promise<void> => {
    await db.run(
      `INSERT INTO section_exercise
         (id, class_section_id, exercise_id, sort_order, coach_notes,
          planned_repetitions, planned_weight_value, planned_weight_unit_id,
          planned_time_seconds, planned_distance_value, planned_distance_unit_id,
          planned_calories, planned_rest_seconds, planned_rounds,
          rm_percentage, suggested_scaling, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [generateUUID(), sectionId, ex[exerciseName], sortOrder,
       opts.coachNotes ?? null,
       opts.reps ?? null,
       null, null,
       opts.timeSeconds ?? null,
       null, null, null,
       opts.restSeconds ?? null,
       null, null, null, null, now, now]
    );
  };

  // Entrada en calor: idéntica en las 4 clases.
  const addWarmUp = async (classId: string): Promise<void> => {
    const s = await addSection(classId, 1, {
      sectionType: 'Entrada en calor',
      workFormat: 'Trabajo libre',
      visibleTitle: 'Entrada en calor',
      description: '1 ronda continua, ~5 minutos. Igual en los 4 días del plan.',
      timeCap: 330,
      rounds: 1,
    });
    await addEx(s, 'March in Place', 1, { timeSeconds: 90 });
    await addEx(s, 'Arm Circles', 2, {
      timeSeconds: 90,
      coachNotes: '45 s hacia adelante + 45 s hacia atrás. Círculos amplios y lentos.',
    });
    await addEx(s, 'Cat-Cow', 3, { reps: 12, coachNotes: '12 ciclos completos, lentos.' });
    await addEx(s, 'Air Squat', 4, {
      reps: 12,
      coachNotes: 'Bajada lenta (3 s) a rango cómodo. Es calentamiento, no un test de rango.',
    });
  };

  const CIRCUIT_DESC =
    '3 rondas. 30-40 s de descanso entre ejercicios y 60-90 s entre rondas. ' +
    'Dosis cargadas = Fase 1; en coach_notes de cada ejercicio están las de Fase 2 y Fase 3.';

  // ══════════════════════════════════════════════════════════════════════════
  // Isometrico-1 · Día 1 · Core isométrico
  // ══════════════════════════════════════════════════════════════════════════
  const c1 = await addClass(
    'Isometrico-1',
    '2026-07-13',
    'Día 1 del plan isométrico: core anti-extensión y anti-rotación con planchas y holds. Complementa el CrossFit sin castigar las rodillas.',
    'Plan isométrico de 12 semanas (3 fases de 4 semanas). El dead bug se hace sólo en Fase 1; ' +
      'desde la Fase 2 lo reemplaza la rueda abdominal. Las dosis cargadas son las de Fase 1: ' +
      'las de Fase 2 y 3 están en las notas de cada ejercicio.'
  );
  await addWarmUp(c1);

  const s1 = await addSection(c1, 2, {
    sectionType: 'Accesorio',
    workFormat: 'Por rondas',
    visibleTitle: 'Circuito · Core isométrico',
    description: CIRCUIT_DESC,
    rounds: 3,
    restBetweenRounds: 90,
  });
  await addEx(s1, 'Plank Hold', 1, {
    timeSeconds: 45,
    restSeconds: 35,
    coachNotes: 'F1 45 s · F2 65 s · F3 90 s. Nunca contener la respiración.',
  });
  await addEx(s1, 'Side Plank', 2, {
    timeSeconds: 30,
    restSeconds: 35,
    coachNotes: 'Por lado. F1 30 s · F2 45 s · F3 65 s. Si cuesta, apoyá la rodilla de abajo.',
  });
  await addEx(s1, 'Hollow Hold', 3, {
    timeSeconds: 30,
    restSeconds: 35,
    coachNotes: 'F1 30 s rodillas flexionadas · F2 50 s · F3 60 s piernas extendidas. La lumbar nunca se despega.',
  });
  await addEx(s1, 'Bird Dog Hold', 4, {
    timeSeconds: 30,
    restSeconds: 35,
    coachNotes: 'Por lado. F1 30 s · F2 y F3 45 s.',
  });
  await addEx(s1, 'Superman Hold', 5, {
    timeSeconds: 30,
    restSeconds: 35,
    coachNotes: 'F1 30 s · F2 45 s · F3 60 s. La altura no importa, la tensión sí.',
  });
  await addEx(s1, 'Dead Bug', 6, {
    reps: 12,
    restSeconds: 35,
    coachNotes: 'SÓLO FASE 1: 12 reps por lado, lentas. Desde la Fase 2 se reemplaza por la rueda abdominal.',
  });
  await addEx(s1, 'Ab Wheel Kneeling Rollout', 7, {
    reps: 9,
    restSeconds: 35,
    coachNotes: 'ENTRA EN FASE 2: 2 rondas × 9 reps con rango corto. F3: 12-15 reps con más rango. No hacer en Fase 1.',
  });

  const s1c = await addSection(c1, 3, {
    sectionType: 'Vuelta a la calma',
    workFormat: 'Trabajo libre',
    visibleTitle: 'Vuelta a la calma',
    description: 'Estiramientos largos y cierre respiratorio. Igual en las 3 fases.',
    timeCap: 300,
    rounds: 1,
  });
  await addEx(s1c, 'Supine Figure-4 Stretch', 1, { timeSeconds: 45, coachNotes: 'Por lado.' });
  await addEx(s1c, 'Doorway Chest Stretch', 2, { timeSeconds: 45 });
  await addEx(s1c, '4-6 Breathing', 3, { timeSeconds: 90, coachNotes: 'Inhalar en 4 s, exhalar en 6 s.' });

  // ══════════════════════════════════════════════════════════════════════════
  // Isometrico-2 · Día 2 · Piernas sin impacto
  // ══════════════════════════════════════════════════════════════════════════
  const c2 = await addClass(
    'Isometrico-2',
    '2026-07-14',
    'Día 2 del plan isométrico: cuádriceps y glúteos con isométricos y tempo lento. El día que le hace bien a las rodillas (dolor patelofemoral).',
    'No programarlo el día después de un WOD pesado de piernas. Si la rodilla molesta en el wall sit, ' +
      'subir el ángulo (menos flexión): sigue siendo efectivo. Regla: molestia hasta 3/10 que desaparece al ' +
      'terminar es aceptable; dolor que aumenta durante o al día siguiente, recortar rango o segundos.'
  );
  await addWarmUp(c2);

  const s2 = await addSection(c2, 2, {
    sectionType: 'Accesorio',
    workFormat: 'Por rondas',
    visibleTitle: 'Circuito · Piernas sin impacto',
    description: CIRCUIT_DESC,
    rounds: 3,
    restBetweenRounds: 90,
  });
  await addEx(s2, 'Wall Sit', 1, {
    timeSeconds: 45,
    restSeconds: 35,
    coachNotes: 'F1 45 s · F2 75 s · F3 90 s. Va a quemar: respirá parejo, no aguantes el aire.',
  });
  await addEx(s2, 'Bodyweight Glute Bridge', 2, {
    timeSeconds: 40,
    restSeconds: 35,
    coachNotes: 'Hold arriba. F1 40 s · F2 55 s · F3 70 s (o a una pierna, 30 s por lado).',
  });
  await addEx(s2, 'Isometric Lunge', 3, {
    timeSeconds: 25,
    restSeconds: 35,
    coachNotes: 'Por lado. F1 25 s · F2 40 s · F3 55 s (con mancuernas, opcional).',
  });
  await addEx(s2, 'Clamshell Hold', 4, {
    timeSeconds: 25,
    restSeconds: 35,
    coachNotes: 'Por lado. F1 25 s · F2 30 s · F3 40 s. Glúteo medio: el estabilizador de la rodilla.',
  });
  await addEx(s2, 'Calf Raise Hold', 5, {
    timeSeconds: 30,
    restSeconds: 35,
    coachNotes: 'F1 30 s · F2 45 s · F3 45 s a una pierna.',
  });
  await addEx(s2, 'Tempo Squat 3-1-3', 6, {
    reps: 9,
    restSeconds: 35,
    coachNotes: 'F1 9 reps · F2 12 · F3 15 (goblet con mancuerna, opcional). 3 s bajar, 1 s pausa, 3 s subir.',
  });

  const s2c = await addSection(c2, 3, {
    sectionType: 'Vuelta a la calma',
    workFormat: 'Trabajo libre',
    visibleTitle: 'Vuelta a la calma',
    description: 'Estiramientos de la cadena de piernas. Igual en las 3 fases.',
    timeCap: 300,
    rounds: 1,
  });
  await addEx(s2c, 'Standing Quad Stretch', 1, { timeSeconds: 45, coachNotes: 'Por lado.' });
  await addEx(s2c, 'Standing Hamstring Stretch', 2, { timeSeconds: 45, coachNotes: 'Por lado.' });
  await addEx(s2c, 'Supine Figure-4 Stretch', 3, { timeSeconds: 45, coachNotes: 'Por lado.' });

  // ══════════════════════════════════════════════════════════════════════════
  // Isometrico-3 · Día 3 · Tren superior + empuje
  // ══════════════════════════════════════════════════════════════════════════
  const c3 = await addClass(
    'Isometrico-3',
    '2026-07-15',
    'Día 3 del plan isométrico: empuje (flexiones y pike), estabilidad escapular y tracción isométrica con toalla.',
    'En los isométricos de tracción (toalla) trabajar al 70-80% de la fuerza, nunca al 100%, y NO aguantar ' +
      'la respiración: la tensión alta sube la presión arterial. En Fase 3, si hay mancuernas, el remo y el ' +
      'curl con toalla se pueden reemplazar por sus versiones con peso.'
  );
  await addWarmUp(c3);

  const s3 = await addSection(c3, 2, {
    sectionType: 'Accesorio',
    workFormat: 'Por rondas',
    visibleTitle: 'Circuito · Tren superior',
    description: CIRCUIT_DESC,
    rounds: 3,
    restBetweenRounds: 90,
  });
  await addEx(s3, 'Isometric Push-Up Hold', 1, {
    timeSeconds: 25,
    restSeconds: 35,
    coachNotes: 'F1 25 s · F2 30 s · F3 45 s. Si no llegás al tiempo, apoyá las rodillas.',
  });
  await addEx(s3, 'Tempo Push-Up', 2, {
    reps: 9,
    restSeconds: 35,
    coachNotes: 'F1 9 reps · F2 12 · F3 15-18. 3 s bajar, 1 s pausa, 1 s subir. Inclinadas en una mesa si hace falta.',
  });
  await addEx(s3, 'Scapular Plank Hold', 3, {
    timeSeconds: 25,
    restSeconds: 35,
    coachNotes: 'F1 25 s · F2 30 s · F3 40 s. Codos siempre extendidos: mueven sólo los omóplatos.',
  });
  await addEx(s3, 'Pike Hold', 4, {
    timeSeconds: 25,
    restSeconds: 35,
    coachNotes: 'F1 25 s · F2 40 s · F3 45 s. Si la espalda se redondea, flexioná más las rodillas.',
  });
  await addEx(s3, 'Towel Isometric Row', 5, {
    timeSeconds: 30,
    restSeconds: 35,
    coachNotes: 'Al 70-80% de tu fuerza. F1 30 s · F2 y F3 45 s. F3 con mancuernas: remo a un brazo, 3 × 15 por lado.',
  });
  await addEx(s3, 'Towel Isometric Curl', 6, {
    timeSeconds: 25,
    restSeconds: 35,
    coachNotes: 'Por lado, al 70-80%. F1 25 s · F2 y F3 30 s. F3 con mancuernas: curl lento (2 s subir, 3 s bajar), 3 × 15.',
  });

  const s3c = await addSection(c3, 3, {
    sectionType: 'Vuelta a la calma',
    workFormat: 'Trabajo libre',
    visibleTitle: 'Vuelta a la calma',
    description: 'Apertura de pecho, movilidad de columna y cierre respiratorio.',
    timeCap: 300,
    rounds: 1,
  });
  await addEx(s3c, 'Doorway Chest Stretch', 1, { timeSeconds: 45 });
  await addEx(s3c, 'Cat-Cow', 2, { reps: 12, coachNotes: '12 ciclos lentos.' });
  await addEx(s3c, '4-6 Breathing', 3, { timeSeconds: 90, coachNotes: 'Inhalar en 4 s, exhalar en 6 s.' });

  // ══════════════════════════════════════════════════════════════════════════
  // Isometrico-4 · Día 4 (opcional) · Cardio suave + movilidad
  // ══════════════════════════════════════════════════════════════════════════
  const c4 = await addClass(
    'Isometrico-4',
    '2026-07-16',
    'Día 4 del plan isométrico (OPCIONAL): pulso sin impacto y estiramientos largos. Sumalo las semanas que el cuerpo pida más.',
    'Día opcional. La cuerda de saltar aparece recién en la Fase 3 y es 100% opcional: si preferís, ' +
      'reemplazala por otra ronda de shadow boxing o por "cuerda fantasma" (mismo gesto, sin despegar del piso). ' +
      'La vuelta a la calma de este día es más larga: tomate los estiramientos con tiempo.'
  );
  await addWarmUp(c4);

  const s4 = await addSection(c4, 2, {
    sectionType: 'WOD',
    workFormat: 'Por rondas',
    visibleTitle: 'Circuito · Cardio suave',
    description: CIRCUIT_DESC,
    rounds: 3,
    restBetweenRounds: 90,
  });
  await addEx(s4, 'Step Jack', 1, {
    timeSeconds: 60,
    restSeconds: 35,
    coachNotes: 'F1 60 s · F2 75 s · F3 90 s. Buscá ritmo, pero sin terminar saltando.',
  });
  await addEx(s4, 'Mountain Climbers', 2, {
    timeSeconds: 45,
    restSeconds: 35,
    coachNotes: 'Lentos, con paso apoyado (sin saltito de cambio). F1 45 s · F2 60 s · F3 70 s.',
  });
  await addEx(s4, 'Shadow Boxing', 3, {
    timeSeconds: 70,
    restSeconds: 35,
    coachNotes: 'F1 70 s · F2 y F3 90 s. En F3, opcional con mancuernas de 1-2 kg como mucho.',
  });
  await addEx(s4, 'Jump Rope', 4, {
    timeSeconds: 45,
    restSeconds: 35,
    coachNotes: 'SÓLO FASE 3 Y OPCIONAL: 45 s de saltos mínimos, sólo si la rodilla viene respondiendo bien. ' +
      'Alternativa sin impacto: "cuerda fantasma" (mismo gesto de muñecas, sin despegar los pies).',
  });

  const s4c = await addSection(c4, 3, {
    sectionType: 'Vuelta a la calma',
    workFormat: 'Trabajo libre',
    visibleTitle: 'Vuelta a la calma (larga)',
    description: 'La más larga del plan: 5 estiramientos, sin apuro.',
    timeCap: 480,
    rounds: 1,
  });
  await addEx(s4c, 'Standing Quad Stretch', 1, { timeSeconds: 45, coachNotes: 'Por lado.' });
  await addEx(s4c, 'Standing Hamstring Stretch', 2, { timeSeconds: 45, coachNotes: 'Por lado.' });
  await addEx(s4c, 'Supine Figure-4 Stretch', 3, { timeSeconds: 45, coachNotes: 'Por lado.' });
  await addEx(s4c, 'Doorway Chest Stretch', 4, { timeSeconds: 45 });
  await addEx(s4c, '4-6 Breathing', 5, { timeSeconds: 90, coachNotes: 'Inhalar en 4 s, exhalar en 6 s.' });

  await saveDatabase();
  markDone();
  return { exercises: exercisesCreated, created: true };
}
