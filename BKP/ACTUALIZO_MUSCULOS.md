# ACTUALIZO_MUSCULOS.md
## Guía para asignar grupos musculares a ejercicios en CrossFit Session Tracker

Este documento le indica a Claude exactamente qué hacer cuando el usuario pide
"asignar los grupos musculares a los ejercicios de la clase X" o proporciona
una lista de nombres de ejercicios.

---

## 1. CUÁNDO SE USA ESTE DOCUMENTO

Cuando el usuario diga algo como:
> "Asigná los músculos a los ejercicios de la clase 02/04/2026 usando ACTUALIZO_MUSCULOS.md"
> "Actualizá los grupos musculares de estos ejercicios: Band Pull-Apart, Snatch High Pull..."

El objetivo es producir:
1. **Un servicio TypeScript** que asigna músculos a cada ejercicio en la BD
2. **Un botón en la sección "Actualizar músculos"** de Configuración para que el usuario lo ejecute

---

## 2. CÓMO OBTENER LA LISTA DE EJERCICIOS

**Opción A — Desde Ejercicios.md:**
Extraer todos los nombres de ejercicios que aparecen en una clase específica del archivo `BKP/Ejercicios.md`.

**Opción B — Lista manual:**
El usuario proporciona directamente los nombres.

En ambos casos, usar el **nombre exacto** tal como está registrado en la BD
(campo `exercise.name`). Si hay duda del nombre, buscar en los servicios
`src/services/class*ImportService.ts` existentes para ver cómo se registraron.

---

## 3. CATÁLOGOS DE MÚSCULOS

⚠️ **IMPORTANTE — Dos posibles estados del catálogo en BD:**

### Estado A — catálogo simplificado (seed inicial, `seedService.ts`)
Solo existe si el usuario NUNCA ejecutó "Cargar Datos Base":
```
Pectorales · Dorsales · Deltoides · Bíceps · Tríceps · Trapecio
Antebrazos · Cuádriceps · Isquiotibiales · Glúteos · Pantorrillas · Core/Abdominales
```

### Estado B — catálogo granular (seedService2, post "Cargar Datos Base") ← **caso habitual**
```
Deltoides anterior · Deltoides lateral · Deltoides posterior
Recto femoral · Vasto lateral · Vasto medial · Vasto intermedio
Glúteo mayor · Glúteo medio
Dorsal ancho · Trapecio (superior) · Trapecio (medio) · Trapecio (inferior)
Bíceps braquial · Braquial anterior
Tríceps braquial
Gastrocnemio (gemelos) · Sóleo
Recto abdominal · Oblicuo externo · Oblicuo interno · Erectores espinales
Flexores antebrazo · Extensores antebrazo · Braquiorradial
Pectoral mayor · Pectoral menor
Bíceps femoral · Semitendinoso · Semimembranoso
```

### Mapeo simplificado → granular (usado en los servicios)
Los servicios incluyen esta tabla internamente (`CATALOG_NAME`):

| Nombre en MUSCLE_ASSIGNMENTS | Nombre en BD (granular) |
|------------------------------|-------------------------|
| `Deltoides`        | `Deltoides anterior`       |
| `Cuádriceps`       | `Recto femoral`            |
| `Isquiotibiales`   | `Bíceps femoral`           |
| `Glúteos`          | `Glúteo mayor`             |
| `Dorsales`         | `Dorsal ancho`             |
| `Trapecio`         | `Trapecio (superior)`      |
| `Bíceps`           | `Bíceps braquial`          |
| `Tríceps`          | `Tríceps braquial`         |
| `Pantorrillas`     | `Gastrocnemio (gemelos)`   |
| `Core/Abdominales` | `Recto abdominal`          |
| `Antebrazos`       | `Flexores antebrazo`       |
| `Pectorales`       | `Pectoral mayor`           |

**Regla:** en `MUSCLE_ASSIGNMENTS` siempre usar los nombres simplificados (columna izquierda). La función `toDbName()` hace la traducción automáticamente.

---

## 4. TABLA DE REFERENCIA — Músculos por tipo de movimiento

