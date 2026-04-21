# ACTUALIZO_VIDEO.md
## Guía para asignar videos de YouTube a ejercicios en CrossFit Session Tracker

Este documento indica a Claude exactamente qué hacer cuando el usuario pide
asignar videos a ejercicios.

---

## 1. CUÁNDO SE USA ESTE DOCUMENTO

Cuando el usuario diga algo como:
> "Asigná los videos a estos ejercicios usando ACTUALIZO_VIDEO.md"
> "Actualizá los videos de la clase 02/04/2026"

El objetivo es producir:
1. **Un servicio TypeScript** que asigna URLs de video a cada ejercicio en la BD
2. **Un botón en la sección "Asignar videos"** de Configuración para que el usuario lo ejecute

---

## 2. CAMPOS DE VIDEO EN LA BD

La tabla `exercise` tiene dos campos de video con propósitos distintos:

| Campo | Descripción | Dónde se muestra |
|-------|-------------|-----------------|
| `video_path` | **Video corto** — demostración rápida del movimiento | Popup durante sesión (botón play en cada ejercicio), detalle de clase, detalle de sesión |
| `video_long_path` | **Video explicativo** — tutorial completo con técnica, errores, etc. | Sección "Video explicativo" en la página de detalle del ejercicio |

En los repos el campo se mapea como:
```sql
e.video_path as exercise_video_url   -- trainingSessionRepo.ts, classTemplateRepo.ts
```

**CRÍTICO:** Si `video_path` está vacío, el botón de video **no aparece** en el popup de sesión.

---

## 3. REGLA DE ASIGNACIÓN — DOS VIDEOS POR EJERCICIO

Para cada ejercicio se deben buscar **dos videos diferentes**:

### Video corto (`video_path`)
- YouTube Shorts preferentemente, o video de < 2 minutos
- Muestra el movimiento de forma directa y limpia
- Sin introducción larga, sin publicidad, va al grano
- Se ve en el popup durante la ejecución de la sesión → debe ser rápido de consultar

### Video explicativo (`video_long_path`)
- Video de > 2 minutos con explicación técnica
- Incluye errores comunes, cues de coaching, progresiones
- Canales como Alan Thrall, Jeff Nippard, Catalyst Athletics, WODprep
- Se ve solo en la página de detalle del ejercicio

### Reglas de decisión cuando hay incertidumbre

1. **Si se sabe explícitamente** que un video es "explicativo/tutorial" → va a `video_long_path`
2. **Si se sabe que es un Short** → va a `video_path` (corto)
3. **Si solo hay una URL** (p.ej. viene de `Ejercicios.md`) → asignarla a `video_path` (corto) y dejar `video_long_path = null` hasta encontrar el explicativo
4. **Si hay dos videos y no está claro cuál es cuál** → el más largo va a `video_long_path`, el más corto a `video_path`
5. **Si ambos parecen igual de cortos** → el más técnico/detallado va a `video_long_path`

---

## 4. CÓMO OBTENER LAS URLs DE VIDEO

**Opción A — Desde Ejercicios.md (más rápido):**
Los ejercicios en `BKP/Ejercicios.md` ya tienen sus URLs de YouTube inline.
Ejemplo: `- Band Pull-Apart - https://www.youtube.com/shorts/SuvO4TBwSu4`
Esto es el video corto. Buscar por separado el explicativo si hace falta.

**Opción B — El usuario las proporciona directamente.**

**Opción C — Claude busca en internet** con WebSearch + WebFetch.

### Proceso con WebSearch + WebFetch (Opción C)

WebSearch rara vez devuelve URLs directas de YouTube. El flujo que funciona:

1. **WebSearch** para encontrar sitios que embeben el video:
   ```
   "{nombre ejercicio}" exercise tutorial site:catalystathletics.com
   "{nombre ejercicio}" exercise youtube video site:barbend.com
   "{nombre ejercicio}" exercise video site:muscleandstrength.com
   ```

2. **WebFetch** sobre la URL del sitio encontrado, con prompt:
   ```
   Find any YouTube video URL or video ID embedded on this page
   ```

3. El fetch devuelve IDs de YouTube → construir URL:
   - `https://www.youtube.com/watch?v={ID}`

### Sitios confiables para hacer WebFetch

| Sitio | Tipo de ejercicios | Video típico |
|-------|--------------------|--------------|
| `catalystathletics.com/exercise/` | Halterofilia olímpica | Tutorial largo (explicativo) |
| `barbend.com/{exercise-name}/` | Fuerza general | Tutorial largo (explicativo) |
| `muscleandstrength.com/exercises/` | Hipertrofia y fuerza general | Tutorial largo |
| `wodprep.com/blog/` | CrossFit específico | Puede ser corto o largo |

