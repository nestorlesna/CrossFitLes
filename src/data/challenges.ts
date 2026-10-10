// Catálogo de challenges de calistenia (sin equipamiento).
// BUILTIN_CHALLENGES viene con el APK; "Actualizar contenido" puede sumar o reemplazar
// definiciones (por code) sin sacar una versión nueva: ver setRemoteChallenges().
// Los challenges de meta sólo guardan la meta y los rangos del test: las series
// las calcula challengeEngine con la curva de progresión. Los diarios traen su
// tabla de 30 días completa.
// Fuente: BKP/Challenges de calistenia — catálogo para la app.md

import {
  ChallengeDefinition,
  ChallengeDailyDay,
  ChallengeExerciseRef,
} from '../models/Challenge';

// ── Ejercicios (se resuelven por nombre contra la BD; si no hay, se crean) ──

const PUSH_UP: ChallengeExerciseRef = {
  names: ['Bodyweight Push Up', 'Push-up', 'Push Up', 'Bodyweight Push-Up'],
  create: {
    name: 'Bodyweight Push Up',
    description: 'Flexión de brazos con el cuerpo en bloque, pecho cerca del piso y codos a unos 45°.',
    primaryMuscle: 'Pectorales',
  },
};

const KNEE_PUSH_UP: ChallengeExerciseRef = {
  names: ['Bodyweight Kneeling Push Up', 'Knee Push-Up', 'Knee Push Up'],
  create: {
    name: 'Bodyweight Kneeling Push Up',
    description: 'Flexión con las rodillas apoyadas. Cadera alineada con hombros y rodillas.',
    primaryMuscle: 'Pectorales',
  },
};

const SIT_UP: ChallengeExerciseRef = {
  names: ['Bodyweight Sit Up', 'Sit-Up', 'Sit Up'],
  create: {
    name: 'Bodyweight Sit Up',
    description: 'Abdominal completo: desde acostado hasta sentado, pies apoyados en el piso.',
    primaryMuscle: 'Core/Abdominales',
  },
};

const CRUNCH: ChallengeExerciseRef = {
  names: ['Bodyweight Crunch', 'Crunch'],
  create: {
    name: 'Bodyweight Crunch',
    description: 'Crunch corto: despegar sólo los omóplatos del piso, manos en el pecho.',
    primaryMuscle: 'Core/Abdominales',
  },
};

const SQUAT: ChallengeExerciseRef = {
  names: ['Bodyweight Squat', 'Air Squat', 'Squat'],
  create: {
    name: 'Bodyweight Squat',
    description: 'Sentadilla sin peso: cadera por debajo de las rodillas, talones apoyados.',
    primaryMuscle: 'Cuádriceps',
  },
};

const SQUAT_TO_BENCH: ChallengeExerciseRef = {
  names: ['Bodyweight Squat to Bench', 'Box Squat'],
  create: {
    name: 'Bodyweight Squat to Bench',
    description: 'Sentadilla a una silla: tocar el asiento con la cola y volver a subir.',
    primaryMuscle: 'Cuádriceps',
  },
};

const BENCH_DIP: ChallengeExerciseRef = {
  names: ['Bodyweight Bench Dip', 'Bench Dip', 'Chair Dip'],
  create: {
    name: 'Bodyweight Bench Dip',
    description:
      'Fondos en silla: manos en el borde del asiento, bajar flexionando los codos hacia atrás hasta 90° y empujar.',
    primaryMuscle: 'Tríceps',
    imageUrl: '/img/exercises/bench-dip.svg',
  },
};

const LUNGE: ChallengeExerciseRef = {
  names: ['Bodyweight Alternating Forward Lunge', 'Bodyweight Forward Lunge', 'Bodyweight Walking Lunge', 'Walking Lunge'],
  create: {
    name: 'Bodyweight Alternating Forward Lunge',
    description: 'Zancada al frente alternando piernas: rodilla de atrás cerca del piso, torso erguido.',
    primaryMuscle: 'Cuádriceps',
  },
};

