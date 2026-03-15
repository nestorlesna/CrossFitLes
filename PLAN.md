# Plan de Desarrollo: CrossFit Session Tracker

## Información del Proyecto

- **Nombre**: CrossFit Session Tracker
- **Tipo**: Aplicación móvil de uso personal
- **Distribución**: APK directo (sin Play Store) + PWA fallback
- **Idioma de la UI**: Español
- **Idioma del código**: Inglés (variables, funciones, componentes, nombres de tablas y columnas)
- **Comentarios en código**: Español

---

## Stack Tecnológico

| Capa | Tecnología | Versión mínima |
|------|-----------|----------------|
| Framework UI | React con TypeScript | 18+ |
| Bundler | Vite | 5+ |
| Bridge nativo | Capacitor | 6+ |
| Base de datos | SQLite vía `@capacitor-community/sqlite` | - |
| Estilos | Tailwind CSS | 3+ |
| Navegación | React Router | 6+ |
| Fechas | date-fns | 3+ |
| Gráficos | Recharts | 2+ |
| Iconos | Lucide React | - |
| Compresión (export/import) | JSZip | 3+ |
| Filesystem nativo | `@capacitor/filesystem` | - |
| Cámara | `@capacitor/camera` | - |
| Share nativo | `@capacitor/share` | - |
| Toast/feedback | Sonner o react-hot-toast | - |

### Notas sobre el stack

- **NO usar localStorage ni sessionStorage** para datos persistentes. Todo va a SQLite.
- Las imágenes y videos de ejercicios se almacenan en el filesystem nativo del dispositivo. En SQLite se guarda solo la ruta relativa al archivo.
- En modo PWA (fallback sin Capacitor), las imágenes se guardan como blobs en una tabla auxiliar de SQLite o IndexedDB.
- Configurar Vite para generar builds optimizados para mobile.
- El proyecto debe funcionar en modo desarrollo en el browser (hot reload) y compilar a APK con Capacitor.

---

## Arquitectura General

```
src/
├── main.tsx                      # Entry point
├── App.tsx                       # Router principal
├── db/
│   ├── database.ts               # Inicialización SQLite, conexión
│   ├── migrations/
│   │   ├── index.ts              # Registry de migraciones
│   │   ├── v001_initial.ts       # Schema inicial
│   │   └── v002_xxx.ts           # Futuras migraciones
│   └── repositories/
│       ├── exerciseRepo.ts
│       ├── classTemplateRepo.ts
│       ├── trainingSessionRepo.ts
│       ├── catalogRepo.ts        # Repos para tablas de lookup
│       └── mediaRepo.ts          # Gestión de archivos multimedia
├── models/
│   ├── Exercise.ts
│   ├── ClassTemplate.ts
│   ├── Section.ts
│   ├── SectionExercise.ts
│   ├── TrainingSession.ts
│   ├── SessionExerciseResult.ts
│   └── catalogs.ts               # Tipos para todas las tablas de lookup
├── components/
│   ├── ui/                       # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Tabs.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ImagePicker.tsx
│   │   └── TagSelector.tsx
│   ├── exercises/
│   │   ├── ExerciseList.tsx
│   │   ├── ExerciseForm.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── ExerciseDetail.tsx
│   │   └── ExerciseFilter.tsx
│   ├── classes/
│   │   ├── ClassTemplateList.tsx
│   │   ├── ClassTemplateForm.tsx
│   │   ├── SectionEditor.tsx
│   │   ├── SectionExerciseEditor.tsx
│   │   └── ClassTemplateDetail.tsx
│   ├── sessions/
│   │   ├── SessionList.tsx
│   │   ├── SessionExecutor.tsx    # Pantalla de ejecución en vivo
│   │   ├── SessionDetail.tsx
│   │   ├── SessionExerciseInput.tsx
│   │   └── SessionSummary.tsx
│   ├── catalogs/
│   │   ├── CatalogManager.tsx     # CRUD genérico para tablas de lookup
│   │   ├── MuscleGroupManager.tsx
│   │   ├── EquipmentManager.tsx
│   │   └── TagManager.tsx
│   ├── stats/
│   │   ├── ProgressCharts.tsx
│   │   ├── ExerciseHistory.tsx
│   │   └── PersonalRecords.tsx
│   ├── export/
│   │   ├── ExportScreen.tsx
│   │   └── ImportScreen.tsx
│   └── layout/
│       ├── BottomNav.tsx
│       ├── Header.tsx
│       └── Layout.tsx
├── hooks/
│   ├── useDatabase.ts
│   ├── useExercises.ts
│   ├── useClassTemplates.ts
│   ├── useSessions.ts
│   ├── useCatalogs.ts
│   └── useExportImport.ts
├── services/
│   ├── exportService.ts          # Lógica de exportación JSON + ZIP
│   ├── importService.ts          # Lógica de importación y restauración
│   ├── mediaService.ts           # Gestión de fotos/videos en filesystem
│   └── migrationService.ts       # Ejecutor de migraciones de BD
├── utils/
│   ├── constants.ts
│   ├── dateUtils.ts
│   ├── validators.ts
│   └── formatters.ts
└── types/
    └── index.ts                  # Tipos compartidos y enums
```

---

## Modelo de Datos (SQLite)

### Principios de diseño de la base de datos

1. Todas las tablas usan `id TEXT PRIMARY KEY` con UUID v4 generado en el cliente.
2. Todas las tablas incluyen `created_at TEXT NOT NULL DEFAULT (datetime('now'))` y `updated_at TEXT NOT NULL DEFAULT (datetime('now'))`.
3. Las foreign keys se definen con `ON DELETE CASCADE` donde corresponda.
4. Los campos opcionales son `NULL` por defecto.
5. Los campos booleanos se representan como `INTEGER` (0/1).
6. Las fechas se almacenan en formato ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
7. Ejecutar `PRAGMA foreign_keys = ON;` al abrir cada conexión.

