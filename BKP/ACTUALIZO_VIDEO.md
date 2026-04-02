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

## 2. CÓMO OBTENER LAS URLs DE VIDEO

**Opción A — Desde Ejercicios.md (más rápido):**
Los ejercicios en `BKP/Ejercicios.md` ya tienen sus URLs de YouTube inline.
Ejemplo: `- Band Pull-Apart - https://www.youtube.com/shorts/SuvO4TBwSu4`

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

| Sitio | Tipo de ejercicios |
|-------|--------------------|
| `catalystathletics.com/exercise/` | Halterofilia olímpica (snatch, clean, squat) |
| `barbend.com/{exercise-name}/` | Fuerza general (deadlift, bench, press) |
| `muscleandstrength.com/exercises/` | Hipertrofia y fuerza general |
| `wodprep.com/blog/` | CrossFit específico |

### Ejemplo resuelto — Back Squat

```
WebFetch: https://www.catalystathletics.com/exercise/77/Back-Squat/
→ Encontrado: ID "6Ai-ne7Lh6M" (Back Squat tutorial Catalyst Athletics)
→ URL final: https://www.youtube.com/watch?v=6Ai-ne7Lh6M
```

---

## 3. CAMPOS DE VIDEO EN LA BD

La tabla `exercise` tiene dos campos de video:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `video_long_path` | URL completa de YouTube (Short o watch) | `https://www.youtube.com/shorts/SuvO4TBwSu4` |
| `video_path` | URL corta opcional (sin uso actual en la UI) | `null` |

**Regla:** siempre usar `video_long_path`. Solo actualizar `video_path` si se proporciona explícitamente.

---

## 4. CÓMO EXTRAER EL ID DE YOUTUBE PARA THUMBNAIL

La app muestra thumbnails desde:
`https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg`

Para extraer el ID:
- De `/shorts/SuvO4TBwSu4` → ID = `SuvO4TBwSu4`
- De `watch?v=E42_MZOKktU` → ID = `E42_MZOKktU`

---

## 5. CONVENCIÓN DE NOMBRES

- Servicio: `src/services/videos{Descripcion}UpdateService.ts`
  - Ejemplo: `src/services/videosClase02042026UpdateService.ts`
  - Si es lista manual: `src/services/videosBatch001UpdateService.ts`
- Flag localStorage: `videos_{descripcion}_done_v1`
- Label del botón: texto descriptivo
  - Ejemplo: `'Clase GOAT 02/04/2026 — videos'`

---

## 6. PROCESO PASO A PASO

### PASO 1 — Obtener nombre exacto del ejercicio en BD
Buscar en los servicios `src/services/class*ImportService.ts` existentes o en `seedService*.ts`.

### PASO 2 — Obtener la URL de YouTube
Ver sección 2. Si está en Ejercicios.md, extraerla de ahí directamente.

### PASO 3 — Crear el servicio TypeScript
Copiar el template de la sección 7 y completar el array `VIDEO_ASSIGNMENTS`.

### PASO 4 — Registrar en VideoSeederSection
Editar `src/components/export/VideoSeederSection.tsx`:
1. Importar las dos funciones del nuevo servicio
2. Agregar una entrada al array `VIDEO_ENTRIES`
3. Quitar el comentario del ejemplo si es la primera entrada

### PASO 5 — Verificar compilación
```bash
npx tsc --noEmit
```

---

## 7. TEMPLATE DEL SERVICIO

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
  videoLongPath: string;        // URL completa YouTube (Shorts o watch)
  videoPath?: string | null;    // Opcional, normalmente null
}

