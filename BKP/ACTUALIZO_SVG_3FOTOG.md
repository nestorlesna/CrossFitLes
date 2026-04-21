# ACTUALIZO_SVG_3FOTOG.md
## Guía para crear SVGs animados de 3 fotogramas para ejercicios

Este documento indica a Claude exactamente qué hacer cuando el usuario pide
crear imágenes SVG animadas para ejercicios y registrarlas en la base de datos.

---

## 1. CUÁNDO SE USA ESTE DOCUMENTO

Cuando el usuario diga algo como:
> "Creá el SVG para estos ejercicios usando ACTUALIZO_SVG_3FOTOG.md"
> "Necesito imágenes para la clase 05/04/2026"
> "Hacé los SVG de: Barbell Lunge, Ring Push-Up, Kettlebell Swing"

El objetivo es:
1. **Crear archivos `.svg`** en `public/img/exercises/` con animación de 3 fotogramas
2. **Crear un servicio TypeScript** que registra la `image_url` en la BD para cada ejercicio
3. **Agregar un botón** en `ImageSeederSection` (sección "Registrar imágenes" en Configuración)

---

## 2. ESTRUCTURA DEL SVG — PATRÓN DE 3 FOTOGRAMAS

Referencia: `public/img/exercises/air-squat.svg`

### Estructura base

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230">
  <rect width="200" height="230" fill="#111827" rx="12"/>
  <style>
    .f1{animation:sh1 4s linear infinite}
    .f2{animation:sh2 4s linear infinite}
    .f3{animation:sh3 4s linear infinite}
    @keyframes sh1{0%,27%{opacity:1}33%,90%{opacity:0}100%{opacity:1}}
    @keyframes sh2{0%,33%{opacity:0}40%,60%{opacity:1}66%,100%{opacity:0}}
    @keyframes sh3{0%,66%{opacity:0}72%,93%{opacity:1}100%{opacity:0}}
  </style>

  <!-- Frame 1: posición inicial / de pie -->
  <g class="f1" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" fill="none">
    <!-- ... figura en posición 1 ... -->
  </g>

  <!-- Frame 2: posición intermedia -->
  <g class="f2" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" fill="none">
    <!-- ... figura en posición 2 ... -->
  </g>

  <!-- Frame 3: posición final / fondo del movimiento -->
  <g class="f3" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" fill="none">
    <!-- ... figura en posición 3 ... -->
  </g>

  <!-- Línea de suelo y etiqueta -->
  <line x1="30" y1="210" x2="170" y2="210" stroke="#374151" stroke-width="3" stroke-linecap="round"/>
  <text x="100" y="225" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle" letter-spacing="0.5">NOMBRE EJERCICIO</text>
</svg>
```

### Timing de la animación (no modificar)

| Clase | Visible en | Ciclo 4 segundos |
|-------|-----------|------------------|
| `.f1` | Frame 1 | 0%–27% visible, 33%–90% oculto |
| `.f2` | Frame 2 | 40%–60% visible, resto oculto |
| `.f3` | Frame 3 | 72%–93% visible, resto oculto |

---

## 3. PALETA DE COLORES (no modificar)

| Elemento | Color | Uso |
|----------|-------|-----|
| `#111827` | Fondo oscuro | `fill` del rect de fondo |
| `#94a3b8` | Gris azulado claro | Cuerpo (cabeza, líneas de figura) |
| `#64748b` | Gris azulado medio | Articulaciones (círculos de rodilla/codo), equipo secundario |
| `#475569` | Gris azulado oscuro | Equipo/pesas (discos, barras), texto etiqueta |
| `#374151` | Gris oscuro | Línea de suelo, detalles de fondo |

Para equipo específico (barra, mancuerna, kettlebell):
- Barra olímpica: `stroke="#64748b"` con `stroke-width="5"` 
- Discos/pesas: `fill="#475569" stroke="#64748b"`
- Kettlebell: `fill="#475569"`