### Tablas de Catálogos (Lookup)

```sql
-- Grupos musculares
CREATE TABLE muscle_group (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    body_zone TEXT,            -- 'upper_body', 'lower_body', 'core', 'full_body'
    image_path TEXT,           -- Ruta a imagen del cuerpo con el músculo resaltado
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Equipamiento
CREATE TABLE equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_path TEXT,           -- Foto del equipamiento
    category TEXT,             -- 'barbell', 'dumbbell', 'kettlebell', 'machine', 'bodyweight', 'cardio', 'other'
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Unidades de medida
CREATE TABLE measurement_unit (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL, -- 'kg', 'lb', 'rep', 'cal', 'min', 'seg', 'm', 'km', etc.
    unit_type TEXT NOT NULL,    -- 'weight', 'repetitions', 'calories', 'time', 'distance'
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Niveles de dificultad
CREATE TABLE difficulty_level (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- 'Básico', 'Intermedio', 'Avanzado', 'Experto'
    description TEXT,
    color TEXT,                 -- Color para UI: '#4CAF50', '#FF9800', etc.
    numeric_value INTEGER,     -- 1, 2, 3, 4 para ordenamiento y comparación
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tags / etiquetas
CREATE TABLE tag (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- 'hombro', 'sentadilla', 'core', 'olímpico', 'gimnástico'
    color TEXT,                 -- Color para badge en UI
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tipos de sección de clase
CREATE TABLE section_type (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- 'Entrada en calor', 'Activación', 'Fuerza', 'Habilidad', 'WOD', 'Vuelta a la calma'
    description TEXT,
    default_order INTEGER,     -- Orden sugerido dentro de una clase
    color TEXT,                -- Color para UI
    icon TEXT,                 -- Nombre de icono Lucide
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Formatos de trabajo
CREATE TABLE work_format (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- 'Por rondas', 'EMOM', 'AMRAP', 'For Time', 'Series fijas', 'Trabajo libre', 'Intervalos', 'Tabata', 'E2MOM'
    description TEXT,
    has_time_cap INTEGER DEFAULT 0,  -- Si el formato implica un límite de tiempo
    has_rounds INTEGER DEFAULT 0,    -- Si el formato implica rondas
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Tabla de Ejercicios

```sql
CREATE TABLE exercise (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    technical_notes TEXT,          -- Notas técnicas detalladas del movimiento
    difficulty_level_id TEXT,
    primary_muscle_group_id TEXT,
    image_path TEXT,               -- Foto principal del ejercicio
    video_path TEXT,               -- Video demostrativo
    is_compound INTEGER DEFAULT 0, -- Si es movimiento compuesto (multiarticular)
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (difficulty_level_id) REFERENCES difficulty_level(id) ON DELETE SET NULL,
    FOREIGN KEY (primary_muscle_group_id) REFERENCES muscle_group(id) ON DELETE SET NULL
);

-- Relación N:N ejercicio-grupo muscular secundario
CREATE TABLE exercise_muscle_group (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL,
    muscle_group_id TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,  -- 1 si es el músculo principal
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
    FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE,
    UNIQUE(exercise_id, muscle_group_id)
);

-- Relación N:N ejercicio-equipamiento
CREATE TABLE exercise_equipment (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL,
    equipment_id TEXT NOT NULL,
    is_required INTEGER DEFAULT 1,  -- 1 obligatorio, 0 opcional/alternativo
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    UNIQUE(exercise_id, equipment_id)
);

-- Relación N:N ejercicio-tipo de sección donde se usa
CREATE TABLE exercise_section_type (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL,
    section_type_id TEXT NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
    FOREIGN KEY (section_type_id) REFERENCES section_type(id) ON DELETE CASCADE,
    UNIQUE(exercise_id, section_type_id)
);

-- Relación N:N ejercicio-unidad de medida aplicable
CREATE TABLE exercise_unit (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL,
    measurement_unit_id TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,  -- Unidad por defecto para este ejercicio
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
    FOREIGN KEY (measurement_unit_id) REFERENCES measurement_unit(id) ON DELETE CASCADE,
    UNIQUE(exercise_id, measurement_unit_id)
);

