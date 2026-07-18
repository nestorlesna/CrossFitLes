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
2. **Un servicio de importación TypeScript** que crea los ejercicios, asigna sus músculos y crea la clase en la BD
3. **Un botón en Clases Predefinidas** (Configuración) para que el usuario ejecute la importación manualmente

> ⚠️ **Músculo incluido en el mismo servicio:** NO se crea un servicio separado de músculos.
> La asignación de `primary_muscle` y `secondary_muscles` ocurre dentro de `importClassDDMMYYYY()`
> justo después de insertar cada ejercicio. Ver sección 11a para el template completo.

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
- **Base de datos**: SQLite (via `@capacitor-community/sqlite`)
- **Formato de importación**: ZIP con un `data.json` dentro
- **Importación**: Menú Configuración → Importar backup (reemplaza TODOS los datos)
- **Repositorios**: `src/db/repositories/` (solo referencia, no hace falta modificarlos para crear una clase)

---

## 3. FORMATO DEL ARCHIVO Ejercicios.md

Cada clase sigue esta estructura:

```
Clase GOAT DD/MM/YYYY

Calentamiento
- descripcion

Movilidad - [instrucciones de rondas/tiempo]
- Nombre del ejercicio - [parámetros] - URL_video (opcional)

Activacion - [instrucciones]
- Nombre del ejercicio - [parámetros] - URL_video

Fuerza
- [rondas/sets/reps]
  - Nombre del ejercicio - [peso] - URL_video

WOD [formato y tiempo]
- [reps] repeticiones - Nombre del ejercicio - [peso] - URL_video

Estiramiento
```

---

## 4. PROCESO PASO A PASO

### PASO 1 – Parsear la clase

Leer la clase del archivo `BKP/Ejercicios.md` e identificar:
- Fecha de la clase (formato DD/MM/YYYY → convertir a YYYY-MM-DD para la BD)
- Nombre: "Clase GOAT DD/MM/YYYY"
- Secciones y sus ejercicios
- Para cada ejercicio: nombre, repeticiones/tiempo/distancia, peso, URL de video

### PASO 2 – Mapear secciones a `section_type`

| Término en Ejercicios.md | `section_type.name` en BD | Icono |
|--------------------------|---------------------------|-------|
| Calentamiento            | Entrada en calor          | Flame |
| Movilidad                | Entrada en calor          | Flame |
| Activacion / Activación  | Activación                | Zap   |
| Fuerza                   | Fuerza                    | Dumbbell |
| WOD                      | WOD                       | Timer |
| Estiramiento             | Vuelta a la calma         | Wind  |

> Si Calentamiento y Movilidad aparecen separados, crear DOS secciones de tipo "Entrada en calor".

### PASO 3 – Identificar formato de trabajo (`work_format`)

| Descripción en MD                                   | `work_format.name`     |
|-----------------------------------------------------|------------------------|
| "X rondas de Y repeticiones por Z minutos" / EMOM  | EMOM                   |
| "X rondas" sin tiempo fijo                          | Por rondas             |
| "series cada N minutos"                             | E2MOM                  |
| "máximo N minutos" / contra el reloj               | For Time               |
| "AMRAP"                                             | AMRAP                  |
| "series fijas" / rondas con descanso fijo          | Series fijas           |
| "trabajo libre" / movilidad sin estructura          | Trabajo libre          |
| Intervalos alternados (A/B)                         | Intervalos             |

> **Formatos de ventana fija (`is_interval = 1`):** EMOM (60s), E2MOM (120s), Tabata (30s),
> Intervalos (60s). En estos formatos el cronómetro le da a cada ejercicio una ventana completa:
> lo que sobra del trabajo se convierte automáticamente en descanso. Si el MD indica otra ventana
> ("cada 1.5 minutos"), cargar `class_section.interval_seconds` con ese valor (90). Ver sección 7.

### PASO 4 – Verificar ejercicios existentes

Comparar cada ejercicio del MD con los SVGs existentes en `public/img/exercises/`.
Usar la siguiente lista de **ejercicios ya presentes** (con su SVG y nombre en la BD si existe):

#### 4a. Lista de SVGs disponibles (102 ejercicios)