---

## 4. PROPORCIONES Y COORDENADAS

El viewBox es `0 0 200 230`. La línea de suelo está en `y=210`. La etiqueta en `y=225`.

### Figura de pie (posición neutra)

```
Cabeza:   circle cx="100" cy="26" r="13-14"
Torso:    line y1="40" y2="108"   (68px de alto)
Brazos:   desde y≈52 hacia afuera
Caderas:  en y≈108
Piernas:  hasta y≈205 (suelo)
```

### Reglas de composición

- **Figura de pie**: cabeza en `cy≈26`, pies en `y≈205`
- **Figura en squat profundo**: cabeza sube a `cy≈88-100`, todo el cuerpo se compacta hacia abajo
- **Figura horizontal (plancha/push-up)**: cabeza a `cx≈50-60`, cuerpo extendido horizontalmente
- **Rodillas y codos**: marcar con `circle r="4-6" fill="#64748b"`
- **Pies**: línea horizontal de ~14px de ancho en `y=205`
- **Nombre en etiqueta**: MAYÚSCULAS, máximo 20 caracteres. Si es muy largo usar `font-size="9"`

### Orientación del personaje

- **Ejercicios bilaterales** (squat, deadlift, press): personaje centrado, visto de frente o de costado
- **Ejercicios unilaterales** (lunge, pistol): personaje orientado hacia la derecha, visto de costado
- **Ejercicios en el suelo** (plancha, push-up): personaje horizontal, cabeza a la izquierda

---

## 5. QUÉ MOSTRAR EN CADA FOTOGRAMA

Los 3 fotogramas deben representar las 3 fases clave del movimiento:

| Ejercicio tipo | Frame 1 | Frame 2 | Frame 3 |
|---------------|---------|---------|---------|
| Squat / sentadilla | De pie | Paralelo (90°) | Fondo |
| Deadlift / peso muerto | Barra en suelo, listo | A mitad del jalón | Extendido arriba |
| Press overhead | Barra en rack/hombros | A mitad del press | Bloqueado arriba |
| Swing / dinámico | Inicio (carga atrás) | Punto medio | Pico (carga arriba) |
| Plancha / isométrico | Posición baja | Posición media | Posición perfecta |
| Push-up | Posición alta | Bajando | Posición baja (pecho) |
| Pull-up / ring | Colgado | A mitad | Barbilla sobre barra |
| Lunge | De pie | Bajando | Rodilla al suelo |
| Movimiento olímpico | Primera tracción | Segunda tracción | Recepción |

---

## 6. NOMBRE DEL ARCHIVO SVG

Regla: `kebab-case` del nombre del ejercicio en inglés, sin caracteres especiales.

| Nombre en BD | Archivo SVG |
|-------------|-------------|
| `Air Squat` | `air-squat.svg` |
| `Barbell Deadlift` | `barbell-deadlift.svg` |
| `Kettlebell Swing` | `kettlebell-swing.svg` |
| `GHD Sit-Up` | `ghd-sit-up.svg` |
| `90/90 Hip Rotation` | `hip-90-90-rotation.svg` |
| `DB Lateral Step-Over` | `dumbbell-lateral-step-over.svg` |

Ruta completa: `public/img/exercises/{nombre-kebab}.svg`

---

## 7. PROCESO PASO A PASO

### PASO 1 — Recibir la lista de ejercicios
El usuario proporciona nombres. Verificar que coincidan exactamente con los nombres en la BD
(buscar en `src/services/class*ImportService.ts` o `src/services/seedService*.ts`).

### PASO 2 — Diseñar cada SVG
Para cada ejercicio:
1. Identificar los 3 fotogramas clave del movimiento (ver sección 5)
2. Decidir orientación del personaje (sección 4)
3. Escribir el SVG usando la estructura base (sección 2)
4. Guardar en `public/img/exercises/{nombre-kebab}.svg`