| Patrón de movimiento | Primario          | Secundarios habituales                            |
|----------------------|-------------------|---------------------------------------------------|
| Sentadilla (squat)   | Cuádriceps        | Glúteos, Isquiotibiales, Core/Abdominales          |
| Peso muerto (DL)     | Isquiotibiales    | Glúteos, Cuádriceps, Dorsales, Trapecio            |
| Press overhead       | Deltoides         | Tríceps, Core/Abdominales                          |
| Pull vertical (pull-up) | Dorsales       | Bíceps, Core/Abdominales                           |
| Row / jalón horizontal | Dorsales        | Bíceps, Trapecio, Core/Abdominales                 |
| High pull / jalón explosivo | Trapecio  | Deltoides, Cuádriceps, Glúteos                     |
| Olímpico (snatch/clean) | Cuádriceps    | Glúteos, Deltoides, Trapecio, Core/Abdominales     |
| Press horizontal (bench) | Pectorales   | Tríceps, Deltoides                                 |
| Cardio (correr/saltar) | Cuádriceps     | Isquiotibiales, Glúteos, Pantorrillas              |
| Core / plancha       | Core/Abdominales  | Deltoides (planchas), Glúteos (puentes)            |
| Movilidad de hombro  | Deltoides         | Trapecio, Dorsales                                 |
| Movilidad de cadera  | Glúteos           | Isquiotibiales, Core/Abdominales                   |
| Carry / farmer      | Trapecio          | Antebrazos, Core/Abdominales, Cuádriceps           |
| Lunge               | Cuádriceps        | Glúteos, Isquiotibiales                            |
| Lateral raise       | Deltoides         | Trapecio                                           |
| Curl / bíceps       | Bíceps            | Antebrazos                                         |
| Extensión tríceps   | Tríceps           | —                                                  |

---

## 5. LISTADO COMPLETO — Ejercicios de Ejercicios.md con sus músculos

### Clase 28/03/2026

| Ejercicio en BD                  | Primario          | Secundarios                                     |
|----------------------------------|-------------------|-------------------------------------------------|
| Toe Touch Sit-Up                 | Core/Abdominales  | Isquiotibiales                                  |
| Hollow to Superman Roll          | Core/Abdominales  | Dorsales, Glúteos                               |
| Plank to Opposite Toe Touch      | Core/Abdominales  | Deltoides, Glúteos                              |
| Dumbbell Front Raise             | Deltoides         | Trapecio                                        |
| Bent-Over Dumbbell Lateral Raise | Deltoides         | Trapecio, Dorsales                              |
| Stability Ball Plate Crunch      | Core/Abdominales  | —                                               |
| Dumbbell Bench Press             | Pectorales        | Tríceps, Deltoides                              |
| Farmer's Carry                   | Trapecio          | Antebrazos, Core/Abdominales, Cuádriceps        |
| Kettlebell Sumo Deadlift High Pull | Glúteos         | Cuádriceps, Isquiotibiales, Deltoides, Trapecio |

### Clase 30/03/2026

| Ejercicio en BD                  | Primario          | Secundarios                                          |
|----------------------------------|-------------------|------------------------------------------------------|
| Cossack Squat                    | Cuádriceps        | Glúteos, Isquiotibiales                              |
| Kettlebell Ankle Mobility Drill  | Pantorrillas      | Cuádriceps                                           |
| Side Plank con carga             | Core/Abdominales  | Deltoides, Glúteos                                   |
| Counterbalance Squat             | Cuádriceps        | Glúteos, Isquiotibiales, Core/Abdominales            |
| Hollow Body Rock                 | Core/Abdominales  | —                                                    |
| Back Squat                       | Cuádriceps        | Glúteos, Isquiotibiales, Core/Abdominales            |
| Shuttle Run                      | Cuádriceps        | Isquiotibiales, Glúteos, Pantorrillas                |
| Overhead Squat                   | Cuádriceps        | Glúteos, Deltoides, Core/Abdominales                 |
| Burpee Over The Bar              | Core/Abdominales  | Cuádriceps, Pectorales, Deltoides                    |

### Clase 01/04/2026

