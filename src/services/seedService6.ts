// WODs Feb–Mar 2026 (segundo batch) — datos adicionales aditivos
// Operación aditiva, asume Inicializar Datos ya corrido.

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateUUID } from '../utils/formatters';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ExerciseDef {
  name: string; description: string; difficulty: string;
  primaryMuscle: string | null; is_compound: number;
  equipment: string[]; sections: string[];
}
interface SectionExDef {
  exerciseName: string; sort_order: number;
  planned_repetitions?: number; planned_weight_value?: number; planned_weight_unit?: string;
  planned_distance_value?: number; planned_distance_unit?: string;
  planned_time_seconds?: number; planned_calories?: number;
  coach_notes?: string; notes?: string; suggested_scaling?: string;
}
interface SectionDef {
  sort_order: number; section_type: string; work_format: string;
  visible_title: string; general_description?: string; notes?: string;
  time_cap_seconds?: number; total_rounds?: number; exercises: SectionExDef[];
}
interface TemplateDef {
  name: string; objective: string; general_notes: string;
  estimated_duration_minutes: number; sections: SectionDef[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function findExercise(db: SQLiteDBConnection, name: string): Promise<string | null> {
  const norm = name.trim().toUpperCase();
  const r = await db.query('SELECT id FROM exercise WHERE UPPER(TRIM(name)) = ? AND is_active = 1', [norm]);
  return (r.values?.[0]?.id as string) ?? null;
}

async function getOrCreateExercise(
  db: SQLiteDBConnection, def: ExerciseDef,
  maps: { diff: Map<string,string>; muscle: Map<string,string>; equip: Map<string,string>; section: Map<string,string> }
): Promise<string> {
  const existing = await findExercise(db, def.name);
  if (existing) return existing;
  const id = generateUUID();
  const ts = new Date().toISOString().replace('T',' ').substring(0,19);
  await db.run(
    `INSERT INTO exercise (id,name,description,difficulty_level_id,primary_muscle_group_id,is_compound,is_active,created_at,updated_at)
     VALUES (?,?,?,?,?,?,1,?,?)`,
    [id, def.name, def.description,
     def.difficulty ? maps.diff.get(def.difficulty) ?? null : null,
     def.primaryMuscle ? maps.muscle.get(def.primaryMuscle) ?? null : null,
     def.is_compound, ts, ts]
  );
  for (const n of def.equipment) { const i = maps.equip.get(n); if (i) await db.run('INSERT INTO exercise_equipment (id,exercise_id,equipment_id,is_required) VALUES (?,?,?,1)',[generateUUID(),id,i]); }
  for (const n of def.sections)  { const i = maps.section.get(n); if (i) await db.run('INSERT INTO exercise_section_type (id,exercise_id,section_type_id) VALUES (?,?,?)',[generateUUID(),id,i]); }
  const ru = await db.query('SELECT id FROM measurement_unit WHERE name=?',['Repeticiones']).then(r=>(r.values?.[0]?.id as string)??null);
  if (ru) await db.run('INSERT INTO exercise_unit (id,exercise_id,measurement_unit_id,is_default) VALUES (?,?,?,1)',[generateUUID(),id,ru]);
  console.log(`[Seed6] Ejercicio creado: "${def.name}"`);
  return id;
}

async function createTemplate(
  db: SQLiteDBConnection, def: TemplateDef,
  maps: { diff: Map<string,string>; muscle: Map<string,string>; equip: Map<string,string>; section: Map<string,string>; sectionType: Map<string,string>; workFormat: Map<string,string>; unit: Map<string,string> }
): Promise<void> {
  const ex = await db.query('SELECT id FROM class_template WHERE name=?',[def.name]);
  if ((ex.values?.length ?? 0) > 0) { console.log(`[Seed6] "${def.name}" ya existe.`); return; }
  const ts = new Date().toISOString().replace('T',' ').substring(0,19);
  const tid = generateUUID();
  await db.run(
    `INSERT INTO class_template (id,name,objective,general_notes,estimated_duration_minutes,is_favorite,template_type,is_active,created_at,updated_at) VALUES (?,?,?,?,?,0,'generic',1,?,?)`,
    [tid,def.name,def.objective,def.general_notes,def.estimated_duration_minutes,ts,ts]
  );
  for (const sec of def.sections) {
    const sid = generateUUID();
    await db.run(
      `INSERT INTO class_section (id,class_template_id,section_type_id,work_format_id,sort_order,visible_title,general_description,time_cap_seconds,total_rounds,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [sid,tid, maps.sectionType.get(sec.section_type)??null, maps.workFormat.get(sec.work_format)??null,
       sec.sort_order, sec.visible_title, sec.general_description??null,
       sec.time_cap_seconds??null, sec.total_rounds??null, sec.notes??null, ts,ts]
    );
    for (const ex of sec.exercises) {
      const eid = await findExercise(db, ex.exerciseName);
      if (!eid) { console.warn(`[Seed6] No encontrado: "${ex.exerciseName}"`); continue; }
      await db.run(
        `INSERT INTO section_exercise (id,class_section_id,exercise_id,sort_order,planned_repetitions,planned_weight_value,planned_weight_unit_id,planned_distance_value,planned_distance_unit_id,planned_time_seconds,planned_calories,coach_notes,notes,suggested_scaling,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(),sid,eid,ex.sort_order,
         ex.planned_repetitions??null, ex.planned_weight_value??null,
         ex.planned_weight_unit ? maps.unit.get(ex.planned_weight_unit)??null : null,
         ex.planned_distance_value??null,
         ex.planned_distance_unit ? maps.unit.get(ex.planned_distance_unit)??null : null,
         ex.planned_time_seconds??null, ex.planned_calories??null,
         ex.coach_notes??null, ex.notes??null, ex.suggested_scaling??null, ts,ts]
      );
    }
  }
  console.log(`[Seed6] Plantilla "${def.name}" creada.`);
}

function wu(exercises: SectionExDef[]): SectionDef {
  return { sort_order:1, section_type:'Entrada en calor', work_format:'Por rondas', visible_title:'Calentamiento', total_rounds:2, exercises };
}

// ── Ejercicios nuevos ──────────────────────────────────────────────────────────

const EXERCISES: ExerciseDef[] = [
  { name:'Barbell Front Squat', description:'Sentadilla completa con barra en rack frontal. Exige torso vertical y movilidad de muñeca y tobillo.', difficulty:'Intermedio', primaryMuscle:'Cuádriceps', is_compound:1, equipment:['Barra olímpica'], sections:['Fuerza','WOD'] },
  { name:'Barbell Romanian Deadlift', description:'Peso muerto rumano: piernas casi extendidas, bisagra de cadera, barra cerca del cuerpo. Estira isquiotibiales.', difficulty:'Básico', primaryMuscle:'Isquiotibiales', is_compound:1, equipment:['Barra olímpica'], sections:['Fuerza','Accesorio'] },
  { name:'Barbell Strict Press', description:'Press de hombros estricto: barra desde rack frontal a extensión total overhead sin impulso de piernas.', difficulty:'Básico', primaryMuscle:'Deltoides', is_compound:1, equipment:['Barra olímpica'], sections:['Fuerza','WOD'] },
  { name:'Barbell Hang Muscle Clean and Press', description:'Muscle clean desde hang (sin re-flexión de rodillas) + press estricto overhead. Técnica de hombro y tirón.', difficulty:'Avanzado', primaryMuscle:'Trapecio', is_compound:1, equipment:['Barra olímpica'], sections:['Fuerza','WOD'] },
  { name:'Barbell Muscle Snatch', description:'Arranque muscular: tirón desde el suelo hasta overhead sin re-flexión de rodillas. Alta demanda de hombros y trapecio.', difficulty:'Avanzado', primaryMuscle:'Trapecio', is_compound:1, equipment:['Barra olímpica'], sections:['Fuerza','WOD'] },
  { name:'Barbell Hang Power Snatch', description:'Arranque de potencia desde posición de colgado (hang). Explosión de cadena posterior + recepción alta.', difficulty:'Avanzado', primaryMuscle:'Trapecio', is_compound:1, equipment:['Barra olímpica'], sections:['WOD','Fuerza'] },
  { name:'Barbell Hang Clean', description:'Cargada desde posición de colgado al rack frontal. Puede ser a squat clean o power clean según instrucción.', difficulty:'Intermedio', primaryMuscle:'Trapecio', is_compound:1, equipment:['Barra olímpica'], sections:['WOD','Fuerza'] },
  { name:'Barbell Hang Power Cluster', description:'Cluster desde hang: hang power clean directo a thruster en un solo movimiento continuo.', difficulty:'Avanzado', primaryMuscle:'Cuádriceps', is_compound:1, equipment:['Barra olímpica'], sections:['WOD'] },
  { name:'Barbell Bent Over Row', description:'Remo con barra inclinado al frente (45-90°). Bilateral, activa dorsales, romboides y bíceps.', difficulty:'Básico', primaryMuscle:'Dorsales', is_compound:1, equipment:['Barra olímpica'], sections:['Fuerza','Accesorio'] },
  { name:'Barbell Upright Row', description:'Tirón de barra desde cadera hasta barbilla con codos altos. Activa trapecio y deltoides.', difficulty:'Básico', primaryMuscle:'Trapecio', is_compound:1, equipment:['Barra olímpica'], sections:['Fuerza','Accesorio'] },
  { name:'Nordic Hamstring Curl', description:'Curl nórdico: pies fijos, bajar el torso en excéntrico controlado. Ejercicio preventivo de isquiotibiales.', difficulty:'Avanzado', primaryMuscle:'Isquiotibiales', is_compound:0, equipment:[], sections:['Accesorio'] },
  { name:'Shuttle Run', description:'Carrera de ida y vuelta entre dos puntos (típicamente 5–10 m). Alta aceleración y desaceleración.', difficulty:'Básico', primaryMuscle:'Cuádriceps', is_compound:1, equipment:[], sections:['WOD','Entrada en calor'] },
  { name:'Dumbbell Bench Press', description:'Press de pecho con mancuernas. Puede realizarse en banco o en el suelo (floor press).', difficulty:'Básico', primaryMuscle:'Pectorales', is_compound:1, equipment:['Mancuernas'], sections:['Fuerza'] },
  { name:'Dumbbell Alternating Bent Over Row', description:'Remo con mancuerna alternado inclinado. Activa dorsales y bíceps de forma unilateral.', difficulty:'Básico', primaryMuscle:'Dorsales', is_compound:1, equipment:['Mancuernas'], sections:['Fuerza','Accesorio'] },
  { name:'Dumbbell Bicep Curl', description:'Curl de bíceps con mancuernas. Aislamiento del bíceps braquial.', difficulty:'Básico', primaryMuscle:'Bíceps', is_compound:0, equipment:['Mancuernas'], sections:['Accesorio'] },
  { name:'Dumbbell Thruster', description:'Thruster con mancuernas: sentadilla completa + push press con DB. Variante más accesible que el barbell thruster.', difficulty:'Intermedio', primaryMuscle:'Cuádriceps', is_compound:1, equipment:['Mancuernas'], sections:['WOD','Fuerza'] },
  { name:'Dumbbell Devil\'s Press', description:'Burpee con dos mancuernas + snatch overhead de ambas a la vez al pararse. Movimiento total de alta intensidad.', difficulty:'Avanzado', primaryMuscle:'Deltoides', is_compound:1, equipment:['Mancuernas'], sections:['WOD'] },
  { name:'Dumbbell Front Rack Lunge', description:'Zancada alternada con mancuernas en posición de rack frontal. Exige estabilidad de core y hombros.', difficulty:'Intermedio', primaryMuscle:'Cuádriceps', is_compound:1, equipment:['Mancuernas'], sections:['WOD','Fuerza'] },
  { name:'Dumbbell One-Arm Overhead Lunge', description:'Zancada con un solo brazo extendido overhead sosteniendo una mancuerna. Estabilidad escapular y core.', difficulty:'Intermedio', primaryMuscle:'Cuádriceps', is_compound:1, equipment:['Mancuernas'], sections:['WOD'] },
  { name:'Hollow Rock', description:'Desde posición hollow body (brazos y piernas extendidos y elevados), balancear hacia adelante y atrás manteniendo la tensión.', difficulty:'Intermedio', primaryMuscle:'Core/Abdominales', is_compound:0, equipment:[], sections:['WOD','Accesorio'] },
  { name:'Kettlebell Clean and Jerk', description:'Cargada de kettlebell al rack de un brazo + envión overhead. Potencia total de un solo lado.', difficulty:'Intermedio', primaryMuscle:'Trapecio', is_compound:1, equipment:['Kettlebell'], sections:['WOD','Fuerza'] },
];

// ── Templates ──────────────────────────────────────────────────────────────────

const TEMPLATES: TemplateDef[] = [

  // 12 MAR — SIEGE PROTOCOL
  {
    name: 'WOD 12 Mar 2026 — Siege Protocol',
    objective: 'Strength superset + MetCon en equipo de 3',
    general_notes:
      'A) 4 Sets Every 3\'30" — Hang Muscle Clean & Press + Ring Dips + Strict Pull-Ups + Push-Ups\n' +
      'B) "SIEGE PROTOCOL" — Team of 3, For Time (cap 35 min)\n' +
      '   Relay de Rowing (turnos 250m) intercalado con ejercicios colectivos.\n' +
      '   ♂/♀ 9/6 kg Wall Ball · 22.5/15 kg DB Lunge',
    estimated_duration_minutes: 60,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'Intervalos', visible_title:'A) 4 Sets Every 3\'30"',
        notes:'4 sets · 3\'30" cada uno · sin descanso programado al final.',
        time_cap_seconds:840, total_rounds:4,
        exercises:[
          { exerciseName:'Barbell Hang Muscle Clean and Press', sort_order:1, planned_repetitions:6 },
          { exerciseName:'Ring Dip',    sort_order:2, planned_repetitions:10 },
          { exerciseName:'Bar Pull Up', sort_order:3, planned_repetitions:8, coach_notes:'Estricto, sin kipping' },
          { exerciseName:'Bodyweight Push Up', sort_order:4, planned_repetitions:12 },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'For Time', visible_title:'B) SIEGE PROTOCOL — Team of 3 (cap 35 min)',
        general_description:'Equipo de 3. Relay de remo en turnos de 250m. Ejercicios de bloque: dividir como el equipo prefiera.',
        notes:'♂ WB 9 kg | ♀ 6 kg · ♂ DB OH Lunge 22.5 kg | ♀ 15 kg\nC2B pueden dividirse libremente.',
        time_cap_seconds:2100,
        exercises:[
          { exerciseName:'Rowing',                         sort_order:1, planned_distance_value:1500, planned_distance_unit:'Metros', coach_notes:'Relay — turnos de 250m sprint. Total equipo: 1500m.' },
          { exerciseName:'Wall Ball Shot',                 sort_order:2, planned_repetitions:120, planned_weight_value:9, planned_weight_unit:'Kilogramos', suggested_scaling:'6 kg (♀)' },
          { exerciseName:'Rowing',                         sort_order:3, planned_distance_value:1500, planned_distance_unit:'Metros', coach_notes:'Relay 250m' },
          { exerciseName:'Chest-to-Bar Pull-Up',           sort_order:4, planned_repetitions:90, coach_notes:'Dividir como el equipo prefiera' },
          { exerciseName:'Rowing',                         sort_order:5, planned_distance_value:1500, planned_distance_unit:'Metros', coach_notes:'Relay 250m' },
          { exerciseName:'Dumbbell One-Arm Overhead Lunge',sort_order:6, planned_repetitions:60, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)', coach_notes:'Los 3 synchro — moverse a la vez' },
        ],
      },
    ],
  },