| Nombre sugerido en BD                   | Archivo SVG                                      |
|-----------------------------------------|--------------------------------------------------|
| Air Squat                               | air-squat.svg                                    |
| Alternating Single-Arm DB Power Snatch  | alternating-single-arm-dumbbell-power-snatch.svg |
| Assault Bike                            | assault-bike.svg                                 |
| Back Squat                              | back-squat.svg                                   |
| Bar Muscle-Up                           | bar-muscle-up.svg                                |
| Barbell Bench Press                     | barbell-bench-press.svg                          |
| Barbell Bent-Over Row                   | barbell-bent-over-row.svg                        |
| Barbell Clean & Jerk                    | barbell-clean-and-jerk.svg                       |
| Barbell Deadlift                        | barbell-deadlift.svg                             |
| Barbell Front Squat                     | barbell-front-squat.svg                          |
| Barbell Hang Clean & Jerk               | barbell-hang-clean-and-jerk.svg                  |
| Barbell Hang Clean                      | barbell-hang-clean.svg                           |
| Barbell Hang Muscle Clean & Press       | barbell-hang-muscle-clean-and-press.svg          |
| Barbell Hang Power Clean                | barbell-hang-power-clean.svg                     |
| Barbell Hang Power Cluster              | barbell-hang-power-cluster.svg                   |
| Barbell Hang Power Snatch               | barbell-hang-power-snatch.svg                    |
| Barbell Lunge                           | barbell-lunge.svg                                |
| Barbell Muscle Snatch                   | barbell-muscle-snatch.svg                        |
| Barbell Overhead Squat                  | barbell-overhead-squat.svg                       |
| Barbell Power Snatch                    | barbell-power-snatch.svg                         |
| Barbell Push Jerk                       | barbell-push-jerk.svg                            |
| Barbell Push Press                      | barbell-push-press.svg                           |
| Barbell Romanian Deadlift               | barbell-romanian-deadlift.svg                    |
| Barbell Squat Clean                     | barbell-squat-clean.svg                          |
| Barbell Strict Press                    | barbell-strict-press.svg                         |
| Barbell Sumo Deadlift High Pull         | barbell-sumo-deadlift-high-pull.svg              |
| Barbell Upright Row                     | barbell-upright-row.svg                          |
| Bent-Over Dumbbell Lateral Raise        | bent-over-dumbbell-lateral-raise.svg             |
| Bodyweight Glute Bridge                 | bodyweight-glute-bridge.svg                      |
| Handstand Push-Up                       | bodyweight-handstand-push-up.svg                 |
| Pistol Squat                            | bodyweight-pistol-squat.svg                      |
| Push-Up                                 | bodyweight-push-up.svg                           |
| Sit-Up                                  | bodyweight-sit-up.svg                            |
| Box Jump Over                           | box-jump-over.svg                                |
| Box Jump                                | box-jump.svg                                     |
| Burpee Over the Bar                     | burpee-over-the-bar.svg                          |
| Burpee                                  | burpee.svg                                       |
| Chest-to-Bar Pull-Up                    | chest-to-bar-pull-up.svg                         |
| Clean & Jerk                            | clean-and-jerk.svg                               |
| Cossack Squat                           | cossack-squat.svg                                |
| Counterbalance Squat                    | counterbalance-squat.svg                         |
| Deadlift                                | deadlift.svg                                     |
| Dips                                    | dips.svg                                         |
| Double Dumbbell Overhead Walking Lunge  | double-dumbbell-overhead-walking-lunge.svg       |
| Double-Under                            | double-under.svg                                 |
| Dumbbell Alternating Bent-Over Row      | dumbbell-alternating-bent-over-row.svg           |
| Dumbbell Bench Press                    | dumbbell-bench-press.svg                         |
| Dumbbell Bicep Curl                     | dumbbell-bicep-curl.svg                          |
| Dumbbell Devil's Press                  | dumbbell-devils-press.svg                        |
| Dumbbell Front Rack Lunge               | dumbbell-front-rack-lunge.svg                    |
| Dumbbell Front Raise                    | dumbbell-front-raise.svg                         |
| Dumbbell One-Arm Overhead Lunge         | dumbbell-one-arm-overhead-lunge.svg              |
| Dumbbell Split Clean                    | dumbbell-split-clean.svg                         |
| Dumbbell Thruster                       | dumbbell-thruster.svg                            |
| Farmer's Carry                          | farmers-carry.svg                                |
| Front Squat                             | front-squat.svg                                  |
| GHD Back Extension                      | ghd-back-extension.svg                           |
| GHD Sit-Up                              | ghd-sit-up.svg                                   |
| Hanging Knees-to-Elbows                 | hanging-knees-to-elbows.svg                      |
| Hanging Toes-to-Bar                     | hanging-toes-to-bar.svg                          |
| Hollow Hold                             | hollow-hold.svg                                  |
| Hollow Rock                             | hollow-rock.svg                                  |
| Hollow to Superman Roll                 | hollow-to-superman-roll.svg                      |
| Kettlebell Ankle Mobility Drill         | kettlebell-ankle-mobility-drill.svg              |
| Kettlebell Clean & Jerk                 | kettlebell-clean-and-jerk.svg                    |
| Kettlebell Front Squat                  | kettlebell-front-squat.svg                       |
| Kettlebell Ground-to-Overhead           | kettlebell-ground-to-overhead.svg                |
| Kettlebell Push-Up                      | kettlebell-push-up.svg                           |
| Kettlebell Snatch                       | kettlebell-snatch.svg                            |
| Kettlebell Sumo Deadlift High Pull      | kettlebell-sumo-deadlift-high-pull.svg           |
| Kettlebell Swing                        | kettlebell-swing.svg                             |
| Med-Ball Box Step-Over                  | med-ball-box-step-over.svg                       |
| Nordic Hamstring Curl                   | nordic-hamstring-curl.svg                        |
| Overhead Squat                          | overhead-squat.svg                               |
| Plank to Opposite Toe Touch             | plank-to-opposite-toe-touch.svg                  |
| Power Clean                             | power-clean.svg                                  |
| Pull-Up                                 | pullup.svg                                       |
| Push Press                              | push-press.svg                                   |
| Push-Up                                 | pushup.svg                                       |
| Ring Dip                                | ring-dip.svg                                     |
| Ring Handstand Push-Up                  | ring-handstand-push-up.svg                       |
| Ring Row                                | ring-row.svg                                     |
| Ring Strict Muscle-Up                   | ring-strict-muscle-up.svg                        |
| Rope Climb                              | rope-climb.svg                                   |
| Rowing                                  | rowing.svg                                       |
| Running                                 | running.svg                                      |
| Russian Twist                           | russian-twist.svg                                |
| Shoulder Press                          | shoulder-press.svg                               |
| Shuttle Run                             | shuttle-run.svg                                  |
| Side Plank with Weight                  | side-plank-weighted.svg                          |
| Single-Leg Dumbbell Romanian Deadlift   | single-leg-dumbbell-romanian-deadlift.svg        |
| Snatch                                  | snatch.svg                                       |
| Squat                                   | squat.svg                                        |
| Stability Ball Plate Crunch             | stability-ball-plate-crunch.svg                  |
| Superband Shoulder Dislocates           | superband-shoulder-dislocates.svg                |
| Thruster                                | thruster.svg                                     |
| Toe Touch Sit-Up                        | toe-touch-sit-up.svg                             |
| Toes-to-Bar                             | toes-to-bar.svg                                  |
| Walking Lunge                           | walking-lunge.svg                                |
| Wall Ball Shot                          | wall-ball-shot.svg                               |
| Wall Walk                               | wall-walk.svg                                    |
| Weighted Box Step-Up                    | weighted-box-step-up.svg                         |

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

