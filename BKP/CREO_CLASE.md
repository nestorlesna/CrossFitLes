# CREO_CLASE.md
## Guía completa para generar una clase en CrossFit Session Tracker

Este documento le indica a Claude (o cualquier IA) exactamente qué hacer cuando el usuario
pide "crear la clase X del archivo Ejercicios.md" para cargarla en la app.

---

## 1. CUÁNDO SE USA ESTE DOCUMENTO

Cuando el usuario agregue una clase nueva a `BKP/Ejercicios.md` y diga algo como:
> "Cargá la Clase GOAT 03/04/2026 en el sistema usando CREO_CLASE.md"

El objetivo es producir:
1. **SVG animados** (3 fotogramas) para cada ejercicio nuevo → en `public/img/exercises/`
2. **Un ZIP `clase-<nombre>-<fecha>.zip`** con un `class-share.json` adentro — el mismo formato
   que genera el botón "Exportar Clase(s)" de la app (`src/services/classShareService.ts`) —
   listo para importarse desde **Configuración → Importar** sin perder datos existentes
3. Guardar el ZIP en `BKP/` (mismo naming que los ZIP generados antes, ej. `clase-GOAT-13-08-2026.zip`)

> 💪 **Músculos obligatorios:** *todos* los ejercicios de la clase — nuevos **y reutilizados** —
> tienen que salir del ZIP con su músculo primario y sus secundarios cargados (§6 PASO 6 y §5.1).
> El importador reemplaza las relaciones musculares del ejercicio cuando el ZIP las trae, así que
> este es el mecanismo vigente para completar/corregir músculos: **ya no se usa
> `ACTUALIZO_MUSCULOS.md` como paso aparte para clases nuevas**. Sin músculos, el mapa muscular de
> la ficha del ejercicio y el gráfico de Estadísticas quedan vacíos.

> ⚠️ **NO se escribe código TypeScript por clase.** No existe (ni hace falta crear) un servicio
> `classDDMMYYYYImportService.ts` ni un botón en Configuración por cada clase nueva. Eso quedó
> descartado: desde 2026-08 el mecanismo vigente es generar el ZIP `class-share.json` a mano
> (ver sección 11) y que el usuario lo importe con el importador que YA existe en la app
> (`importClassFromZip` / `importFromZip`, `src/services/classShareService.ts`). Ese importador
> ya resuelve catálogos y ejercicios por nombre (case-insensitive) y crea la clase como nueva —
> es idempotente y aditivo, no hace falta programar nada más.
>
> Músculos, equipamiento, tags, etc. van directo en el JSON del ZIP (ver sección 11), no en un
> servicio aparte.

> ⏱️ **Cronómetro obligatorio:** la clase también tiene que quedar ejecutable en modo
> **Clase guiada**, donde el cronómetro avanza solo. Eso implica cargar tiempos de trabajo,
> descansos y ventanas de intervalo en `class_section` y `section_exercise`. Cuando el MD no
> dice cuánto dura un ejercicio, se estima con las tablas de la **sección 7**.

> 📚 **Dataset de referencia (`BKP/exercises-dataset-main/`):** para diseñar ejercicios nuevos
> podés consultar este dataset externo de 1.324 ejercicios (`data/exercises.json`: nombres,
> músculos, equipamiento, instrucciones en 10 idiomas + GIF animado por ejercicio). Úsalo **sólo
> como consulta** para nombrar el ejercicio, deducir músculos/equipamiento y apoyarte en su
> animación al dibujar el SVG. **NO** se compila ni se toca ese repo, **NO** se versiona (está en
> `.gitignore`) y **NO** se copian sus imágenes/GIF a la app (media © Gym visual, licencia aparte;
> los SVG de la app se dibujan a mano según PASO 5). Ver la sección "Dataset de referencia externo"
> en `CLAUDE.md`.

---

## 2. ARQUITECTURA DEL SISTEMA (resumen)

- **App**: React + TypeScript + Vite
- **Base de datos**: SQLite (via `@capacitor-community/sqlite`) — **schema v014** (última migración:
  `v014_movilidad_section_type`)
- **Formato de importación de una clase nueva**: ZIP con un `class-share.json` adentro (formato
  "compartir clase", ver `src/services/classShareService.ts`) — **NO** es el mismo formato que el
  backup completo (`data.json` de `backupService.ts`)
- **Importación**: Menú Configuración → **Gestión de datos → Importar** → seleccionar el ZIP.
  `importFromZip()` detecta que es una clase (`class-share.json`) y llama a `importClassFromZip()`:
  hace **merge aditivo** (reutiliza catálogos/ejercicios existentes por nombre, crea la clase como
  nueva) — **NO** borra nada de lo que el usuario ya tiene cargado. Muy distinto del backup completo,
  que sí reemplaza todos los datos.
- **Repositorios**: `src/db/repositories/` (solo referencia, no hace falta modificarlos para crear una clase)

**Qué hace exactamente el importador con cada tabla** (`importClassFromZip`, líneas 360-600 de
`classShareService.ts`) — esto define qué conviene mandar en el JSON:

| Entidad | Si ya existe (match por nombre) | Si no existe |
|---------|--------------------------------|--------------|
| Catálogos (7 tablas) | Reutiliza el id local. En `work_format` sólo **agrega** `is_interval`/`default_interval_seconds` si el local no los tenía; nunca los quita | Lo crea con todos los campos del JSON |
| `exercise` | **Actualiza campo por campo, sólo los que vengan en el JSON** (`description`, `technical_notes`, `difficulty_level_id`, `primary_muscle_group_id`, `image_url`, `image_path`, `video_path`, `video_long_path`, `is_compound`). Un campo ausente no se toca | Lo crea |
| Relaciones del ejercicio (músculos, equipamiento, tags, section_type, unidades) | Si el ZIP trae filas de esa relación: **DELETE + INSERT** (reemplazo total de esa relación). Si no trae ninguna: la deja intacta | Inserta las que traiga |
| `class_template` | Reutiliza la clase con el mismo nombre exacto (¡y le cuelga las secciones nuevas!) | La crea con `template_type = 'my_classes'` fijo (el campo del JSON se ignora) |
| `class_section` / `section_exercise` | Siempre se insertan como filas nuevas | Idem |
| Sesiones, resultados, récords | **Nunca se tocan** | — |

> ⚠️ **Consecuencia práctica:** el nombre de la clase tiene que ser único. Si ya existe una clase con
> ese nombre exacto, el importador NO crea otra: le agrega las secciones al final de la existente y
> quedan duplicadas. Antes de importar dos veces, borrar la clase anterior desde `/clases`.

---

## 3. FORMATO DEL ARCHIVO Ejercicios.md

La plantilla vigente está al principio de `BKP/Ejercicios.md` (bloque `### TEMPLATE`). Las clases
nuevas se escriben así:

```
Clase GOAT DD/MM/YYYY

Calentamiento
- 6 minutos de calentamiento

Movilidad - 2 rondas todo 30 segundos
 - Nombre o descripción del movimiento

Activacion [instrucciones de rondas/tiempo]
 - [reps o tiempo] Nombre del ejercicio video corto URL, video explicativo URL

Fuerza [N series/rondas cada X minutos]
 - [reps] Nombre del ejercicio [peso] video corto URL, video explicativo URL

WOD [formato y tiempo]
 - [reps | metros | calorías] Nombre del ejercicio [peso]

Estiramiento, 5 min aprox de estiramientos y vuelta a la calma
```

**Particularidades del MD real** (mirar clases recientes: 15/08, 13/08, 10/08):

- La cantidad va **antes** del nombre (`12 Calf Raises`, `600 m running`, `20 Wall Ball Shot`), no
  después. También aparece como tiempo (`60 seg Assault Bike`) o distancia (`12 metros Burpee Broad Jump`).
- **Dos videos por ejercicio**: `video corto <URL>` → `video_path` (el popup de la ficha) y
  `video explicativo <URL>` → `video_long_path` (el tutorial largo). Si sólo hay una URL, va a
  `video_path`. Los videos suelen citarse una sola vez, en la primera aparición del ejercicio.
- En Movilidad y Estiramiento muchas veces no hay nombre de ejercicio sino una **descripción en
  español** ("en cuclillas, roto y subo el brazo"). Hay que traducirla a un nombre de ejercicio en
  inglés — reutilizando uno existente si el movimiento ya está (§4a) — y dejar la frase original del
  MD en `coach_notes` de ese `section_exercise`.
- Las rondas de un circuito a veces vienen **desenrolladas** (la lista repite los mismos ejercicios
  4 veces). En ese caso cargar el circuito **una sola vez** y poner `total_rounds` en la sección.
- El encabezado de la sección trae el formato y el tiempo (`Fuerza 5 rondas cada 3 minutos`,
  `WOD 25 minutos maximo`, `Activacion mayor cantidad de vueltas en 6 minutos`) → de ahí salen
  `work_format`, `total_rounds`, `time_cap_seconds` e `interval_seconds` (PASO 3).
- El MD tiene erratas y falta de tildes ("Activacion", "mintuos"). Se interpreta, no se copia literal.

---

## 4. PROCESO PASO A PASO

### PASO 1 – Parsear la clase

Leer la clase del archivo `BKP/Ejercicios.md` e identificar:
- Fecha de la clase (formato DD/MM/YYYY → convertir a YYYY-MM-DD para la BD)
- Nombre: **"GOAT DD/MM/YYYY"** — es el naming que usan las clases desde 2026-05 (las viejas
  "Clase GOAT DD/MM/YYYY" quedaron así por historia). Tiene que ser único (§2).
- Secciones y sus ejercicios
- Para cada ejercicio: nombre, repeticiones/tiempo/distancia/calorías, peso, video corto y explicativo

### PASO 2 – Mapear secciones a `section_type`

**Actualizado (migración v014):** "Movilidad" ya **no** se carga como "Entrada en calor". Tiene su
propio tipo, creado desde Configuración → Tipos de sección. La v014 reasignó retroactivamente las
secciones tituladas "Movilidad" que estaban colgando de "Entrada en calor".

| Término en Ejercicios.md          | `section_type.name` en BD | Icono    | Color   |
|-----------------------------------|---------------------------|----------|---------|
| Calentamiento                     | Entrada en calor          | Flame    | #22c55e |
| Movilidad                         | **Movilidad**             | Activity | #14b8a6 |
| Activacion / Activación           | Activación                | Zap      | #f59e0b |
| Fuerza                            | Fuerza                    | Dumbbell | #ef4444 |
| Técnica / progresión de un lift   | Habilidad                 | Star     | #8b5cf6 |
| WOD / MetCon                      | WOD                       | Timer    | #f97316 |
| Estiramiento / vuelta a la calma  | Vuelta a la calma         | Wind     | #06b6d4 |
| Accesorio / trabajo complementario| Accesorio                 | Plus     | #64748b |

> "Movilidad" **no** está en el seed de catálogos (`seedService.ts` / `seedService2.ts`): existe
> porque el usuario la creó a mano. Igual hay que incluirla en `catalogs.section_type` del ZIP con
> su color e icono: si el destino ya la tiene, se reutiliza por nombre; si no, el importador la crea.
> Mismo criterio para cualquier tipo que no esté en el seed.

> Si la clase trae Calentamiento **y** Movilidad, son dos secciones **de tipo distinto** — ya no dos
> del mismo tipo. Eso es justamente lo que arreglaron v013/v014: dos secciones del mismo tipo en una
> clase rompían la agrupación de resultados de sesión y el gráfico de distribución de Estadísticas.
> Si por lo que sea hacen falta dos secciones del mismo tipo, distinguirlas siempre con
> `visible_title` distinto (ej. "Fuerza A" / "Fuerza B").

### PASO 3 – Identificar formato de trabajo (`work_format`)

| Descripción en MD                                        | `work_format.name` | Campos a cargar                                |
|----------------------------------------------------------|--------------------|------------------------------------------------|
| "X rondas de Y repeticiones por 1 minuto" / EMOM         | EMOM               | `total_rounds`, `interval_seconds` si ≠ 60      |
| "X rondas" sin tiempo fijo                                | Por rondas         | `total_rounds`                                 |
| "N series/rondas **cada X minutos**"                      | E2MOM              | `total_rounds` + `interval_seconds = X × 60`   |
| "máximo N minutos" / contra el reloj                     | For Time           | `time_cap_seconds`                             |
| "**mayor cantidad de vueltas** en N minutos" / "AMRAP"    | AMRAP              | `time_cap_seconds` (sin `total_rounds`)        |
| "series fijas" / rondas con descanso fijo                | Series fijas       | `total_rounds`, `rest_between_rounds_seconds`  |
| "trabajo libre" / calentamiento sin estructura            | Trabajo libre      | `time_cap_seconds`                             |
| Intervalos alternados (A/B)                               | Intervalos         | `total_rounds`, `interval_seconds`             |
| "N segundos de trabajo / N de descanso"                   | Tabata             | `total_rounds`, `interval_seconds` si ≠ 30     |
| Reps que suben o bajan cada ronda (21-15-9, escalera)     | Escalera           | `time_cap_seconds`; reps por ronda en `coach_notes` |

