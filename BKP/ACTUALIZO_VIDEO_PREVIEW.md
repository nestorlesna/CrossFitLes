# Guía: Actualizar Videos con Preview Interactivo

## ¿Qué hace esta funcionalidad?

Permite asignar videos de YouTube (cortos o explicativos) a ejercicios de forma masiva e interactiva. El usuario ve 2 opciones de video por ejercicio lado a lado, puede previsualizarlos en popup, elegir cuál prefiere, y al final aplica todos los cambios de una vez a la base de datos.

## Archivos involucrados

Cada "batch" de actualización requiere **4 archivos**:

| # | Archivo | Ruta | Función |
|---|---------|------|---------|
| 1 | `data/batchXXXVideoPairs.ts` | `src/data/` | Datos: lista de ejercicios con 2 videos cada uno |
| 2 | `services/videosBatchXXXUpdateService.ts` | `src/services/` | Lógica: UPDATE en SQLite usando las selecciones del usuario |
| 3 | `pages/Settings/VideoBatchXXXPage.tsx` | `src/pages/Settings/` | UI: página interactiva con thumbnails, preview y botón de guardar |
| 4 | **Ruta + botón** | `App.tsx` + `SettingsPage.tsx` | Cableado: registrar la ruta y agregar botón en Configuración |

> Reemplazá `XXX` por el número de batch (ej: `003`, `004`, etc.)

---

## Paso 1: Crear el archivo de datos

**Ruta:** `src/data/batchXXXVideoPairs.ts`

Este archivo exporta la interfaz y el array con los pares de videos.

### Para video corto (`video_path`, máx. 20 segundos)

```typescript
export interface ExerciseVideoPair {
  exerciseName: string;
  videoA: string;
  videoB: string;
}

export const BATCH_XXX_VIDEO_PAIRS: ExerciseVideoPair[] = [
  { exerciseName: 'Back Squat', videoA: 'https://www.youtube.com/shorts/ABC123', videoB: 'https://www.youtube.com/watch?v=DEF456' },
  { exerciseName: 'Deadlift', videoA: 'https://www.youtube.com/shorts/GHI789', videoB: 'https://www.youtube.com/shorts/JKL012' },
  // ... más ejercicios
];
```

### Para video explicativo (`video_long_path`, hasta 40 segundos)

Misma estructura, solo cambian las URLs. Podés usar el mismo `ExerciseVideoPair` o crear uno nuevo si necesitás campos diferentes.

### Reglas para los videos

| Tipo | Campo en BD | Duración máx. | Formato recomendado |
|------|-------------|---------------|---------------------|
| **Video corto** | `video_path` | ≤ 20 segundos | YouTube Shorts (`/shorts/`) o videos cortos |
| **Video explicativo** | `video_long_path` | ≤ 40 segundos | Cualquier video de YouTube/Vimeo |

### Formatos de URL soportados

- `https://www.youtube.com/shorts/XXXXXXXXXXX`
- `https://www.youtube.com/watch?v=XXXXXXXXXXX`
- `https://youtu.be/XXXXXXXXXXX`
- `https://www.youtube.com/embed/XXXXXXXXXXX`
- `https://vimeo.com/123456789`

---

## Paso 2: Crear el servicio de actualización

**Ruta:** `src/services/videosBatchXXXUpdateService.ts`

```typescript
import { getDatabase, saveDatabase } from '../db/database';
import { BATCH_XXX_VIDEO_PAIRS } from '../data/batch003VideoPairs';

const UPDATE_FLAG = 'videos_batch_XXX_done';

export function isVideosBatchXXXUpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

export async function updateVideosBatchXXX(
  selections: Record<string, 'A' | 'B'>
): Promise<{
  updated: number;
  skippedNoExercise: number;
  skippedNoVideo: number;
}> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updated = 0;
  let skippedNoExercise = 0;
  let skippedNoVideo = 0;

  for (const pair of BATCH_XXX_VIDEO_PAIRS) {
    const choice = selections[pair.exerciseName];
    if (!choice) {
      skippedNoVideo++;
      continue;
    }

    const videoUrl = choice === 'A' ? pair.videoA : pair.videoB;

    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))',
      [pair.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[VideosUpdate BatchXXX] No encontrado: "${pair.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    // ── IMPORTANTE: elegir el campo correcto ──
    // Para video CORTO → video_path
    // Para video EXPLICATIVO → video_long_path
    await db.run(
      'UPDATE exercise SET video_path = ?, updated_at = ? WHERE id = ?',
      [videoUrl, ts, exerciseId]
    );

    console.log(`[VideosUpdate BatchXXX] OK: "${pair.exerciseName}" → ${videoUrl}`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise, skippedNoVideo };
}
```

### ⚠️ Campo a actualizar

En el `UPDATE` del servicio, cambiá `video_path` por el campo que corresponda:

| Tipo de video | Campo en el UPDATE |
|---------------|-------------------|
| Video corto | `video_path` |
| Video explicativo | `video_long_path` |