### PASO 6 – Determinar datos de cada ejercicio

Para cada ejercicio (nuevo o existente), definir:

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre en inglés (igual al usado en el SVG, Title Case) |
| `description` | Descripción en español, 1-3 oraciones sobre cómo se ejecuta |
| `technical_notes` | Notas técnicas: errores comunes, puntos clave de forma |
| `difficulty` | Básico / Intermedio / Avanzado / Experto |
| `primary_muscle` | **1 músculo primario** — usar nombre **simplificado** del catálogo (ver §5.1) |
| `secondary_muscles[]` | 0 a N **músculos secundarios** — misma convención simplificada (ver §5.1) |
| `equipment[]` | Equipamiento necesario (ver catálogo abajo) |
| `tags[]` | Tags relevantes (ver catálogo abajo) |
| `section_types[]` | En qué tipos de sección suele aparecer |
| `units[]` | Unidades de medida (primera = default) |
| `video_path` | URL del video de YouTube si está en Ejercicios.md |
| `is_compound` | 1 si trabaja múltiples articulaciones, 0 si es monoarticular |
| `image_url` | `/img/exercises/nombre-del-archivo.svg` |

**Vista frontal y posterior de músculos:**
Al describir músculos trabajados, indicar:

| Músculo en BD         | Vista       | Zona          |
|-----------------------|-------------|---------------|
| Pectorales            | Frontal     | upper_body    |
| Deltoides             | Frontal     | upper_body    |
| Bíceps                | Frontal     | upper_body    |
| Cuádriceps            | Frontal     | lower_body    |
| Core/Abdominales      | Frontal     | core          |
| Dorsales              | Posterior   | upper_body    |
| Trapecio              | Posterior   | upper_body    |
| Tríceps               | Posterior   | upper_body    |
| Antebrazos            | Posterior   | upper_body    |
| Glúteos               | Posterior   | lower_body    |
| Isquiotibiales        | Posterior   | lower_body    |
| Pantorrillas          | Posterior   | lower_body    |

### PASO 7 – Construir el JSON de salida

El archivo `data.json` dentro del ZIP tiene esta estructura:

```json
{
  "meta": {
    "app": "CrossFit Session Tracker",
    "version": "1.0.0",
    "exportDate": "2026-04-01T00:00:00.000Z",
    "schemaVersion": 1,
    "tables": 19,
    "totalRecords": <total>
  },
  "data": {
    "muscle_group": [ ... ],
    "equipment": [ ... ],
    "measurement_unit": [ ... ],
    "difficulty_level": [ ... ],
    "tag": [ ... ],
    "section_type": [ ... ],
    "work_format": [ ... ],
    "exercise": [ ... ],
    "exercise_muscle_group": [ ... ],
    "exercise_equipment": [ ... ],
    "exercise_section_type": [ ... ],
    "exercise_unit": [ ... ],
    "exercise_tag": [ ... ],
    "class_template": [ ... ],
    "class_section": [ ... ],
    "section_exercise": [ ... ],
    "training_session": [],
    "session_exercise_result": [],
    "personal_record": []
  }
}
```