> **Ojo con E2MOM:** el nombre dice "cada 2 minutos" pero en la práctica se usa para *cualquier*
> ventana distinta de 60 s. "5 rondas cada 3 minutos" → `E2MOM` + `interval_seconds: 180`. La
> ventana explícita de la sección siempre le gana al `default_interval_seconds` del formato.

> **Formatos de ventana fija (`is_interval = 1`):** EMOM (60s), E2MOM (120s), Tabata (30s),
> Intervalos (60s). En estos formatos el cronómetro le da a cada ejercicio una ventana completa:
> lo que sobra del trabajo se convierte automáticamente en descanso. Si el MD indica otra ventana
> ("cada 1.5 minutos"), cargar `class_section.interval_seconds` con ese valor (90). Ver sección 7.

### PASO 4 – Verificar qué ejercicios ya existen

Antes de inventar un ejercicio nuevo hay que agotar la búsqueda del que ya está. Hoy hay
**275 SVG** en `public/img/exercises/` y más de 250 ejercicios usados en clases, así que lo normal
es que el movimiento ya exista con otro nombre.

**Orden de búsqueda:**

1. `ls public/img/exercises/` — es la **fuente de la verdad** del inventario de SVG (la lista de §4a
   es una foto al 2026-08-15 y envejece con cada clase).
2. `src/services/imageUpdateService.ts` — array `EXERCISE_IMAGES` con pares
   `nombre exacto en BD → /img/exercises/x.svg`. Sirve para saber **con qué nombre está cargado en
   la BD** un SVG determinado.
3. `PosiblesEjerciciosRepetidos.md` (raíz del repo) — lista de nombres duplicados/parecidos que ya
   se usaron en clases, con las clases donde aparece cada uno. Es el mejor índice de nombres reales.
4. `src/services/videoUpdateService.ts` y los `seedService*.ts` — más nombres reales de la BD.

#### 4a. Convención de nombres (importante)

El importador matchea por `UPPER(TRIM(name))`: **un nombre distinto = un ejercicio nuevo**. Para no
seguir generando duplicados:

- Nombre en **inglés, Title Case**, prefijado por el implemento cuando corresponde:
  `Barbell …`, `Dumbbell …`, `Kettlebell …`, `Bodyweight …`, `Ring …`, `Band …`, `Sandbag …`.
- **`and`, no `&`**: en la BD está `Barbell Clean and Jerk`, `Kettlebell Good Morning to Squat`.
- Guiones como los usa CrossFit: `Push-Up`, `Pull-Up`, `Sit-Up`, `Toes-to-Bar`, `Knees-to-Elbows`,
  `Muscle-Up`, `Step-Up`, `Step-Over`, `Chest-to-Bar`.
- Archivo SVG = kebab-case del nombre: `Barbell Snatch Grip Deadlift` → `barbell-snatch-grip-deadlift.svg`.
- **Antes de crear un nombre nuevo**, buscar la variante sin prefijo y con prefijo (`Snatch High Pull`
  vs `Barbell Snatch High Pull`): las dos existen como SVG y ese es exactamente el tipo de duplicado
  que hubo que fusionar después.
- Si igual quedan dos ejercicios que son el mismo movimiento, se arreglan desde
  **Configuración → Gestión de datos → Migrar / fusionar ejercicios**, que reasigna clases, sesiones
  y récords al ejercicio destino y borra el origen.

#### 4b. SVG existentes al 2026-08-15 (275 archivos, sin la extensión `.svg`)

- **A** — ab-wheel-kneeling-rollout, ab-wheel-standing-rollout, air-squat, alternating-90-90-into-shin-box, alternating-double-clubbell-front-flag-press, alternating-heel-touches, alternating-kettlebell-row, alternating-single-arm-dumbbell-power-snatch, alternating-spiderman-stretch, american-kettlebell-swing, ankle-mobility-rock, arm-circles, assault-bike
- **B** — back-squat, banded-ankle-dorsiflexion-stretch, banded-prone-leg-curl, banded-triceps-extensions, band-external-rotation, band-pass-through, band-pull-apart, band-row, band-triceps-pushdown, barbell-bench-press, barbell-bent-over-row, barbell-bicep-curl, barbell-clean-and-jerk, barbell-deadlift, barbell-front-rack-reverse-lunge, barbell-front-squat, barbell-good-morning, barbell-hang-clean, barbell-hang-clean-and-jerk, barbell-hang-muscle-clean-and-press, barbell-hang-muscle-clean-press, barbell-hang-power-clean, barbell-hang-power-cluster, barbell-hang-power-snatch, barbell-high-hang-power-clean, barbell-low-hang-power-clean, barbell-lunge, barbell-muscle-snatch, barbell-overhead-squat, barbell-power-snatch, barbell-push-jerk, barbell-push-press, barbell-romanian-deadlift, barbell-shrug, barbell-snatch-grip-deadlift, barbell-snatch-high-pull, barbell-snatch-pause-at-knee, barbell-squat-clean, barbell-strict-press, barbell-sumo-deadlift-high-pull, barbell-thruster, barbell-upright-row, bar-kip-swing, bar-muscle-up, bear-crawl-hold, bent-over-dumbbell-lateral-raise, bicycle-crunch, bird-dog-crunch, bird-dog-hold, bodyweight-glute-bridge, bodyweight-handstand-push-up, bodyweight-hollow-body-hold, bodyweight-pistol-squat, bodyweight-push-up, bodyweight-sit-up, box-jump, box-jump-over, box-step-up, breathing-4-6, bulgarian-split-squat, burpee, burpee-broad-jump, burpee-over-the-bar, burpee-to-bar
- **C** — calf-raise-hold, cat-cow, chest-to-bar-pull-up, childs-pose, clamshell-hold, clean-and-jerk, cobra-pose, cool-down-stretch, core-overhead-hold-side-bend, cossack-squat, couch-stretch, counterbalance-squat, cross-body-mountain-climbers, cuban-press
- **D** — dead-bug, dead-bug-hold-dumbbell, deadlift, dips, doorway-chest-stretch, double-dumbbell-overhead-walking-lunge, double-under, dual-dumbbell-snatch-with-burpee, dumbbell-alternating-bent-over-row, dumbbell-bench-press, dumbbell-bicep-curl, dumbbell-burpee-snatch, dumbbell-deadlift, dumbbell-devils-press, dumbbell-front-rack-lunge, dumbbell-front-raise, dumbbell-hang-clean-and-push-jerk, dumbbell-lateral-step-over, dumbbell-one-arm-overhead-lunge, dumbbell-overhead-hold, dumbbell-push-press, dumbbell-row, dumbbell-split-clean, dumbbell-thruster, dumbbell-wall-sit, dynamic-warm-up
- **F** — farmers-carry, front-squat
- **G** — general-stretching, ghd-back-extension, ghd-sit-up, goblet-squat-hold-press
- **H** — half-kneel-banded-lat-stretch, half-kneeling-ankle-dorsiflexion-stretch, half-kneeling-hip-flexor-hamstring-dynamic-stretch, half-kneeling-hip-flexor-stretch, half-kneeling-thoracic-rotation, hanging-flutter-kicks, hanging-knees-to-elbows, hanging-leg-raise-rotation-over-box, hanging-toes-to-bar, high-knee-clap, high-pull-external-rotation, hip-90-90-internal-rotation-liftoff, hip-90-90-rotation, hip-rotations-in-squat, hollow-body-rock, hollow-hold, hollow-hold-pass, hollow-rock, hollow-to-superman-roll
- **I** — inchworm, isometric-lunge, isometric-push-up-hold
- **J** — jumping-lunge, jump-rope
- **K** — kettlebell-ankle-mobility-drill, kettlebell-box-step-over, kettlebell-clean-and-jerk, kettlebell-deadlift, kettlebell-farmer-carry, kettlebell-front-squat, kettlebell-good-morning, kettlebell-good-morning-to-squat, kettlebell-ground-to-overhead, kettlebell-jumping-lunge, kettlebell-leg-overs, kettlebell-push-up, kettlebell-single-leg-romanian-deadlift, kettlebell-snatch, kettlebell-sumo-deadlift-high-pull, kettlebell-swing, kettlebell-windmill
- **L** — lateral-lunge, lateral-raise-to-overhead
- **M** — march-in-place, med-ball-box-step-over, mountain-climbers
- **N** — nordic-hamstring-curl
- **O** — overhead-squat, overhead-triceps-stretch
- **P** — partner-wall-ball-over-bar, partner-wall-ball-sit-up, pigeon-pose, pike-hold, plank-hold, plank-shoulder-taps, plank-to-opposite-toe-touch, plank-up-down, power-clean, pullup, push-press, push-press-behind-the-neck, pushup
- **Q** — quadruped-rock-back, quadruped-thoracic-rotation
- **R** — reverse-snow-angels, ring-dip, ring-handstand-push-up, ring-row, ring-strict-muscle-up, rope-climb, rowing, running, russian-twist
- **S** — sally-up-sally-down, sandbag-carry, sandbag-walking-lunges, scapular-plank-hold, scapular-push-up, scapular-push-up-dina, scapular-wall-slides, seated-forward-fold, seated-leg-tucks, seated-quad-stretch, shadow-boxing, shoulder-press, shuttle-run, side-plank, side-plank-con-carga, side-plank-weighted, single-arm-dumbbell-push-press, single-leg-calf-raise, single-leg-dumbbell-romanian-deadlift, single-leg-pallof-press, single-leg-toes-to-bar, single-leg-v-up, single-leg-wall-sit, skierg, sled-push-pull, snatch, snatch-grip-deadlift, snatch-high-pull, snatch-pause-at-knee, spiderman-stretch-rotation, split-squat-calf-raise, squat, squat-press-out, squat-thoracic-rotation, stability-ball-plate-crunch, standing-biceps-stretch, standing-cross-crunch, standing-hamstring-stretch, standing-knees-to-elbow, standing-quad-stretch, step-jack, strict-knees-to-elbows, superband-shoulder-dislocates, superman-hold, supine-abdominal-stretch, supine-figure-4-stretch, supine-spinal-twist
- **T** — tempo-push-up, tempo-squat, thruster, toes-to-bar, toe-touch-crunch, toe-touch-sit-up, towel-isometric-curl, towel-isometric-row
- **V** — v-up
- **W** — walking, walking-lunge, wall-ball-box-over, wall-ball-run, wall-ball-shot, wall-lat-stretch, wall-shoulder-car, wall-shoulder-external-rotation, wall-shoulder-stretch, wall-sit, wall-sit-with-leg-extension, wall-squat-hold, wall-thoracic-extensions, wall-walk, weighted-bird-dog, weighted-box-step-up, weighted-hollow-rock, weighted-lunge, weighted-plank, weighted-sit-up, wrist-extensor-stretch
- **Y** — yoga-push-up, y-raises

> **Pares duplicados o casi-duplicados ya detectados en esta carpeta** (elegir uno, no crear un
> tercero):
> `barbell-hang-muscle-clean-and-press` / `barbell-hang-muscle-clean-press`,
> `scapular-push-up` / `scapular-push-up-dina`,
> `side-plank-weighted` / `side-plank-con-carga`,
> `snatch-grip-deadlift` / `barbell-snatch-grip-deadlift`,
> `snatch-high-pull` / `barbell-snatch-high-pull`,
> `snatch-pause-at-knee` / `barbell-snatch-pause-at-knee`,
> `pushup` / `bodyweight-push-up`, `hollow-rock` / `hollow-body-rock`,
> `farmers-carry` / `kettlebell-farmer-carry`, `walking-lunge` / `weighted-lunge` (revisar cuál
> corresponde antes de reusar).
> La versión **con prefijo de implemento** es la preferida para ejercicios nuevos.

### PASO 5 – Para cada ejercicio NUEVO (sin SVG), crear el SVG

**Reglas generales del SVG:**
- viewBox: `0 0 200 230`
- Fondo: `<rect width="200" height="230" fill="#111827" rx="12"/>`
- Línea de piso: `<line x1="30" y1="210" x2="170" y2="210" stroke="#374151" stroke-width="3" stroke-linecap="round"/>`
- Nombre del ejercicio en la parte inferior: font-size="10", fill="#475569", en mayúsculas, máx 20 chars
- Color del stick figure: `#94a3b8` (cuerpo) y `#64748b` (articulaciones/círculos)
- **3 frames animados** con clases CSS `f1`, `f2`, `f3`

