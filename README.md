# 💪 CrossFit Session Tracker

Aplicación móvil personal para planificar, registrar y analizar entrenamientos de CrossFit. Diseñada con enfoque **mobile-first** y **offline-first**.

## 📱 Distribución

- **APK directo** (sin Play Store)
- **PWA** como fallback para navegador

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework UI | React + TypeScript | 18+ |
| Bundler | Vite | 5+ |
| Bridge Nativo | Capacitor | 6+ |
| Base de Datos | SQLite (`@capacitor-community/sqlite`) | — |
| Estilos | Tailwind CSS | 3+ |
| Navegación | React Router | 6+ |
| Fechas | date-fns | 3+ |
| Iconos | Lucide React | — |
| Toast/Feedback | Sonner | — |

## 🚀 Inicio Rápido

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [npm](https://www.npmjs.com/) (v9 o superior)
- [Android Studio](https://developer.android.com/studio) (para compilar APK)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/crossfit-session-tracker.git
cd crossfit-session-tracker

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Compilar para Android

```bash
# Compilar y sincronizar con Capacitor
npm run cap:sync

# Abrir en Android Studio
npm run cap:android
```

## 📁 Estructura del Proyecto

```
src/
├── main.tsx                  # Entry point
├── App.tsx                   # Router principal
├── db/
│   ├── database.ts           # Inicialización SQLite
│   ├── migrations/           # Migraciones de esquema
│   └── repositories/         # Acceso a datos (repos)
├── models/                   # Modelos de datos
├── components/
│   ├── ui/                   # Componentes base reutilizables
│   ├── exercises/            # Biblioteca de ejercicios
│   ├── classes/              # Plantillas de clase
│   ├── sessions/             # Sesiones de entrenamiento
│   ├── catalogs/             # Gestión de catálogos
│   ├── stats/                # Estadísticas y gráficos
│   ├── export/               # Exportar / Importar datos
│   └── layout/               # Layout, Header, BottomNav
├── hooks/                    # Custom hooks
├── services/                 # Servicios (media, migración, seed)
├── utils/                    # Utilidades y helpers
└── types/                    # Tipos compartidos
```

## ✨ Funcionalidades

### ✅ Implementadas (Fases 0–3)

- **Catálogos completos** — CRUD de grupos musculares, equipamiento, unidades, niveles, tags, tipos de sección y formatos de trabajo con datos semilla precargados.
- **Biblioteca de ejercicios** — Creación, búsqueda, filtrado avanzado, imágenes, relaciones N:N con grupos musculares, equipamiento, tags y más.
- **Plantillas de clase** — Planificación de clases con múltiples secciones, ejercicios configurables, formatos de trabajo (AMRAP, EMOM, For Time, etc.), duplicación de plantillas.
- **Base de datos SQLite** — Schema completo con sistema de migraciones versionado, transacciones y datos semilla.

### 🔜 Próximamente (Fases 4–6)

- **Ejecución de sesiones** — Registro en vivo, timer, comparación plan vs. resultado, detección de PRs.
- **Estadísticas y progresión** — Gráficos de evolución, historial por ejercicio, records personales, dashboard.
- **Exportación e importación** — Backup completo a JSON + ZIP con archivos multimedia.

## 🗄️ Base de Datos

- **Motor**: SQLite (offline-first, datos locales en el dispositivo)
- **Migraciones**: Sistema versionado automático al iniciar la app
- **Principios**: UUIDs como PK, `created_at`/`updated_at` en todas las tablas, foreign keys con `ON DELETE CASCADE`

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila TypeScript y genera el build de producción |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run cap:sync` | Compila y sincroniza con Capacitor |
| `npm run cap:android` | Sincroniza y abre Android Studio |

## 🌐 Convenciones del Proyecto

- **Idioma de la UI**: Español 🇪🇸
- **Idioma del código** (variables, funciones, componentes, tablas): Inglés
- **Comentarios en código**: Español
- **Fuente tipográfica**: Inter

## 📄 Licencia

Proyecto de uso personal. Todos los derechos reservados.