**IMPORTANTE:** El orden de las tablas en `data` es obligatorio (respeta dependencias FK).

### PASO 8 – Generar IDs

Todos los IDs son UUID v4. Generarlos con el formato estándar:
`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

Asignar un ID único fijo por entidad en el JSON generado.

---

## 5. CATÁLOGOS DE LA BASE DE DATOS (valores exactos del seed)

### 5.1 muscle_group

Estos son los **12 nombres simplificados** que se usan siempre en el código (`primary_muscle`, `secondary_muscles[]`).
La función `toDbName()` del servicio los traduce automáticamente a los nombres granulares de la BD
cuando el usuario tiene el catálogo extendido (post "Cargar Datos Base").

```json
[
  {"name":"Pectorales",      "body_zone":"upper_body", "sort_order":1},
  {"name":"Dorsales",        "body_zone":"upper_body", "sort_order":2},
  {"name":"Deltoides",       "body_zone":"upper_body", "sort_order":3},
  {"name":"Bíceps",          "body_zone":"upper_body", "sort_order":4},
  {"name":"Tríceps",         "body_zone":"upper_body", "sort_order":5},
  {"name":"Trapecio",        "body_zone":"upper_body", "sort_order":6},
  {"name":"Antebrazos",      "body_zone":"upper_body", "sort_order":7},
  {"name":"Cuádriceps",      "body_zone":"lower_body", "sort_order":8},
  {"name":"Isquiotibiales",  "body_zone":"lower_body", "sort_order":9},
  {"name":"Glúteos",         "body_zone":"lower_body", "sort_order":10},
  {"name":"Pantorrillas",    "body_zone":"lower_body", "sort_order":11},
  {"name":"Core/Abdominales","body_zone":"core",       "sort_order":12}
]
```

**Mapeo simplificado → granular** (usado por `toDbName()` en el servicio):

| Nombre simplificado (en código) | Nombre granular (en BD post Cargar Datos) |
|---------------------------------|-------------------------------------------|
| `Deltoides`                     | `Deltoides anterior`                      |
| `Cuádriceps`                    | `Recto femoral`                           |
| `Isquiotibiales`                | `Bíceps femoral`                          |
| `Glúteos`                       | `Glúteo mayor`                            |
| `Dorsales`                      | `Dorsal ancho`                            |
| `Trapecio`                      | `Trapecio (superior)`                     |
| `Bíceps`                        | `Bíceps braquial`                         |
| `Tríceps`                       | `Tríceps braquial`                        |
| `Pantorrillas`                  | `Gastrocnemio (gemelos)`                  |
| `Core/Abdominales`              | `Recto abdominal`                         |
| `Antebrazos`                    | `Flexores antebrazo`                      |
| `Pectorales`                    | `Pectoral mayor`                          |

**Tabla de referencia — músculos por patrón de movimiento:**

| Patrón de movimiento        | Primario           | Secundarios habituales                              |
|-----------------------------|--------------------|-----------------------------------------------------|
| Sentadilla (squat)          | Cuádriceps         | Glúteos, Isquiotibiales, Core/Abdominales           |
| Peso muerto (DL)            | Isquiotibiales     | Glúteos, Cuádriceps, Dorsales, Trapecio             |
| Press overhead              | Deltoides          | Tríceps, Core/Abdominales                           |
| Pull vertical (pull-up)     | Dorsales           | Bíceps, Core/Abdominales                            |
| Row / jalón horizontal      | Dorsales           | Bíceps, Trapecio, Core/Abdominales                  |
| High pull / jalón explosivo | Trapecio           | Deltoides, Cuádriceps, Glúteos                      |
| Olímpico (snatch/clean)     | Cuádriceps         | Glúteos, Deltoides, Trapecio, Core/Abdominales      |
| Press horizontal (bench)    | Pectorales         | Tríceps, Deltoides                                  |
| Cardio (correr/saltar)      | Cuádriceps         | Isquiotibiales, Glúteos, Pantorrillas               |
| Core / plancha              | Core/Abdominales   | Deltoides (planchas), Glúteos (puentes)             |
| Movilidad de hombro         | Deltoides          | Trapecio, Dorsales                                  |
| Movilidad de cadera         | Glúteos            | Isquiotibiales, Core/Abdominales                    |
| Carry / farmer              | Trapecio           | Antebrazos, Core/Abdominales, Cuádriceps            |
| Lunge                       | Cuádriceps         | Glúteos, Isquiotibiales                             |
| Curl / bíceps               | Bíceps             | Antebrazos                                          |
| Extensión tríceps           | Tríceps            | —                                                   |
| Estiramiento cadera/glúteo  | Glúteos            | Isquiotibiales, Core/Abdominales                    |
| Estiramiento posterior      | Isquiotibiales     | Pantorrillas, Dorsales                              |
| Estiramiento hombro/pecho   | Bíceps / Pectorales| Deltoides                                           |

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

> Si un ejercicio usa un equipamiento que no está en la lista, agregarlo como registro nuevo en la tabla `equipment` con category apropiada.

### 5.3 difficulty_level

| name        | color   | numeric_value |
|-------------|---------|---------------|
| Básico      | #22c55e | 1             |
| Intermedio  | #f59e0b | 2             |
| Avanzado    | #ef4444 | 3             |
| Experto     | #8b5cf6 | 4             |

### 5.4 section_type

| name             | color   | icon     | default_order |
|------------------|---------|----------|---------------|
| Entrada en calor | #22c55e | Flame    | 1             |
| Activación       | #f59e0b | Zap      | 2             |
| Fuerza           | #ef4444 | Dumbbell | 3             |
| Habilidad        | #8b5cf6 | Star     | 4             |
| WOD              | #f97316 | Timer    | 5             |
| Vuelta a la calma| #06b6d4 | Wind     | 6             |
| Accesorio        | #64748b | Plus     | 7             |

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

`hombro`, `sentadilla`, `core`, `olímpico`, `gimnástico`, `cardio`, `monoarticular`, `press`, `pull`, `push`, `bilateral`, `unilateral`, `isométrico`, `pliométrico`, `movilidad`, `activación`

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
  "video_path": "https://www.youtube.com/...",
  "is_compound": 1,
  "is_active": 1,
  "created_at": "2026-04-01 00:00:00",
  "updated_at": "2026-04-01 00:00:00"
}
```