**Template CSS de animación (siempre el mismo):**
```xml
<style>
  .f1{animation:sh1 4s linear infinite}.f2{animation:sh2 4s linear infinite}.f3{animation:sh3 4s linear infinite}
  @keyframes sh1{0%,27%{opacity:1}33%,90%{opacity:0}100%{opacity:1}}
  @keyframes sh2{0%,33%{opacity:0}40%,60%{opacity:1}66%,100%{opacity:0}}
  @keyframes sh3{0%,66%{opacity:0}72%,93%{opacity:1}100%{opacity:0}}
</style>
```

**Anatomía del stick figure estándar (de pie):**
- Cabeza: `<circle cx="100" cy="26" r="14" fill="#94a3b8"/>`
- Torso: `x1="100" y1="40" x2="100" y2="108"` (de cuello a cadera)
- Brazos horizontales: y=52 (shoulders), extremos en x=78 y x=122
- Caderas (bifurcación): y=108
- Piernas: bajan desde y=108 hasta y=162 (rodillas) y luego a y=205 (pies)
- Pies: líneas horizontales a y=205

**Los 3 fotogramas deben mostrar las 3 posiciones clave del movimiento:**
- Frame 1 (f1): Posición inicial
- Frame 2 (f2): Posición media / punto de mayor esfuerzo
- Frame 3 (f3): Posición final / de retorno

**Nombre del archivo SVG:** kebab-case del nombre del ejercicio en inglés.
Ejemplo: "Band Pull-Apart" → `band-pull-apart.svg`

**Guardar en:** `public/img/exercises/`

> 📐 **Guía completa del SVG:** `BKP/ACTUALIZO_SVG_3FOTOG.md` tiene el patrón detallado (paleta,
> timing, anatomía por tipo de movimiento, ejemplos). Lo de arriba es el resumen.
> **Salvedad:** ese documento pide además crear un service TypeScript + un botón en
> "Registrar imágenes" para grabar la `image_url` en la BD. **Para una clase eso no hace falta**:
> la `image_url` viaja en el `class-share.json` del ZIP y el importador la escribe sola, tanto en
> los ejercicios nuevos como en los que ya existían. El service/botón sólo se usa cuando se dibujan
> SVG sueltos, fuera del flujo de una clase.

### PASO 6 – Determinar datos de cada ejercicio (incluidos los músculos)

Para cada ejercicio de la clase — **nuevo o reutilizado** — definir:

| Campo | Descripción | ¿También para reutilizados? |
|-------|-------------|-----------------------------|
| `name` | Nombre en inglés, Title Case, según la convención de §4a | sí (es la clave de match) |
| `description` | Descripción en español, 1-3 oraciones sobre cómo se ejecuta | sólo si el existente no la tiene |
| `technical_notes` | Notas técnicas: errores comunes, puntos clave de forma | sólo si falta |
| `difficulty` | Básico / Intermedio / Avanzado / Experto | opcional |
| `primary_muscle` | **1 músculo primario** — nombre exacto del catálogo (§5.1) | **SÍ, siempre** |
| `secondary_muscles[]` | 1 a N **músculos secundarios** — mismo catálogo (§5.1) | **SÍ, siempre** |
| `equipment[]` | Equipamiento necesario (§5.2) | sí |
| `tags[]` | Tags relevantes (§5.7) | sí |
| `section_types[]` | En qué tipos de sección suele aparecer | sí |
| `units[]` | Unidades de medida (la primera es `is_default: 1`) | sí |
| `video_path` | Video **corto** (el del popup de la ficha) — "video corto" del MD | si el MD lo trae |
| `video_long_path` | Video **explicativo/tutorial** — "video explicativo" del MD | si el MD lo trae |
| `is_compound` | 1 si trabaja múltiples articulaciones, 0 si es monoarticular | sí |
| `image_url` | `/img/exercises/nombre-del-archivo.svg` | sí (repara fichas sin imagen) |

#### 6.1 Músculos: cómo asignarlos (paso obligatorio)

Cada ejercicio necesita **1 primario + al menos 2 secundarios** (salvo monoarticulares puros, donde
puede haber 1 solo secundario). Se cargan en dos lugares del JSON, y hay que poner los dos:

1. `exercise.primary_muscle_group_id` → el músculo primario.
2. `exercise_relations.exercise_muscle_group` → **una fila por músculo**, incluido el primario
   (con `is_primary: 1`) y una por cada secundario (`is_primary: 0`).

> El primario va **repetido** en los dos lados: el campo alimenta el filtro y el badge de la lista de
> ejercicios; las filas de `exercise_muscle_group` alimentan el mapa muscular
> (`MuscleMapSVG.tsx`) y el gráfico de músculos de Estadísticas. Si falta la fila, el mapa no pinta
> nada aunque el campo esté cargado.

**Fuentes para decidir los músculos**, en orden:

1. `src/services/muscleSeedService.ts` — mapa `EXERCISE_MUSCLES` con primarios/secundarios de ~90
   ejercicios base ya curados. Si el movimiento está ahí (o es una variante directa), copiar de ahí.
2. La tabla de patrones de movimiento de §5.1.
3. `BKP/exercises-dataset-main/data/exercises.json` — el dataset externo trae `targetMuscles` y
   `secondaryMuscles` por ejercicio (en inglés) para los 1.324 movimientos que cubre. Sólo consulta.

**Reglas prácticas:**
- El primario es el músculo que **limita** el movimiento, no el que más se siente.
- En los levantamientos olímpicos completos el primario es de pierna/cadera (`Glúteo mayor` o
  `Recto femoral`), y hombro/trapecio van de secundarios.
- Todo lo que se sostiene con brazos extendidos overhead suma `Deltoides anterior` y
  `Recto abdominal` como secundarios.
- Todo lo que se hace colgado de la barra suma `Flexores antebrazo`.
- Los estiramientos también llevan músculos: el que se estira es el primario.

### PASO 7 – Construir el JSON de salida

El archivo dentro del ZIP se llama **`class-share.json`** (NO `data.json` — ese nombre es del
backup completo, un formato distinto). Es el mismo formato que exporta el botón "Exportar
Clase(s)" de la app (`exportClasses()` en `src/services/classShareService.ts`), y lo consume el
importador ya existente `importClassFromZip()` (aditivo, resuelve todo por nombre). Estructura:

```json
{
  "meta": {
    "app": "CrossFit Session Tracker",
    "type": "class-share",
    "version": "<versión de la app, ver src/config/version.ts — OJO: el APP_VERSION de src/utils/constants.ts quedó en 1.0.0 y no se usa para esto>",
    "exportDate": "2026-08-01T09:00:00.000Z",
    "classCount": 1
  },
  "catalogs": {
    "muscle_group":       [ { "id": "...", "name": "..." }, ... ],
    "equipment":          [ { "id": "...", "name": "...", "category": "..." }, ... ],
    "measurement_unit":   [ { "id": "...", "name": "..." }, ... ],
    "difficulty_level":   [ { "id": "...", "name": "..." }, ... ],
    "tag":                [ { "id": "...", "name": "..." }, ... ],
    "section_type":       [ { "id": "...", "name": "..." }, ... ],
    "work_format":        [ { "id": "...", "name": "...", "is_interval": 0, "default_interval_seconds": null }, ... ]
  },
  "exercises": [ { "id": "...", "name": "...", "primary_muscle_group_id": "...",
                   "image_url": "/img/exercises/....svg" /* reutilizado: ver nota */ },
                 { "id": "...", "name": "...", "description": "...", "technical_notes": "...",
                   "difficulty_level_id": "...", "primary_muscle_group_id": "...",
                   "image_url": "/img/exercises/....svg", "video_path": "...", "video_long_path": "...",
                   "is_compound": 0, "is_active": 1, "created_at": "...", "updated_at": "..." } ],
  "exercise_relations": {
    "exercise_muscle_group":  [ { "exercise_id": "...", "muscle_group_id": "...", "is_primary": 1 }, ... ],
    "exercise_equipment":     [ { "exercise_id": "...", "equipment_id": "...", "is_required": 1 }, ... ],
    "exercise_section_type":  [ { "exercise_id": "...", "section_type_id": "..." }, ... ],
    "exercise_unit":          [ { "exercise_id": "...", "measurement_unit_id": "...", "is_default": 1 }, ... ],
    "exercise_tag":           [ { "exercise_id": "...", "tag_id": "..." }, ... ]
  },
  "classes": [ { "id": "...", "date": "2026-08-15", "name": "GOAT 15/08/2026",
                 "objective": "...", "general_notes": null, "estimated_duration_minutes": 55,
                 "is_favorite": 0, "is_active": 1, "created_at": "...", "updated_at": "..." } ],
  "class_sections": [ { "id": "...", "class_template_id": "...", "section_type_id": "...",
                         "work_format_id": "...", "sort_order": 1, "visible_title": "...",
                         "general_description": "...", "time_cap_seconds": null, "total_rounds": null,
                         "rest_between_rounds_seconds": null, "notes": null,
                         "rest_between_exercises_seconds": null, "rest_after_section_seconds": null,
                         "interval_seconds": null, "created_at": "...", "updated_at": "..." } ],
  "section_exercises": [ { "id": "...", "class_section_id": "...", "exercise_id": "...", "sort_order": 1,
                            "coach_notes": null, "planned_repetitions": null, "planned_weight_value": null,
                            "planned_weight_unit_id": null, "planned_time_seconds": null,
                            "planned_distance_value": null, "planned_distance_unit_id": null,
                            "planned_calories": null, "planned_rest_seconds": null, "planned_rounds": null,
                            "suggested_timer_seconds": null, "rm_percentage": null, "suggested_scaling": null,
                            "notes": null, "created_at": "...", "updated_at": "..." } ]
}
```

**Notas clave (diferentes al viejo formato `data.json`):**

- **Ejercicios nuevos**: incluir todos los campos de `exercise` (PASO 6) + sus 5 relaciones
  (`exercise_muscle_group`, `_equipment`, `_section_type`, `_unit`, `_tag`). El importador los crea
  si no encuentra el nombre.
- **Ejercicios reutilizados** (ya existen en la BD — §4a): la regla vieja de mandar *sólo `id` +
  `name`* **quedó obsoleta**. Se manda:
  - `id`, `name` (clave de match, `UPPER(TRIM(name))`),
  - `primary_muscle_group_id` **siempre**,
  - `image_url` si el SVG existe (así se repara la ficha si estaba sin imagen),
  - `video_path` / `video_long_path` **sólo si el MD trae URLs nuevas** para ese ejercicio,
  - `description` / `technical_notes` **sólo si el ejercicio no las tenía** (mandarlas las pisa),
  - filas de `exercise_muscle_group` (primario + secundarios) **siempre**.

  Lo que **no** se manda, no se toca: la actualización es campo por campo (§2). Lo que sí se manda
  **pisa** el valor anterior, y en las relaciones (músculos, equipamiento, tags, unidades,
  section_types) el reemplazo es total (DELETE + INSERT). Por eso: si se mandan músculos, mandarlos
  **completos**; si se manda una sola relación (ej. tags), esa relación queda sólo con lo del ZIP.
- **Nunca mandar una relación a medias.** Un `exercise_equipment` con una sola fila borra el resto
  del equipamiento que el ejercicio ya tenía.
- Los `id` de catálogos/ejercicios/secciones son sólo identificadores **internos del JSON** para
  enlazar filas entre sí (no tienen que coincidir con nada de la BD real) — el importador los
  resuelve a los IDs locales del usuario por nombre al importar.
- No hace falta incluir `training_session`, `session_exercise_result` ni `personal_record`: este
  formato es sólo de la clase, nunca toca el progreso del usuario.
- Media (imágenes subidas por el usuario, no SVG estáticos): sólo si algún ejercicio nuevo usa una
  imagen que no es un SVG de `/img/exercises/`, agregar carpeta `media/` al ZIP (ver
  `classShareService.ts` → `restoreMedia`). Para ejercicios con SVG en `public/img/exercises/`
  (el caso normal, PASO 5) **no hace falta** carpeta `media/`: `image_url` ya apunta a un path
  estático servido por la app.

### PASO 8 – Generar IDs y armar el ZIP

Todos los IDs son UUID v4 (`crypto.randomUUID()` o equivalente). Asignar un ID único por entidad en
el JSON. Para armar el ZIP, el camino más simple y menos propenso a errores es un script Node de un
solo uso (usando el paquete `jszip` ya instalado en `node_modules`) que arma el objeto JS con la
estructura de PASO 7 y lo escribe a `BKP/clase-<nombre-clase>-<fecha>.zip` con
`zip.file('class-share.json', JSON.stringify(shareJson, null, 2))` +
`zip.generateAsync({ type: 'nodebuffer' })`. No hace falta ejecutar nada dentro de la app para
generarlo — sólo para importarlo (PASO 11).

