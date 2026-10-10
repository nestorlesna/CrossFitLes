# 💪 CrossFit Session Tracker

Aplicación móvil personal para planificar, registrar y analizar entrenamientos de CrossFit. Diseñada con enfoque **mobile-first** y **offline-first**.

## 📱 Distribución

- **APK directo** (sin Play Store), gratis. Link fijo a la última versión:
  `https://github.com/nestorlesna/CrossFitLes/releases/latest/download/CrossFitLes.apk`
- La app avisa sola cuando hay una versión nueva del APK.
- **Contenido online**: clases, ejercicios (con sus SVG), planes y challenges se bajan desde el repo
  público [CrossFitLes-content](https://github.com/nestorlesna/CrossFitLes-content) con
  *Configuración → Contenido online → Actualizar contenido*, sin importar archivos.
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
git clone https://github.com/nestorlesna/CrossFitLes.git
cd CrossFitLes

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Compilar para Android (manual)

El flujo normal es sincronizar con Capacitor y luego usar Android Studio directamente:

```bash
# 1. Compilar el bundle web y sincronizar assets al proyecto Android
npm run cap:sync
```

Luego, en **Android Studio**:

1. Abrir la carpeta `android/` como proyecto
2. Esperar que Gradle sincronice
3. Menú **Build → Generate Signed Bundle / APK**
4. Elegir **APK** → Next
5. En *Key store path* apuntar a `KEY/release.keystore`
6. Completar alias (`crossfitles`), contraseña del keystore y contraseña de la clave
7. Elegir variante **release** → Next → **Finish**

El APK firmado queda en `android/app/release/CrossFitLes.apk`.

> `npm run cap:android` intenta abrir Android Studio automáticamente; si no funciona, abrir Android Studio manualmente desde la carpeta `android/`.

## 🚢 Release — Distribución automática (GitHub Actions)

El APK se genera y publica automáticamente mediante **GitHub Actions** al crear un tag con prefijo `v`.

### Secrets de GitHub (ya configurados)

Los siguientes secrets están cargados en **Settings → Secrets and variables → Actions**:

| Secret | Descripción |
|--------|-------------|
| `KEYSTORE_BASE64` | Keystore en base64 (`KEY/release.keystore`) |
| `KEYSTORE_PASSWORD` | Contraseña del keystore |
| `KEY_ALIAS` | `crossfitles` |
| `KEY_PASSWORD` | Contraseña de la clave |

Para regenerar `KEYSTORE_BASE64` si fuera necesario:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("KEY\release.keystore")) | Set-Clipboard
```

### Publicar una nueva versión

```powershell
# Desde la raíz del proyecto — bump de versión, commit, tag, merge a master, push
# y, al final, push del contenido online si hay cambios publicados
.\scripts\release.ps1 1.0.1

.\scripts\release.ps1 1.0.1 -SkipContent   # release de la app sin tocar el contenido
.\scripts\release.ps1 -ContentOnly          # sólo subir el contenido (sin release de la app)
```

GitHub Actions construye el APK firmado y lo publica como GitHub Release automáticamente.

### Flujo resumido

```
.\scripts\release.ps1 X.Y.Z
  → bump versionCode/versionName en build.gradle
  → git commit + tag vX.Y.Z + push
  → GitHub Actions: build web → cap sync → gradle assembleRelease → firma APK
  → GitHub Release con CrossFitLes.apk adjunto
  → push de ../CrossFitLes-content (commit "contenido vN") si hay cambios
```

> El keystore vive en `KEY/` (ignorado por git). No subir al repositorio. **No perderlo**: sin la
> misma firma Android no permite actualizar la app y habría que desinstalarla (perdiendo los datos).

## ☁️ Contenido online

Las clases y ejercicios se comparten por un repo público con dos archivos JSON. No hay servidor ni
base de datos online.

```
PC (npm run dev)                       GitHub (público)                 Teléfonos
Configuración → Publicar contenido  →  CrossFitLes-content          →   Configuración → Actualizar contenido
  escribe en ../CrossFitLes-content      manifest.json                    baja lo nuevo y lo aplica
  (git push o release.ps1)               content/content.json             en una sola transacción