### exercise_muscle_group
```json
{
  "id": "uuid-v4",
  "exercise_id": "id del exercise",
  "muscle_group_id": "id del muscle_group",
  "is_primary": 1
}
```
> `is_primary: 1` para el músculo principal, `0` para los secundarios.

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
  "date": "2026-04-01",
  "name": "Clase GOAT 01/04/2026",
  "objective": "Descripción del objetivo de la clase",
  "general_notes": null,
  "estimated_duration_minutes": 60,
  "is_favorite": 0,
  "is_active": 1,
  "created_at": "2026-04-01 00:00:00",
  "updated_at": "2026-04-01 00:00:00"
}
```

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
con un mínimo de 15 s.

| Tipo de movimiento                                                        | seg/rep | Ej. 10 reps |
|---------------------------------------------------------------------------|:-------:|:-----------:|
| Olímpico pesado o complejo (snatch, clean & jerk, con pausa)               | 8       | 80 s        |
| Fuerza con barra (deadlift, squat, press, thruster)                        | 5       | 50 s        |
| Gimnástico avanzado (muscle-up, HSPU, chest-to-bar, wall walk, pistol)     | 5       | 50 s        |
| Mancuerna / kettlebell (swing, snatch, push press, devil's press, wall ball)| 3      | 30 s        |
| Gimnástico básico (push-up, sit-up, air squat, burpee, box jump)           | 3       | 30 s        |
| Lunge / step-over / step-up (por paso)                                     | 2.5     | 25 s        |
| Movilidad y activación con reps (band pull-apart, scapular push-up)        | 2       | 20 s        |
| Saltos de soga (single-under / double-under)                               | 0.8     | 10 s        |

**Ejercicios que no son por repeticiones:**

| Caso                                    | Estimación                                              |
|-----------------------------------------|---------------------------------------------------------|
| Correr / shuttle run                    | 25 s cada 100 m                                         |
| Remo / assault bike (distancia)         | 25 s cada 100 m                                         |
| Remo / assault bike (calorías)          | 4 s por caloría                                         |
| Carry (farmer's, overhead)              | 10 s cada 20 m                                          |
| Rope climb                              | 30 s por subida                                         |
| Isométricos (plancha, hollow hold)      | el tiempo del MD; si no dice, 30 s                      |
| Estiramiento sin tiempo indicado        | 30 s por posición                                       |

**Ajustes:**
- Si el ejercicio es "cada lado" / "por lado", **duplicar** la estimación (y dejarlo en `coach_notes`).
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

### 7.4 Descansos por tipo de sección (valores sugeridos)

| Sección                                | `rest_between_exercises_seconds` | `rest_after_section_seconds` |
|----------------------------------------|:--------------------------------:|:----------------------------:|
| Entrada en calor / Movilidad           | 10                               | 60                           |
| Activación                             | 10                               | 60                           |
| Fuerza (series pesadas)                | 60–90                            | 120                          |
| WOD (For Time / AMRAP / Por rondas)    | **0** (circuito continuo)        | 60                           |
| Vuelta a la calma                      | 10                               | `null` (es la última)        |
| Secciones de intervalo                 | ignorado (manda la ventana)      | 60–120                       |

`rest_between_rounds_seconds`: sólo si el MD lo dice ("1 minuto entre rondas" → 60). En un WOD
continuo va en 0; si va en `null` el motor mete 60 s por default, que casi nunca es lo que se quiere
en un metcon.

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

---

## 8. REGLAS PARA IMPORTAR SIN PERDER DATOS EXISTENTES

El `importDataFromZip` BORRA todos los datos existentes antes de importar.

**Para agregar una clase a un sistema con datos existentes:**

**Opción A – Exportar + Merge (recomendada):**
1. El usuario exporta su backup actual desde Configuración → Exportar
2. Claude descomprime el ZIP, lee el `data.json`
3. Claude agrega los nuevos registros (ejercicios + clase) al JSON existente
4. Claude genera nuevo ZIP con el JSON enriquecido
5. El usuario importa el nuevo ZIP

**Opción B – ZIP completo desde cero:**
Generar un ZIP con TODOS los registros (catálogos seed + ejercicios seed + los nuevos + la clase nueva).
Sirve para enviar a un usuario nuevo que no tiene datos.
El JSON debe incluir todos los catálogos del seed y todos los ejercicios del seed más los nuevos.

---

## 9. EJEMPLO COMPLETO RESUELTO: Clase GOAT 01/04/2026

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

- [ ] SVGs creados para todos los ejercicios nuevos (3 frames, 200x230, animación CSS)
- [ ] Todos los ejercicios tienen: description, technical_notes, difficulty, equipment, tags, sections, units, video_path (si hay video en el MD)
- [ ] Cada ejercicio tiene exactamente 1 `primary_muscle` y 0-N `secondary_muscles` con nombres **simplificados** del catálogo (§5.1)
- [ ] El servicio incluye `SIMPLIFIED_TO_GRANULAR`, `toDbName()` y la lógica de `exercise_muscle_group` (§11a)
- [ ] Todas las secciones de la clase mapeadas a section_type y work_format correctos
- [ ] Todos los section_exercise tienen planned_repetitions / planned_time_seconds / planned_weight_value según corresponda

**Cronómetro (§7):**
- [ ] Todo ejercicio tiene duración resoluble: `planned_time_seconds` (si el MD lo dice) **o** `suggested_timer_seconds` (estimado) — nunca los dos
- [ ] Ninguna sección quedó sin ejercicios (el cronómetro la saltearía)
- [ ] Secciones de intervalo: `interval_seconds` cargado si la ventana difiere del default del formato, y el trabajo estimado entra en la ventana
- [ ] `rest_between_exercises_seconds` = 0 en los WOD continuos; `rest_between_rounds_seconds` cargado donde el MD lo indica
- [ ] `rest_after_section_seconds` definido en las secciones intermedias
- [ ] La suma estimada de la línea de tiempo es coherente con `estimated_duration_minutes`
- [ ] El data.json sigue el orden de tablas obligatorio
- [ ] Los IDs son UUID v4 válidos y no se repiten
- [ ] Las fechas están en formato `YYYY-MM-DD HH:MM:SS` (campos created_at/updated_at) o `YYYY-MM-DD` (campo date de class_template)
- [ ] El campo `meta.totalRecords` suma correctamente todos los registros del JSON
- [ ] Los SVGs nuevos están guardados en `public/img/exercises/`

---

## 11. CÓMO INTEGRAR LA CLASE EN LA APP

La forma estándar de cargar una clase es mediante un **servicio de importación TypeScript** y un **botón en Clases Predefinidas**. Este es el flujo completo:

### 11a. Crear el servicio de importación

Crear `src/services/classDDMMYYYYImportService.ts`. El template completo incluye la asignación
de músculos dentro del mismo servicio, sin necesitar un paso separado:

```typescript
// src/services/classDDMMYYYYImportService.ts
import { openDatabase, saveDatabase } from '../db/database';
import { generateUUID } from '../utils/formatters';

