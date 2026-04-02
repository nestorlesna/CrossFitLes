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
2. **Un servicio de importación TypeScript** que crea los ejercicios y la clase en la BD
3. **Un botón en Clases Predefinidas** (Configuración) para que el usuario ejecute la importación manualmente

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
| `primary_muscle` | Músculo principal (ver catálogo abajo) |
| `secondary_muscles[]` | Músculos secundarios (ver catálogo abajo) |
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

| name         | has_time_cap | has_rounds |
|--------------|:------------:|:----------:|
| Por rondas   | 0            | 1          |
| EMOM         | 1            | 1          |
| AMRAP        | 1            | 0          |
| For Time     | 1            | 0          |
| Series fijas | 0            | 1          |
| Trabajo libre| 0            | 0          |
| Intervalos   | 1            | 1          |
| Tabata       | 1            | 1          |
| E2MOM        | 1            | 1          |
| Escalera     | 0            | 0          |

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
  "created_at": "2026-04-01 00:00:00",
  "updated_at": "2026-04-01 00:00:00"
}
```

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
  "rm_percentage": 80,
  "suggested_scaling": null,
  "notes": null,
  "created_at": "2026-04-01 00:00:00",
  "updated_at": "2026-04-01 00:00:00"
}
```

---

## 7. REGLAS PARA IMPORTAR SIN PERDER DATOS EXISTENTES

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

## 8. EJEMPLO COMPLETO RESUELTO: Clase GOAT 01/04/2026

### 8a. Análisis del MD

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

### 8b. Ejercicios nuevos de esta clase (sin SVG previo)

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

### 8c. Ejercicios ya existentes en esta clase

| Ejercicio en MD         | Nombre en BD          | SVG existente              |
|-------------------------|-----------------------|----------------------------|
| Muscle Snatch           | Barbell Muscle Snatch | barbell-muscle-snatch.svg  |

### 8d. Secciones y section_exercises de la Clase GOAT 01/04/2026

**Sección 1: Calentamiento**
- section_type: Entrada en calor | work_format: Trabajo libre | time_cap: 360 seg | visible_title: "Calentamiento"
- Ejercicios: Ninguno específico (general_description: "6 minutos de calentamiento general")

**Sección 2: Movilidad**
- section_type: Entrada en calor | work_format: Por rondas | total_rounds: 2 | visible_title: "Movilidad"
- general_description: "2 rondas todo 30 segundos"
- Ejercicios:
  1. Band Pull-Apart → planned_time_seconds: 30
  2. Band External Rotation → planned_time_seconds: 30 | coach_notes: "Cada lado"
  3. 90/90 Hip Rotation → planned_time_seconds: 30

**Sección 3: Activación**
- section_type: Activación | work_format: EMOM | time_cap: 300 seg | visible_title: "Activación"
- general_description: "todo 10 repeticiones en 5 minutos"
- Ejercicios:
  1. Lateral Raise to Overhead → planned_repetitions: 10 | planned_weight_value: 2.5 | planned_weight_unit_id: kg | coach_notes: "2 discos de 2.5"
  2. Scapular Push-Up → planned_repetitions: 10
  3. High Pull + External Rotation → planned_repetitions: 10 | planned_weight_value: 2.5 | planned_weight_unit_id: kg | coach_notes: "2 discos de 2.5"

**Sección 4: Fuerza A – Complejo de snatch**
- section_type: Fuerza | work_format: E2MOM | total_rounds: 3 | visible_title: "Fuerza - Complejo"
- general_description: "3 rondas, todo 5 repeticiones por 1 minuto"
- Ejercicios (en cada ronda, en orden):
  1. Snatch Grip Deadlift → planned_repetitions: 5 | planned_weight_value: 20 | sort_order: 1 | coach_notes: "a"
  2. Snatch High Pull → planned_repetitions: 5 | planned_weight_value: 20 | sort_order: 2 | coach_notes: "b"
  3. Barbell Muscle Snatch → planned_repetitions: 5 | planned_weight_value: 20 | sort_order: 3 | coach_notes: "c"