  // 11 MAR
  {
    name: 'WOD 11 Mar 2026',
    objective: 'EMOM Muscle Snatch + 6 Sets MetCon + Finisher Sit-Ups',
    general_notes:
      'A) EMOM 12 min — Muscle Snatches y Rope Climb alternados\n' +
      'B) 6 Sets For Time — T2B + Box Jumps + Hang Power Snatches (35/25 kg)\n' +
      'C) 100 Sit-Ups For Time',
    estimated_duration_minutes: 50,
    sections: [
      { sort_order:1, section_type:'Activación', work_format:'EMOM', visible_title:'A) EMOM 12 min',
        notes:'Impares: 5 Muscle Snatches @ RPE 6/10\nPares: 1 Rope Climb',
        time_cap_seconds:720,
        exercises:[
          { exerciseName:'Barbell Muscle Snatch', sort_order:1, planned_repetitions:5, coach_notes:'Minutos IMPARES — RPE 6/10' },
          { exerciseName:'Rope Climb',            sort_order:2, planned_repetitions:1, coach_notes:'Minutos PARES' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'Por rondas', visible_title:'B) 6 Sets For Time',
        notes:'♂ HPS: 35 kg | ♀ 25 kg · Box 60/50 cm',
        total_rounds:6,
        exercises:[
          { exerciseName:'Hanging Toes to Bar',   sort_order:1, planned_repetitions:9 },
          { exerciseName:'Box Jump',              sort_order:2, planned_repetitions:9, coach_notes:'60 cm (♂) / 50 cm (♀)' },
          { exerciseName:'Barbell Hang Power Snatch', sort_order:3, planned_repetitions:9, planned_weight_value:35, planned_weight_unit:'Kilogramos', suggested_scaling:'25 kg (♀)' },
        ],
      },
      { sort_order:3, section_type:'Accesorio', work_format:'For Time', visible_title:'C) 100 Sit-Ups For Time',
        notes:'Descansar cuando sea necesario. Registrar tiempo total.',
        exercises:[
          { exerciseName:'Bodyweight Sit Up', sort_order:1, planned_repetitions:100 },
        ],
      },
    ],
  },

  // 10 MAR — VOLTAGE SHIFT
  {
    name: 'WOD 10 Mar 2026 — Voltage Shift',
    objective: 'EMOM DU + Burpees + VOLTAGE SHIFT intervalos alternados',
    general_notes:
      'A) EMOM 12 min — Double Unders y Burpees alternados\n' +
      'B) "VOLTAGE SHIFT" — 2 min ON / 2 min OFF × 4 sets\n' +
      '   Sets impares: 200m Run + Max Hang Power Clusters (tiempo restante)\n' +
      '   Sets pares: 200m Row Sprint + Max Devil\'s Press (tiempo restante)',
    estimated_duration_minutes: 45,
    sections: [
      { sort_order:1, section_type:'Activación', work_format:'EMOM', visible_title:'A) EMOM 12 min — DU / Burpees',
        notes:'Impares: 50 Double Unders (scale: 100 Single Unders)\nPares: 10 Burpees',
        time_cap_seconds:720,
        exercises:[
          { exerciseName:'Double Under',    sort_order:1, planned_repetitions:50, coach_notes:'Minutos IMPARES (scale: 100 single unders)' },
          { exerciseName:'Bodyweight Burpee',sort_order:2, planned_repetitions:10, coach_notes:'Minutos PARES' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'Intervalos', visible_title:'B) VOLTAGE SHIFT — 2 ON / 2 OFF × 4',
        general_description:'4 sets alternando. Sets 1/3: Run + Clusters. Sets 2/4: Row + Devil\'s Press.',
        notes:
          'Sets IMPARES (1/3): 200m Run sprint → Max Hang Power Clusters con tiempo restante\n' +
          'Sets PARES (2/4): 200m Row sprint → Max Devil\'s Press con tiempo restante\n' +
          'Puntaje: total reps Clusters + Devil\'s Press',
        total_rounds:4,
        exercises:[
          { exerciseName:'Running',                   sort_order:1, planned_distance_value:200, planned_distance_unit:'Metros', coach_notes:'Sets IMPARES (1/3)' },
          { exerciseName:'Barbell Hang Power Cluster', sort_order:2, coach_notes:'Max reps en tiempo restante del set impar' },
          { exerciseName:'Rowing',                    sort_order:3, planned_distance_value:200, planned_distance_unit:'Metros', coach_notes:'Sets PARES (2/4)' },
          { exerciseName:'Dumbbell Devil\'s Press',   sort_order:4, coach_notes:'Max reps en tiempo restante del set par' },
        ],
      },
    ],
  },

  // 09 MAR — OPEN 26.2
  {
    name: 'WOD 09 Mar 2026 — Open 26.2',
    objective: 'Build Back Squats + Open 26.2 For Time',
    general_notes:
      'A) Every 90" For 9 min (6 sets) — 3 Back Squats @ 85-87%\n' +
      'B) Open 26.2 — For Time (cap 15 min)\n' +
      '   3 rondas: 80ft OH Lunge + 20 Alt DB Snatch + pull-up escalado\n' +
      '   ♂ 22.5 kg | ♀ 15 kg dumbbell',
    estimated_duration_minutes: 40,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'Intervalos', visible_title:'A) Every 90" × 6 — Back Squats',
        notes:'3 reps @ 85-87% 1RM. Construir si hay margen.',
        time_cap_seconds:540, total_rounds:6,
        exercises:[
          { exerciseName:'Barbell Back Squat', sort_order:1, planned_repetitions:3, coach_notes:'85-87% 1RM' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'For Time', visible_title:'B) Open 26.2 — For Time (cap 15 min)',
        notes:'♂ 22.5 kg | ♀ 15 kg\nRonda 1: Pull-Ups · Ronda 2: C2B · Ronda 3: Ring Muscle-Ups',
        time_cap_seconds:900,
        exercises:[
          { exerciseName:'Double Dumbbell Overhead Walking Lunge', sort_order:1, planned_distance_value:24, planned_distance_unit:'Metros', planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)', coach_notes:'Ronda 1 — 80 ft = 24 m' },
          { exerciseName:'Alternating Single Arm Dumbbell Power Snatch', sort_order:2, planned_repetitions:20, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)' },
          { exerciseName:'Bar Pull Up',                               sort_order:3, planned_repetitions:20, coach_notes:'Ronda 1' },
          { exerciseName:'Double Dumbbell Overhead Walking Lunge',    sort_order:4, planned_distance_value:24, planned_distance_unit:'Metros', planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)', coach_notes:'Ronda 2' },
          { exerciseName:'Alternating Single Arm Dumbbell Power Snatch', sort_order:5, planned_repetitions:20, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)' },
          { exerciseName:'Chest-to-Bar Pull-Up',                      sort_order:6, planned_repetitions:20, coach_notes:'Ronda 2' },
          { exerciseName:'Double Dumbbell Overhead Walking Lunge',    sort_order:7, planned_distance_value:24, planned_distance_unit:'Metros', planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)', coach_notes:'Ronda 3' },
          { exerciseName:'Alternating Single Arm Dumbbell Power Snatch', sort_order:8, planned_repetitions:20, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)' },
          { exerciseName:'Ring Strict Muscle Up',                     sort_order:9, planned_repetitions:20, coach_notes:'Ronda 3' },
        ],
      },
    ],
  },

  // 06 MAR — WHITTEN (Hero)
  {
    name: 'WOD 06 Mar 2026 — Whitten',
    objective: 'Hero WOD — 5 rondas de KB + Box + Run + Burpees',
    general_notes:
      'For Time (cap 40 min) — 5 Rondas\n' +
      'Whitten — En honor al Cpt Dan Whitten.\n' +
      '♂ KB 32 kg · Box 60 cm | ♀ KB 24 kg · Box 50 cm\n' +
      'Russian KB Swings (hasta hombros).',
    estimated_duration_minutes: 50,
    sections: [
      wu([
        { exerciseName:'Running',          sort_order:1, planned_distance_value:400, planned_distance_unit:'Metros' },
        { exerciseName:'Kettlebell Swing', sort_order:2, planned_repetitions:10 },
        { exerciseName:'Box Jump',         sort_order:3, planned_repetitions:5  },
        { exerciseName:'Bodyweight Burpee',sort_order:4, planned_repetitions:5  },
      ]),
      { sort_order:2, section_type:'WOD', work_format:'Por rondas', visible_title:'WOD — 5 Rondas For Time (cap 40 min)',
        notes:'♂ KB 32 kg · Box 60 cm | ♀ KB 24 kg · Box 50 cm',
        time_cap_seconds:2400, total_rounds:5,
        exercises:[
          { exerciseName:'Kettlebell Swing', sort_order:1, planned_repetitions:22, planned_weight_value:32, planned_weight_unit:'Kilogramos', suggested_scaling:'24 kg (♀)', coach_notes:'Russian swing (hasta hombros)' },
          { exerciseName:'Box Jump',         sort_order:2, planned_repetitions:22, coach_notes:'60 cm (♂) / 50 cm (♀)' },
          { exerciseName:'Running',          sort_order:3, planned_distance_value:400, planned_distance_unit:'Metros' },
          { exerciseName:'Bodyweight Burpee',sort_order:4, planned_repetitions:22 },
        ],
      },
    ],
  },

  // 04 MAR A — GROUND ASSAULT
  {
    name: 'WOD 04 Mar 2026 A — Ground Assault',
    objective: 'Front Squats + GROUND ASSAULT E2MOM + Nordic Curls',
    general_notes:
      'A) Every 2 min × 5 — 4 Front Squats @ 83-88% 1RM (2" pause)\n' +
      'B) "GROUND ASSAULT" — E2MOM 16 min (8 rondas)\n' +
      '   10/8 Cal + 12 KB C&J (32/24 kg) + 24 DU\n' +
      'C) Finisher: 3 Sets × 8 Nordic Hamstring Curls',
    estimated_duration_minutes: 55,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'Intervalos', visible_title:'A) Every 2 min × 5 — Front Squats',
        notes:'4 reps @ 83-88% · 2 segundos de pausa en el punto más bajo.',
        time_cap_seconds:600, total_rounds:5,
        exercises:[
          { exerciseName:'Barbell Front Squat', sort_order:1, planned_repetitions:4, coach_notes:'83-88% · 2" pausa abajo' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'E2MOM', visible_title:'B) GROUND ASSAULT — E2MOM 16 min (8 rondas)',
        notes:'♂ KB 32 kg · 10 Cal | ♀ KB 24 kg · 8 Cal',
        time_cap_seconds:960, total_rounds:8,
        exercises:[
          { exerciseName:'Assault Bike',            sort_order:1, planned_calories:10, coach_notes:'10 Cal (♂) / 8 Cal (♀) — o rower' },
          { exerciseName:'Kettlebell Clean and Jerk',sort_order:2, planned_repetitions:12, planned_weight_value:32, planned_weight_unit:'Kilogramos', suggested_scaling:'24 kg (♀)' },
          { exerciseName:'Double Under',            sort_order:3, planned_repetitions:24 },
        ],
      },
      { sort_order:3, section_type:'Accesorio', work_format:'Series fijas', visible_title:'C) Finisher — Nordic Hamstring Curls',
        total_rounds:3,
        exercises:[
          { exerciseName:'Nordic Hamstring Curl', sort_order:1, planned_repetitions:8 },
        ],
      },
    ],
  },

  // 04 MAR B — DARK PULSE
  {
    name: 'WOD 04 Mar 2026 B — Dark Pulse',
    objective: 'Muscle Pump superset + DARK PULSE AMRAP',
    general_notes:
      'A) "Muscle Pump Superset" — 4 Sets Every 3\'30"\n' +
      '   8 Bent Over Rows + 12 Push-Ups + 8 Upright Rows + 12 Ring Dips\n' +
      'B) "DARK PULSE" — AMRAP 16 min\n' +
      '   24 DB Front Rack Lunges + 7 MU (o 14 Pull-Ups) + 24 Hollow Rocks + 7 Devil\'s Press\n' +
      '   ♂ 22.5 kg | ♀ 15 kg',
    estimated_duration_minutes: 50,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'Intervalos', visible_title:'A) Muscle Pump — 4 Sets Every 3\'30"',
        time_cap_seconds:840, total_rounds:4,
        exercises:[
          { exerciseName:'Barbell Bent Over Row', sort_order:1, planned_repetitions:8  },
          { exerciseName:'Bodyweight Push Up',    sort_order:2, planned_repetitions:12 },
          { exerciseName:'Barbell Upright Row',   sort_order:3, planned_repetitions:8  },
          { exerciseName:'Ring Dip',              sort_order:4, planned_repetitions:12 },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'AMRAP', visible_title:'B) DARK PULSE — AMRAP 16 min',
        notes:'♂ 22.5 kg | ♀ 15 kg · Scale MU → 14 Pull-Ups',
        time_cap_seconds:960,
        exercises:[
          { exerciseName:'Dumbbell Front Rack Lunge',sort_order:1, planned_repetitions:24, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)', coach_notes:'Alternando (12 por pierna)' },
          { exerciseName:'Ring Strict Muscle Up',    sort_order:2, planned_repetitions:7, suggested_scaling:'14 Pull-Ups' },
          { exerciseName:'Hollow Rock',              sort_order:3, planned_repetitions:24 },
          { exerciseName:'Dumbbell Devil\'s Press',  sort_order:4, planned_repetitions:7, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)' },
        ],
      },
    ],
  },

  // 03 MAR
  {
    name: 'WOD 03 Mar 2026',
    objective: 'EMOM Olympic Complex + 5 Rondas MetCon',
    general_notes:
      'A) EMOM 12 min — Impares: 1 Power Clean + 1 Hang Squat Clean · Pares: 1 Rope Climb\n' +
      'B) 5 Rondas For Time — 100m Run + 6 Hang Clean + 12 T2B + 6 Burpees + 12 Sit-Ups\n' +
      '   ♂ Hang Clean 60 kg | ♀ 40 kg',
    estimated_duration_minutes: 50,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'EMOM', visible_title:'A) EMOM 12 min — Clean Complex / Rope Climb',
        notes:'Impares: 1 Power Clean + 1 Hang Squat Clean (construir)\nPares: 1 Rope Climb',
        time_cap_seconds:720,
        exercises:[
          { exerciseName:'Barbell Power Clean',  sort_order:1, planned_repetitions:1, coach_notes:'Minutos IMPARES' },
          { exerciseName:'Barbell Squat Clean',  sort_order:2, planned_repetitions:1, coach_notes:'Desde hang — mismo set que el Power Clean' },
          { exerciseName:'Rope Climb',           sort_order:3, planned_repetitions:1, coach_notes:'Minutos PARES' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'Por rondas', visible_title:'B) 5 Rondas For Time',
        notes:'♂ 60 kg | ♀ 40 kg Hang Clean',
        total_rounds:5,
        exercises:[
          { exerciseName:'Running',              sort_order:1, planned_distance_value:100, planned_distance_unit:'Metros' },
          { exerciseName:'Barbell Hang Clean',   sort_order:2, planned_repetitions:6, planned_weight_value:60, planned_weight_unit:'Kilogramos', suggested_scaling:'40 kg (♀)' },
          { exerciseName:'Hanging Toes to Bar',  sort_order:3, planned_repetitions:12 },
          { exerciseName:'Bodyweight Burpee',    sort_order:4, planned_repetitions:6  },
          { exerciseName:'Bodyweight Sit Up',    sort_order:5, planned_repetitions:12 },
        ],
      },
    ],
  },

  // 27 FEB — HOLLEYMAN (Hero)
  {
    name: 'WOD 27 Feb 2026 — Holleyman',
    objective: 'Hero WOD — 30 rondas de 5 WB + 3 HSPU + 1 Power Clean',
    general_notes:
      'For Time (cap 35 min) — 30 Rondas\n' +
      'En honor al SSgt Aaron Holleyman.\n' +
      '♂ WB 9 kg (objetivo 4.6 m) · Power Clean 102 kg\n' +
      '♀ WB 6 kg · Power Clean 70 kg',
    estimated_duration_minutes: 45,
    sections: [
      wu([
        { exerciseName:'Wall Ball Shot',         sort_order:1, planned_repetitions:10 },
        { exerciseName:'Bodyweight Handstand Push-Up', sort_order:2, planned_repetitions:3, coach_notes:'O piked push-up' },
        { exerciseName:'Barbell Power Clean',    sort_order:3, planned_repetitions:3, coach_notes:'Peso de trabajo' },
      ]),
      { sort_order:2, section_type:'WOD', work_format:'Por rondas', visible_title:'WOD — For Time, 30 Rondas (cap 35 min)',
        notes:'♂ WB 9 kg / 4.6 m · PC 102 kg | ♀ WB 6 kg · PC 70 kg',
        time_cap_seconds:2100, total_rounds:30,
        exercises:[
          { exerciseName:'Wall Ball Shot',              sort_order:1, planned_repetitions:5, planned_weight_value:9, planned_weight_unit:'Kilogramos', suggested_scaling:'6 kg (♀)', coach_notes:'Objetivo: 4.6 m' },
          { exerciseName:'Bodyweight Handstand Push-Up',sort_order:2, planned_repetitions:3 },
          { exerciseName:'Barbell Power Clean',         sort_order:3, planned_repetitions:1, planned_weight_value:102, planned_weight_unit:'Kilogramos', suggested_scaling:'70 kg (♀)' },
        ],
      },
    ],
  },

  // 26 FEB
  {
    name: 'WOD 26 Feb 2026',
    objective: 'Romanian DL + Acumular 240 calorías en parejas',
    general_notes:
      'A) Every 2 min × 5 — 6 Romanian Deadlifts @ 68-75%\n' +
      'B) Acumular 240 Calorías en parejas\n' +
      '   Atleta A: Max Calorías en 90" (Rower)\n' +
      '   Atleta B: AMRAP: 10 KB Swings Americanos (32/24 kg) + 20 Double Unders\n' +
      '   Rotar al terminar los 90 segundos de A.',
    estimated_duration_minutes: 45,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'Intervalos', visible_title:'A) Every 2 min × 5 — Romanian Deadlift',
        notes:'6 reps @ 68-75% del 1RM en Deadlift.',
        time_cap_seconds:600, total_rounds:5,
        exercises:[
          { exerciseName:'Barbell Romanian Deadlift', sort_order:1, planned_repetitions:6, coach_notes:'68-75% 1RM Deadlift' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'Trabajo libre', visible_title:'B) 240 Calorías en parejas',
        general_description:'Acumular 240 Cal totales. Atleta A rema 90" max Cal. Atleta B hace KB + DU mientras tanto. Rotar.',
        notes:'♂ KB 32 kg | ♀ 24 kg (American swing — overhead)\nEl equipo acumula hasta 240 Cal de remo total.',
        exercises:[
          { exerciseName:'Rowing',          sort_order:1, planned_calories:240, coach_notes:'Atleta A: max calorías en 90" (rotar con B)' },
          { exerciseName:'Kettlebell Swing',sort_order:2, planned_repetitions:10, planned_weight_value:32, planned_weight_unit:'Kilogramos', suggested_scaling:'24 kg (♀)', coach_notes:'Atleta B: American swing (overhead)' },
          { exerciseName:'Double Under',    sort_order:3, planned_repetitions:20, coach_notes:'Atleta B: AMRAP alternando con KB Swings' },
        ],
      },
    ],
  },

  // 25 FEB — SUPERNOVA
  {
    name: 'WOD 25 Feb 2026 — Supernova',
    objective: 'E2MOM Strict Press + SUPERNOVA 5 rondas',
    general_notes:
      'A) Every 2 min × 6 — 5 Strict Press + 10 Upright Row + 15 Alt Lunges\n' +
      'B) "SUPERNOVA" — 5 Rondas For Time\n' +
      '   200m Run + 12 C2B + 9 DB Thrusters (2×22.5/15 kg)',
    estimated_duration_minutes: 50,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'E2MOM', visible_title:'A) E2MOM 12 min — Strict Press / Upright Row / Lunges',
        time_cap_seconds:720, total_rounds:6,
        exercises:[
          { exerciseName:'Barbell Strict Press',          sort_order:1, planned_repetitions:5  },
          { exerciseName:'Barbell Upright Row',           sort_order:2, planned_repetitions:10 },
          { exerciseName:'Bodyweight Walking Lunge',      sort_order:3, planned_repetitions:15, coach_notes:'Alternando' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'Por rondas', visible_title:'B) SUPERNOVA — 5 Rondas For Time',
        notes:'♂ DB Thruster 2×22.5 kg | ♀ 2×15 kg',
        total_rounds:5,
        exercises:[
          { exerciseName:'Running',            sort_order:1, planned_distance_value:200, planned_distance_unit:'Metros' },
          { exerciseName:'Chest-to-Bar Pull-Up',sort_order:2, planned_repetitions:12 },
          { exerciseName:'Dumbbell Thruster',   sort_order:3, planned_repetitions:9, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)' },
        ],
      },
    ],
  },

  // 24 FEB — COLD FUSION
  {
    name: 'WOD 24 Feb 2026 — Cold Fusion',
    objective: 'Front Squats + COLD FUSION AMRAP + Nordic Curls',
    general_notes:
      'A) Every 2.5 min × 5 — 4 Front Squats @ 82-88%\n' +
      'B) "COLD FUSION" — AMRAP 15 min: Box Jump Overs + T2B + Cal\n' +
      'C) Hamstring Finisher: 3×8 Nordic Curls\n' +
      '   Box 60/50 cm · 15/12 Cal (Rower o Bike)',
    estimated_duration_minutes: 55,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'Intervalos', visible_title:'A) Every 2.5 min × 5 — Front Squats',
        notes:'4 reps @ 82-88% 1RM.',
        time_cap_seconds:750, total_rounds:5,
        exercises:[
          { exerciseName:'Barbell Front Squat', sort_order:1, planned_repetitions:4, coach_notes:'82-88% 1RM' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'AMRAP', visible_title:'B) COLD FUSION — AMRAP 15 min',
        notes:'Box 60 cm (♂) / 50 cm (♀) · 15 Cal (♂) / 12 Cal (♀) en Rower o Bike',
        time_cap_seconds:900,
        exercises:[
          { exerciseName:'Box Jump-Over',       sort_order:1, planned_repetitions:12, coach_notes:'60 cm (♂) / 50 cm (♀)' },
          { exerciseName:'Hanging Toes to Bar', sort_order:2, planned_repetitions:15 },
          { exerciseName:'Rowing',              sort_order:3, planned_calories:15, coach_notes:'15 Cal (♂) / 12 Cal (♀) — o Assault Bike' },
        ],
      },
      { sort_order:3, section_type:'Accesorio', work_format:'Series fijas', visible_title:'C) Hamstring Finisher — 3×8 Nordic Curls',
        total_rounds:3,
        exercises:[
          { exerciseName:'Nordic Hamstring Curl', sort_order:1, planned_repetitions:8 },
        ],
      },
    ],
  },

  // 20 FEB — THE SEVEN (Hero)
  {
    name: 'WOD 20 Feb 2026 — The Seven',
    objective: 'Hero WOD — 7 Rondas × 7 movimientos × 7 reps',
    general_notes:
      'For Time (cap 35 min) — 7 Rondas\n' +
      '"The Seven" — En honor a 7 operativos del SEAL Team caídos.\n' +
      '♂ Thruster 61 kg · DL 111 kg · KB 32 kg\n' +
      '♀ Thruster 43 kg · DL 75 kg · KB 24 kg',
    estimated_duration_minutes: 45,
    sections: [
      wu([
        { exerciseName:'Bodyweight Handstand Push-Up', sort_order:1, planned_repetitions:3 },
        { exerciseName:'Barbell Thruster',            sort_order:2, planned_repetitions:5, coach_notes:'Peso de trabajo' },
        { exerciseName:'Hanging Knees to Elbows',     sort_order:3, planned_repetitions:7 },
      ]),
      { sort_order:2, section_type:'WOD', work_format:'Por rondas', visible_title:'WOD — For Time, 7 Rondas (cap 35 min)',
        notes:'♂ Thruster 61 kg · DL 111 kg · KB 32 kg | ♀ Thruster 43 kg · DL 75 kg · KB 24 kg',
        time_cap_seconds:2100, total_rounds:7,
        exercises:[
          { exerciseName:'Bodyweight Handstand Push-Up', sort_order:1, planned_repetitions:7 },
          { exerciseName:'Barbell Thruster',            sort_order:2, planned_repetitions:7, planned_weight_value:61, planned_weight_unit:'Kilogramos', suggested_scaling:'43 kg (♀)' },
          { exerciseName:'Hanging Knees to Elbows',     sort_order:3, planned_repetitions:7 },
          { exerciseName:'Barbell Deadlift',            sort_order:4, planned_repetitions:7, planned_weight_value:111, planned_weight_unit:'Kilogramos', suggested_scaling:'75 kg (♀)' },
          { exerciseName:'Bodyweight Burpee',           sort_order:5, planned_repetitions:7 },
          { exerciseName:'Kettlebell Swing',            sort_order:6, planned_repetitions:7, planned_weight_value:32, planned_weight_unit:'Kilogramos', suggested_scaling:'24 kg (♀)' },
          { exerciseName:'Bar Pull Up',                 sort_order:7, planned_repetitions:7 },
        ],
      },
    ],
  },

  // 19 FEB — LEGS & LUNGS
  {
    name: 'WOD 19 Feb 2026 — Legs & Lungs',
    objective: 'Clean Complex Every 90" + LEGS & LUNGS E2MOM',
    general_notes:
      'A) Every 90" × 8 — 1 Clean + 2 Push Press + 3 Jerks (mismo peso, RPE 8-9)\n' +
      'B) "LEGS & LUNGS" — E2MOM 14 min (7 rondas)\n' +
      '   12/10 Cal Bike + 10 T2B + 10 DB Lunges (2×22.5/15 kg)',
    estimated_duration_minutes: 45,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'Intervalos', visible_title:'A) Every 90" × 8 — Clean + Push Press + Jerk',
        notes:'Mismo barbell · mismo peso todo el bloque · RPE 8-9',
        time_cap_seconds:720, total_rounds:8,
        exercises:[
          { exerciseName:'Barbell Power Clean', sort_order:1, planned_repetitions:1, coach_notes:'RPE 8-9 · mismo peso 8 sets' },
          { exerciseName:'Barbell Push Press',  sort_order:2, planned_repetitions:2 },
          { exerciseName:'Barbell Push Jerk',   sort_order:3, planned_repetitions:3 },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'E2MOM', visible_title:'B) LEGS & LUNGS — E2MOM 14 min (7 rondas)',
        notes:'♂ 12 Cal · 22.5 kg DB | ♀ 10 Cal · 15 kg DB',
        time_cap_seconds:840, total_rounds:7,
        exercises:[
          { exerciseName:'Assault Bike',          sort_order:1, planned_calories:12, coach_notes:'12 Cal (♂) / 10 Cal (♀)' },
          { exerciseName:'Hanging Toes to Bar',   sort_order:2, planned_repetitions:10 },
          { exerciseName:'Dumbbell Front Rack Lunge',sort_order:3, planned_repetitions:10, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)', coach_notes:'Doble mancuerna en rack frontal · 5 por pierna' },
        ],
      },
    ],
  },

  // 18 FEB — ROW & SNATCH
  {
    name: 'WOD 18 Feb 2026 — Row & Snatch',
    objective: 'DB Bench Press + ROW & SNATCH 4 rondas',
    general_notes:
      'A) Every 2 min × 5 — 12 DB Bench Press (floor) + 10 Ring Rows (pies elevados)\n' +
      'B) "ROW & SNATCH" — 4 Rondas For Time\n' +
      '   30 Cal Row + 20 Wall Balls (9/6 kg) + 10 Hang Snatches (40/30 kg)',
    estimated_duration_minutes: 50,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'E2MOM', visible_title:'A) Every 2 min × 5 — DB Bench + Ring Row',
        time_cap_seconds:600, total_rounds:5,
        exercises:[
          { exerciseName:'Dumbbell Bench Press', sort_order:1, planned_repetitions:12, coach_notes:'Desde el suelo (floor press)' },
          { exerciseName:'Ring Row',             sort_order:2, planned_repetitions:10, coach_notes:'Pies elevados en caja' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'Por rondas', visible_title:'B) ROW & SNATCH — 4 Rondas For Time',
        notes:'♂ WB 9 kg · HPS 40 kg | ♀ WB 6 kg · HPS 30 kg',
        total_rounds:4,
        exercises:[
          { exerciseName:'Rowing',                   sort_order:1, planned_calories:30, coach_notes:'30 Cal' },
          { exerciseName:'Wall Ball Shot',            sort_order:2, planned_repetitions:20, planned_weight_value:9, planned_weight_unit:'Kilogramos', suggested_scaling:'6 kg (♀)' },
          { exerciseName:'Barbell Hang Power Snatch', sort_order:3, planned_repetitions:10, planned_weight_value:40, planned_weight_unit:'Kilogramos', suggested_scaling:'30 kg (♀)' },
        ],
      },
    ],
  },

  // 17 FEB — SHOULDER CRUSHER
  {
    name: 'WOD 17 Feb 2026 — Shoulder Crusher',
    objective: 'Back Squats + SHOULDER CRUSHER AMRAP',
    general_notes:
      'A) Every 2 min × 6 — 5 Back Squats @ 80-85%\n' +
      'B) "SHOULDER CRUSHER" — AMRAP 12 min\n' +
      '   10 Strict HSPU + 15 Deadlifts (70/45 kg) + 20 DU',
    estimated_duration_minutes: 45,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'E2MOM', visible_title:'A) Every 2 min × 6 — Back Squats',
        notes:'5 reps @ 80-85% 1RM.',
        time_cap_seconds:720, total_rounds:6,
        exercises:[
          { exerciseName:'Barbell Back Squat', sort_order:1, planned_repetitions:5, coach_notes:'80-85% 1RM' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'AMRAP', visible_title:'B) SHOULDER CRUSHER — AMRAP 12 min',
        notes:'♂ DL 70 kg | ♀ 45 kg · HSPU Strict',
        time_cap_seconds:720,
        exercises:[
          { exerciseName:'Bodyweight Handstand Push-Up', sort_order:1, planned_repetitions:10, coach_notes:'Strict (sin kipping)' },
          { exerciseName:'Barbell Deadlift',            sort_order:2, planned_repetitions:15, planned_weight_value:70, planned_weight_unit:'Kilogramos', suggested_scaling:'45 kg (♀)' },
          { exerciseName:'Double Under',               sort_order:3, planned_repetitions:20 },
        ],
      },
    ],
  },

  // 16 FEB — FRAN'S REVENGE
  {
    name: "WOD 16 Feb 2026 — Fran's Revenge",
    objective: "Olympic Complex + FRAN'S REVENGE + Core finisher",
    general_notes:
      "A) Every 2 min × 6 — 1 Power Clean + 1 Squat Clean + 1 Hang Squat Clean\n" +
      "B) \"FRAN'S REVENGE\" — For Time (cap 16 min)\n" +
      "   21-15-9: Thrusters (50/35 kg) + C2B Pull-Ups + 400m Run después de cada set\n" +
      "C) Core Finisher: 3 Sets × 15 GHD Sit-Ups + 15 DB Bicep Curls",
    estimated_duration_minutes: 55,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'E2MOM', visible_title:'A) Every 2 min × 6 — Olympic Complex',
        notes:'1 Power Clean + 1 Squat Clean + 1 Hang Squat Clean · Construir peso progresivamente.',
        time_cap_seconds:720, total_rounds:6,
        exercises:[
          { exerciseName:'Barbell Power Clean', sort_order:1, planned_repetitions:1 },
          { exerciseName:'Barbell Squat Clean', sort_order:2, planned_repetitions:1 },
          { exerciseName:'Barbell Hang Clean',  sort_order:3, planned_repetitions:1, coach_notes:'Desde hang a squat clean' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'For Time', visible_title:"B) FRAN'S REVENGE — For Time (cap 16 min)",
        notes:'♂ Thruster 50 kg | ♀ 35 kg · 400m Run después de cada set de 21, 15 y 9',
        time_cap_seconds:960,
        exercises:[
          { exerciseName:'Barbell Thruster',    sort_order:1, planned_repetitions:21, planned_weight_value:50, planned_weight_unit:'Kilogramos', suggested_scaling:'35 kg (♀)' },
          { exerciseName:'Chest-to-Bar Pull-Up',sort_order:2, planned_repetitions:21 },
          { exerciseName:'Running',             sort_order:3, planned_distance_value:400, planned_distance_unit:'Metros' },
          { exerciseName:'Barbell Thruster',    sort_order:4, planned_repetitions:15, planned_weight_value:50, planned_weight_unit:'Kilogramos', suggested_scaling:'35 kg (♀)' },
          { exerciseName:'Chest-to-Bar Pull-Up',sort_order:5, planned_repetitions:15 },
          { exerciseName:'Running',             sort_order:6, planned_distance_value:400, planned_distance_unit:'Metros' },
          { exerciseName:'Barbell Thruster',    sort_order:7, planned_repetitions:9, planned_weight_value:50, planned_weight_unit:'Kilogramos', suggested_scaling:'35 kg (♀)' },
          { exerciseName:'Chest-to-Bar Pull-Up',sort_order:8, planned_repetitions:9 },
          { exerciseName:'Running',             sort_order:9, planned_distance_value:400, planned_distance_unit:'Metros' },
        ],
      },
      { sort_order:3, section_type:'Accesorio', work_format:'Series fijas', visible_title:'C) Core Finisher — 3 Sets',
        total_rounds:3,
        exercises:[
          { exerciseName:'GHD Sit-Up',        sort_order:1, planned_repetitions:15 },
          { exerciseName:'Dumbbell Bicep Curl',sort_order:2, planned_repetitions:15, coach_notes:'Peso pesado' },
        ],
      },
    ],
  },

  // 12 FEB
  {
    name: 'WOD 12 Feb 2026',
    objective: 'Back Squats tempo + Intervalos Row + Shuttle Run + Max HPS',
    general_notes:
      'A) Every 2 min × 6 — 5 Back Squats @ 75% (2" eccentric / 2" pausa)\n' +
      'B) Every 2\'30" × 6 — 12/10 Cal Row + 10 Shuttle Runs (5m) + Max Hang Power Snatches\n' +
      '   ♂ HPS 40 kg | ♀ 25 kg · Puntaje: total HPS',
    estimated_duration_minutes: 50,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'E2MOM', visible_title:'A) Every 2 min × 6 — Back Squats Tempo',
        notes:'5 reps @ 75% · Tempo: 2" bajada / 2" pausa abajo / subir explosivo.',
        time_cap_seconds:720, total_rounds:6,
        exercises:[
          { exerciseName:'Barbell Back Squat', sort_order:1, planned_repetitions:5, coach_notes:'75% · 2" eccentric + 2" pausa en el bottom' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'Intervalos', visible_title:"B) Every 2'30\" × 6 — Row + Shuttle + Max HPS",
        notes:'♂ 12 Cal Row · HPS 40 kg | ♀ 10 Cal · 25 kg\nPuntaje: total reps HPS en todos los sets.',
        total_rounds:6,
        exercises:[
          { exerciseName:'Rowing',                   sort_order:1, planned_calories:12, coach_notes:'12 Cal (♂) / 10 Cal (♀)' },
          { exerciseName:'Shuttle Run',              sort_order:2, planned_repetitions:10, coach_notes:'10 × 5 metros (ida y vuelta)' },
          { exerciseName:'Barbell Hang Power Snatch', sort_order:3, planned_weight_value:40, planned_weight_unit:'Kilogramos', suggested_scaling:'25 kg (♀)', coach_notes:'Max reps en tiempo restante' },
        ],
      },
    ],
  },

  // 11 FEB
  {
    name: 'WOD 11 Feb 2026',
    objective: 'Strict Press + DB Row + 5 Rondas Run / Hang Clean / HSPU',
    general_notes:
      'A) Every 2 min × 5 — 6 Strict Press (RPE 8) + 12 DB Alternating Bent Over Row\n' +
      'B) 5 Rondas For Time — 400m Run + 15 Hang Cleans + 12 Strict HSPU\n' +
      '   ♂ Hang Clean peso moderado | ♀ escalar según nivel',
    estimated_duration_minutes: 50,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'E2MOM', visible_title:'A) Every 2 min × 5 — Strict Press + DB Row',
        notes:'Strict Press: RPE 8. DB Row: alternando, control excéntrico.',
        time_cap_seconds:600, total_rounds:5,
        exercises:[
          { exerciseName:'Barbell Strict Press',           sort_order:1, planned_repetitions:6, coach_notes:'RPE 8' },
          { exerciseName:'Dumbbell Alternating Bent Over Row', sort_order:2, planned_repetitions:12, coach_notes:'6 por lado' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'Por rondas', visible_title:'B) 5 Rondas For Time',
        total_rounds:5,
        exercises:[
          { exerciseName:'Running',                      sort_order:1, planned_distance_value:400, planned_distance_unit:'Metros' },
          { exerciseName:'Barbell Hang Clean',           sort_order:2, planned_repetitions:15, coach_notes:'Peso moderado sostenible' },
          { exerciseName:'Bodyweight Handstand Push-Up', sort_order:3, planned_repetitions:12, coach_notes:'Strict' },
        ],
      },
    ],
  },

  // 10 FEB
  {
    name: 'WOD 10 Feb 2026',
    objective: 'Front Squats + AMRAP escalera ascendente',
    general_notes:
      'A) Every 90" × 8 — 3 Front Squats @ 80% 1RM\n' +
      'B) AMRAP 15 min — Escalera ascendente\n' +
      '   2-4-6-8-10… DB Snatches (22.5/15 kg)\n' +
      '   3-6-9-12-15… Burpees Over Box (60/50 cm)\n' +
      '   1-2-3-4-5… Chest-to-Bar Pull-Ups',
    estimated_duration_minutes: 40,
    sections: [
      { sort_order:1, section_type:'Fuerza', work_format:'Intervalos', visible_title:'A) Every 90" × 8 — Front Squats',
        notes:'3 reps @ 80% 1RM.',
        time_cap_seconds:720, total_rounds:8,
        exercises:[
          { exerciseName:'Barbell Front Squat', sort_order:1, planned_repetitions:3, coach_notes:'80% 1RM' },
        ],
      },
      { sort_order:2, section_type:'WOD', work_format:'AMRAP', visible_title:'B) AMRAP 15 min — Escalera ascendente',
        general_description:'Escalera ascendente: cada ronda suma 2 DB Snatches, 3 Burpees Over Box, 1 C2B. Contar hasta donde llegues.',
        notes:
          '♂ DB Snatch 22.5 kg | ♀ 15 kg · Box 60/50 cm\n' +
          'Ronda 1: 2 DBS + 3 BOB + 1 C2B\n' +
          'Ronda 2: 4 DBS + 6 BOB + 2 C2B\n' +
          'Ronda 3: 6 DBS + 9 BOB + 3 C2B… (continuar hasta el tiempo)',
        time_cap_seconds:900,
        exercises:[
          { exerciseName:'Alternating Single Arm Dumbbell Power Snatch', sort_order:1, planned_repetitions:2, planned_weight_value:22.5, planned_weight_unit:'Kilogramos', suggested_scaling:'15 kg (♀)', coach_notes:'+2 reps cada ronda' },
          { exerciseName:'Box Jump-Over',         sort_order:2, planned_repetitions:3, coach_notes:'60 cm (♂) / 50 cm (♀) · +3 reps c/ronda' },
          { exerciseName:'Chest-to-Bar Pull-Up',  sort_order:3, planned_repetitions:1, coach_notes:'+1 rep cada ronda' },
        ],
      },
    ],
  },

];

// ── Punto de entrada ──────────────────────────────────────────────────────────

export async function addDailyWodsFebMar2026(db: SQLiteDBConnection): Promise<void> {
  console.log('[Seed6] Iniciando WODs Feb–Mar 2026...');

  const check = await db.query('SELECT COUNT(*) as count FROM section_type');
  if ((check.values?.[0]?.count ?? 0) === 0) {
    throw new Error('Los catálogos no están inicializados. Ejecutá "Inicializar Datos" primero.');
  }

  const [diffRows, muscleRows, equipRows, sectionRows, sectionTypeRows, workFmtRows, unitRows] =
    await Promise.all([
      db.query('SELECT id, name FROM difficulty_level'),
      db.query('SELECT id, name FROM muscle_group'),
      db.query('SELECT id, name FROM equipment'),
      db.query('SELECT id, name FROM section_type'),
      db.query('SELECT id, name FROM section_type'),
      db.query('SELECT id, name FROM work_format'),
      db.query('SELECT id, name FROM measurement_unit'),
    ]);

  const maps = {
    diff:        new Map((diffRows.values       ?? []).map((r: any) => [r.name, r.id] as [string,string])),
    muscle:      new Map((muscleRows.values      ?? []).map((r: any) => [r.name, r.id] as [string,string])),
    equip:       new Map((equipRows.values       ?? []).map((r: any) => [r.name, r.id] as [string,string])),
    section:     new Map((sectionRows.values     ?? []).map((r: any) => [r.name, r.id] as [string,string])),
    sectionType: new Map((sectionTypeRows.values ?? []).map((r: any) => [r.name, r.id] as [string,string])),
    workFormat:  new Map((workFmtRows.values     ?? []).map((r: any) => [r.name, r.id] as [string,string])),
    unit:        new Map((unitRows.values        ?? []).map((r: any) => [r.name, r.id] as [string,string])),
  };

  console.log('[Seed6] Verificando ejercicios...');
  for (const def of EXERCISES) {
    await getOrCreateExercise(db, def, maps);
  }

  console.log('[Seed6] Creando plantillas...');
  for (const tpl of TEMPLATES) {
    await createTemplate(db, tpl, maps);
  }

  const { saveDatabase } = await import('../db/database');
  await saveDatabase();
  console.log('[Seed6] WODs Feb–Mar 2026 completados.');
}