### Estrategia de búsqueda de dos videos

Para cada ejercicio:
1. Buscar primero en `catalystathletics.com` o `barbend.com` → suele dar el **explicativo**
2. Buscar en YouTube Shorts (`"{ejercicio}" shorts`) → da el **corto**
3. Si solo se encuentra uno → usarlo como `video_path` (corto) y dejar `video_long_path = null`

---

## 5. CÓMO EXTRAER EL ID DE YOUTUBE PARA THUMBNAIL

La app muestra thumbnails desde:
`https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg`

Para extraer el ID:
- De `/shorts/SuvO4TBwSu4` → ID = `SuvO4TBwSu4`
- De `watch?v=E42_MZOKktU` → ID = `E42_MZOKktU`

---

## 6. CONVENCIÓN DE NOMBRES

- Servicio: `src/services/videos{Descripcion}UpdateService.ts`
  - Ejemplo: `src/services/videosClase02042026UpdateService.ts`
  - Si es lista manual: `src/services/videosBatch003UpdateService.ts`
- Flag localStorage: `videos_{descripcion}_done_v1`
- Label del botón: texto descriptivo
  - Ejemplo: `'Clase GOAT 02/04/2026 — videos'`

---

## 7. PROCESO PASO A PASO

### PASO 1 — Obtener nombre exacto del ejercicio en BD
Buscar en los servicios `src/services/class*ImportService.ts` existentes o en `seedService*.ts`.

### PASO 2 — Obtener las dos URLs de YouTube
Ver sección 4. Buscar video corto + video explicativo por separado.
Si solo hay una URL disponible, usarla como `videoShortPath` y dejar `videoLongPath: null`.

### PASO 3 — Crear el servicio TypeScript
Copiar el template de la sección 8 y completar el array `VIDEO_ASSIGNMENTS`.

### PASO 4 — Registrar en VideoSeederSection
Editar `src/components/export/VideoSeederSection.tsx`:
1. Importar las dos funciones del nuevo servicio
2. Agregar una entrada al array `VIDEO_ENTRIES`

### PASO 5 — Verificar compilación
```bash
npx tsc --noEmit
```

---

## 8. TEMPLATE DEL SERVICIO

```typescript
// src/services/videos{Descripcion}UpdateService.ts
// Asigna URLs de video a ejercicios — {descripción}

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'videos_{descripcion}_done_v1';

export function isVideos{Descripcion}UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface VideoAssignment {
  exerciseName: string;
  videoShortPath: string | null;   // video_path — popup sesión (Shorts o video corto)
  videoLongPath: string | null;    // video_long_path — explicativo (tutorial, > 2 min)
}

const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  // ─── Completar con los ejercicios ────────────────────────────────────────
  // {
  //   exerciseName: 'Band Pull-Apart',
  //   videoShortPath: 'https://www.youtube.com/shorts/SuvO4TBwSu4',  // Shorts = corto
  //   videoLongPath:  'https://www.youtube.com/watch?v=XXXXXXX',     // Tutorial = explicativo
  // },
];

export async function updateVideos{Descripcion}(): Promise<{
  updated: number;
  skippedNoExercise: number;
  skippedNoVideo: number;
}> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updated = 0;
  let skippedNoExercise = 0;
  let skippedNoVideo = 0;

  for (const assignment of VIDEO_ASSIGNMENTS) {
    if (!assignment.videoShortPath && !assignment.videoLongPath) {
      skippedNoVideo++;
      continue;
    }

    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))',
      [assignment.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[VideosUpdate] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET video_path = ?, video_long_path = ?, updated_at = ? WHERE id = ?',
      [assignment.videoShortPath ?? null, assignment.videoLongPath ?? null, ts, exerciseId]
    );

    console.log(`[VideosUpdate] OK: "${assignment.exerciseName}"`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
```

---

## 9. ESTRUCTURA DE VideoSeederSection

El componente `src/components/export/VideoSeederSection.tsx` sigue el mismo
patrón que `MuscleSeederSection.tsx`. Se oculta automáticamente si no hay
entradas (`VIDEO_ENTRIES.length === 0`).

```typescript
interface VideoEntry {
  label: string;
  description: string;       // Ej: 'Band Pull-Apart · Snatch · Dumbbell Deadlift…'
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skippedNoExercise: number; skippedNoVideo: number }>;
}
```