### PASO 3 — Crear el servicio TypeScript
Copiar el template de la sección 9 y completar el array `IMAGE_ASSIGNMENTS`.

### PASO 4 — Registrar en ImageSeederSection
Editar `src/components/export/ImageSeederSection.tsx`:
1. Importar las dos funciones del nuevo servicio
2. Agregar una entrada al array `IMAGE_ENTRIES`

Si `ImageSeederSection.tsx` **no existe todavía**, crearlo con el template de la sección 10
y luego agregarlo a `SettingsPage.tsx` dentro del `<CollapsibleSection title="Gestión de datos">`,
**antes de `<BackupSection />`**:

```typescript
// src/pages/Settings/SettingsPage.tsx

import { ImageSeederSection } from '../../components/export/ImageSeederSection';

// En el JSX, dentro de <CollapsibleSection title="Gestión de datos">:
<ClassShareSection />
<VideoSeederSection />
<ImageSeederSection />   {/* ← agregar acá */}
<BackupSection />
<ResetSection />
```

### PASO 5 — Verificar compilación
```bash
npx tsc --noEmit
```

---

## 8. CONVENCIÓN DE NOMBRES DEL SERVICIO

- Servicio: `src/services/images{Descripcion}UpdateService.ts`
  - Ejemplo: `src/services/imagesClase02042026UpdateService.ts`
  - Si es lista manual: `src/services/imagesBatch001UpdateService.ts`
- Flag localStorage: `images_{descripcion}_done_v1`
- Label del botón: texto descriptivo
  - Ejemplo: `'Clase GOAT 02/04/2026 — imágenes'`

---

## 9. TEMPLATE DEL SERVICIO

```typescript
// src/services/images{Descripcion}UpdateService.ts
// Registra image_url en la BD para ejercicios con SVG nuevo — {descripción}

import { getDatabase, saveDatabase } from '../db/database';

const UPDATE_FLAG = 'images_{descripcion}_done_v1';

export function isImages{Descripcion}UpdateDone(): boolean {
  return localStorage.getItem(UPDATE_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(UPDATE_FLAG, 'true');
}

interface ImageAssignment {
  exerciseName: string;
  imageUrl: string;   // Ruta relativa desde public/, ej: '/img/exercises/air-squat.svg'
}

const IMAGE_ASSIGNMENTS: ImageAssignment[] = [
  // { exerciseName: 'Air Squat', imageUrl: '/img/exercises/air-squat.svg' },
];

export async function updateImages{Descripcion}(): Promise<{
  updated: number;
  skippedNoExercise: number;
}> {
  const db = await getDatabase();
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let updated = 0;
  let skippedNoExercise = 0;

  for (const assignment of IMAGE_ASSIGNMENTS) {
    const exRes = await db.query(
      'SELECT id FROM exercise WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))',
      [assignment.exerciseName]
    );
    const exerciseId = exRes.values?.[0]?.id as string | undefined;
    if (!exerciseId) {
      console.warn(`[ImagesUpdate] No encontrado: "${assignment.exerciseName}"`);
      skippedNoExercise++;
      continue;
    }

    await db.run(
      'UPDATE exercise SET image_url = ?, updated_at = ? WHERE id = ?',
      [assignment.imageUrl, ts, exerciseId]
    );

    console.log(`[ImagesUpdate] OK: "${assignment.exerciseName}" → ${assignment.imageUrl}`);
    updated++;
  }

  await saveDatabase();
  markDone();
  return { updated, skippedNoExercise };
}
```

---

## 10. TEMPLATE DE ImageSeederSection

Si el componente `src/components/export/ImageSeederSection.tsx` no existe, crearlo:

```typescript
// Sección para registrar image_url de ejercicios con SVG nuevo
import { useState } from 'react';
import { ImagePlay, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEntry {
  label: string;
  description: string;
  isDone: () => boolean;
  run: () => Promise<{ updated: number; skippedNoExercise: number }>;
}

const IMAGE_ENTRIES: ImageEntry[] = [
  // Agregar entradas aquí al crear nuevos servicios
];

export function ImageSeederSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);

  if (IMAGE_ENTRIES.length === 0) return null;

  const handleUpdate = async (entry: ImageEntry) => {
    setLoading(entry.label);
    try {
      const result = await entry.run();
      if (result.updated > 0) {
        let msg = `${result.updated} imagen${result.updated !== 1 ? 'es' : ''} registrada${result.updated !== 1 ? 's' : ''}`;
        if (result.skippedNoExercise > 0) msg += ` · ${result.skippedNoExercise} ejercicios no encontrados`;
        toast.success(msg);
      } else if (result.skippedNoExercise > 0) {
        toast.error(`${result.skippedNoExercise} ejercicios no encontrados en la BD`);
      } else {
        toast.info('No se registraron imágenes');
      }
      setTick(t => t + 1);
    } catch (error) {
      toast.error(
        `Error al registrar imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Registrar imágenes
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        {IMAGE_ENTRIES.map((entry) => {
          const done = entry.isDone();
          const isLoading = loading === entry.label;
          return (
            <button
              key={entry.label}
              onClick={() => !done && handleUpdate(entry)}
              disabled={done || isLoading}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:cursor-not-allowed group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  done
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-orange-500/10 border-orange-500/20 group-hover:border-orange-500/50'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="text-orange-400 animate-spin" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <ImagePlay size={18} className="text-orange-400" />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-bold block ${done ? 'text-gray-500' : 'text-white'}`}>
                  {entry.label}
                </span>
                <span className="text-[11px] text-gray-500">{entry.description}</span>
              </div>
              {done && (
                <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                  Listo
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

Luego agregar en `src/pages/Settings/SettingsPage.tsx`:
```typescript
import { ImageSeederSection } from '../../components/export/ImageSeederSection';
// ...en el render:
<ImageSeederSection />
```

---

## 11. EJEMPLO RESUELTO — Clase GOAT 02/04/2026

4 SVGs nuevos creados: wall-thoracic-extensions, yoga-push-up, isometric-lunge, weighted-plank.

```typescript
// src/services/imagesClase02042026UpdateService.ts
const IMAGE_ASSIGNMENTS: ImageAssignment[] = [
  { exerciseName: 'Wall Thoracic Extensions', imageUrl: '/img/exercises/wall-thoracic-extensions.svg' },
  { exerciseName: 'Yoga Push-Up',             imageUrl: '/img/exercises/yoga-push-up.svg' },
  { exerciseName: 'Isometric Lunge',          imageUrl: '/img/exercises/isometric-lunge.svg' },
  { exerciseName: 'Weighted Plank',           imageUrl: '/img/exercises/weighted-plank.svg' },
];
```

Nota: los ejercicios creados con `class*ImportService.ts` ya reciben `image_url` al momento
de creación — este servicio es para ejercicios que existían antes o que se crearon sin imagen.

---

## 12. CHECKLIST DE ENTREGA

- [ ] Cada SVG tiene exactamente 3 fotogramas con clases `f1`, `f2`, `f3`
- [ ] Los colores respetan la paleta definida en sección 3
- [ ] El fondo `#111827` está presente con `rx="12"` para bordes redondeados
- [ ] La línea de suelo (`y=210`) y etiqueta (`y=225`) están presentes
- [ ] La etiqueta está en MAYÚSCULAS y es legible (font-size 9 o 10)
- [ ] El nombre del archivo es kebab-case sin caracteres especiales
- [ ] El servicio usa `UPPER(TRIM(?))` para buscar el ejercicio en la BD
- [ ] El flag localStorage es único (no colisiona con otros servicios)
- [ ] `npx tsc --noEmit` sin errores

---

*Última actualización: 2026-04-02*
*Referencia SVG: public/img/exercises/air-squat.svg*
*Patrón de servicio basado en: videosBatch001UpdateService.ts + VideoSeederSection.tsx*