---

## Paso 3: Crear la página interactiva

**Ruta:** `src/pages/Settings/VideoBatchXXXPage.tsx`

Copiá el archivo `VideoBatch003Page.tsx` y adaptá los imports:

```typescript
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Play, Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { updateVideosBatchXXX } from '../../services/videosBatchXXXUpdateService';
import { BATCH_XXX_VIDEO_PAIRS } from '../../data/batchXXXVideoPairs';
import { Modal } from '../../components/ui/Modal';

// ... el resto del componente es idéntico a VideoBatch003Page
```

### Cambios necesarios respecto al batch anterior

1. **Import del servicio**: `updateVideosBatchXXX`
2. **Import de los datos**: `BATCH_XXX_VIDEO_PAIRS`
3. **Título del header**: Cambiá `"Seleccionar Videos Cortos"` por algo descriptivo como `"Seleccionar Videos Explicativos"` o `"Asignar Videos Cortos — Batch 004"`
4. **El resto es idéntico**: thumbnails, selección, preview en modal, botón de guardar

---

## Paso 4: Cablear la ruta y el botón

### 4a. Agregar la ruta en `App.tsx`

```typescript
import { VideoBatchXXXPage } from './pages/Settings/VideoBatchXXXPage';

// Dentro de <Routes>:
<Route path="configuracion/seleccionar-videos-xxx" element={<VideoBatchXXXPage />} />
```

### 4b. Agregar el botón en `SettingsPage.tsx`

En la sección **"Listados"** (dentro de `SettingsPage.tsx`), agregar:

```typescript
import { Video } from 'lucide-react'; // si no está importado ya

// Dentro de la sección "Listados":
<button
  onClick={() => navigate('/configuracion/seleccionar-videos-xxx')}
  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
>
  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
    <Video size={16} className="text-primary-400" />
  </div>
  <div className="flex-1 min-w-0">
    <span className="text-sm text-white block">Título descriptivo del batch</span>
    <span className="text-xs text-gray-600">Batch XXX — N ejercicios · tipo de video</span>
  </div>
  <ChevronRight size={16} className="text-gray-600" />
</button>
```

---

## Flujo completo de uso

1. **Preparar datos**: Buscar 2 videos por ejercicio en YouTube (respetando la duración según tipo). Crear `batchXXXVideoPairs.ts`.
2. **Crear servicio**: Copiar el servicio del batch anterior, cambiar nombre, flag y campo de BD.
3. **Crear página**: Copiar `VideoBatch003Page.tsx`, cambiar imports y título.
4. **Cablear**: Agregar ruta en `App.tsx` y botón en `SettingsPage.tsx`.
5. **Ejecutar**: El usuario va a Configuración → Listados → botón del batch, selecciona videos, y guarda.

---

## Estructura de la UI (siempre la misma)

```
┌─────────────────────────────────────┐
│ ←  Seleccionar Videos     15/67    │  ← Header sticky
├─────────────────────────────────────┤
│ [ Buscar ejercicio...            ] │  ← Barra de búsqueda
│ [Todos A] [Todos B] [Limpiar]     │  ← Acciones rápidas
├─────────────────────────────────────┤
│ Back Squat              [Video A]  │
│ ┌──────────┐  ┌──────────┐        │
│ │  [Thumb] │  │  [Thumb] │        │  ← 2 videos lado a lado
│ │    A  ▶  │  │    B  ▶  │        │  ← ▶ = abrir preview en popup
│ └──────────┘  └──────────┘        │  ← Click = seleccionar
├─────────────────────────────────────┤
│ ... más ejercicios ...             │
├─────────────────────────────────────┤
│ [  Aplicar 15 videos  ]            │  ← Barra fija inferior (z-[60])
└─────────────────────────────────────┘
```

### Interacción

- **Click en thumbnail** → selecciona ese video (borde verde + check)
- **Click en ▶ (play)** → abre popup con el video embebido reproduciéndose
- **Todos A / Todos B** → selecciona masivamente
- **Limpiar** → deselecciona todo
- **Aplicar N videos** → hace los UPDATE en SQLite y navega atrás

---

## Checklist para crear un nuevo batch

- [ ] Crear `src/data/batchXXXVideoPairs.ts` con la interfaz y el array
- [ ] Crear `src/services/videosBatchXXXUpdateService.ts` (copiar del anterior, ajustar nombre, flag, campo BD)
- [ ] Crear `src/pages/Settings/VideoBatchXXXPage.tsx` (copiar del anterior, ajustar imports y título)
- [ ] Agregar import + `<Route>` en `src/App.tsx`
- [ ] Agregar botón en `src/pages/Settings/SettingsPage.tsx` (sección Listados)
- [ ] Definir qué campo se actualiza: `video_path` (corto) o `video_long_path` (explicativo)
- [ ] Verificar que los videos respeten la duración (≤20s corto, ≤40s explicativo)
- [ ] Probar en dev: seleccionar videos, previsualizar, guardar, verificar en BD