| Ejercicio en BD                  | Primario          | Secundarios                                          |
|----------------------------------|-------------------|------------------------------------------------------|
| Band Pull-Apart                  | Deltoides         | Trapecio, Dorsales                                   |
| Band External Rotation           | Deltoides         | Trapecio                                             |
| 90/90 Hip Rotation               | Glúteos           | Core/Abdominales, Isquiotibiales                     |
| Lateral Raise to Overhead        | Deltoides         | Trapecio                                             |
| Scapular Push-Up                 | Dorsales          | Pectorales, Core/Abdominales                         |
| High Pull + External Rotation    | Deltoides         | Trapecio, Bíceps                                     |
| Snatch Grip Deadlift             | Isquiotibiales    | Glúteos, Cuádriceps, Dorsales, Trapecio              |
| Snatch High Pull                 | Trapecio          | Deltoides, Cuádriceps, Glúteos                       |
| Barbell Muscle Snatch            | Deltoides         | Trapecio, Cuádriceps, Glúteos, Core/Abdominales      |
| Snatch with Pause at Knee        | Cuádriceps        | Glúteos, Deltoides, Trapecio, Core/Abdominales       |
| Dumbbell Deadlift                | Isquiotibiales    | Glúteos, Cuádriceps, Core/Abdominales                |
| DB Lateral Step-Over             | Cuádriceps        | Glúteos, Core/Abdominales                            |
| Dumbbell Push Press              | Deltoides         | Tríceps, Cuádriceps, Core/Abdominales                |

---

## 6. PROCESO PASO A PASO

### PASO 1 — Determinar los músculos de cada ejercicio

Para cada ejercicio de la lista:
- Identificar el patrón de movimiento (sección 4)
- Asignar 1 músculo primario y 0 a N secundarios
- Confirmar usando la tabla de la sección 5 si el ejercicio ya está ahí

### PASO 2 — Determinar el nombre del servicio y el flag

Convención de nombres:
- Servicio: `src/services/muscles{Descripcion}UpdateService.ts`
  - Ejemplo: `src/services/musclesClase01042026UpdateService.ts`
  - Si es lista manual: `src/services/musclesBatch001UpdateService.ts`
- Flag localStorage: `muscles_{descripcion}_done`
  - Ejemplo: `muscles_clase_01_04_2026_done`
- Label del botón: texto descriptivo de qué ejercicios cubre
  - Ejemplo: `'Clase GOAT 01/04/2026 — músculos'`

### PASO 3 — Crear el servicio TypeScript

Copiar el template de la sección 7 y completar el array `MUSCLE_ASSIGNMENTS`.

### PASO 4 — Registrar en MuscleSeederSection

Editar `src/components/export/MuscleSeederSection.tsx`:
1. Importar las dos funciones del nuevo servicio
2. Agregar una entrada al array `MUSCLE_ENTRIES` (más reciente primero)

### PASO 5 — Verificar compilación

```bash
npx tsc --noEmit
```

---

## 7. TEMPLATE DEL SERVICIO