const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  // ─── Completar con los ejercicios ────────────────────────────────────────
  // { exerciseName: 'Band Pull-Apart', videoLongPath: 'https://www.youtube.com/shorts/SuvO4TBwSu4' },
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
    if (!assignment.videoLongPath) {
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
      'UPDATE exercise SET video_long_path = ?, video_path = ?, updated_at = ? WHERE id = ?',
      [assignment.videoLongPath, assignment.videoPath ?? null, ts, exerciseId]
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

## 8. ESTRUCTURA DE VideoSeederSection

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

## 9. EJEMPLO RESUELTO — Clase GOAT 01/04/2026

Los videos ya están en `Ejercicios.md` líneas 34-81. Servicio a crear:
`src/services/videosClase01042026UpdateService.ts`

```typescript
const VIDEO_ASSIGNMENTS: VideoAssignment[] = [
  { exerciseName: 'Band Pull-Apart',               videoLongPath: 'https://www.youtube.com/shorts/SuvO4TBwSu4' },
  { exerciseName: 'Band External Rotation',        videoLongPath: 'https://www.youtube.com/watch?v=wQdfeB80fqo' },
  { exerciseName: '90/90 Hip Rotation',            videoLongPath: 'https://www.youtube.com/watch?v=f_7qIPxw6nE' },
  { exerciseName: 'Lateral Raise to Overhead',     videoLongPath: 'https://www.youtube.com/watch?v=7mUqxKfg6zo' },
  { exerciseName: 'Scapular Push-Up',              videoLongPath: 'https://www.youtube.com/watch?v=huGj4aBk9C4' },
  { exerciseName: 'High Pull + External Rotation', videoLongPath: 'https://www.youtube.com/watch?v=-EZP2ynZchc' },
  { exerciseName: 'Snatch Grip Deadlift',          videoLongPath: 'https://www.youtube.com/watch?v=E42_MZOKktU' },
  { exerciseName: 'Snatch High Pull',              videoLongPath: 'https://www.youtube.com/watch?v=33jE3S5IMMo' },
  { exerciseName: 'Barbell Muscle Snatch',         videoLongPath: 'https://www.youtube.com/watch?v=hFb3l16PI4U' },
  { exerciseName: 'Snatch with Pause at Knee',     videoLongPath: 'https://www.youtube.com/watch?v=EOrFQ9O1Ng4' },
  { exerciseName: 'Dumbbell Deadlift',             videoLongPath: 'https://www.youtube.com/shorts/ElCIiU1FWxg' },
  { exerciseName: 'DB Lateral Step-Over',          videoLongPath: 'https://www.youtube.com/shorts/vs1813G1Q00' },
  { exerciseName: 'Dumbbell Push Press',           videoLongPath: 'https://www.youtube.com/shorts/cQ67XoqcItE' },
];
```

Entrada en `VideoSeederSection`:
```typescript
{
  label: 'Clase GOAT 01/04/2026 — videos',
  description: 'Band Pull-Apart · Snatch Grip DL · Snatch High Pull · Dumbbell DL…',
  isDone: isVideosClase01042026UpdateDone,
  run: updateVideosClase01042026,
}
```

---

## 10. EJERCICIOS SIN VIDEO TODAVÍA (para buscar)

Usar el listado en Configuración → "Ejercicios con videos" → toggle "Sin"
para ver qué ejercicios aún no tienen video cargado.

Para buscar manualmente en YouTube:
```
"NOMBRE DEL EJERCICIO" technique site:youtube.com
```
Canales recomendados: CrossFit, WODprep, Wodstar, Alan Thrall, Jeff Nippard, Renaissance Periodization.

---

## 11. CHECKLIST DE ENTREGA

- [ ] URL de YouTube verificada y accesible (abrir en browser)
- [ ] Preferir YouTube Shorts cuando existan (más cortos y directos)
- [ ] El nombre del ejercicio coincide exactamente con `exercise.name` en la BD
- [ ] El servicio tiene flag único (no colisiona con otros)
- [ ] La entrada en `VideoSeederSection` tiene label descriptivo
- [ ] `npx tsc --noEmit` sin errores

---

*Última actualización: 2026-04-02*
*Patrón basado en: musclesClase01042026UpdateService.ts + MuscleSeederSection.tsx*