const SPLIT_SQUAT: ChallengeExerciseRef = {
  names: ['Bodyweight Split Squat'],
  create: {
    name: 'Bodyweight Split Squat',
    description: 'Zancada estática: pies fijos, bajar y subir en el lugar.',
    primaryMuscle: 'Cuádriceps',
  },
};

const BURPEE: ChallengeExerciseRef = {
  names: ['Bodyweight Burpee', 'Burpee'],
  create: {
    name: 'Bodyweight Burpee',
    description: 'Pecho al piso, volver a pararse y saltar con aplauso arriba.',
    primaryMuscle: 'Cuádriceps',
  },
};

const PLANK: ChallengeExerciseRef = {
  names: ['Bodyweight Forearm Plank', 'Plank Hold', 'Plank'],
  create: {
    name: 'Bodyweight Forearm Plank',
    description: 'Plancha sobre antebrazos: cuerpo en línea, abdomen y glúteos apretados.',
    primaryMuscle: 'Core/Abdominales',
  },
};

const KNEE_PLANK: ChallengeExerciseRef = {
  names: ['Bodyweight Kneeling Forearm Plank'],
  create: {
    name: 'Bodyweight Kneeling Forearm Plank',
    description: 'Plancha sobre antebrazos con las rodillas apoyadas.',
    primaryMuscle: 'Core/Abdominales',
  },
};

const BICYCLE: ChallengeExerciseRef = {
  names: ['Bodyweight Bicycle Crunch', 'Bicycle Crunch'],
  create: {
    name: 'Bodyweight Bicycle Crunch',
    description: 'Bicicleta: codo hacia la rodilla contraria alternando lados.',
    primaryMuscle: 'Core/Abdominales',
  },
};

const LEG_RAISE: ChallengeExerciseRef = {
  names: ['Bodyweight Supine Leg Raise', 'Lying Leg Raise', 'Leg Raise'],
  create: {
    name: 'Bodyweight Supine Leg Raise',
    description: 'Elevación de piernas acostado: subir las piernas extendidas sin despegar la zona lumbar.',
    primaryMuscle: 'Core/Abdominales',
  },
};

// ── Tablas de los challenges diarios ──

const REST: ChallengeDailyDay = { rest: true };

// Plancha de 5 minutos: segundos por serie, 30s de descanso entre series
const PLANK_DAYS: ChallengeDailyDay[] = [
  [20], [20], [30], [30], [40], null, [45], [45], [60], [60],
  [70], [80], null, [90], [50, 50], [55, 55], [60, 60], [65, 65], [70, 70], null,
  [75, 75], [83, 82], [90, 90], [65, 65, 65], [70, 70, 70], [75, 75, 75], null, [80, 80, 80], [90, 90, 90], [300],
].map((sets) => (sets ? { sets, restSeconds: 30 } : REST));

// 30 días de sentadillas: 45s de descanso en la primera mitad, 60s en la segunda
const x = (reps: number, times: number) => Array(times).fill(reps) as number[];
const SQUAT_DAYS: ChallengeDailyDay[] = [
  [5, 5, 5, 5], [7, 6, 6, 6], [9, 7, 7, 7], [11, 8, 8, 8], null,
  x(10, 4), [12, 11, 11, 11], [14, 12, 12, 12], [16, 13, 13, 13], null,
  x(15, 4), [19, 17, 17, 17], x(20, 4), [24, 22, 22, 22], null,
  x(25, 4), [29, 27, 27, 27], x(30, 4), x(26, 5), null,
  x(28, 5), x(30, 5), x(32, 5), x(36, 5), null,
  x(38, 5), x(40, 5), x(44, 5), x(48, 5), x(50, 5),
].map((sets, i) => (sets ? { sets, restSeconds: i < 15 ? 45 : 60 } : REST));