Toast de éxito: `"X videos asignados"`
Toast de error: `"X ejercicios no encontrados en la BD"`
Icono: `Video` de lucide-react, color azul (`text-blue-400`)

---

## 10. EJEMPLO RESUELTO — Clase GOAT 01/04/2026

Los videos ya están en `Ejercicios.md` líneas 34-81 (todos son el video corto).
Para el explicativo habría que buscar por separado; por ahora se dejan en `null`.

```typescript
const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  // Los URLs de Ejercicios.md son el video corto (popup sesión)
  // videoLongPath = null hasta que se busque un tutorial más extenso
  { exerciseName: 'Band Pull-Apart',               videoShortPath: 'https://www.youtube.com/shorts/SuvO4TBwSu4',   videoLongPath: null },
  { exerciseName: 'Band External Rotation',        videoShortPath: 'https://www.youtube.com/watch?v=wQdfeB80fqo',  videoLongPath: null },
  { exerciseName: '90/90 Hip Rotation',            videoShortPath: 'https://www.youtube.com/watch?v=f_7qIPxw6nE',  videoLongPath: null },
  { exerciseName: 'Lateral Raise to Overhead',     videoShortPath: 'https://www.youtube.com/watch?v=7mUqxKfg6zo',  videoLongPath: null },
  { exerciseName: 'Scapular Push-Up',              videoShortPath: 'https://www.youtube.com/watch?v=huGj4aBk9C4',  videoLongPath: null },
  { exerciseName: 'High Pull + External Rotation', videoShortPath: 'https://www.youtube.com/watch?v=-EZP2ynZchc',  videoLongPath: null },
  // Catalyst Athletics: el video de su sitio es explicativo → va a videoLongPath
  { exerciseName: 'Back Squat',                    videoShortPath: null,                                           videoLongPath: 'https://www.youtube.com/watch?v=6Ai-ne7Lh6M' },
  { exerciseName: 'Snatch Grip Deadlift',          videoShortPath: null,                                           videoLongPath: 'https://www.youtube.com/watch?v=E42_MZOKktU' },
  { exerciseName: 'Snatch High Pull',              videoShortPath: null,                                           videoLongPath: 'https://www.youtube.com/watch?v=33jE3S5IMMo' },
  { exerciseName: 'Barbell Muscle Snatch',         videoShortPath: null,                                           videoLongPath: 'https://www.youtube.com/watch?v=hFb3l16PI4U' },
  { exerciseName: 'Snatch with Pause at Knee',     videoShortPath: null,                                           videoLongPath: 'https://www.youtube.com/watch?v=EOrFQ9O1Ng4' },
  // Shorts → video corto
  { exerciseName: 'Dumbbell Deadlift',             videoShortPath: 'https://www.youtube.com/shorts/ElCIiU1FWxg',   videoLongPath: null },
  { exerciseName: 'DB Lateral Step-Over',          videoShortPath: 'https://www.youtube.com/shorts/vs1813G1Q00',   videoLongPath: null },
  { exerciseName: 'Dumbbell Push Press',           videoShortPath: 'https://www.youtube.com/shorts/cQ67XoqcItE',   videoLongPath: null },
];
```

---

## 11. EJERCICIOS SIN VIDEO TODAVÍA (para buscar)

Usar el listado en Configuración → "Ejercicios con videos" → toggle "Sin"
para ver qué ejercicios aún no tienen video cargado.

Para buscar manualmente en YouTube:
```
"NOMBRE DEL EJERCICIO" technique site:youtube.com
```
Canales recomendados: CrossFit, WODprep, Wodstar, Alan Thrall, Jeff Nippard, Renaissance Periodization.

---

## 12. CHECKLIST DE ENTREGA

- [ ] Cada ejercicio tiene al menos un video (`videoShortPath` o `videoLongPath`)
- [ ] Los YouTube Shorts van siempre a `videoShortPath`
- [ ] Los tutoriales de Catalyst Athletics / BarBend van a `videoLongPath`
- [ ] Si solo hay un video y es de dudosa duración, va a `videoShortPath` (popup sesión)
- [ ] El nombre del ejercicio coincide exactamente con `exercise.name` en la BD
- [ ] El servicio tiene flag único (no colisiona con otros)
- [ ] La entrada en `VideoSeederSection` tiene label descriptivo
- [ ] `npx tsc --noEmit` sin errores

---

*Última actualización: 2026-04-02*
*Patrón basado en: musclesClase01042026UpdateService.ts + MuscleSeederSection.tsx*