```typescript
// src/services/muscles{Descripcion}UpdateService.ts
// Asigna grupos musculares a los ejercicios de {descripción}

import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const UPDATE_FLAG = 'muscles_{descripcion}_done';

export function isMuscles{Descripcion}UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface MuscleAssignment {
  exerciseName: string;        // nombre exacto en la BD
  primary: string;             // 1 músculo primario
  secondary: string[];         // 0 a N músculos secundarios
}

const MUSCLE_ASSIGNMENTS: MuscleAssignment[] = [
  // ─── Completar con los ejercicios ──────────────────────────────────────
  // { exerciseName: 'Band Pull-Apart', primary: 'Deltoides', secondary: ['Trapecio', 'Dorsales'] },
];

export async function updateMuscles{Descripcion}(): Promise<{ updated: number; skipped: number }> {
  const db = await getDatabase();

  const muscleRows = await db.query('SELECT id, name FROM muscle_group WHERE is_active = 1');
  const muscleMap = new Map(
    (muscleRows.values ?? []).map((r: any) => [r.name as string, r.id as string])
  );

  let updated = 0;
  let skipped = 0;

  for (const assignment of MUSCLE_ASSIGNMENTS) {
    // Buscar el ejercicio
    const exRes = await db.query(
      'SELECT id FROM exercise WHERE name = ? AND is_active = 1',
      [assignment.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[MusclesUpdate] Ejercicio no encontrado: ${assignment.exerciseName}`);
      skipped++;
      continue;
    }

    // Si ya tiene músculos asignados, omitir
    const existing = await db.query(
      'SELECT id FROM exercise_muscle_group WHERE exercise_id = ?',
      [exerciseId]
    );
    if ((existing.values?.length ?? 0) > 0) {
      console.debug(`[MusclesUpdate] Ya tiene músculos: ${assignment.exerciseName}`);
      skipped++;
      continue;
    }

    // Insertar músculo primario
    const primaryId = muscleMap.get(assignment.primary);
    if (primaryId) {
      await db.run(
        'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 1)',
        [generateUUID(), exerciseId, primaryId]
      );
      // También actualizar primary_muscle_group_id en la tabla exercise
      await db.run(
        'UPDATE exercise SET primary_muscle_group_id = ?, updated_at = ? WHERE id = ?',
        [primaryId, new Date().toISOString().replace('T', ' ').substring(0, 19), exerciseId]
      );
    }

    // Insertar músculos secundarios
    for (const secName of assignment.secondary) {
      const secId = muscleMap.get(secName);
      if (secId) {
        await db.run(
          'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?, ?, ?, 0)',
          [generateUUID(), exerciseId, secId]
        );
      }
    }

    updated++;
    console.info(`[MusclesUpdate] Músculos asignados: ${assignment.exerciseName}`);
  }

  markDone();
  return { updated, skipped };
}
```

---

## 8. ESTRUCTURA DE MuscleSeederSection

El componente `src/components/export/MuscleSeederSection.tsx` sigue el mismo
patrón que `ClassSeederSection.tsx`:

```typescript
interface MuscleEntry {
  label: string;             // Ej: 'Clase GOAT 01/04/2026 — músculos'
  description: string;       // Ej: 'Band Pull-Apart · Snatch · Dumbbell Deadlift…'
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skipped: number }>;
}
```

El botón muestra:
- **Icono verde** `CheckCircle2` + texto "Actualizado" si ya está hecho
- **Icono violeta** `Dumbbell` si está pendiente
- Toast de éxito: `"X ejercicios actualizados (Y ya tenían músculos)"`
- Toast info: `"Todos los ejercicios ya tenían músculos"`

---

## 9. EJEMPLO RESUELTO — Clase GOAT 01/04/2026

Servicio a crear: `src/services/musclesClase01042026UpdateService.ts`

```typescript
const MUSCLE_ASSIGNMENTS: MuscleAssignment[] = [
  { exerciseName: 'Band Pull-Apart',             primary: 'Deltoides',        secondary: ['Trapecio', 'Dorsales'] },
  { exerciseName: 'Band External Rotation',      primary: 'Deltoides',        secondary: ['Trapecio'] },
  { exerciseName: '90/90 Hip Rotation',          primary: 'Glúteos',          secondary: ['Core/Abdominales', 'Isquiotibiales'] },
  { exerciseName: 'Lateral Raise to Overhead',   primary: 'Deltoides',        secondary: ['Trapecio'] },
  { exerciseName: 'Scapular Push-Up',            primary: 'Dorsales',         secondary: ['Pectorales', 'Core/Abdominales'] },
  { exerciseName: 'High Pull + External Rotation', primary: 'Deltoides',      secondary: ['Trapecio', 'Bíceps'] },
  { exerciseName: 'Snatch Grip Deadlift',        primary: 'Isquiotibiales',   secondary: ['Glúteos', 'Cuádriceps', 'Dorsales', 'Trapecio'] },
  { exerciseName: 'Snatch High Pull',            primary: 'Trapecio',         secondary: ['Deltoides', 'Cuádriceps', 'Glúteos'] },
  { exerciseName: 'Barbell Muscle Snatch',       primary: 'Deltoides',        secondary: ['Trapecio', 'Cuádriceps', 'Glúteos', 'Core/Abdominales'] },
  { exerciseName: 'Snatch with Pause at Knee',   primary: 'Cuádriceps',       secondary: ['Glúteos', 'Deltoides', 'Trapecio', 'Core/Abdominales'] },
  { exerciseName: 'Dumbbell Deadlift',           primary: 'Isquiotibiales',   secondary: ['Glúteos', 'Cuádriceps', 'Core/Abdominales'] },
  { exerciseName: 'DB Lateral Step-Over',        primary: 'Cuádriceps',       secondary: ['Glúteos', 'Core/Abdominales'] },
  { exerciseName: 'Dumbbell Push Press',         primary: 'Deltoides',        secondary: ['Tríceps', 'Cuádriceps', 'Core/Abdominales'] },
];
```

Entrada en `MuscleSeederSection`:
```typescript
{
  label: 'Clase GOAT 01/04/2026 — músculos',
  description: 'Band Pull-Apart · Snatch Grip DL · High Pull · Dumbbell DL · Push Press…',
  isDone: isMusclesClase01042026UpdateDone,
  run: updateMusclesClase01042026,
}
```

---

## 10. CHECKLIST DE ENTREGA

- [ ] Músculo primario definido para cada ejercicio (exactamente 1)
- [ ] Músculos secundarios correctos según el patrón de movimiento
- [ ] Nombres de músculos con tilde y capitalización exacta del catálogo
- [ ] El nombre del ejercicio coincide exactamente con `exercise.name` en la BD
- [ ] El servicio tiene el flag único (no colisiona con otros)
- [ ] La entrada en `MuscleSeederSection` tiene label descriptivo
- [ ] `npx tsc --noEmit` sin errores

---

## 11. MAPEO CATÁLOGO → SVG (MuscleMap)

Los músculos se guardan en la BD con **nombres simplificados** del catálogo
(ej: `'Deltoides'`), pero el componente `MuscleMap.tsx` usa **nombres granulares**
(ej: `'Deltoides anterior'`, `'Deltoides lateral'`, `'Deltoides posterior'`).

El componente tiene un mapa interno `CATALOG_TO_SVG` que expande automáticamente
los nombres del catálogo a sus partes anatómicas del SVG. Por eso:

- **No hace falta cambiar los servicios** — los nombres del catálogo son correctos
- **El MuscleMap colorea todas las partes** de un músculo cuando se pasa su nombre simple
- Si un ejercicio no colorea la figura, verificar primero que el nombre en `MUSCLE_ASSIGNMENTS`
  coincida exactamente con el catálogo (con tildes y mayúsculas)

### Tabla de expansión completa

| Nombre catálogo (BD)  | Nombres SVG (figura humana)                                                   |
|-----------------------|-------------------------------------------------------------------------------|
| `Deltoides`           | Deltoides anterior · Deltoides lateral · Deltoides posterior                  |
| `Cuádriceps`          | Recto femoral · Vasto lateral · Vasto medial · Vasto intermedio               |
| `Glúteos`             | Glúteo mayor · Glúteo medio                                                   |
| `Dorsales`            | Dorsal ancho                                                                  |
| `Trapecio`            | Trapecio (superior) · Trapecio (medio) · Trapecio (inferior)                  |
| `Bíceps`              | Bíceps braquial · Braquial anterior                                           |
| `Tríceps`             | Tríceps braquial                                                              |
| `Pantorrillas`        | Gastrocnemio (gemelos) · Sóleo                                                |
| `Core/Abdominales`    | Recto abdominal · Oblicuo externo · Oblicuo interno · Erectores espinales     |
| `Antebrazos`          | Flexores antebrazo · Extensores antebrazo · Braquiorradial                    |
| `Pectorales`          | Pectoral mayor · Pectoral menor                                               |
| `Isquiotibiales`      | Bíceps femoral · Semitendinoso · Semimembranoso                               |

El mapa está definido en `src/components/exercises/MuscleMap.tsx` (constante `CATALOG_TO_SVG`).
Los nombres granulares también se pueden pasar directamente al componente y funcionan igual.

---

## 12. NOTAS IMPORTANTES

- El servicio **omite** ejercicios que ya tienen músculos asignados (no sobreescribe)
- Si se necesita **corregir** músculos ya asignados, crear un servicio separado con `forceUpdate: true` que primero borra (`DELETE FROM exercise_muscle_group WHERE exercise_id = ?`) y luego inserta
- Siempre actualizar también `exercise.primary_muscle_group_id` al asignar el primario
- El flag queda en `localStorage` — se resetea con el botón de reset total de la app

---

*Última actualización: 2026-04-02*
*Patrón basado en: class01042026ImportService.ts + ClassSeederSection.tsx*