```

- **Publicar** (sólo visible en `npm run dev` en la PC): arma `content.json` con catálogos, ejercicios
  (con su SVG embebido), clases, planes y las definiciones de challenges, y sube `contentVersion`
  sólo si algo cambió. Lo escribe en el clon local `../CrossFitLes-content` (configurable con
  `CONTENT_REPO_DIR` en `.env`). Después: `git push` en ese repo o `.\scripts\release.ps1 -ContentOnly`.
- **Actualizar** (todos): agrega lo nuevo y actualiza lo que cambió, comparando un hash por
  ejercicio/clase/plan. **Nunca** pisa lo que el usuario creó o editó (`user_modified`), no
  actualiza clases que ya tienen sesiones, no borra nada y no toca sesiones, resultados, récords,
  progreso de challenges ni perfil. Los planes llegan en borrador.
- **Challenges**: un challenge nuevo agregado en `src/data/challenges.ts` llega a todos al publicar,
  sin sacar APK (si es de un tipo que la app ya soporta: meta de repeticiones o diario).
- **Probar antes del push**: levantar el dev server con `VITE_CONTENT_BASE_URL=/__content/raw` y abrir
  `http://127.0.0.1:5173` (otro origen = otra base de datos) → Actualizar contenido.
- Detalle, reglas y checklist: [`PLAN_SINCRONIZACION.md`](PLAN_SINCRONIZACION.md).

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
├── data/                     # Catálogo de challenges (del APK; se suman los remotos)
├── pages/                    # Pantallas por sección (Challenges, Plans, Sessions...)
├── services/                 # Servicios (media, migración, seed, challenges, contenido online)
├── utils/                    # Utilidades y helpers
└── types/                    # Tipos compartidos
```

## ✨ Funcionalidades

### ✅ Implementadas (Fases 0–6)

- **Catálogos completos** — CRUD de grupos musculares, equipamiento, unidades, niveles, tags, tipos de sección y formatos de trabajo con datos semilla precargados.
- **Biblioteca de ejercicios** — Creación, búsqueda, filtrado avanzado, imágenes y SVG animados, relaciones N:N con grupos musculares, equipamiento, tags y más.
- **Plantillas de clase** — Planificación de clases con múltiples secciones, ejercicios configurables, formatos de trabajo (AMRAP, EMOM, For Time, etc.), duplicación de plantillas.
- **Sesiones y récords** — Registro en vivo, cronómetro guiado paso a paso, comparación plan vs. resultado y detección de PRs.
- **Estadísticas y progresión** — Gráficos de evolución, historial por ejercicio, récords personales y dashboard.
- **Planes de entrenamiento** — Días programados en un calendario (por fecha o secuenciales), con clases existentes o días armados a mano, avance y racha.
- **Challenges de calistenia** — 9 challenges sin equipamiento: 6 de meta de repeticiones (100 flexiones, 200 abdominales, 200 sentadillas, 150 fondos en silla, 150 zancadas, 50 burpees) y 3 diarios de 30 días (plancha de 5 minutos, sentadillas, abdominales). Test inicial que define el nivel, retests en las semanas 2/4/5 que recalculan las sesiones, "No pude completar" que repite la semana, timer de descanso con aviso sonoro, registro de repeticiones reales por serie y gráficos de progreso (volumen por sesión y repeticiones máximas). Varios challenges pueden estar en curso a la vez.
- **Exportación e importación** — Backup completo a ZIP con los datos en JSON y los archivos multimedia; exportar/importar clases y ejercicios sueltos.
- **Contenido online** — Publicar desde la PC y actualizar en cada dispositivo clases, ejercicios con SVG, planes y challenges, sin pisar lo propio ni tocar sesiones.
- **Base de datos SQLite** — Schema completo con sistema de migraciones versionado, transacciones y datos semilla.

### 🏆 Cómo funcionan los challenges

Un challenge en curso es un plan de entrenamiento con `plan_kind = 'challenge'`, así reutiliza días, plantillas privadas, sesiones, PRs y el cronómetro. El catálogo viene con el APK (`src/data/challenges.ts`) y se amplía con las definiciones bajadas del contenido online y las series de los challenges de meta se calculan con una curva de progresión única (`src/services/challengeEngine.ts`): `reps = round(meta × factor_sesión × factor_nivel × pct_serie)`. Las rutas son `/challenges`, `/challenges/:code` y `/challenges/sesion/:sessionId`.

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
| `npm run cap:android` | Sincroniza y abre Android Studio (opcional) |
| `.\scripts\release.ps1 X.Y.Z` | Publica una nueva versión (bump + tag + push) y sube el contenido online |
| `.\scripts\release.ps1 -ContentOnly` | Sólo sube el contenido online publicado |

## 🌐 Convenciones del Proyecto

- **Idioma de la UI**: Español 🇪🇸
- **Idioma del código** (variables, funciones, componentes, tablas): Inglés
- **Comentarios en código**: Español
- **Fuente tipográfica**: Inter

## 📄 Licencia

Proyecto de uso personal. Todos los derechos reservados.