-- Relación N:N ejercicio-tags
CREATE TABLE exercise_tag (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE,
    UNIQUE(exercise_id, tag_id)
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_exercise_name ON exercise(name);
CREATE INDEX idx_exercise_difficulty ON exercise(difficulty_level_id);
CREATE INDEX idx_exercise_muscle ON exercise(primary_muscle_group_id);
CREATE INDEX idx_exercise_muscle_group_exercise ON exercise_muscle_group(exercise_id);
CREATE INDEX idx_exercise_equipment_exercise ON exercise_equipment(exercise_id);
CREATE INDEX idx_exercise_tag_exercise ON exercise_tag(exercise_id);
CREATE INDEX idx_exercise_tag_tag ON exercise_tag(tag_id);
```

### Plantillas de Clase

```sql
CREATE TABLE class_template (
    id TEXT PRIMARY KEY,
    date TEXT,                     -- Fecha para la que se planificó (puede ser NULL si es genérica)
    name TEXT NOT NULL,
    objective TEXT,                -- Objetivo o foco de la clase
    general_notes TEXT,            -- Observaciones generales
    estimated_duration_minutes INTEGER,
    is_favorite INTEGER DEFAULT 0, -- Para marcar plantillas recurrentes
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE class_section (
    id TEXT PRIMARY KEY,
    class_template_id TEXT NOT NULL,
    section_type_id TEXT NOT NULL,
    work_format_id TEXT,           -- Puede ser NULL si no aplica formato específico
    sort_order INTEGER NOT NULL,
    visible_title TEXT,            -- Título personalizado (si difiere del tipo de sección)
    general_description TEXT,      -- Descripción general de la sección
    time_cap_seconds INTEGER,      -- Límite de tiempo en segundos (para AMRAP, For Time, etc.)
    total_rounds INTEGER,          -- Rondas totales (para EMOM, por rondas, etc.)
    rest_between_rounds_seconds INTEGER, -- Descanso entre rondas
    notes TEXT,                    -- Notas adicionales del coach
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (class_template_id) REFERENCES class_template(id) ON DELETE CASCADE,
    FOREIGN KEY (section_type_id) REFERENCES section_type(id) ON DELETE SET NULL,
    FOREIGN KEY (work_format_id) REFERENCES work_format(id) ON DELETE SET NULL
);

CREATE TABLE section_exercise (
    id TEXT PRIMARY KEY,
    class_section_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    coach_notes TEXT,              -- Indicaciones del coach o propias
    planned_repetitions INTEGER,
    planned_weight_value REAL,
    planned_weight_unit_id TEXT,   -- FK a measurement_unit
    planned_time_seconds INTEGER,
    planned_distance_value REAL,
    planned_distance_unit_id TEXT, -- FK a measurement_unit
    planned_calories INTEGER,
    planned_rest_seconds INTEGER,
    planned_rounds INTEGER,
    rm_percentage REAL,            -- % del RM si aplica (ej: 0.80 para 80%)
    suggested_scaling TEXT,        -- Escalado sugerido (texto libre)
    notes TEXT,                    -- Observaciones particulares
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (class_section_id) REFERENCES class_section(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE RESTRICT,
    FOREIGN KEY (planned_weight_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL,
    FOREIGN KEY (planned_distance_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL
);

CREATE INDEX idx_class_template_date ON class_template(date);
CREATE INDEX idx_class_section_template ON class_section(class_template_id);
CREATE INDEX idx_section_exercise_section ON section_exercise(class_section_id);
CREATE INDEX idx_section_exercise_exercise ON section_exercise(exercise_id);
```

### Sesiones de Entrenamiento (Resultados)

```sql
CREATE TABLE training_session (
    id TEXT PRIMARY KEY,
    class_template_id TEXT,        -- FK opcional (puede ser sesión sin plantilla)
    session_date TEXT NOT NULL,    -- Fecha real del entrenamiento
    status TEXT NOT NULL DEFAULT 'planned',  -- 'planned', 'in_progress', 'completed', 'cancelled'
    actual_duration_minutes INTEGER,
    general_feeling TEXT,          -- 'terrible', 'bad', 'normal', 'good', 'excellent'
    perceived_effort INTEGER,      -- RPE 1-10
    final_notes TEXT,
    body_weight REAL,              -- Peso corporal del día (opcional)
    body_weight_unit_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (class_template_id) REFERENCES class_template(id) ON DELETE SET NULL,
    FOREIGN KEY (body_weight_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL
);

CREATE TABLE session_exercise_result (
    id TEXT PRIMARY KEY,
    training_session_id TEXT NOT NULL,
    section_exercise_id TEXT,      -- FK al ejercicio planificado (NULL si fue improvisado)
    exercise_id TEXT NOT NULL,     -- FK directa al ejercicio (siempre presente)
    section_type_id TEXT,          -- Para saber en qué sección se hizo
    sort_order INTEGER,
    actual_repetitions INTEGER,
    actual_weight_value REAL,
    actual_weight_unit_id TEXT,
    actual_time_seconds INTEGER,
    actual_distance_value REAL,
    actual_distance_unit_id TEXT,
    actual_calories INTEGER,
    actual_rounds INTEGER,
    actual_rest_seconds INTEGER,
    rx_or_scaled TEXT DEFAULT 'rx', -- 'rx', 'scaled', 'rx+'
    result_text TEXT,              -- Resultado textual libre (ej: "completé 5+3" en AMRAP)
    notes TEXT,
    is_completed INTEGER DEFAULT 1,
    is_personal_record INTEGER DEFAULT 0, -- Si fue PR
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (training_session_id) REFERENCES training_session(id) ON DELETE CASCADE,
    FOREIGN KEY (section_exercise_id) REFERENCES section_exercise(id) ON DELETE SET NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE RESTRICT,
    FOREIGN KEY (section_type_id) REFERENCES section_type(id) ON DELETE SET NULL,
    FOREIGN KEY (actual_weight_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL,
    FOREIGN KEY (actual_distance_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL
);

CREATE INDEX idx_training_session_date ON training_session(session_date);
CREATE INDEX idx_training_session_status ON training_session(status);
CREATE INDEX idx_training_session_template ON training_session(class_template_id);
CREATE INDEX idx_session_result_session ON session_exercise_result(training_session_id);
CREATE INDEX idx_session_result_exercise ON session_exercise_result(exercise_id);
```

### Tabla para Records Personales

```sql
CREATE TABLE personal_record (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL,
    record_type TEXT NOT NULL,     -- 'max_weight', 'max_reps', 'min_time', 'max_distance', 'max_calories'
    record_value REAL NOT NULL,
    record_unit_id TEXT,
    session_exercise_result_id TEXT, -- FK al resultado donde se logró
    achieved_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
    FOREIGN KEY (record_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL,
    FOREIGN KEY (session_exercise_result_id) REFERENCES session_exercise_result(id) ON DELETE SET NULL
);

CREATE INDEX idx_pr_exercise ON personal_record(exercise_id);
CREATE INDEX idx_pr_type ON personal_record(record_type);
```

---

## Sistema de Migraciones

Implementar un sistema de migraciones versionado para gestionar la evolución del schema.

```typescript
// src/db/migrations/index.ts
interface Migration {
    version: number;
    name: string;
    up: string[];    // Array de sentencias SQL
    down: string[];  // Rollback (opcional pero recomendado)
}

// Tabla de control de migraciones (se crea automáticamente)
// CREATE TABLE _migrations (
//     version INTEGER PRIMARY KEY,
//     name TEXT NOT NULL,
//     applied_at TEXT NOT NULL DEFAULT (datetime('now'))
// );
```

Al iniciar la app, el servicio de migraciones compara la versión actual de la BD con las migraciones disponibles y ejecuta las pendientes en orden. Cada migración se ejecuta dentro de una transacción.

---

## Plan de Fases de Desarrollo

### FASE 0: Scaffolding del proyecto (Prioridad: CRÍTICA)

**Objetivo**: Tener el proyecto corriendo con Capacitor y SQLite funcional.

Tareas:
1. Crear proyecto Vite + React + TypeScript
2. Configurar Tailwind CSS
3. Instalar y configurar Capacitor 6
4. Instalar y configurar `@capacitor-community/sqlite`
5. Instalar `@capacitor/filesystem`, `@capacitor/camera`, `@capacitor/share`
6. Configurar el service worker para PWA (vite-plugin-pwa)
7. Crear el módulo `src/db/database.ts` con la inicialización de SQLite
8. Crear el sistema de migraciones (`src/services/migrationService.ts`)
9. Crear la migración v001 con todas las tablas del schema inicial
10. Crear el componente Layout con BottomNav y Header
11. Configurar React Router con las rutas principales
12. Verificar que la app arranca en browser y que SQLite funciona
13. Generar primer build de prueba con Capacitor (APK)

**Criterio de aceptación**: La app abre, muestra la navegación inferior, SQLite inicializa correctamente y las tablas se crean.

---

### FASE 1: Catálogos y datos base (Prioridad: ALTA)

**Objetivo**: CRUD completo de todas las tablas de lookup y datos semilla.

Tareas:
1. Crear componente genérico `CatalogManager` con: listado con búsqueda, formulario de alta/edición en modal, eliminación lógica (is_active = 0), reordenamiento drag-and-drop (sort_order), soporte para campo de imagen (image_path) con selector
2. Implementar pantallas específicas para cada catálogo:
   - Grupos musculares (con imagen del cuerpo)
   - Equipamiento (con foto)
   - Unidades de medida
   - Niveles de dificultad (con color picker)
   - Tags (con color picker)
   - Tipos de sección
   - Formatos de trabajo
3. Crear `src/services/mediaService.ts`:
   - Función para tomar foto con la cámara o seleccionar de galería
   - Función para guardar archivo en filesystem nativo con nombre único (UUID)
   - Función para leer archivo y devolver URL/base64 para mostrar en UI
   - Función para eliminar archivo del filesystem
   - Directorio base: `crossfit-tracker/media/`
   - Subdirectorios: `muscles/`, `equipment/`, `exercises/`, `other/`
4. Crear datos semilla (seed) que se carguen en la primera ejecución:
   - Grupos musculares básicos: Pectorales, Dorsales, Deltoides, Bíceps, Tríceps, Cuádriceps, Isquiotibiales, Glúteos, Pantorrillas, Core/Abdominales, Trapecio, Antebrazos
   - Equipamiento común: Barra olímpica, Mancuernas, Kettlebell, Anillas, Pull-up bar, Rower, Assault bike, Cuerda para saltar, Box de salto, Banda elástica, Balón medicinal, Wall ball, Paralelas, GHD, Sled
   - Unidades: kg, lb, repeticiones, calorías, minutos, segundos, metros, kilómetros, millas
   - Niveles: Básico(1), Intermedio(2), Avanzado(3), Experto(4)
   - Tags iniciales: hombro, sentadilla, core, olímpico, gimnástico, cardio, monoarticular, press, pull, push, bilateral, unilateral, isométrico, pliométrico
   - Tipos de sección: Entrada en calor, Activación, Fuerza, Habilidad, WOD, Vuelta a la calma, Accesorio
   - Formatos: Por rondas, EMOM, AMRAP, For Time, Series fijas, Trabajo libre, Intervalos, Tabata, E2MOM, Escalera
5. Crear pantalla de administración de catálogos accesible desde el menú lateral o una pestaña de configuración

**Criterio de aceptación**: Todos los catálogos tienen CRUD funcional, los datos semilla se cargan en la primera ejecución, las imágenes se guardan y muestran correctamente.

---

### FASE 2: Biblioteca de Ejercicios (Prioridad: ALTA)

**Objetivo**: CRUD completo de ejercicios con todas sus relaciones.

Tareas:
1. Crear `ExerciseList` con:
   - Listado en formato tarjeta con imagen thumbnail, nombre, dificultad, tags
   - Búsqueda por nombre (input con debounce)
   - Filtros: por grupo muscular, por equipamiento, por dificultad, por tag, por sección donde se usa
   - Los filtros deben ser combinables (AND)
   - Orden: alfabético, por dificultad, por fecha de creación
   - Vista rápida y vista detallada
2. Crear `ExerciseForm` (pantalla completa, no modal, por la cantidad de campos):
   - Campo nombre (obligatorio)
   - Campo descripción (textarea)
   - Selector de dificultad (dropdown con colores)
   - Selector de grupo muscular primario (dropdown con imagen)
   - Multi-selector de grupos musculares secundarios (chips seleccionables)
   - Multi-selector de equipamiento (chips con imágenes pequeñas, marcar requerido/opcional)
   - Multi-selector de tipos de sección donde se usa
   - Multi-selector de unidades de medida aplicables (marcar cuál es la default)
   - Multi-selector de tags (chips con colores)
   - Notas técnicas (textarea rico o markdown simple)
   - Imagen del ejercicio (foto desde cámara o galería)
   - Video del ejercicio (selección desde galería, solo referencia a archivo)
   - Toggle compuesto/aislado
3. Crear `ExerciseDetail` con:
   - Visualización completa de toda la información
   - Imagen/video del ejercicio
   - Historial de uso (en qué sesiones se usó, con qué pesos, etc.)
   - Registro de PRs del ejercicio
   - Botón de editar y eliminar (eliminación lógica)
4. Implementar repositorio `exerciseRepo.ts` con:
   - `getAll(filters?)`: Query con JOINs a todas las relaciones, soportando filtros combinados
   - `getById(id)`: Con todas las relaciones cargadas
   - `create(exercise, relations)`: Insert en transacción (ejercicio + todas las tablas de relación)
   - `update(id, exercise, relations)`: Update en transacción (delete relations + re-insert)
   - `delete(id)`: Eliminación lógica (is_active = 0)
   - `search(term)`: Búsqueda por nombre con LIKE
   - `getHistory(exerciseId)`: Historial de resultados de sesiones
   - `getPersonalRecords(exerciseId)`: PRs del ejercicio

**Criterio de aceptación**: Se pueden crear ejercicios con todas sus relaciones, buscarlos, filtrarlos, ver su detalle con foto y editar/eliminar.

---

### FASE 3: Plantillas de Clase (Prioridad: ALTA)

**Objetivo**: Crear, editar y gestionar plantillas de clase con secciones y ejercicios.

Tareas:
1. Crear `ClassTemplateList` con:
   - Listado en formato tarjeta con fecha, nombre, objetivo, cantidad de secciones, duración estimada
   - Filtro por fecha (calendario o rango)
   - Búsqueda por nombre u objetivo
   - Opción de marcar como favorita
   - Opción de duplicar una plantilla (para reutilizar como base)
   - Vista calendario mensual con las clases planificadas por día
2. Crear `ClassTemplateForm`:
   - Datos generales: nombre, fecha, objetivo, observaciones, duración estimada
   - Editor de secciones (`SectionEditor`):
     - Botón "Agregar sección" que permite seleccionar el tipo
     - Cada sección se muestra como un bloque expandible/colapsable
     - Dentro de cada sección: tipo, formato de trabajo, título visible, descripción, time cap, rondas, descanso entre rondas, notas
     - Reordenamiento de secciones por drag-and-drop o botones arriba/abajo
     - Eliminación de sección (con confirmación)
   - Editor de ejercicios dentro de sección (`SectionExerciseEditor`):
     - Botón "Agregar ejercicio" que abre un buscador/selector de la biblioteca
     - Por cada ejercicio: muestra la tarjeta del ejercicio con sus campos dinámicos
     - Los campos que se muestran dependen del ejercicio y la sección:
       - Repeticiones planificadas
       - Peso planificado (con selector de unidad)
       - Tiempo planificado
       - Distancia planificada (con selector de unidad)
       - Calorías planificadas
       - Descanso planificado
       - Rondas
       - % RM
       - Escalado sugerido
       - Notas/indicaciones del coach
     - No todos los campos son visibles siempre: mostrar los más relevantes según el tipo de ejercicio y permitir expandir "más campos"
     - Reordenamiento de ejercicios dentro de la sección
     - Eliminación de ejercicio de la sección
3. Crear `ClassTemplateDetail` con:
   - Vista completa de la plantilla
   - Secciones con sus ejercicios en formato legible
   - Botón "Iniciar sesión con esta plantilla" (lleva a la pantalla de ejecución)
   - Botón "Editar" y "Duplicar"
4. Implementar repositorio `classTemplateRepo.ts` con:
   - `getAll(filters?)`: Con conteo de secciones y ejercicios
   - `getById(id)`: Con todas las secciones y ejercicios cargados (deep load)
   - `create(template, sections, exercises)`: Insert en transacción profunda
   - `update(id, template, sections, exercises)`: Update completo en transacción
   - `duplicate(id)`: Clonar plantilla con nuevos IDs para todo
   - `delete(id)`: Eliminación lógica
   - `getByDateRange(from, to)`: Para vista calendario

**Criterio de aceptación**: Se puede crear una plantilla completa con múltiples secciones, cada una con múltiples ejercicios y parámetros distintos. Se puede duplicar, editar y ver en detalle.

---

### FASE 4: Sesiones de Entrenamiento - Ejecución y Registro (Prioridad: ALTA)

**Objetivo**: Registrar la ejecución real de un entrenamiento, comparando plan vs resultado.

Tareas:
1. Crear `SessionList` con:
   - Listado de sesiones con estado (ícono/color), fecha, nombre de plantilla, duración, sensación
   - Filtros: por estado, por rango de fecha, por plantilla
   - Estadísticas rápidas del mes: sesiones completadas, duración total, tendencia
2. Crear `SessionExecutor` (pantalla de ejecución en vivo):
   - **Inicio de sesión**: Se puede iniciar desde una plantilla (carga la planificación) o vacía
   - **Encabezado**: nombre de la clase, fecha, timer corriendo (duración total)
   - **Navegación por secciones**: tabs o swipe horizontal entre secciones
   - **Para cada ejercicio de la sección**:
     - Muestra los valores planificados (en gris/referencia)
     - Inputs para los valores reales: repeticiones, peso, tiempo, distancia, calorías, rondas
     - Solo mostrar los inputs relevantes según lo que tiene planificado el ejercicio
     - Selector Rx / Scaled / Rx+
     - Campo de resultado textual (para anotar "5+3" en AMRAP, etc.)
     - Campo de notas
     - Toggle completado sí/no
     - Botón "Marcar como PR" (se guardan automáticamente si el valor supera el anterior)
   - **Para sesiones sin plantilla**: permitir agregar secciones y ejercicios on-the-fly desde la biblioteca
   - **Barra inferior de la sesión**:
     - Timer total corriendo
     - Botón "Pausar" / "Reanudar"
     - Botón "Finalizar sesión"
   - **Al finalizar**: pantalla de resumen con:
     - Duración total
     - Sensación general (selector de emojis: terrible a excelente)
     - RPE (slider 1-10)
     - Notas finales (textarea)
     - Peso corporal del día (opcional)
     - Botón "Guardar y cerrar"
3. Crear `SessionDetail` con:
   - Vista completa de la sesión terminada
   - Comparación plan vs resultado por cada ejercicio (side by side o con colores indicando diferencias)
   - PRs logrados resaltados
   - Opción de editar resultados post-sesión
4. Implementar repositorio `trainingSessionRepo.ts` con:
   - `create(session)`: Crear sesión (status 'planned' o 'in_progress')
   - `createFromTemplate(templateId)`: Crear sesión pre-cargada con los datos de la plantilla
   - `update(id, session)`: Actualizar datos generales
   - `saveResults(sessionId, results[])`: Guardar/actualizar resultados de ejercicios
   - `finalize(sessionId, summary)`: Marcar como completada con resumen
   - `getById(id)`: Con todos los resultados y datos planificados
   - `getAll(filters?)`: Listado con filtros
   - `getByDateRange(from, to)`: Para estadísticas
5. Implementar detección automática de PRs:
   - Al guardar un resultado, comparar con `personal_record` para ese ejercicio y tipo
   - Si supera el récord: actualizar la tabla y marcar `is_personal_record = 1` en el resultado
   - Notificar al usuario con un toast/alerta visual celebratoria

**Criterio de aceptación**: Se puede iniciar una sesión desde plantilla, registrar resultados ejercicio por ejercicio, ver comparación plan vs resultado, detectar PRs y finalizar con resumen.

---

### FASE 5: Estadísticas y Progresión (Prioridad: MEDIA)

**Objetivo**: Visualizar el progreso histórico.

Tareas:
1. Crear `ProgressCharts`:
   - Gráfico de línea: evolución de peso para un ejercicio dado en el tiempo
   - Gráfico de barras: volumen total por semana/mes (peso × reps)
   - Gráfico de frecuencia: sesiones por semana/mes
   - Gráfico de distribución: tipos de sección más trabajados
   - Gráfico RPE: esfuerzo percibido a lo largo del tiempo
2. Crear `ExerciseHistory`:
   - Seleccionar un ejercicio y ver todas las veces que se realizó
   - Tabla con: fecha, sesión, peso, reps, tiempo, resultado, Rx/Scaled, notas
   - Gráfico de progresión del ejercicio seleccionado
3. Crear `PersonalRecords`:
   - Listado de todos los PRs actuales por ejercicio
   - Filtro por tipo de récord
   - Vista de timeline de PRs logrados
4. Dashboard principal (pantalla home):
   - Resumen de la semana: sesiones completadas vs planificadas
   - Próxima sesión planificada
   - PRs recientes
   - Racha actual (streak de días consecutivos/semanas)
   - Accesos directos: "Iniciar sesión", "Ver hoy", "Planificar"

**Criterio de aceptación**: Se puede ver la progresión de peso/reps de cualquier ejercicio en un gráfico, ver estadísticas mensuales y una tabla de PRs.

---

### FASE 6: Exportación e Importación de Datos (Prioridad: ALTA)

**Objetivo**: Exportar todos los datos a JSON + ZIP (con medios) e importar desde ese archivo.

#### 6.1 Estructura del archivo de exportación

El archivo exportado es un `.zip` con la siguiente estructura:

```
crossfit-tracker-export-YYYYMMDD-HHmmss.zip
├── manifest.json              # Metadatos del export
├── data.json                  # Todos los datos de la BD
└── media/                     # Carpeta con todos los archivos multimedia
    ├── muscles/
    │   ├── uuid1.jpg
    │   └── uuid2.png
    ├── equipment/
    │   ├── uuid3.jpg
    │   └── ...
    ├── exercises/
    │   ├── uuid4.jpg
    │   ├── uuid5.mp4
    │   └── ...
    └── other/
        └── ...
```

**manifest.json**:
```json
{
    "app_name": "CrossFit Session Tracker",
    "app_version": "1.0.0",
    "export_version": 1,
    "db_schema_version": 1,
    "export_date": "2026-03-10T14:30:00.000Z",
    "device_info": "Android 14 / Samsung Galaxy S24",
    "total_records": {
        "exercises": 45,
        "class_templates": 30,
        "training_sessions": 120,
        "personal_records": 15,
        "media_files": 60
    },
    "include_media": true,
    "export_scope": "full"
}
```

**data.json**:
```json
{
    "catalogs": {
        "muscle_groups": [...],
        "equipment": [...],
        "measurement_units": [...],
        "difficulty_levels": [...],
        "tags": [...],
        "section_types": [...],
        "work_formats": [...]
    },
    "exercises": [
        {
            "...campos del ejercicio...",
            "muscle_groups": ["uuid_mg1", "uuid_mg2"],
            "equipment": [{"equipment_id": "uuid_eq1", "is_required": 1}],
            "section_types": ["uuid_st1"],
            "units": [{"unit_id": "uuid_u1", "is_default": 1}],
            "tags": ["uuid_t1", "uuid_t2"]
        }
    ],
    "class_templates": [
        {
            "...campos de la plantilla...",
            "sections": [
                {
                    "...campos de la sección...",
                    "exercises": [
                        { "...campos de section_exercise..." }
                    ]
                }
            ]
        }
    ],
    "training_sessions": [
        {
            "...campos de la sesión...",
            "results": [
                { "...campos de session_exercise_result..." }
            ]
        }
    ],
    "personal_records": [...]
}
```

#### 6.2 Tareas de exportación

1. Crear `src/services/exportService.ts`:
   - `exportAll(options)`: Exportación completa
     - Options: `{ includeMedia: boolean, scope: 'full' | 'templates_only' | 'date_range', dateFrom?: string, dateTo?: string }`
     - Leer todas las tablas y ensamblar `data.json` con estructura desnormalizada (relaciones embebidas)
     - Generar `manifest.json` con metadatos
     - Si `includeMedia`: recorrer todos los `image_path` y `video_path` no nulos, leer los archivos del filesystem y agregarlos al ZIP
     - Crear ZIP con JSZip
     - Guardar el ZIP en el filesystem del dispositivo (directorio de descargas)
     - Ofrecer compartir vía `@capacitor/share`
   - `exportTemplatesOnly()`: Solo exportar catálogos + ejercicios + plantillas (sin sesiones ni resultados). Útil para compartir la planificación.
   - `exportDateRange(from, to)`: Exportar sesiones de un rango de fechas con sus plantillas asociadas.

2. Crear `ExportScreen`:
   - Selector de tipo de exportación: completa, solo plantillas, rango de fechas
   - Toggle incluir/excluir archivos multimedia
   - Estimación de tamaño del archivo
   - Barra de progreso durante la exportación
   - Botón "Exportar" y "Compartir"

#### 6.3 Tareas de importación

1. Crear `src/services/importService.ts`:
   - `importFromZip(file)`:
     - Leer el ZIP con JSZip
     - Parsear `manifest.json`: validar versión de la app y schema
     - Parsear `data.json`
     - Estrategia de importación: **merge inteligente**
       - Para cada registro, verificar si ya existe por `id`
       - Si existe: preguntar al usuario qué hacer (sobrescribir / omitir / mantener ambos con nuevo ID)
       - Si no existe: insertar normalmente
     - Orden de importación (respetar foreign keys):
       1. Catálogos (muscle_groups, equipment, measurement_units, difficulty_levels, tags, section_types, work_formats)
       2. Ejercicios + relaciones
       3. Plantillas de clase + secciones + ejercicios de sección
       4. Sesiones de entrenamiento + resultados
       5. Records personales
     - Si el ZIP contiene `media/`: extraer archivos al filesystem nativo en sus carpetas correspondientes, actualizando las rutas si es necesario
     - Toda la importación de datos dentro de una transacción SQLite
     - Si falla: rollback completo
   - `validateImportFile(file)`: Validar estructura del ZIP antes de importar, retornar resumen de qué contiene

2. Crear `ImportScreen`:
   - Selector de archivo (input file o Capacitor FilePicker)
   - Paso 1: Seleccionar archivo → se muestra resumen del contenido (del manifest)
   - Paso 2: Vista previa de qué se va a importar (cantidad de registros por tipo)
   - Paso 3: Selector de estrategia de conflicto: "Sobrescribir existentes" / "Omitir existentes" / "Crear duplicados"
   - Paso 4: Barra de progreso de la importación con log de acciones
   - Paso 5: Resumen final (insertados, actualizados, omitidos, errores)

**Criterio de aceptación**: Se puede exportar toda la app (datos + media) a un ZIP, compartirlo, recibirlo en otro dispositivo e importarlo recuperando todos los datos y archivos multimedia.

---

### FASE 7: UX/UI polish y detalles (Prioridad: MEDIA)

**Objetivo**: Refinar la experiencia de usuario.

Tareas:
1. Tema visual:
   - Paleta de colores definida (modo oscuro por defecto, es lo más común en apps de fitness)
   - Tipografía consistente con buena legibilidad en pantallas pequeñas
   - Tamaños de toque mínimos de 44x44px para todos los botones e inputs
   - Transiciones y animaciones sutiles entre pantallas
2. Feedback al usuario:
   - Toasts para confirmaciones de guardado, eliminación, errores
   - Vibración del dispositivo al registrar un PR
   - Estados vacíos (empty states) con ilustraciones y call-to-action
   - Skeleton loaders mientras se cargan datos
3. Navegación:
   - Bottom navigation con 4-5 tabs: Home/Dashboard, Ejercicios, Clases, Sesiones, Configuración
   - Navegación fluida con transiciones
   - Breadcrumbs o back button consistente
   - Pull to refresh en listados
4. Formularios:
   - Validaciones en tiempo real con mensajes claros
   - Autoguardado de borradores (para no perder trabajo si la app se cierra)
   - Atajos: al crear ejercicio en una sección, poder crear uno nuevo directo sin ir a la biblioteca
5. Accesibilidad:
   - Labels en todos los inputs
   - Contraste adecuado de colores
   - Soporte para fuentes grandes del sistema

---

## Datos precargados (Seeds)

Además de los catálogos mencionados en Fase 1, incluir ejercicios de ejemplo en la primera ejecución (sin imágenes, el usuario las agregará después):

### Ejercicios semilla (mínimo 30-40 ejercicios comunes de CrossFit):

**Movimientos gimnásticos**: Pull-up, Chest to bar, Muscle up (anillas), Muscle up (barra), Toes to bar, Knees to elbow, Push-up, Handstand push-up, Handstand walk, Dip (anillas), Dip (paralelas), Pistol squat, Rope climb, Box jump, Burpee, Double under, Single under

**Levantamientos olímpicos**: Snatch, Clean, Clean & Jerk, Power snatch, Power clean, Hang snatch, Hang clean, Squat clean, Split jerk, Push jerk, Push press, Thruster, Cluster

**Fuerza**: Back squat, Front squat, Overhead squat, Deadlift, Sumo deadlift, Romanian deadlift, Bench press, Strict press, Barbell row, Hip thrust, Lunge, Bulgarian split squat, Good morning

**Cardio/Mono-estructural**: Row (remo), Assault bike, Ski erg, Running, Sled push, Sled pull, Bike erg

**Core**: Sit-up, GHD sit-up, Plank, L-sit, Hollow hold, V-up, Russian twist, Ab mat sit-up

Cada ejercicio semilla debe tener: nombre, descripción básica, grupo muscular primario, equipamiento requerido, dificultad, tags, tipos de sección sugeridos y unidades aplicables.

---

## Convenciones de Código

1. **Naming**:
   - Componentes: PascalCase (`ExerciseList.tsx`)
   - Hooks: camelCase con prefijo use (`useExercises.ts`)
   - Servicios: camelCase (`exportService.ts`)
   - Repositorios: camelCase con sufijo Repo (`exerciseRepo.ts`)
   - Tipos/interfaces: PascalCase (`Exercise`, `ClassTemplate`)
   - Constantes: UPPER_SNAKE_CASE
   - Tablas SQL: snake_case (`class_template`)
   - Columnas SQL: snake_case (`created_at`)

2. **Estructura de componentes**:
   - Un componente por archivo
   - Props tipadas con interface
   - Custom hooks para lógica de datos
   - Separar lógica de presentación

3. **Manejo de errores**:
   - Try/catch en todas las operaciones de BD
   - Toast de error con mensaje amigable al usuario
   - Console.error con detalle técnico para debug
   - Las funciones de repositorio devuelven `Promise<Result<T, Error>>` o manejan errores internamente

4. **Estado**:
   - React state local para UI
   - Custom hooks + contexto para datos compartidos entre pantallas
   - NO usar state managers externos (Redux, Zustand, etc.) a menos que la complejidad lo justifique más adelante
   - Invalidar y refetch datos después de cada mutación

---

## Configuración de Capacitor

```json
// capacitor.config.ts
{
    "appId": "com.nestorcode.crossfittracker",
    "appName": "CrossFit Tracker",
    "webDir": "dist",
    "bundledWebRuntime": false,
    "plugins": {
        "CapacitorSQLite": {
            "iosDatabaseLocation": "Library/CapacitorDatabase",
            "iosIsEncryption": false,
            "androidIsEncryption": false
        }
    }
}
```

---

## Comando de build para APK

```bash
# Desarrollo (browser)
npm run dev

# Build web
npm run build

# Sincronizar con Capacitor
npx cap sync android

# Abrir en Android Studio para generar APK
npx cap open android

# O generar APK directamente via CLI (requiere Android SDK)
cd android && ./gradlew assembleDebug
# APK en: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Prioridades de desarrollo resumidas

| Orden | Fase | Descripción | Dependencias |
|-------|------|-------------|--------------|
| 1 | Fase 0 | Scaffolding + SQLite + Layout | Ninguna |
| 2 | Fase 1 | Catálogos + Media service + Seeds | Fase 0 |
| 3 | Fase 2 | Biblioteca de ejercicios | Fase 1 |
| 4 | Fase 3 | Plantillas de clase | Fase 2 |
| 5 | Fase 4 | Sesiones de entrenamiento | Fase 3 |
| 6 | Fase 6 | Export / Import | Fase 4 |
| 7 | Fase 5 | Estadísticas y gráficos | Fase 4 |
| 8 | Fase 7 | UX/UI polish | Todas |

> **Nota**: La Fase 6 (Export/Import) se prioriza antes que la Fase 5 (Estadísticas) porque es más crítica para el uso real (backup de datos y portabilidad).

---

## Notas importantes para el desarrollo

1. **Desarrollar mobile-first**: Todos los componentes deben diseñarse primero para pantalla de celular (ancho ~360-420px). No hay versión desktop.

2. **Offline-first**: La app debe funcionar 100% sin conexión a internet. No hay backend ni APIs externas. Todo es local.

3. **Performance en listas**: Para listas largas (ejercicios, sesiones), usar virtualización (react-window o similar) si se detecta lentitud con más de 100 items.

4. **Imágenes**: Comprimir las imágenes al guardarlas (máximo 1080px de lado mayor, calidad 80% JPEG). Los videos no se comprimen pero se limita la duración a 30 segundos si se capturan desde la app.

5. **Transacciones**: Toda operación que involucre más de una tabla debe ejecutarse dentro de una transacción SQLite.

6. **IDs**: Usar UUID v4 generado en el cliente para todos los IDs. Esto facilita el merge en importación y evita conflictos.

7. **Timestamps**: Guardar siempre en UTC. Mostrar en la zona horaria local del dispositivo.

8. **Eliminación**: Siempre eliminación lógica (is_active = 0) excepto en tablas de relación N:N donde se elimina el registro físicamente.