// 30 días de abdominales: circuito, igual todos los días de la semana
function absCircuit(
  rounds: number,
  crunch: number,
  bicycle: number,
  legRaise: number,
  plankSeconds: number,
  rest: number
): ChallengeDailyDay {
  return {
    circuit: {
      rounds,
      restBetweenExercises: rest,
      restBetweenRounds: 60,
      items: [
        { exercise: CRUNCH, reps: crunch },
        { exercise: BICYCLE, reps: bicycle * 2, note: `${bicycle} por lado` },
        { exercise: LEG_RAISE, reps: legRaise },
        { exercise: PLANK, seconds: plankSeconds },
      ],
    },
  };
}
const ACTIVE_REST: ChallengeDailyDay = { rest: true, restNote: 'Descanso activo: caminata de 20 minutos' };
const ABS_W1 = absCircuit(2, 12, 10, 8, 20, 45);
const ABS_W2 = absCircuit(3, 15, 12, 10, 30, 40);
const ABS_W3 = absCircuit(3, 20, 15, 12, 40, 35);
const ABS_W4 = absCircuit(4, 22, 18, 15, 50, 30);
const ABS_DAYS: ChallengeDailyDay[] = [
  ...Array(6).fill(ABS_W1), ACTIVE_REST,
  ...Array(6).fill(ABS_W2), ACTIVE_REST,
  ...Array(6).fill(ABS_W3), ACTIVE_REST,
  ...Array(6).fill(ABS_W4), ACTIVE_REST,
  ABS_W4,
  absCircuit(5, 25, 20, 18, 60, 30),
];

// ── Catálogo ──

export const BUILTIN_CHALLENGES: ChallengeDefinition[] = [
  {
    code: 'pushups-100',
    name: '100 flexiones',
    summary: '100 flexiones seguidas en 6 semanas',
    kind: 'meta_reps',
    color: '#ef4444',
    equipment: 'Ninguno',
    unit: 'reps',
    exercise: PUSH_UP,
    regression: { exercise: KNEE_PUSH_UP, hint: 'Con rodillas apoyadas o contra la mesada' },
    goal: 100,
    testRanges: { beginnerMax: 5, intermediateMax: 15 },
  },
  {
    code: 'situps-200',
    name: '200 abdominales',
    summary: '200 abdominales seguidos en 6 semanas',
    kind: 'meta_reps',
    color: '#f59e0b',
    equipment: 'Toalla o colchoneta',
    unit: 'reps',
    exercise: SIT_UP,
    regression: { exercise: CRUNCH, hint: 'Crunch corto, manos en el pecho, nunca en la nuca' },
    goal: 200,
    testRanges: { beginnerMax: 14, intermediateMax: 30 },
    notes: 'Si lo hacés junto con el de sentadillas, alterná los días.',
  },
  {
    code: 'squats-200',
    name: '200 sentadillas',
    summary: '200 sentadillas seguidas en 6 semanas',
    kind: 'meta_reps',
    color: '#22c55e',
    equipment: 'Ninguno',
    unit: 'reps',
    exercise: SQUAT,
    regression: { exercise: SQUAT_TO_BENCH, hint: 'Tocar la silla con la cola y subir' },
    goal: 200,
    testRanges: { beginnerMax: 19, intermediateMax: 40 },
  },
  {
    code: 'dips-150',
    name: '150 fondos en silla',
    summary: '150 fondos seguidos en 6 semanas',
    kind: 'meta_reps',
    color: '#8b5cf6',
    equipment: 'Silla firme',
    unit: 'reps',
    exercise: BENCH_DIP,
    regression: { hint: 'Rodillas flexionadas, poco recorrido' },
    goal: 150,
    testRanges: { beginnerMax: 7, intermediateMax: 15 },
  },
  {
    code: 'lunges-150',
    name: '150 zancadas',
    summary: '150 zancadas seguidas (75 por pierna) en 6 semanas',
    kind: 'meta_reps',
    color: '#06b6d4',
    equipment: 'Ninguno',
    unit: 'reps',
    exercise: LUNGE,
    regression: { exercise: SPLIT_SQUAT, hint: 'Zancada estática, mano en la pared' },
    goal: 150,
    testRanges: { beginnerMax: 15, intermediateMax: 34 },
    notes: 'El número es el total: 150 son 75 por pierna.',
  },
  {
    code: 'burpees-50',
    name: '50 burpees',
    summary: '50 burpees seguidos en 6 semanas',
    kind: 'meta_reps',
    color: '#ec4899',
    equipment: 'Ninguno',
    unit: 'reps',
    exercise: BURPEE,
    regression: { hint: 'Sin salto y con paso atrás' },
    goal: 50,
    testRanges: { beginnerMax: 4, intermediateMax: 10 },
    notes: 'Es el más duro porque suma cardio. Si cuesta, repetí semanas sin culpa.',
  },
  {
    code: 'plank-5min',
    name: 'Plancha de 5 minutos',
    summary: 'De 20 segundos a 5 minutos de plancha en 30 días',
    kind: 'daily',
    color: '#3b82f6',
    equipment: 'Colchoneta',
    unit: 'seconds',
    exercise: PLANK,
    regression: { exercise: KNEE_PLANK, hint: 'Con las rodillas apoyadas' },
    days: PLANK_DAYS,
    notes: 'Desde el día 15 el objetivo se parte en series con 30s de descanso. El día 30 es de corrido.',
  },
  {
    code: 'squats-30d',
    name: '30 días de sentadillas',
    summary: 'De 20 a 250 sentadillas por día en 30 días',
    kind: 'daily',
    color: '#84cc16',
    equipment: 'Ninguno',
    unit: 'reps',
    exercise: SQUAT,
    regression: { exercise: SQUAT_TO_BENCH, hint: 'Tocar la silla con la cola y subir' },
    days: SQUAT_DAYS,
  },
  {
    code: 'abs-30d',
    name: '30 días de abdominales',
    summary: 'Circuito de crunch, bicicleta, elevación de piernas y plancha',
    kind: 'daily',
    color: '#f97316',
    equipment: 'Colchoneta',
    unit: 'reps',
    exercise: CRUNCH,
    days: ABS_DAYS,
    notes: 'Entre vuelta y vuelta, 60s de descanso. Los días 7, 14, 21 y 28 son de descanso activo.',
  },
];