**Sección 5: Fuerza B – Snatch con pausa**
- section_type: Fuerza | work_format: E2MOM | total_rounds: 6 | visible_title: "Fuerza - Snatch"
- time_cap_seconds: 540 (6 x 1.5 min) | general_description: "6 rondas, 3 repeticiones por 1.5 minutos"
- Ejercicios:
  1. Snatch with Pause at Knee → planned_repetitions: 3 | coach_notes: "2s de pausa en rodilla"

**Sección 6: WOD**
- section_type: WOD | work_format: Por rondas | total_rounds: 10 | time_cap_seconds: 960 | visible_title: "WOD"
- general_description: "10 rondas máximo 16 minutos en parejas, uno trabaja el otro descansa"
- Ejercicios:
  1. Dumbbell Deadlift → planned_repetitions: 6 | planned_weight_value: 10 | sort_order: 1
  2. DB Lateral Step-Over → planned_repetitions: 4 | planned_weight_value: 10 | sort_order: 2
  3. Dumbbell Push Press → planned_repetitions: 2 | sort_order: 3

---

## 9. CHECKLIST DE ENTREGA

Al finalizar la generación de una clase, verificar:

- [ ] SVGs creados para todos los ejercicios nuevos (3 frames, 200x230, animación CSS)
- [ ] Todos los ejercicios tienen: description, technical_notes, difficulty, primaryMuscle, secondaryMuscles, equipment, tags, sections, units, video_path (si hay video en el MD)
- [ ] Todas las secciones de la clase mapeadas a section_type y work_format correctos
- [ ] Todos los section_exercise tienen planned_repetitions / planned_time_seconds / planned_weight_value según corresponda
- [ ] El data.json sigue el orden de tablas obligatorio
- [ ] Los IDs son UUID v4 válidos y no se repiten
- [ ] Las fechas están en formato `YYYY-MM-DD HH:MM:SS` (campos created_at/updated_at) o `YYYY-MM-DD` (campo date de class_template)
- [ ] El campo `meta.totalRecords` suma correctamente todos los registros del JSON
- [ ] Los SVGs nuevos están guardados en `public/img/exercises/`

---

## 10. CÓMO INTEGRAR LA CLASE EN LA APP

La forma estándar de cargar una clase es mediante un **servicio de importación TypeScript** y un **botón en Clases Predefinidas**. Este es el flujo completo:

### 10a. Crear el servicio de importación

Crear `src/services/classDDMMYYYYImportService.ts` siguiendo el patrón de `class01042026ImportService.ts`:

```typescript
// Flag de control (único por clase)
const IMPORT_FLAG = 'import_class_DD_MM_YYYY_done';
export function isClassDDMMYYYYImportDone(): boolean {
  return localStorage.getItem(IMPORT_FLAG) === 'true';
}

// Función principal
export async function importClassDDMMYYYY(): Promise<{ exercises: number; created: boolean }> {
  // 1. Verificar si la clase ya existe por nombre exacto
  // 2. Cargar mapas de catálogos (difficulty, muscle, equipment, tag, section_type, work_format, unit)
  // 3. Crear ejercicios nuevos (INSERT si no existen + todas las tablas de relación)
  // 4. Crear class_template + class_section + section_exercise
  // 5. markImportDone() y return { exercises, created: true }
}
```

**Reglas del servicio:**
- Verificar la clase por `name` exacto antes de insertar (idempotente)
- Usar `video_long_path` para las URLs de YouTube (campo de la migración v003)
- Usar `image_url` para la ruta del SVG (campo de la migración v004)
- Usar `INSERT OR IGNORE` para equipamiento nuevo
- El flag en localStorage controla que no se ejecute dos veces

### 10b. Agregar el botón en ClassSeederSection

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

### 10c. Verificar compilación

```bash
npx tsc --noEmit
```

### 10d. Usar la clase

1. Abrir la app (`npm run dev` → `localhost:5173`)
2. Ir a **Configuración** → sección **Clases predefinidas**
3. Tocar el botón de la clase nueva
4. La clase aparece en `/clases` con todos sus ejercicios y secciones listos

---

*Última actualización: 2026-04-01*
*Versión del schema: 1 (v001_initial)*