const IMPORT_FLAG = 'import_class_DD_MM_YYYY_done';

export function isClassDDMMYYYYImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

function markDone(): void {
  localStorage.setItem(IMPORT_FLAG, 'true');
}

// ── Mapeo simplificado → granular (post "Cargar Datos Base") ──────────────────
// Usar siempre los nombres simplificados (izquierda) en EXERCISES.
// toDbName() los traduce automáticamente al buscar en muscle_group.
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
  difficulty: string;           // 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto'
  primary_muscle: string;       // nombre simplificado (§5.1)
  secondary_muscles: string[];  // nombres simplificados (§5.1)
  equipment: string[];          // nombres exactos del catálogo equipment
  tags: string[];               // nombres exactos del catálogo tag
  section_types: string[];      // nombres exactos del catálogo section_type
  units: string[];              // primer elemento = default
  video_path?: string | null;
  video_long_path?: string | null;
  image_url: string;
  is_compound: number;
}

const EXERCISES: ExerciseDef[] = [
  // Completar con los ejercicios de la clase...
  // Ejemplo:
  // {
  //   name: 'Band Pull-Apart',
  //   description: 'De pie, separar los brazos con banda elástica...',
  //   technical_notes: 'Codos extendidos, escápulas juntas al final.',
  //   difficulty: 'Básico',
  //   primary_muscle: 'Deltoides',
  //   secondary_muscles: ['Trapecio', 'Dorsales'],
  //   equipment: ['Banda elástica'],
  //   tags: ['hombro', 'movilidad', 'pull'],
  //   section_types: ['Entrada en calor', 'Activación'],
  //   units: ['Repeticiones', 'Segundos'],
  //   video_path: 'https://youtube.com/...',
  //   image_url: '/img/exercises/band-pull-apart.svg',
  //   is_compound: 0,
  // },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function getOrCreate(
  db: any,
  exerciseDef: ExerciseDef,
  maps: {
    difficulty: Map<string, string>;
    muscle: Map<string, string>;
    equipment: Map<string, string>;
    tag: Map<string, string>;
    sectionType: Map<string, string>;
    unit: Map<string, string>;
  }
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
  const primaryDbName = toDbName(exerciseDef.primary_muscle);
  const primaryId = maps.muscle.get(primaryDbName) ?? null;

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

  // Músculo primario
  if (primaryId) {
    await db.run(
      'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,1)',
      [generateUUID(), id, primaryId]
    );
  }

  // Músculos secundarios
  for (const secName of exerciseDef.secondary_muscles) {
    const secId = maps.muscle.get(toDbName(secName));
    if (secId) {
      await db.run(
        'INSERT INTO exercise_muscle_group (id, exercise_id, muscle_group_id, is_primary) VALUES (?,?,?,0)',
        [generateUUID(), id, secId]
      );
    }
  }

  // Equipamiento
  for (const eqName of exerciseDef.equipment) {
    const eqId = maps.equipment.get(eqName);
    if (eqId) {
      await db.run(
        'INSERT INTO exercise_equipment (id, exercise_id, equipment_id, is_required) VALUES (?,?,?,1)',
        [generateUUID(), id, eqId]
      );
    }
  }

  // Tags
  for (const tagName of exerciseDef.tags) {
    const tagId = maps.tag.get(tagName);
    if (tagId) {
      await db.run(
        'INSERT INTO exercise_tag (id, exercise_id, tag_id) VALUES (?,?,?)',
        [generateUUID(), id, tagId]
      );
    }
  }

  // Section types
  for (const stName of exerciseDef.section_types) {
    const stId = maps.sectionType.get(stName);
    if (stId) {
      await db.run(
        'INSERT INTO exercise_section_type (id, exercise_id, section_type_id) VALUES (?,?,?)',
        [generateUUID(), id, stId]
      );
    }
  }

  // Unidades (primera = default)
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

// ── Función principal ─────────────────────────────────────────────────────────
export async function importClassDDMMYYYY(): Promise<{ exercises: number; created: boolean }> {
  const db = await openDatabase();

  // Guardia: clase ya importada
  const existing = await db.query(
    "SELECT id FROM class_template WHERE name = 'Clase GOAT DD/MM/YYYY' AND is_active = 1"
  );
  if (existing.values?.length) {
    markDone();
    return { exercises: 0, created: false };
  }

  // Cargar mapas de catálogos
  const rows = async (sql: string) => (await db.query(sql)).values ?? [];
  const toMap = (arr: any[]) => new Map(arr.map((r) => [r.name as string, r.id as string]));

  const maps = {
    difficulty:  toMap(await rows('SELECT id, name FROM difficulty_level WHERE is_active = 1')),
    muscle:      toMap(await rows('SELECT id, name FROM muscle_group WHERE is_active = 1')),
    equipment:   toMap(await rows('SELECT id, name FROM equipment WHERE is_active = 1')),
    tag:         toMap(await rows('SELECT id, name FROM tag WHERE is_active = 1')),
    sectionType: toMap(await rows('SELECT id, name FROM section_type WHERE is_active = 1')),
    workFormat:  toMap(await rows('SELECT id, name FROM work_format WHERE is_active = 1')),
    unit:        toMap(await rows('SELECT id, name FROM measurement_unit WHERE is_active = 1')),
  };

  // Crear ejercicios (idempotente — getOrCreate no duplica)
  let exercisesCreated = 0;
  const exerciseIds: Record<string, string> = {};
  for (const def of EXERCISES) {
    const { id, created } = await getOrCreate(db, def, maps);
    exerciseIds[def.name] = id;
    if (created) exercisesCreated++;
  }

  // ── Crear la plantilla de clase ────────────────────────────────────────────
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const classId = generateUUID();
  await db.run(
    `INSERT INTO class_template
       (id, date, name, objective, general_notes, estimated_duration_minutes,
        is_favorite, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,0,1,?,?)`,
    [classId, 'YYYY-MM-DD', 'Clase GOAT DD/MM/YYYY',
     'Objetivo de la clase', null, 60, now, now]
  );

  // ── Secciones ──────────────────────────────────────────────────────────────
  // Las 3 últimas columnas antes de las fechas son los overrides del cronómetro (§7).
  // Repetir este bloque por cada sección:
  // const sec1Id = generateUUID();
  // await db.run(
  //   `INSERT INTO class_section
  //      (id, class_template_id, section_type_id, work_format_id, sort_order,
  //       visible_title, general_description, time_cap_seconds, total_rounds,
  //       rest_between_rounds_seconds, notes,
  //       rest_between_exercises_seconds, rest_after_section_seconds, interval_seconds,
  //       created_at, updated_at)
  //    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  //   [sec1Id, classId, maps.sectionType.get('Entrada en calor'),
  //    maps.workFormat.get('Trabajo libre'), 1,
  //    'Calentamiento', '6 minutos', 360, null, null, null,
  //    10, 60, null,   // ← descanso entre ejercicios / al cerrar sección / ventana de intervalo
  //    now, now]
  // );

  // ── Ejercicios de sección ──────────────────────────────────────────────────
  // suggested_timer_seconds = duración estimada (§7.2). Va SOLO si planned_time_seconds es null.
  // await db.run(
  //   `INSERT INTO section_exercise
  //      (id, class_section_id, exercise_id, sort_order, coach_notes,
  //       planned_repetitions, planned_weight_value, planned_weight_unit_id,
  //       planned_time_seconds, planned_distance_value, planned_distance_unit_id,
  //       planned_calories, planned_rest_seconds, planned_rounds, suggested_timer_seconds,
  //       rm_percentage, suggested_scaling, notes, created_at, updated_at)
  //    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  //   [generateUUID(), sec1Id, exerciseIds['Nombre ejercicio'], 1,
  //    'notas coach', 10, null, null, null, null, null, null, null, null,
  //    30,             // ← suggested_timer_seconds: 10 reps × 3 s
  //    null, null, null, now, now]
  // );

  await saveDatabase();
  markDone();
  return { exercises: exercisesCreated, created: true };
}
```

**Reglas del servicio:**
- Verificar la clase por `name` exacto antes de insertar (idempotente)
- Los músculos se asignan dentro de `getOrCreate()` — **no se crea ningún servicio separado**
- Usar siempre nombres **simplificados** en `primary_muscle` y `secondary_muscles`; `toDbName()` resuelve el nombre granular
- `video_path` = video corto (popup en sesión); `video_long_path` = tutorial explicativo
- `image_url` = ruta al SVG en `/img/exercises/`
- `INSERT OR IGNORE` no aplica aquí — se usa `getOrCreate` que verifica primero por nombre
- El flag en localStorage controla que no se ejecute dos veces
- **Cronómetro:** cada `section_exercise` tiene que salir con `planned_time_seconds` **o**
  `suggested_timer_seconds` cargado; ninguna sección puede quedar sin ejercicios (§7)

### 11b. Agregar el botón en ClassSeederSection

Editar `src/components/export/ClassSeederSection.tsx`:

```typescript
// 1. Importar el nuevo servicio
import {
  importClassDDMMYYYY,
  isClassDDMMYYYYImportDone,
} from '../../services/classDDMMYYYYImportService';

// 2. Agregar entrada al array CLASS_ENTRIES (más reciente primero)
const CLASS_ENTRIES: ClassEntry[] = [
  {
    label: 'Clase GOAT DD/MM/YYYY',
    date: 'Sección 1 · Sección 2 · Sección 3 · ...',
    isDone: isClassDDMMYYYYImportDone,
    run: importClassDDMMYYYY,
  },
  // ... entradas anteriores
];
```

El botón aparece automáticamente en **Configuración → Clases predefinidas**.
- Icono violeta con `CalendarPlus` → pendiente
- Icono verde con `CheckCircle2` → ya importada (deshabilitado)
- El texto debajo del nombre describe las secciones de la clase

### 11c. Verificar compilación

```bash
npx tsc --noEmit
```

### 11d. Usar la clase

1. Abrir la app (`npm run dev` → `localhost:5173`)
2. Ir a **Configuración** → sección **Clases predefinidas**
3. Tocar el botón de la clase nueva
4. La clase aparece en `/clases` con todos sus ejercicios y secciones listos

### 11e. Verificar el cronómetro

1. Ir a **Sesiones → Nueva**, dejar seleccionado **Clase guiada** y elegir la clase recién importada
2. El cronómetro debe recorrer la clase entera sin pasos de 0 segundos inesperados ni secciones ausentes
3. Contrastar la duración total que muestra con `estimated_duration_minutes` de la plantilla
4. Los tiempos globales (cuenta regresiva, pips, vibración) se ajustan en
   **Configuración → Cronómetro**; los de la clase, editando la plantilla

---

*Última actualización: 2026-07-13*
*Versión del schema: 11 (v011_timer_mode — campos del cronómetro)*
*Músculo integrado en el servicio — ya no se usa ACTUALIZO_MUSCULOS.md para clases nuevas*
*Cronómetro: toda clase nueva debe traer tiempos cargados o estimados (§7)*