// ── Catálogo remoto (bajado del contenido publicado) ──

const SUPPORTED_KINDS: ChallengeDefinition['kind'][] = ['meta_reps', 'daily'];

let remoteChallenges: ChallengeDefinition[] = [];

// Descarta definiciones que esta versión de la app no sabe ejecutar
export function isSupportedChallenge(def: unknown): def is ChallengeDefinition {
  const d = def as ChallengeDefinition;
  if (!d || typeof d.code !== 'string' || typeof d.name !== 'string') return false;
  if (!SUPPORTED_KINDS.includes(d.kind) || !Array.isArray(d.exercise?.names)) return false;
  if (d.kind === 'meta_reps') return typeof d.goal === 'number' && !!d.testRanges;
  return Array.isArray(d.days) && d.days.length > 0;
}

export function setRemoteChallenges(defs: unknown[]): void {
  remoteChallenges = defs.filter(isSupportedChallenge);
}

// Catálogo completo: los del APK en su orden (reemplazados si llegó una versión remota)
// y después los remotos nuevos
export function getChallenges(): ChallengeDefinition[] {
  const remoteByCode = new Map(remoteChallenges.map((c) => [c.code, c]));
  const merged = BUILTIN_CHALLENGES.map((c) => remoteByCode.get(c.code) ?? c);
  const builtinCodes = new Set(BUILTIN_CHALLENGES.map((c) => c.code));
  return [...merged, ...remoteChallenges.filter((c) => !builtinCodes.has(c.code))];
}

export function getChallenge(code: string | undefined): ChallengeDefinition | undefined {
  return getChallenges().find((c) => c.code === code);
}

export const CHALLENGE_SAFETY_TEXT =
  'Técnica antes que número. Pará ante dolor articular (no muscular). Los días de descanso son parte del programa, no opcionales. Si tenés una lesión previa o estás volviendo a entrenar, consultá antes de arrancar.';