---

## 5. CATÁLOGOS DE LA BASE DE DATOS (valores exactos del seed)

### 5.1 muscle_group — **catálogo granular de 35 músculos (vigente)**

El catálogo de músculos cambió: la app ya no usa los 12 nombres simplificados, sino los **35
músculos anatómicos** que carga `seedService2.ts` ("Inicialización unificada") y que dibuja el mapa
muscular `src/components/ui/MuscleMapSVG.tsx`. **Usar estos nombres exactos** en el ZIP.

`body_zone` es `anterior` o `posterior` (así se decide en qué vista del mapa se pinta el músculo).

**Vista ANTERIOR (frontal)**

| # | name | # | name |
|---|------|---|------|
| 1 | Cabeza y cuello | 11 | Recto abdominal |
| 2 | Esternocleidomastoideo | 12 | Oblicuo externo |
| 3 | Pectoral mayor | 13 | Oblicuo interno |
| 4 | Pectoral menor | 14 | Recto femoral |
| 5 | Deltoides anterior | 15 | Vasto lateral |
| 6 | Deltoides lateral | 16 | Vasto medial |
| 7 | Bíceps braquial | 17 | Vasto intermedio |
| 8 | Braquial anterior | 18 | Aductores |
| 9 | Braquiorradial | 19 | Tibial anterior |
| 10 | Flexores antebrazo | | |

**Vista POSTERIOR**

| # | name | # | name |
|---|------|---|------|
| 20 | Trapecio (superior) | 28 | Extensores antebrazo |
| 21 | Trapecio (medio) | 29 | Glúteo mayor |
| 22 | Trapecio (inferior) | 30 | Glúteo medio |
| 23 | Dorsal ancho | 31 | Bíceps femoral |
| 24 | Romboides | 32 | Semitendinoso |
| 25 | Erectores espinales | 33 | Semimembranoso |
| 26 | Deltoides posterior | 34 | Gastrocnemio (gemelos) |
| 27 | Tríceps braquial | 35 | Sóleo |

> `Cabeza y cuello` y `Esternocleidomastoideo` existen en el catálogo pero **no tienen zona pintable
> en el mapa** (`MuscleMapSVG` los mapea a `[]`). No usarlos como primario.

**Equivalencia con los 12 nombres simplificados viejos.** El mapa muscular todavía entiende los dos
juegos de nombres, así que un ZIP viejo no rompe nada; pero para clases nuevas se usa la columna de
la derecha. La función `toDbName()` que hacía esta traducción **ya no existe**.

| Nombre viejo (simplificado) | Nombre a usar hoy (granular)                               |
|-----------------------------|------------------------------------------------------------|
| Pectorales                  | `Pectoral mayor` (+ `Pectoral menor` si aplica)            |
| Dorsales                    | `Dorsal ancho`                                             |
| Deltoides                   | `Deltoides anterior` / `lateral` / `posterior` (el que corresponda) |
| Bíceps                      | `Bíceps braquial`                                          |
| Tríceps                     | `Tríceps braquial`                                         |
| Trapecio                    | `Trapecio (superior)` / `(medio)` / `(inferior)`           |
| Antebrazos                  | `Flexores antebrazo` (agarre) / `Extensores antebrazo`     |
| Cuádriceps                  | `Recto femoral` + `Vasto lateral` / `Vasto medial`         |
| Isquiotibiales              | `Bíceps femoral` + `Semitendinoso`                         |
| Glúteos                     | `Glúteo mayor` (+ `Glúteo medio` en unilaterales)          |
| Pantorrillas                | `Gastrocnemio (gemelos)` + `Sóleo`                         |
| Core/Abdominales            | `Recto abdominal` + `Oblicuo externo` / `interno`          |
| (espalda baja)              | `Erectores espinales`                                      |

**Tabla de referencia — músculos por patrón de movimiento** (nombres granulares, alineada con
`muscleSeedService.ts`):

| Patrón de movimiento          | Primario            | Secundarios habituales                                              |
|-------------------------------|---------------------|---------------------------------------------------------------------|
| Sentadilla (squat)            | Recto femoral       | Vasto lateral, Vasto medial, Glúteo mayor, Erectores espinales      |
| Peso muerto (DL / RDL)        | Glúteo mayor        | Bíceps femoral, Semitendinoso, Erectores espinales, Dorsal ancho, Flexores antebrazo |
| Press overhead                | Deltoides anterior  | Deltoides lateral, Tríceps braquial, Recto abdominal, Trapecio (superior) |
| Pull vertical (pull-up)       | Dorsal ancho        | Bíceps braquial, Trapecio (medio/inferior), Romboides, Braquiorradial |
| Row / jalón horizontal        | Dorsal ancho        | Trapecio (medio), Bíceps braquial, Romboides, Deltoides posterior   |
| High pull / jalón explosivo   | Trapecio (superior) | Deltoides lateral, Recto femoral, Glúteo mayor, Braquiorradial      |
| Olímpico (snatch / clean)     | Glúteo mayor        | Recto femoral, Deltoides anterior, Trapecio (superior), Erectores espinales, Bíceps femoral |
| Press horizontal (bench / push-up) | Pectoral mayor | Tríceps braquial, Deltoides anterior, Pectoral menor                |
| Cardio (correr / bike / remo) | Recto femoral       | Glúteo mayor, Gastrocnemio (gemelos), Sóleo, Bíceps femoral         |
| Saltos (box jump, soga)       | Gastrocnemio (gemelos) | Sóleo, Glúteo mayor, Vasto lateral, Tibial anterior              |
| Core / plancha                | Recto abdominal     | Oblicuo externo, Oblicuo interno, Deltoides anterior (planchas)     |
| Core rotacional (russian twist, windmill) | Oblicuo externo | Oblicuo interno, Recto abdominal                          |
| Puente de glúteo / bird dog   | Glúteo mayor        | Erectores espinales, Bíceps femoral, Recto abdominal                |
| Movilidad de hombro (band, wall slides) | Deltoides posterior | Trapecio (medio), Romboides, Deltoides lateral           |
| Movilidad torácica (cat-cow, rotaciones) | Erectores espinales | Oblicuo externo, Dorsal ancho                          |
| Movilidad de cadera (90/90, couch) | Glúteo mayor   | Glúteo medio, Bíceps femoral, Recto femoral                         |
| Movilidad de tobillo          | Sóleo               | Gastrocnemio (gemelos), Tibial anterior                             |
| Carry (farmer, sandbag)       | Trapecio (superior) | Flexores antebrazo, Recto abdominal, Erectores espinales            |
| Lunge / step-up / step-over   | Recto femoral       | Glúteo mayor, Glúteo medio, Vasto lateral, Bíceps femoral           |
| Curl de bíceps                | Bíceps braquial     | Braquial anterior, Braquiorradial                                   |
| Extensión de tríceps          | Tríceps braquial    | Extensores antebrazo                                                |
| Calf raise                    | Gastrocnemio (gemelos) | Sóleo, Tibial anterior                                           |
| Estiramiento de isquios       | Bíceps femoral      | Semitendinoso, Gastrocnemio (gemelos)                               |
| Estiramiento de cuádriceps    | Recto femoral       | Vasto lateral, Vasto medial                                         |
| Estiramiento de pecho/hombro  | Pectoral mayor      | Deltoides anterior, Pectoral menor                                  |
| Estiramiento de cadera/glúteo | Glúteo mayor        | Glúteo medio, Aductores                                             |

### 5.2 equipment

```json
[
  {"name":"Barra olímpica",    "category":"barbell"},
  {"name":"Mancuernas",        "category":"dumbbell"},
  {"name":"Kettlebell",        "category":"kettlebell"},
  {"name":"Anillas",           "category":"bodyweight"},
  {"name":"Pull-up bar",       "category":"bodyweight"},
  {"name":"Rower",             "category":"cardio"},
  {"name":"Assault bike",      "category":"cardio"},
  {"name":"Cuerda para saltar","category":"cardio"},
  {"name":"Box de salto",      "category":"other"},
  {"name":"Banda elástica",    "category":"other"},
  {"name":"Balón medicinal",   "category":"other"},
  {"name":"Wall ball",         "category":"other"},
  {"name":"Paralelas",         "category":"bodyweight"},
  {"name":"GHD",               "category":"machine"},
  {"name":"Sled",              "category":"other"},
  {"name":"Disco",             "category":"other"},
  {"name":"Stability Ball",    "category":"other"}
]
```

> Los últimos dos (`Disco`, `Stability Ball`) están en `seedService.ts` pero **no** en
> `seedService2.ts` (la inicialización unificada). Si el usuario inicializó con la 2, no los tiene:
> igual se los incluye en `catalogs.equipment` del ZIP y el importador los crea.
>
> Equipamiento que aparece en clases recientes y **no** está en ningún seed — incluirlo en el ZIP
> con su `category` para que se cree: `SkiErg` (cardio), `Sandbag` (other), `Cuerda` / soga de trepa
> (other), `Toalla` (other), `Silla / banco` (other), `Superband` (other, distinto de la banda
> elástica común), `Clubbell` (other), `Ab wheel` (other), `Pared` (other, para wall sit / wall
> walk / wall slides).
>
> Los ejercicios de peso corporal puro **no llevan ninguna fila** en `exercise_equipment`.

### 5.3 difficulty_level

| name        | color   | numeric_value |
|-------------|---------|---------------|
| Básico      | #22c55e | 1             |
| Intermedio  | #f59e0b | 2             |
| Avanzado    | #ef4444 | 3             |
| Experto     | #8b5cf6 | 4             |

### 5.4 section_type

| name             | color   | icon     | default_order | ¿en el seed? |
|------------------|---------|----------|---------------|--------------|
| Entrada en calor | #22c55e | Flame    | 1             | sí           |
| Activación       | #f59e0b | Zap      | 2             | sí           |
| Fuerza           | #ef4444 | Dumbbell | 3             | sí           |
| Habilidad        | #8b5cf6 | Star     | 4             | sí           |
| WOD              | #f97316 | Timer    | 5             | sí           |
| Vuelta a la calma| #06b6d4 | Wind     | 6             | sí           |
| Accesorio        | #64748b | Plus     | 7             | sí           |
| **Movilidad**    | #14b8a6 | Activity | 8             | **no** — creado a mano, ver PASO 2 y migración v014 |

### 5.5 work_format

| name         | has_time_cap | has_rounds | is_interval | default_interval_seconds |
|--------------|:------------:|:----------:|:-----------:|:------------------------:|
| Por rondas   | 0            | 1          | 0           | —                        |
| EMOM         | 1            | 1          | 1           | 60                       |
| AMRAP        | 1            | 0          | 0           | —                        |
| For Time     | 1            | 0          | 0           | —                        |
| Series fijas | 0            | 1          | 0           | —                        |
| Trabajo libre| 0            | 0          | 0           | —                        |
| Intervalos   | 1            | 1          | 1           | 60                       |
| Tabata       | 1            | 1          | 1           | 30                       |
| E2MOM        | 1            | 1          | 1           | 120                      |
| Escalera     | 0            | 0          | 0           | —                        |

> `is_interval` y `default_interval_seconds` los agrega la migración v011 y los consume el
> cronómetro. Son editables desde Configuración → Formatos de trabajo.

### 5.6 measurement_unit

| name         | abbreviation | unit_type   |
|--------------|--------------|-------------|
| Kilogramos   | kg           | weight      |
| Libras       | lb           | weight      |
| Repeticiones | rep          | repetitions |
| Calorías     | cal          | calories    |
| Minutos      | min          | time        |
| Segundos     | seg          | time        |
| Metros       | m            | distance    |
| Kilómetros   | km           | distance    |
| Millas       | mi           | distance    |

### 5.7 tag

Los 14 del seed: `hombro`, `sentadilla`, `core`, `olímpico`, `gimnástico`, `cardio`,
`monoarticular`, `press`, `pull`, `push`, `bilateral`, `unilateral`, `isométrico`, `pliométrico`.

`movilidad` y `activación` **no** están en el seed pero se usan desde clases anteriores: incluirlos
en `catalogs.tag` del ZIP (con un color) y el importador los crea si faltan.

---

## 6. ESTRUCTURA DE TABLAS CLAVE (con todos sus campos)

