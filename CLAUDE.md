# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos de desarrollo
- Servidor de desarrollo: `npm run dev` (arranca en localhost:5173)
- Build de producción: `npm run build`
- Linting: `npm run lint`
- Sincronización Capacitor: `npm run cap:sync`
- Preparar para Android: `npm run cap:android`

No hay tests unitarios en este proyecto.

## Guía de Estilo y Reglas

### Idioma
- **UI (texto visible al usuario)**: Español.
- **Código** (variables, funciones, componentes, tablas/columnas BD): Inglés.
- **Comentarios y documentación**: Español.

### Diseño
- Mobile-first, Dark-mode first (fondo base: `bg-gray-950`).
- Tailwind CSS para estilos generales + Vanilla CSS para layouts específicos y micro-animaciones.
- Iconos: `lucide-react` exclusivamente.
- Toasts/feedback: `sonner` (`toast.success`, `toast.error`).

### Base de Datos
- **NO usar localStorage ni sessionStorage** para datos persistentes. Todo va a SQLite.
- Toda interacción con la BD debe ir en `src/db/repositories/`.
- Operaciones multi-tabla **requieren transacciones** SQLite.
- IDs: UUID v4 generado en cliente con `generateUUID()` de `src/utils/formatters.ts`.
- Fechas en SQLite: ISO 8601 (`new Date().toISOString().replace('T', ' ').substring(0, 19)`).
- `PRAGMA foreign_keys = ON` se activa al abrir cada conexión.
- Para obtener la conexión activa: `getDatabase()` de `src/db/database.ts` (singleton).

### Estructura de código
- Modelos TypeScript: `src/models/`.
- Repositorios (lógica de persistencia): `src/db/repositories/`.
- Componentes atómicos reutilizables: `src/components/ui/`.
- Utilidades: `src/utils/` (`formatters.ts`, `constants.ts`).

## Arquitectura

### Flujo de arranque
1. `main.tsx` inicializa `jeep-sqlite` en el DOM antes de montar React.
2. `DbProvider` (wrappea toda la app) llama a `openDatabase()` → ejecuta migraciones → ejecuta seed si es la primera vez → expone `useDb()` context.
3. Las páginas/componentes sólo se renderizan cuando `isReady === true`.

### Base de datos y migraciones
- Schema completo en `src/db/migrations/v001_initial.ts`; migraciones futuras siguen el patrón `v00N_descripcion.ts`.
- El registry `src/db/migrations/index.ts` exporta el array ordenado de migraciones.
- `migrationService.ts` aplica migraciones pendientes comparando con la tabla `_migrations`.
- Para agregar una migración: crear `src/db/migrations/v00N_xxx.ts` y registrarla en el index.

### Repositorios
Cada entidad principal tiene su propio repo:
- `catalogRepo.ts` — CRUD genérico para las 7 tablas de lookup (muscle_group, equipment, measurement_unit, difficulty_level, tag, section_type, work_format).
- `exerciseRepo.ts` — ejercicios con relaciones M2M (grupos musculares, equipamiento, tags, etc.).
- `classTemplateRepo.ts` — plantillas con secciones (`class_section`) y ejercicios de sección (`section_exercise`); usa transacciones para escrituras.
- `trainingSessionRepo.ts` — sesiones de entrenamiento (`training_session`) y resultados (`session_exercise_result`, `personal_record`).

### Modelos clave
- `TrainingSession` / `SessionWithRelations` / `SessionExerciseResult` — en `src/models/TrainingSession.ts`.
- `ClassTemplate` / `ClassTemplateWithSections` / `ClassSection` / `SectionExercise` — en `src/models/ClassTemplate.ts`.
- Catálogos y enums compartidos en `src/models/catalogs.ts` e `src/models/index.ts`.

### Rutas (React Router 6)
Todas bajo un `<Layout>` con `BottomNav` de 5 tabs:
- `/inicio` → Dashboard
- `/ejercicios` (+ `/nuevo`, `/:id`, `/:id/editar`)
- `/clases` (+ `/nueva`, `/:id`, `/:id/editar`)
- `/sesiones` (+ `/nueva`, `/:id/ejecutar`, `/:id`)
- `/estadisticas`
- `/configuracion` (+ subrutas para los 7 catálogos)

### Servicios adicionales
- `src/services/mediaService.ts` — gestión de imágenes (web: file input; native: Capacitor Camera + Filesystem).
- `src/services/seedService.ts` — carga datos iniciales (64 registros) controlado por flag en localStorage (`seed_v1_done`).
- `src/services/backupService.ts` — exportar/importar todos los datos como JSON respetando el orden de dependencias entre tablas.

## Estado del Proyecto
- Fase 0 (Setup inicial): COMPLETADA (2026-03-10)
- Fase 1 (Catálogos básicos): COMPLETADA (2026-03-10)
- Fase 2 (Gestión de Ejercicios): COMPLETADA (2026-03-10)
- Fase 3 (Plantillas de Clases): COMPLETADA (2026-03-10)
- Fase 4 (Sesiones y Récords): COMPLETADA (2026-03-15)
