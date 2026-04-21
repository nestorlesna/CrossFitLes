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

## 🚢 Release — Distribución de APK

El APK se genera y publica automáticamente mediante **GitHub Actions** al crear un tag con prefijo `v`.

### Requisitos previos (primera vez)

1. Generar el keystore de firma (en PowerShell, desde la carpeta `KEY/`):
   ```powershell
   keytool -genkey -v -keystore release.keystore -alias crossfitles -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Convertir el keystore a base64 y copiarlo al portapapeles:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\ruta\KEY\release.keystore")) | Set-Clipboard
   ```

3. Cargar los siguientes secrets en GitHub → **Settings → Secrets and variables → Actions**:

   | Secret | Valor |
   |--------|-------|
   | `KEYSTORE_BASE64` | Output del paso anterior |
   | `KEYSTORE_PASSWORD` | Password del keystore |
   | `KEY_ALIAS` | `crossfitles` |
   | `KEY_PASSWORD` | Password de la clave |

4. Activar permisos del workflow: **Settings → Actions → General → Read and write permissions**

### Publicar una nueva versión

```powershell
# Desde la raíz del proyecto
.\scripts\release.ps1 1.0.1
```

El script actualiza `versionCode` y `versionName` en `build.gradle`, hace commit, crea el tag y hace push. GitHub Actions construye el APK firmado y lo publica como GitHub Release automáticamente.

### Flujo resumido

```
git tag v1.0.1 → GitHub Actions → build web → cap sync → gradle assembleRelease → CrossFitLes.apk → GitHub Release
```

> El keystore vive en la carpeta `KEY/` (ignorada por git). No subir al repositorio.

---

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
| `.\scripts\release.ps1 X.Y.Z` | Publica una nueva versión (bump + tag + push) |

## 🌐 Convenciones del Proyecto

- **Idioma de la UI**: Español 🇪🇸
- **Idioma del código** (variables, funciones, componentes, tablas): Inglés
- **Comentarios en código**: Español
- **Fuente tipográfica**: Inter

## 📄 Licencia

Proyecto de uso personal. Todos los derechos reservados.