### exercise
```json
{
  "id": "uuid-v4",
  "name": "Nombre en inglés",
  "description": "Descripción en español",
  "technical_notes": "Notas técnicas en español",
  "difficulty_level_id": "id del difficulty_level",
  "primary_muscle_group_id": "id del muscle_group principal",
  "image_url": "/img/exercises/nombre.svg",
  "image_path": null,
  "video_path": "https://www.youtube.com/shorts/...",
  "video_long_path": "https://www.youtube.com/watch?v=...",
  "is_compound": 1,
  "is_active": 1,
  "created_at": "2026-08-15 00:00:00",
  "updated_at": "2026-08-15 00:00:00"
}
```
> - `video_path` = video **corto** (popup de la ficha). `video_long_path` = video **explicativo**.
>   En el MD vienen etiquetados así ("video corto" / "video explicativo").
> - `image_url` = SVG estático servido por la app. `image_path` = imagen subida por el usuario
>   (queda en `null` en este flujo).
> - Verificar que el ID de YouTube exista antes de cargarlo:
>   `https://www.youtube.com/oembed?url=<URL>&format=json` → HTTP 200 significa que existe y es
>   embebible.

### exercise_muscle_group
```json
{
  "id": "uuid-v4",
  "exercise_id": "id del exercise",
  "muscle_group_id": "id del muscle_group",
  "is_primary": 1
}
```
> `is_primary: 1` para el músculo principal, `0` para los secundarios. **Tiene que haber una fila
> con `is_primary: 1`** que apunte al mismo músculo que `exercise.primary_muscle_group_id` (§6.1).

### exercise_equipment
```json
{
  "id": "uuid-v4",
  "exercise_id": "id del exercise",
  "equipment_id": "id del equipment",
  "is_required": 1
}
```

### exercise_section_type
```json
{
  "id": "uuid-v4",
  "exercise_id": "id del exercise",
  "section_type_id": "id del section_type"
}
```

### exercise_unit
```json
{
  "id": "uuid-v4",
  "exercise_id": "id del exercise",
  "measurement_unit_id": "id del measurement_unit",
  "is_default": 1
}
```
> `is_default: 1` para la primera unidad, `0` para las demás.

### exercise_tag
```json
{
  "id": "uuid-v4",
  "exercise_id": "id del exercise",
  "tag_id": "id del tag"
}
```

### class_template
```json
{
  "id": "uuid-v4",
  "date": "2026-08-15",
  "name": "GOAT 15/08/2026",
  "objective": "Descripción del objetivo de la clase",
  "general_notes": null,
  "estimated_duration_minutes": 60,
  "is_favorite": 0,
  "template_type": "my_classes",
  "is_active": 1,
  "created_at": "2026-08-15 00:00:00",
  "updated_at": "2026-08-15 00:00:00"
}
```
> `template_type` (migración v008) separa **"Mis clases"** (`my_classes`) de las plantillas
> genéricas (`generic`: Girls, Heroes, Open). El importador de clases lo fuerza a `'my_classes'`
> ignorando lo que venga en el JSON, así que el campo es informativo — pero conviene dejarlo escrito
> para que el JSON refleje la tabla real.

### class_section
```json
{
  "id": "uuid-v4",
  "class_template_id": "id del class_template",
  "section_type_id": "id del section_type",
  "work_format_id": "id del work_format (o null)",
  "sort_order": 1,
  "visible_title": "Movilidad",
  "general_description": "2 rondas todo 30 segundos",
  "time_cap_seconds": null,
  "total_rounds": 2,
  "rest_between_rounds_seconds": null,
  "notes": null,
  "rest_between_exercises_seconds": 10,
  "rest_after_section_seconds": 60,
  "interval_seconds": null,
  "created_at": "2026-04-01 00:00:00",
  "updated_at": "2026-04-01 00:00:00"
}
```
> Los tres campos nuevos (`rest_between_exercises_seconds`, `rest_after_section_seconds`,
> `interval_seconds`) son overrides del cronómetro: si van en `null`, el motor usa el valor global
> de `timer_config`. Ver sección 7.

### section_exercise
```json
{
  "id": "uuid-v4",
  "class_section_id": "id del class_section",
  "exercise_id": "id del exercise",
  "sort_order": 1,
  "coach_notes": "Notas del coach para este ejercicio en esta clase",
  "planned_repetitions": 10,
  "planned_weight_value": 20.0,
  "planned_weight_unit_id": "id de kg",
  "planned_time_seconds": 30,
  "planned_distance_value": null,
  "planned_distance_unit_id": null,
  "planned_calories": null,
  "planned_rest_seconds": null,
  "planned_rounds": null,
  "suggested_timer_seconds": null,
  "rm_percentage": 80,
  "suggested_scaling": null,
  "notes": null,
  "created_at": "2026-04-01 00:00:00",
  "updated_at": "2026-04-01 00:00:00"
}
```
> `suggested_timer_seconds` es la **duración estimada** del ejercicio cuando el MD no dice cuánto
> dura (típicamente ejercicios por repeticiones). Sólo se carga si `planned_time_seconds` es `null`.
> Ver sección 7.

---

## 7. CRONÓMETRO: CÓMO CARGAR LOS TIEMPOS

La clase tiene que poder ejecutarse en **modo Clase guiada** (`/sesiones/:id/cronometro`), donde el
cronómetro avanza solo. El motor (`src/services/timerEngine.ts`) aplana la clase en una secuencia
lineal de pasos:

```
cuenta regresiva → trabajo → descanso → ... → descanso de ronda → ... → descanso de sección → ...
```

Para que esa secuencia sea coherente, **cada ejercicio necesita una duración**. Si el MD la dice, se
usa tal cual; si no, se estima.

> 🤖 **Estas reglas ya están implementadas en código:** `src/services/timerEstimationService.ts`
> aplica exactamente lo de §7.2/§7.4 sobre las clases que ya están en la BD, y se dispara desde
> **Configuración → Gestión de datos → Estimación de tiempos** (`TimerEstimationSection`). Por
> defecto sólo rellena lo que está vacío; con "recalcular todo" pisa los valores existentes.
>
> Sirve como red de seguridad, **no reemplaza** cargar los tiempos en el ZIP: el service estima por
> palabras clave del nombre en inglés y no sabe lo que dice el MD (pausas, "cada lado", ventanas
> raras). Lo que sí conviene es que las estimaciones del ZIP **coincidan** con lo que produciría el
> service, para que un "recalcular todo" no cambie la clase.

### 7.1 Cascada de resolución (qué campo gana)

| Concepto                    | 1º — ejercicio            | 2º — ejercicio (estimado)   | 3º — sección                     | 4º — global (`timer_config`)      |
|-----------------------------|---------------------------|-----------------------------|----------------------------------|-----------------------------------|
| Duración del trabajo        | `planned_time_seconds`    | `suggested_timer_seconds`   | —                                | `default_exercise_seconds` (45)   |
| Descanso entre ejercicios   | `planned_rest_seconds`    | —                           | `rest_between_exercises_seconds` | `rest_between_exercises_seconds` (15) |
| Descanso entre vueltas      | —                         | —                           | `rest_between_rounds_seconds`    | `rest_between_rounds_seconds` (60) |
| Descanso al cerrar sección  | —                         | —                           | `rest_after_section_seconds`     | `rest_between_sections_seconds` (90) |
| Ventana de intervalo        | —                         | —                           | `interval_seconds`               | `work_format.default_interval_seconds` → `default_interval_seconds` (60) |

Regla de oro: **dejar en `null` lo que el default global ya resuelve bien**, y cargar valor explícito
sólo cuando la clase pide algo distinto. Lo único que casi siempre hay que completar es
`suggested_timer_seconds` en los ejercicios por repeticiones.

### 7.2 Estimar la duración de un ejercicio por repeticiones

`suggested_timer_seconds ≈ repeticiones × segundos_por_rep`, redondeado a múltiplo de 5,
con un **mínimo de 15 s y un máximo de 180 s**.

Los seg/rep de abajo son los mismos que usa `timerEstimationService.ts` (constante
`SECONDS_PER_REP`), evaluados **de arriba hacia abajo por palabra clave del nombre en inglés: la
primera fila que matchea gana**. Por eso "Barbell Hang Power Clean" cae en la fila olímpica (8 s) y
no en la de barra (5 s).

| # | Tipo de movimiento | Palabras clave que lo disparan | seg/rep | Ej. 10 reps |
|---|--------------------|--------------------------------|:-------:|:-----------:|
| 1 | Olímpico y muscle-ups | `snatch`, `clean`, `jerk`, `muscle-up` | 8 | 80 s |
| 2 | Gimnástico avanzado | `handstand`, `pistol`, `wall walk`, `chest-to-bar`, `toes-to-bar`, `knees-to-elbows`, `rope climb`, `ring dip` | 5 | 50 s |
| 3 | Fuerza con barra | `barbell`, `deadlift`, `back/front/overhead squat`, `thruster`, `push press`, `push jerk`, `strict press`, `bench press`, `bent-over row` | 5 | 50 s |
| 4 | Saltos de soga | `double-under`, `single-under`, `jump rope` | 1 | 15 s (mínimo) |
| 5 | Lunges y pasos (por paso) | `lunge`, `step-over`, `step-up` | 3 | 30 s |
| 6 | Movilidad y activación | `band`, `scapular`, `rotation`, `stretch`, `mobility`, `dislocate`, `pull-apart`, `glute bridge` | 2 | 20 s |
| 7 | Mancuerna, KB y gimnástico básico | `dumbbell`, `kettlebell`, `wall ball`, `burpee`, `box jump`, `push-up`, `sit-up`, `air squat`, `pull-up`, `ring row`, `swing`, `russian twist` | 3 | 30 s |
| — | Cualquier otro | (default) | 3 | 30 s |

> ⚠️ Estas dos columnas cambiaron respecto de la versión anterior de este documento: los lunges
> pasaron de 2,5 a **3** seg/rep y los saltos de soga de 0,8 a **1** seg/rep, para quedar iguales al
> código.

**Ejercicios que no son por repeticiones:**

| Caso                                       | Estimación                                           |
|--------------------------------------------|------------------------------------------------------|
| Correr / shuttle run                       | 25 s cada 100 m (600 m → 150 s)                      |
| Remo / assault bike / SkiErg (distancia)   | 25 s cada 100 m                                      |
| Remo / assault bike / SkiErg (calorías)    | 4 s por caloría                                      |
| Carry (farmer's, sandbag, overhead)        | 10 s cada 20 m                                       |
| Rope climb                                 | 30 s por subida                                      |
| Isométricos (`hold`, `plank`, `hollow`, `superman`, `wall sit`, `l-sit`) | el tiempo del MD; si no dice, 30 s |
| Estiramiento sin tiempo indicado           | 30 s por posición                                    |

> La distancia se toma de `planned_distance_value` + su unidad (`m` o `km`), y las calorías de
> `planned_calories`: cargar esos campos hace que la estimación salga sola y sea consistente con el
> service. Si el ejercicio tiene distancia **y** reps, gana la distancia.

**Ajustes:**
- Si el ejercicio es "cada lado" / "por lado", **duplicar** la estimación. Escribir literalmente
  `"cada lado"` o `"por lado"` en `coach_notes`: el service busca esas dos frases para duplicar.
- Si el MD dice el tiempo (ej. "todo 30 segundos"), va en `planned_time_seconds` y
  `suggested_timer_seconds` queda en `null`. **Nunca cargar los dos.**
- Peso alto o % de RM alto (≥85%): sumar ~30% al tiempo estimado.

### 7.3 Secciones de intervalo (EMOM, E2MOM, Tabata, Intervalos)

En estas secciones cada ejercicio recibe una **ventana fija**: el motor recorta el trabajo al tamaño
de la ventana y convierte el sobrante en descanso automáticamente.

- La ventana sale de `interval_seconds` de la sección; si va en `null`, del `default_interval_seconds`
  del formato (EMOM 60 / E2MOM 120 / Tabata 30 / Intervalos 60).
- Cargar `interval_seconds` cuando el MD indica una ventana distinta a la del formato
  (ej. "5 reps por 1.5 minutos" → `interval_seconds: 90`).
- La estimación de trabajo debe **entrar en la ventana con aire**: apuntar a que quede al menos un
  15-20 % de descanso. Si la estimación iguala o supera la ventana, recortarla a `ventana − 10`.
- Si la sección tiene `time_cap_seconds` y no tiene `total_rounds`, el motor deduce las vueltas
  (`floor(time_cap / (ventana × ventanas_por_vuelta))`). Aun así, **cargar `total_rounds` explícito**
  siempre que el MD lo permita.

> ⚠️ **La ventana es POR EJERCICIO, no por ronda.** `timerEngine.ts` le da una ventana completa a
> cada `section_exercise`. Con `interval_seconds: 180` y 2 ejercicios, cada vuelta dura **360 s**,
> no 180.
>
> Por eso, cuando el MD dice *"N rondas cada X minutos"* y la ronda tiene **más de un ejercicio**
> (el caso típico de un complejo de fuerza), **no** se modela como intervalo: se usa
> **`Por rondas`** con los tiempos de trabajo explícitos y
> `rest_between_rounds_seconds = ventana − suma del trabajo`, para que la vuelta completa dure lo
> que dice el MD. Los formatos de intervalo quedan para cuando **cada ejercicio** tiene su propia
> ventana (EMOM clásico, Tabata).
>
> Ejemplo real (GOAT 15/08/2026, "5 rondas cada 3 minutos" con 2 ejercicios): `Por rondas`,
> `total_rounds: 5`, trabajo 60 s + 50 s, `rest_between_exercises_seconds: 0`,
> `rest_between_rounds_seconds: 70` → 180 s por vuelta. Mismo criterio que se usó en la clase
> GOAT 13/07/2026.

### 7.4 Descansos por tipo de sección (valores sugeridos)

Estos son los valores exactos de `SECTION_RESTS` en `timerEstimationService.ts` — usar los mismos en
el ZIP para que el ZIP y el botón "Estimación de tiempos" digan lo mismo:

| `section_type`      | `rest_between_exercises_seconds` | `rest_between_rounds_seconds` | `rest_after_section_seconds` |
|---------------------|:--------------------------------:|:-----------------------------:|:----------------------------:|
| Entrada en calor    | 10                               | 0                             | 60                           |
| Activación          | 10                               | 0                             | 60                           |
| Fuerza              | 60                               | 90                            | 120                          |
| Habilidad           | 30                               | 60                            | 90                           |
| WOD                 | **0** (circuito continuo)        | 0                             | 60                           |
| Accesorio           | 30                               | 60                            | 60                           |
| Vuelta a la calma   | 10                               | 0                             | 0 / `null` si es la última   |
| **Movilidad**       | 10                               | 0                             | 60 (mismo criterio que Entrada en calor) |
| Cualquier otro      | 15                               | `null`                        | 60                           |

> ⚠️ **Movilidad todavía no está en `SECTION_RESTS`** (el service se escribió antes de que existiera
> ese tipo de sección): si se deja en `null`, el botón de estimación le va a poner los defaults
> genéricos (15 / `null` / 60) en vez de los de calentamiento. Por eso, en las secciones de
> Movilidad conviene **cargar los tres descansos explícitos en el ZIP**.

- `rest_between_rounds_seconds` sólo se completa si la sección tiene más de una vuelta
  (`total_rounds > 1`). Si el MD dice algo distinto ("1 minuto entre rondas" → 60), manda el MD.
- En un WOD continuo va en 0: si queda en `null`, el motor mete 60 s por default, que casi nunca es
  lo que se quiere en un metcon.
- `rest_after_section_seconds` de la **última** sección: dejarlo en `null` (no hay nada después).

### 7.5 Trampas conocidas

- **Una sección sin ejercicios el cronómetro la salta por completo.** Un "Calentamiento – 6 minutos"
  sin ejercicios cargados desaparece de la línea de tiempo. Si el MD no detalla movimientos, cargar
  igual un ejercicio representativo (ej. Running) con `planned_time_seconds` = el time cap.
- `planned_rounds` en `section_exercise` = series del **mismo** ejercicio dentro de una vuelta
  (el motor las anida). `total_rounds` en `class_section` = vueltas al circuito completo.
- Un ejercicio por reps sin `planned_time_seconds` ni `suggested_timer_seconds` cae al default global
  de 45 s, que casi nunca es correcto. Por eso el paso de estimación es obligatorio.
- La suma de la línea de tiempo debería quedar cerca de `estimated_duration_minutes` de la clase.
  Si difiere mucho, revisar rondas y descansos.
- **Dos secciones del mismo `section_type` en una clase** rompen la agrupación de resultados de
  sesión (bug corregido en v013/v014, ver `src/utils/sessionSections.ts`). Con Movilidad como tipo
  propio esto ya casi no pasa; si hace falta repetir un tipo, darles `visible_title` distintos.
- **Circuitos desenrollados en el MD**: si se cargan las 4 vueltas como 12 `section_exercise`
  seguidos *y además* `total_rounds: 4`, el cronómetro hace 16 vueltas. Una cosa o la otra.
- Un `section_exercise` con `planned_time_seconds: 0` o `suggested_timer_seconds: 0` genera un paso
  de 0 segundos que el cronómetro atraviesa de golpe. Mínimo 15 s siempre.

---

## 8. IMPORTAR SIN PERDER DATOS EXISTENTES

**Esto ya no es un problema a resolver a mano.** `importDataFromZip` (el backup completo, con
`data.json`) sí borra todo antes de importar — pero el ZIP de clase de este documento usa
`class-share.json`, que entra por `importClassFromZip()` (vía el detector automático
`importFromZip()`), y ese importador es **aditivo por diseño**:

- Ejercicios y catálogos se resuelven por nombre: si ya existen, se reutilizan y se actualizan con
  lo que traiga el ZIP — campo por campo en `exercise`, reemplazo completo en las relaciones (§2 y
  PASO 7). Si no existen, se crean.
- La clase se crea siempre como nueva **salvo que ya exista una con el mismo nombre exacto**, en
  cuyo caso se reutiliza esa y las secciones nuevas se le agregan al final (ojo con reimportar).
- **Nunca** toca `training_session`, `session_exercise_result` ni `personal_record` — el progreso
  del usuario no se ve afectado.

Por eso no hace falta pedirle al usuario su backup actual ni hacer merge manual: Claude arma el ZIP
de la clase nueva de forma aislada (PASO 7/8) y el usuario lo importa directamente desde
**Configuración → Importar**, sea cual sea el estado de su base de datos.

---

## 9. EJEMPLO COMPLETO RESUELTO: Clase GOAT 01/04/2026

> ⚠️ **Ejemplo histórico.** Sirve para ver el nivel de detalle esperado en cada sección y cómo se
> razonan los tiempos, pero fue escrito con las convenciones viejas. Al usarlo como molde, traducir:
> - Los músculos están con los **12 nombres simplificados** ("Deltoides", "Cuádriceps",
>   "Core/Abdominales"). Hoy van los **35 granulares** de §5.1 ("Deltoides anterior",
>   "Recto femoral", "Recto abdominal").
> - La "Sección 2: Movilidad" figura como `section_type: Entrada en calor`. Hoy es su propio tipo
>   **Movilidad** (PASO 2).
> - El nombre de la clase hoy es `GOAT DD/MM/YYYY`, sin el prefijo "Clase".
> - Los `suggested_timer_seconds` de lunges/step-overs se recalculan con **3 seg/rep** (§7.2).
> - Los ejercicios reutilizados de §9c hoy también viajan con sus músculos (§6.1).

### 9a. Análisis del MD

```
Clase GOAT 01/04/2026
fecha BD: 2026-04-01
nombre: "Clase GOAT 01/04/2026"
objetivo: "Habilidad de arrancada (snatch): progresión técnica desde el suelo + WOD con mancuernas en parejas"
duración estimada: 60 minutos
```

**Secciones identificadas:**

| # | Título visible           | section_type    | work_format    | rounds | time_cap | Descripción                                          |
|---|--------------------------|-----------------|----------------|--------|----------|------------------------------------------------------|
| 1 | Calentamiento            | Entrada en calor| Trabajo libre  | —      | 6 min    | 6 minutos de calentamiento                           |
| 2 | Movilidad                | Entrada en calor| Por rondas     | 2      | —        | 2 rondas todo 30 segundos                            |
| 3 | Activación               | Activación      | Por rondas     | —      | 5 min    | todo 10 repeticiones en 5 minutos                    |
| 4 | Fuerza A                 | Fuerza          | E2MOM          | 3      | —        | 3 rondas 5 reps por 1 min (snatch complex)           |
| 5 | Fuerza B                 | Fuerza          | E2MOM          | 6      | —        | 6 rondas 3 reps por 1.5 min (snatch con pausa)       |
| 6 | WOD                      | WOD             | Por rondas     | 10     | 16 min   | 10 rondas máx 16 min en parejas                      |

### 9b. Ejercicios nuevos de esta clase (sin SVG previo)

Los siguientes ejercicios NO tienen SVG y deben crearse:

1. **Band Pull-Apart** → `band-pull-apart.svg`
   - Descripción: De pie, sostener una banda elástica con ambas manos al frente. Separar los brazos horizontalmente hasta que la banda toque el pecho, luego volver. Trabaja la apertura posterior del hombro.
   - Technical notes: Mantener los codos extendidos. No elevar los hombros. Escápulas juntas al final del movimiento.
   - Dificultad: Básico | Primario: Deltoides | Secundarios: Trapecio, Dorsales
   - Equipment: Banda elástica | Tags: hombro, movilidad, pull | Sections: Entrada en calor, Activación
   - Units: Repeticiones, Segundos | is_compound: 0
   - Video: https://www.youtube.com/shorts/SuvO4TBwSu4
   - Frame 1: De pie, brazos al frente con banda extendida (inicio)
   - Frame 2: Brazos en apertura lateral máxima, banda tocando el pecho
   - Frame 3: Brazos volviendo a la posición inicial

2. **Band External Rotation** → `band-external-rotation.svg`
   - Descripción: De pie junto a un ancla, codo a 90° contra el cuerpo. Rotar el antebrazo hacia afuera contra la resistencia de la banda, luego volver.
   - Technical notes: El codo no debe separarse del cuerpo. Rango de movimiento controlado. Ejecutar cada lado.
   - Dificultad: Básico | Primario: Deltoides | Secundarios: Trapecio
   - Equipment: Banda elástica | Tags: hombro, movilidad, unilateral | Sections: Entrada en calor, Activación
   - Units: Repeticiones, Segundos | is_compound: 0
   - Video: https://www.youtube.com/watch?v=wQdfeB80fqo
   - Frame 1: Codo a 90° pegado al cuerpo, antebrazo al frente (posición neutra)
   - Frame 2: Antebrazo rotado hacia afuera (rotación externa máxima)
   - Frame 3: Retorno a posición neutra

3. **90/90 Hip Rotation** → `hip-90-90-rotation.svg`
   - Descripción: Sentado en el suelo con ambas piernas en 90° (una adelante, una al costado). Rotar el torso y la cadera hacia el lado contrario, volviendo a la posición original.
   - Technical notes: Mantener la espalda recta. Las rodillas permanecen en 90°. Movimiento activo, sin forzar.
   - Dificultad: Básico | Primario: Glúteos | Secundarios: Core/Abdominales, Isquiotibiales
   - Equipment: — (bodyweight) | Tags: movilidad, unilateral | Sections: Entrada en calor
   - Units: Repeticiones, Segundos | is_compound: 0
   - Video: https://www.youtube.com/watch?v=f_7qIPxw6nE
   - Frame 1: Sentado, pierna derecha adelante y pierna izquierda al costado (90/90)
   - Frame 2: Torso rotando hacia el otro lado
   - Frame 3: Pierna izquierda adelante, pierna derecha al costado (90/90 invertido)

4. **Lateral Raise to Overhead** → `lateral-raise-to-overhead.svg`
   - Descripción: De pie con discos o mancuernas livianas. Elevar los brazos lateralmente (lateral raise) y continuar el movimiento hasta overhead. Bajar por el mismo camino.
   - Technical notes: Pesos muy livianos (2.5kg). Movimiento continuo sin pausa. Core activo.
   - Dificultad: Básico | Primario: Deltoides | Secundarios: Trapecio
   - Equipment: Disco | Tags: hombro, monoarticular, bilateral | Sections: Activación
   - Units: Repeticiones, Kilogramos | is_compound: 0
   - Video: https://www.youtube.com/watch?v=7mUqxKfg6zo
   - Frame 1: De pie, brazos al costado con discos
   - Frame 2: Brazos en T horizontal (lateral raise)
   - Frame 3: Brazos overhead (posición final)

5. **Scapular Push-Up** → `scapular-push-up.svg`
   - Descripción: En posición de plancha alta (push-up), sin doblar los codos, hacer protracción y retracción escapular. Las escápulas se juntan y separan moviendo el torso verticalmente pocos centímetros.
   - Technical notes: Los codos permanecen extendidos siempre. Es un movimiento de las escápulas, no de los brazos. Core activo.
   - Dificultad: Básico | Primario: Dorsales | Secundarios: Pectorales, Core/Abdominales
   - Equipment: — (bodyweight) | Tags: gimnástico, movilidad, activación | Sections: Activación
   - Units: Repeticiones, Segundos | is_compound: 0
   - Video: https://www.youtube.com/watch?v=huGj4aBk9C4
   - Frame 1: Plancha alta, escápulas retraídas (torso bajo, columna ligeramente curva)
   - Frame 2: Posición media de tránsito
   - Frame 3: Plancha alta, escápulas en protracción (torso elevado, espalda redondeada)

6. **High Pull + External Rotation** → `high-pull-external-rotation.svg`
   - Descripción: Con discos livianos en las manos, realizar un high pull (subir los codos por encima de los hombros) y en el punto más alto, rotar los antebrazos hacia arriba y afuera (como el inicio del overhead squat).
   - Technical notes: Movimiento combinado de preparación para la arrancada. Pesos livianos. Los codos lideran el movimiento.
   - Dificultad: Intermedio | Primario: Deltoides | Secundarios: Trapecio, Bíceps
   - Equipment: Disco | Tags: hombro, olímpico, bilateral | Sections: Activación, Fuerza
   - Units: Repeticiones, Kilogramos | is_compound: 1
   - Video: https://www.youtube.com/watch?v=-EZP2ynZchc
   - Frame 1: De pie, brazos al costado con discos (posición inicial)
   - Frame 2: High pull, codos altos, discos a la altura del pecho
   - Frame 3: Rotación externa completada, discos overhead con codos abiertos

7. **Snatch Grip Deadlift** → `barbell-snatch-grip-deadlift.svg`
   - Descripción: Peso muerto con agarre amplio de arrancada. Desde el suelo, elevar la barra manteniendo el agarre ancho (snatch grip), terminando de pie con la cadera extendida.
   - Technical notes: El agarre es más ancho que el deadlift convencional. Mantener la espalda neutra. La barra debe rozar las piernas.
   - Dificultad: Intermedio | Primario: Isquiotibiales | Secundarios: Glúteos, Cuádriceps, Dorsales, Trapecio
   - Equipment: Barra olímpica | Tags: olímpico, pull, bilateral | Sections: Fuerza
   - Units: Kilogramos, Libras, Repeticiones | is_compound: 1
   - Video: https://www.youtube.com/watch?v=E42_MZOKktU
   - Frame 1: Posición inicial, cadera abajo, espalda neutra, agarre ancho en la barra en el suelo
   - Frame 2: Barra a la mitad (a nivel de rodillas), espalda inclinada
   - Frame 3: De pie, cadera extendida, barra a nivel de cadera

8. **Snatch High Pull** → `barbell-snatch-high-pull.svg`
   - Descripción: Desde la cadera (o desde el suelo), tirar la barra con agarre de arrancada hasta la altura del pecho, llevando los codos altos. El jalón termina en puntillas.
   - Technical notes: La extensión de cadera inicia el movimiento. Los codos salen hacia afuera y hacia arriba. La barra sube pegada al cuerpo.
   - Dificultad: Intermedio | Primario: Trapecio | Secundarios: Deltoides, Cuádriceps, Glúteos
   - Equipment: Barra olímpica | Tags: olímpico, pull, bilateral | Sections: Fuerza, Habilidad
   - Units: Kilogramos, Libras, Repeticiones | is_compound: 1
   - Video: https://www.youtube.com/watch?v=33jE3S5IMMo
   - Frame 1: Posición de inicio, cadera semiflexionada, barra a nivel de cadera, agarre ancho
   - Frame 2: Extensión de cadera, barra subiendo, codos empezando a salir
   - Frame 3: Puntillas, codos altos, barra a la altura del pecho

9. **Snatch with Pause at Knee** → `barbell-snatch-pause-at-knee.svg`
   - Descripción: Arrancada completa con una pausa de 2 segundos cuando la barra pasa la altura de las rodillas. Permite trabajar la posición crítica de la arrancada.
   - Technical notes: Durante la pausa mantener la espalda plana y los hombros delante de la barra. Reanudar la extensión de cadera con potencia.
   - Dificultad: Avanzado | Primario: Cuádriceps | Secundarios: Glúteos, Deltoides, Trapecio, Core/Abdominales
   - Equipment: Barra olímpica | Tags: olímpico, bilateral | Sections: Fuerza, Habilidad
   - Units: Kilogramos, Libras, Repeticiones | is_compound: 1
   - Video: https://www.youtube.com/watch?v=EOrFQ9O1Ng4
   - Frame 1: Inicio del levantamiento, barra en el suelo
   - Frame 2: PAUSA - barra a altura de rodillas, torso inclinado
   - Frame 3: Recepción overhead con sentadilla completa (snatch completo)

10. **Dumbbell Deadlift** → `dumbbell-deadlift.svg`
    - Descripción: Peso muerto con mancuernas. Desde el suelo (o con mancuernas colgando), flexionar caderas y rodillas para bajar y subir las mancuernas manteniendo la espalda neutra.
    - Technical notes: Igual que el deadlift con barra pero con mancuernas. Mantener el core activo y la espalda recta. Las mancuernas van al costado del cuerpo.
    - Dificultad: Básico | Primario: Isquiotibiales | Secundarios: Glúteos, Cuádriceps, Core/Abdominales
    - Equipment: Mancuernas | Tags: pull, bilateral | Sections: Fuerza, WOD
    - Units: Kilogramos, Repeticiones | is_compound: 1
    - Video: https://www.youtube.com/shorts/ElCIiU1FWxg
    - Frame 1: De pie con mancuernas a los costados (posición final/inicial)
    - Frame 2: A mitad del descenso, torso inclinado, mancuernas a nivel de rodillas
    - Frame 3: Posición baja, mancuernas cerca del suelo, cadera abajo

11. **DB Lateral Step-Over** → `dumbbell-lateral-step-over.svg`
    - Descripción: Con una mancuerna en cada mano, pasar lateralmente por encima de un objeto (barra, cono) dando un paso lateral con cada pierna. También llamado Crossover.
    - Technical notes: Mantener el torso erguido. Las mancuernas no se apoyan en el objeto. Core activo durante todo el movimiento.
    - Dificultad: Básico | Primario: Cuádriceps | Secundarios: Glúteos, Core/Abdominales
    - Equipment: Mancuernas | Tags: cardio, unilateral, pliométrico | Sections: WOD
    - Units: Repeticiones, Kilogramos | is_compound: 1
    - Video: https://www.youtube.com/shorts/vs1813G1Q00
    - Frame 1: De pie al costado de un objeto, mancuernas en mano
    - Frame 2: Una pierna cruzando por encima del objeto
    - Frame 3: Al otro lado del objeto, ambos pies apoyados

12. **Dumbbell Push Press** → `dumbbell-push-press.svg`
    - Descripción: Con mancuernas en rack position (a la altura de los hombros), hacer un pequeño dip de rodillas y usar el impulso de piernas para empujar las mancuernas overhead.
    - Technical notes: El dip es pequeño y controlado. La extensión de rodillas impulsa el movimiento. Terminar con brazos completamente extendidos overhead.
    - Dificultad: Intermedio | Primario: Deltoides | Secundarios: Tríceps, Cuádriceps, Core/Abdominales
    - Equipment: Mancuernas | Tags: push, press, bilateral | Sections: Fuerza, WOD
    - Units: Kilogramos, Repeticiones | is_compound: 1
    - Video: https://www.youtube.com/shorts/cQ67XoqcItE
    - Frame 1: Mancuernas en rack position, rodillas ligeramente flexionadas (dip)
    - Frame 2: Piernas extendiéndose, mancuernas comenzando a subir
    - Frame 3: Mancuernas overhead, brazos extendidos, de puntillas

### 9c. Ejercicios ya existentes en esta clase

| Ejercicio en MD         | Nombre en BD          | SVG existente              |
|-------------------------|-----------------------|----------------------------|
| Muscle Snatch           | Barbell Muscle Snatch | barbell-muscle-snatch.svg  |

### 9d. Secciones y section_exercises de la Clase GOAT 01/04/2026

**Sección 1: Calentamiento**
- section_type: Entrada en calor | work_format: Trabajo libre | time_cap: 360 seg | visible_title: "Calentamiento"
- general_description: "6 minutos de calentamiento general"
- rest_after_section_seconds: 60
- Ejercicios: el MD no detalla movimientos, pero **una sección vacía el cronómetro la saltea** (§7.5),
  así que se carga un ejercicio representativo:
  1. Running → planned_time_seconds: 360 | coach_notes: "Calentamiento general, ritmo suave"

**Sección 2: Movilidad**
- section_type: Entrada en calor | work_format: Por rondas | total_rounds: 2 | visible_title: "Movilidad"
- general_description: "2 rondas todo 30 segundos"
- rest_between_exercises_seconds: 10 | rest_between_rounds_seconds: 0 | rest_after_section_seconds: 60
- Ejercicios (el MD da el tiempo → va en `planned_time_seconds`, sin estimar):
  1. Band Pull-Apart → planned_time_seconds: 30
  2. Band External Rotation → planned_time_seconds: 30 | coach_notes: "Cada lado"
  3. 90/90 Hip Rotation → planned_time_seconds: 30

**Sección 3: Activación**
- section_type: Activación | work_format: EMOM | time_cap: 300 seg | total_rounds: 1 | visible_title: "Activación"
- general_description: "todo 10 repeticiones en 5 minutos"
- interval_seconds: null → usa la ventana del EMOM (60 s) | rest_after_section_seconds: 90
- Ejercicios (por reps → se **estima** `suggested_timer_seconds`, §7.2):
  1. Lateral Raise to Overhead → planned_repetitions: 10 | planned_weight_value: 2.5 kg | **suggested_timer_seconds: 30** (10 × 3 s) | coach_notes: "2 discos de 2.5"
  2. Scapular Push-Up → planned_repetitions: 10 | **suggested_timer_seconds: 20** (10 × 2 s, movilidad)
  3. High Pull + External Rotation → planned_repetitions: 10 | planned_weight_value: 2.5 kg | **suggested_timer_seconds: 30** | coach_notes: "2 discos de 2.5"
- Las tres estimaciones entran cómodas en la ventana de 60 s: el resto se vuelve descanso solo.

**Sección 4: Fuerza A – Complejo de snatch**
- section_type: Fuerza | work_format: E2MOM | total_rounds: 3 | visible_title: "Fuerza - Complejo"
- general_description: "3 rondas, todo 5 repeticiones por 1 minuto"
- **interval_seconds: 60** — el MD dice "por 1 minuto", no los 120 s por default del E2MOM
- rest_after_section_seconds: 120
- Ejercicios (olímpico: 5 reps × 8 s = 40 s, entra en la ventana de 60):
  1. Snatch Grip Deadlift → planned_repetitions: 5 | planned_weight_value: 20 | **suggested_timer_seconds: 40** | sort_order: 1 | coach_notes: "a"
  2. Snatch High Pull → planned_repetitions: 5 | planned_weight_value: 20 | **suggested_timer_seconds: 40** | sort_order: 2 | coach_notes: "b"
  3. Barbell Muscle Snatch → planned_repetitions: 5 | planned_weight_value: 20 | **suggested_timer_seconds: 40** | sort_order: 3 | coach_notes: "c"

**Sección 5: Fuerza B – Snatch con pausa**
- section_type: Fuerza | work_format: E2MOM | total_rounds: 6 | visible_title: "Fuerza - Snatch"
- time_cap_seconds: 540 (6 x 1.5 min) | general_description: "6 rondas, 3 repeticiones por 1.5 minutos"
- **interval_seconds: 90** ("por 1.5 minutos") | rest_after_section_seconds: 120
- Ejercicios:
  1. Snatch with Pause at Knee → planned_repetitions: 3 | **suggested_timer_seconds: 30** (3 × 8 s + pausa) | coach_notes: "2s de pausa en rodilla"

**Sección 6: WOD**
- section_type: WOD | work_format: Por rondas | total_rounds: 10 | time_cap_seconds: 960 | visible_title: "WOD"
- general_description: "10 rondas máximo 16 minutos en parejas, uno trabaja el otro descansa"
- **rest_between_exercises_seconds: 0** (circuito continuo) | **rest_between_rounds_seconds: 30**
  (en parejas: la ronda del compañero) | rest_after_section_seconds: null (última sección con ejercicios)
- Ejercicios:
  1. Dumbbell Deadlift → planned_repetitions: 6 | planned_weight_value: 10 | **suggested_timer_seconds: 20** (6 × 3 s) | sort_order: 1
  2. DB Lateral Step-Over → planned_repetitions: 4 | planned_weight_value: 10 | **suggested_timer_seconds: 10** (4 × 2.5 s) | sort_order: 2
  3. Dumbbell Push Press → planned_repetitions: 2 | **suggested_timer_seconds: 15** (mínimo) | sort_order: 3

**Control final:** la línea de tiempo suma ≈ 6' + 4' + 5' + 9' + 9' + 16' ≈ 49' de trabajo + descansos
de sección → coherente con `estimated_duration_minutes: 60`.

---

## 10. CHECKLIST DE ENTREGA

Al finalizar la generación de una clase, verificar:

- [ ] Antes de crear un ejercicio nuevo, se buscó el existente en `public/img/exercises/`,
      `imageUpdateService.ts` y `PosiblesEjerciciosRepetidos.md` (§4)
- [ ] Los nombres nuevos respetan la convención de §4a (inglés, Title Case, prefijo de implemento,
      `and` en vez de `&`) y no duplican una variante ya existente
- [ ] SVGs creados para todos los ejercicios nuevos (3 frames, 200x230, animación CSS) y guardados en `public/img/exercises/`
- [ ] Ejercicios **nuevos** en el JSON traen todos los campos: description, technical_notes, difficulty_level_id, primary_muscle_group_id, image_url, video_path/video_long_path (si hay video en el MD), is_compound, is_active, created_at, updated_at
- [ ] Ejercicios **reutilizados** llevan `id`, `name`, `primary_muscle_group_id`, `image_url` y sus
      filas de músculos; **no** llevan description/technical_notes/videos salvo que aporten algo nuevo (§7)
- [ ] Ninguna relación va a medias: si el ZIP trae `exercise_equipment` / `_tag` / `_unit` /
      `_section_type` de un ejercicio, las trae **completas** (el importador hace DELETE + INSERT)
- [ ] **Músculos (§6.1):** *todos* los ejercicios de la clase — nuevos y reutilizados — tienen
      1 `primary_muscle_group_id` + su fila con `is_primary: 1` + al menos 2 filas con `is_primary: 0`
- [ ] Los nombres de músculos son los **granulares del catálogo de 35** (§5.1), no los 12 viejos
- [ ] Todos los músculos, equipamiento, tags y tipos de sección usados están declarados en
      `catalogs` del mismo JSON (si no están en el seed, igual van: el importador los crea)
- [ ] La sección de Movilidad usa el `section_type` **Movilidad**, no "Entrada en calor" (PASO 2)
- [ ] Todas las secciones de la clase mapeadas a `section_type` y `work_format` correctos (§2/§3)
- [ ] El nombre de la clase (`GOAT DD/MM/YYYY`) no existe todavía en la BD del usuario (§2)
- [ ] Todos los `section_exercises` tienen `planned_repetitions` / `planned_time_seconds` /
      `planned_distance_value` + unidad / `planned_calories` / `planned_weight_value` según corresponda
- [ ] Los circuitos que el MD trae desenrollados se cargaron **una vez** + `total_rounds`

**Cronómetro (§7):**
- [ ] Todo ejercicio tiene duración resoluble: `planned_time_seconds` (si el MD lo dice) **o** `suggested_timer_seconds` (estimado) — nunca los dos
- [ ] Ninguna sección quedó sin ejercicios (el cronómetro la saltearía)
- [ ] Secciones de intervalo: `interval_seconds` cargado si la ventana difiere del default del formato, y el trabajo estimado entra en la ventana
- [ ] `rest_between_exercises_seconds` = 0 en los WOD continuos; `rest_between_rounds_seconds` cargado donde el MD lo indica
- [ ] `rest_after_section_seconds` definido en las secciones intermedias, `null` en la última
- [ ] Las secciones de **Movilidad** llevan los tres descansos explícitos (§7.4)
- [ ] Ningún paso queda en 0 segundos
- [ ] La suma estimada de la línea de tiempo es coherente con `estimated_duration_minutes`

**ZIP (§11b):**
- [ ] El ZIP contiene `class-share.json` (no `data.json`) y parsea como JSON válido
- [ ] Todo `exercise_id` / `class_section_id` / `class_template_id` referenciado existe en su tabla correspondiente del mismo JSON
- [ ] Los IDs son UUID v4 válidos y no se repiten dentro del JSON
- [ ] Las fechas están en formato `YYYY-MM-DD HH:MM:SS` (created_at/updated_at) o `YYYY-MM-DD` (campo `date` de la clase)
- [ ] Todo `muscle_group_id` / `equipment_id` / `tag_id` / `measurement_unit_id` /
      `section_type_id` / `work_format_id` referenciado existe en `catalogs` del mismo JSON
      (un id que no resuelve se descarta en silencio: la relación simplemente no se crea)
- [ ] El ZIP quedó guardado en `BKP/clase-<nombre>-<fecha>.zip`

---

## 11. CÓMO INTEGRAR LA CLASE EN LA APP

La forma estándar de cargar una clase es generar el **ZIP `class-share.json`** (PASO 7/8) y que el
usuario lo importe desde la UI. No se escribe ningún archivo TypeScript nuevo por clase — el
importador ya existe (`src/services/classShareService.ts`) y es el mismo que usa el botón
"Exportar Clase(s)" / "Importar" de la app.

### 11a. Generar el ZIP con un script Node de un solo uso

Escribir un script temporal (por ejemplo en el directorio de scratch de la sesión, no versionado)
que arme el objeto `class-share.json` descripto en PASO 7 y lo comprima con `jszip` (ya está en
`node_modules`, no hace falta instalar nada):

```javascript
// build_zip.js (script temporal, no se commitea)
const JSZip = require('<ruta al repo>/node_modules/jszip');
const fs = require('fs');
const crypto = require('crypto');
const uuid = () => crypto.randomUUID();

// 1. Catálogos usados (id interno + name; el importador los resuelve por nombre)
//    Músculos: nombres GRANULARES del catálogo de 35 (§5.1)
const muscle = {};
['Recto femoral', 'Glúteo mayor', 'Deltoides anterior', 'Trapecio (superior)', /* ... */]
  .forEach(n => muscle[n] = uuid());
// ... equipment, unit, difficulty, tag, sectionType, workFormat, igual patrón
// section_type incluye 'Movilidad' con { color: '#14b8a6', icon: 'Activity', ... } por si no existe

// 2. Ejercicios + músculos. Helper que sirve para nuevos y reutilizados:
const exId = {}, exercises = [], emg = [];
const addMuscles = (name, primary, secondary = []) => {
  emg.push({ id: uuid(), exercise_id: exId[name], muscle_group_id: muscle[primary], is_primary: 1 });
  secondary.forEach(m =>
    emg.push({ id: uuid(), exercise_id: exId[name], muscle_group_id: muscle[m], is_primary: 0 }));
};

// reutilizados: id + name + primary_muscle_group_id + image_url (+ sus filas de músculos)
const reuse = (name, primary, secondary, svg) => {
  exId[name] = uuid();
  exercises.push({ id: exId[name], name, primary_muscle_group_id: muscle[primary],
                   image_url: `/img/exercises/${svg}.svg` });
  addMuscles(name, primary, secondary);
};
reuse('Wall Ball Shot', 'Recto femoral',
      ['Glúteo mayor', 'Deltoides anterior', 'Tríceps braquial'], 'wall-ball-shot');

// nuevos: id, name, description, technical_notes, difficulty_level_id, primary_muscle_group_id,
//         image_url, video_path, video_long_path, is_compound, is_active, created_at, updated_at
//         + addMuscles(...) + filas de equipment / section_type / unit / tag

// 3. Clase, class_sections (una por sección del MD, PASO 2/3) y section_exercises
//    (una por ejercicio de cada sección, con planned_* / suggested_timer_seconds del PASO 7)

// 4. Ensamblar shareJson = { meta, catalogs, exercises, exercise_relations, classes,
//                             class_sections, section_exercises } y escribir el ZIP:
const zip = new JSZip();
zip.file('class-share.json', JSON.stringify(shareJson, null, 2));
zip.generateAsync({ type: 'nodebuffer' }).then(buf =>
  fs.writeFileSync('BKP/clase-<nombre>-<fecha>.zip', buf)
);
```

Ejecutar con `node build_zip.js` desde la raíz del repo. El resultado es un único archivo
`BKP/clase-<nombre-clase>-<DD-MM-YYYY>.zip` — mismo naming que los ZIP de clases anteriores
(ej. `clase-GOAT-13-08-2026.zip`, generado de la misma forma).

### 11b. Verificar el ZIP antes de entregarlo

Antes de darlo por terminado, chequear con un script Node corto (usando el mismo `jszip`) que:
- El ZIP contiene `class-share.json` y parsea como JSON válido.
- Todo `section_exercises[].exercise_id` existe en `exercises[].id`.
- Todo `section_exercises[].class_section_id` existe en `class_sections[].id`.
- Todo `class_sections[].class_template_id` coincide con el `id` de la clase en `classes[]`.
- **Todo ejercicio de `exercises[]` tiene `primary_muscle_group_id` + al menos 3 filas en
  `exercise_relations.exercise_muscle_group`, exactamente una con `is_primary: 1`.**
- Todo `*_id` de `exercise_relations` apunta a un id declarado en `catalogs`.
- Ningún `section_exercise` queda sin duración (`planned_time_seconds` o `suggested_timer_seconds`),
  y ninguno tiene los dos a la vez.

### 11c. Guardar el ZIP en `BKP/` y explicarle al usuario cómo importarlo

1. Copiar el ZIP a `BKP/clase-<nombre>-<fecha>.zip` (se versiona junto a `Ejercicios.md`, sirve de
   historial — igual que los ZIP de clases anteriores).
2. Indicarle al usuario: abrir la app (`npm run dev` si es local) → **Configuración → Gestión de
   datos → Importar** → elegir ese ZIP. `importFromZip()` detecta que es una clase y hace el merge
   aditivo — no hace falta backup previo ni hay riesgo de perder sesiones/PRs existentes (§8).
3. La clase aparece en `/clases` con todas sus secciones y ejercicios listos.

### 11d. Verificar después de que el usuario importe

**Ejercicios y músculos:**
1. Abrir un par de ejercicios de la clase desde `/ejercicios` y confirmar que el **mapa muscular**
   pinta las zonas correctas en las dos vistas (frontal y posterior) y que el SVG animado se ve.
2. Si el mapa aparece vacío, el ZIP no trajo filas de `exercise_muscle_group` (o los ids de músculo
   no resolvían contra `catalogs`) — §6.1.
3. En **Estadísticas**, el gráfico de distribución muscular debería reflejar la clase nueva.

**Cronómetro:**
1. En **Sesiones → Nueva**, dejar seleccionado **Clase guiada** y elegir la clase recién importada.
2. El cronómetro debe recorrer la clase entera sin pasos de 0 segundos inesperados ni secciones
   ausentes.
3. Contrastar la duración total que muestra con `estimated_duration_minutes` de la plantilla.
4. Los tiempos globales (cuenta regresiva, pips, vibración) se ajustan en
   **Configuración → Cronómetro**; los de la clase, editando la plantilla.
5. Si algo quedó flojo, **Configuración → Gestión de datos → Estimación de tiempos** rellena los
   huecos con las reglas de §7 sin tocar lo que ya está cargado.

---

*Última actualización: 2026-08-15*
*Versión del schema: 14 (v014_movilidad_section_type)*
*Mecanismo de carga vigente: ZIP `class-share.json` (§11) generado con un script Node + `jszip`,
importado desde Configuración → Gestión de datos → Importar. Reemplaza el viejo mecanismo de
`classDDMMYYYYImportService.ts` + botón en "Clases Predefinidas", descartado.*

**Cambios de esta revisión (vs. 2026-08-01):**
- **Músculos obligatorios** para todos los ejercicios de la clase, también los reutilizados (§1, §6.1,
  §7): la regla vieja de mandar sólo `{ id, name }` quedó sin efecto. `ACTUALIZO_MUSCULOS.md` ya no
  se usa como paso aparte.
- **Catálogo de músculos granular de 35** (§5.1) en reemplazo de los 12 nombres simplificados; la
  función `toDbName()` ya no existe. Tabla de equivalencia y patrones de movimiento actualizados.
- **"Movilidad" es su propio `section_type`** (PASO 2, §5.4), no "Entrada en calor" — migración v014.
- **Inventario de SVG actualizado a 275** (§4b), con convención de nombres y lista de duplicados a
  evitar (§4a) y el flujo de fusión desde Configuración → Gestión de datos.
- **Contrato real del importador documentado** (§2): qué actualiza campo por campo, qué relaciones
  reemplaza entero (DELETE + INSERT) y qué pasa si el nombre de la clase ya existe.
- **Formato del MD al día** (§3): reps antes del nombre, `video corto` → `video_path` y
  `video explicativo` → `video_long_path`, circuitos desenrollados, descripciones en español.
- **Tiempos alineados con `timerEstimationService.ts`** (§7.2/§7.4), incluidos los seg/rep que
  cambiaron, y documentado el botón "Estimación de tiempos".
