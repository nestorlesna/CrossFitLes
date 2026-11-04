# Plan de migración a FitLesUY Session Tracker

Objetivo: distribuir la app al público del canal de YouTube **FitLesUY**, con un nombre sin la marca
"CrossFit", datos base listos para usar, aspectos legales cubiertos y lo más preparada posible para
Google Play (aunque la distribución sigue siendo por GitHub Releases).

## Decisiones tomadas (2026-11-03)

| Tema | Decisión |
|---|---|
| Nombre visible | **FitLesUY Session Tracker** (corto: **FitLesUY**) |
| Logo | `BKP/fitlesuy-logo.png` (800×800, naranja sobre negro; ya coincide con `primary` de Tailwind) |
| `applicationId` | Cambia de `com.crossfitles.tracker` a **`uy.fitles.tracker`** (Android la toma como otra app) |
| Benchmarks | Quitar "CrossFit" del nombre: `Girl: Fran`, `Hero: Murph`, `Open 26.1` |
| Clases GOAT | **No** se cargan con "Cargar Datos Base"; **sí** llegan a cualquiera con "Actualizar contenido" |
| Licencia | **MIT** para el código y **CC BY 4.0** para el contenido (SVG, clases, challenges) |
| Distribución | **Sólo GitHub Releases por ahora**; Play queda para el futuro (Fase 8 en espera) |
| Feedback | Botón "Enviar comentario" que abre WhatsApp `+598 99447598` (`wa.me/59899447598`) |
| Carga base | Va en el código y se ejecuta sola en el primer arranque; el resto llega con "Actualizar contenido". **Se elimina el botón "Cargar Datos Base"** |
| Logo | No hay versión 1024: se escala el de 800 (Lanczos) |

## Estado

- **Fase 1: HECHA (2026-11-03)**, salvo 1.6 (renombrar repos de GitHub) y 1.7 (migrar tu teléfono, al
  publicar 2.0.0). Desvío: `DB_NAME` **no** se renombró (ver 1.3).
- **Fase 7: HECHA (2026-11-03)**: `feedbackService.ts`, botón en Configuración y en Acerca de;
  override remoto con `PUBLISHED_FEEDBACK_URL` → `manifest.feedbackUrl`.
- **Fase 6: HECHA (2026-11-03)**: `LICENSE` (MIT), `LICENSE-CONTENT.md` (CC BY 4.0; el logo queda
  fuera), `THIRD_PARTY_NOTICES.md` y `src/data/thirdPartyLicenses.json` (`npm run licenses`),
  Acerca de reescrita, pantalla "Licencias de terceros". Faltan los links a Privacidad y Términos:
  se agregan en la Fase 5.
- **Fase 2: HECHA (2026-11-03)**: migración `v020_fix_classic_classes` (aplicada en la BD de
  desarrollo) y contenido **v8** publicado en el clon local, **sin commit ni push**.
  **Ojo:** la app 1.3.1 rechaza un `manifest.app` distinto de `CrossFit Session Tracker`, así que
  el contenido v8 (`FitLesUY Session Tracker`) se sube **junto con el release 2.0.0**
  (`release.ps1` lo hace), nunca antes.
- **Fase 3: HECHA (2026-11-03)**: carga base = snapshot del contenido publicado **sin la biblioteca
  de 3.242 ejercicios** (decisión: sólo lo publicado). Detalle en la sección de la Fase 3.

---

## Fase 1: Renombrado y marca

### 1.1 Lo que cambia (visible al usuario)
- `capacitor.config.ts`: `appId: 'uy.fitles.tracker'` y `appName: 'FitLesUY Session Tracker'`.
- `android/app/build.gradle`: `namespace`, `applicationId` y `outputFileName = "FitLesUY.apk"`.
- `android/app/src/main/res/values/strings.xml` (4 strings).
- `MainActivity.java`: mover de `java/com/crossfitles/tracker/` a `java/uy/fitles/tracker/` y
  actualizar el `package`.
- `index.html` (título, `application-name` y `apple-mobile-web-app-title`).
- UI: `HomePage.tsx` (header), `AboutPage.tsx`, `SettingsPage.tsx` ("Acerca de FitLesUY"),
  `UpdateModal.tsx`, `HelpPage.tsx`, `ClassShareSection.tsx`.
- Textos de compartir y backup: `backupService.ts` (nombre del zip `fitlesuy-backup-…`, título),
  `classShareService.ts` ("Clase FitLesUY", "Ejercicios FitLesUY").
- `.github/workflows/release-apk.yml`: nombre del release "FitLesUY vX.Y.Z", APK `FitLesUY.apk` y
  texto de instalación. `useUpdateCheck` busca cualquier `.apk`, así que no se rompe.
- `scripts/release.ps1`, `README.md`, `CLAUDE.md`, `tailwind.config.js` (comentario),
  `vite.config.ts`, comentarios de `contentSyncService`/`contentFormat`/`contentPublishService`.
- `useUpdateCheck.ts`: archivo temporal `fitlesuy-update.apk`.
- `VideoTestPage.tsx`: URL de prueba de TikTok con `@crossfit` → otra URL.

### 1.2 Compatibilidad (no romper archivos viejos)
- `meta.app` de backups, clases y ejercicios compartidos y de `manifest.json`: el valor nuevo es
  `'FitLesUY Session Tracker'`, pero **al importar se acepta también `'CrossFit Session Tracker'`**.
  Centralizar en una constante `APP_NAMES_ACCEPTED` en `contentFormat.ts` o `constants.ts`.
  Afecta a `backupService.ts:256`, `classShareService.ts:350/888/1089` y `contentSyncService`.

### 1.3 Nombres internos
Como el `applicationId` nuevo arranca con una instalación limpia, se aprovecha para renombrar sin costo:
- `DB_NAME` **se mantiene** en `crossfit_tracker`: en web (`npm run dev`) la BD de desarrollo, la
  que publica el contenido, vive en IndexedDB con ese nombre, y renombrarla dejaría la app vacía.
  Es interno y no lo ve nadie. Lo mismo pasa con el alias `crossfitles` del keystore.
- `MEDIA_BASE_DIR` y los subdirectorios: `crossfit-tracker/media` → `fitlesuy/media`. Hay rutas
  hardcodeadas en `mediaService.ts`, `contentSyncService.ts:559`, `classShareService.ts`
  y `backupService.ts`: **reemplazarlas todas por la constante**.
- `iosKeychainPrefix` en `capacitor.config.ts`.
- Benchmarks: se renombran con la migración `v019_rename_benchmarks` (BD de desarrollo y
  dispositivos) y en `seedService3/4.ts`.
- Verificar que el backup guarda rutas **relativas** a media, para que un backup de la app vieja
  se restaure bien en la nueva.

### 1.4 Íconos y splash
- Reemplazar `resources/icon.png` por el logo (idealmente re-exportado a 1024×1024) y generar
  mipmaps, adaptive icon y splash con `@capacitor/assets`. El logo es circular, así que entra en la
  zona segura del adaptive icon (verificarlo con la máscara redonda y la "squircle").
- Web/PWA: regenerar `public/icon.svg` (o pasar a PNG), `icon-192.png`, `icon-512.png` y `favicon-32.png`.

### 1.5 Contenido con la marca
- Renombrar las 48 clases `CrossFit Girl: X` → `Girl: X`, `CrossFit Hero: X` → `Hero: X` y
  `CrossFit Open 26.N` → `Open 26.N`, en `seedService3/4.ts` y en la BD de desarrollo (para que
  "Publicar contenido" lo propague).
- Revisar descripciones con "CrossFit" en ejercicios (ej. `seedService.ts:307`) y `HelpPage.tsx:516`.
  Usar "entrenamiento funcional" donde se refiera a la marca. Los nombres de ejercicios genéricos no
  se tocan.
- Como el contenido se actualiza por `remote_hash`, los usuarios reciben los nombres nuevos sin
  duplicados (salvo que hayan editado la clase: `user_modified = 1`).

### 1.6 Repos de GitHub (al final, opcional)
- `CrossFitLes` → `FitLesUY` y `CrossFitLes-content` → `FitLesUY-content`. GitHub redirige las
  URLs viejas (API y raw), pero conviene actualizar `GITHUB_REPO` en `version.ts` y `CONTENT_REPO`
  en `contentFormat.ts` en el mismo release.
- Actualizar `release.ps1` (`$ContentRepoDir`), `vite.config.ts` (`CONTENT_REPO_DIR`) y el `remote`
  de los clones locales.

### 1.7 Migración de TU teléfono (una sola vez)
1. En la app vieja: Configuración → Exportar backup completo.
2. Instalar `FitLesUY.apk` (queda **al lado** de la vieja).
3. En la nueva: Importar backup y verificar sesiones, fotos, perfil y clases GOAT.
4. Recién ahí desinstalar la app vieja.

---

## Fase 2: Revisión de las clases no-GOAT

Relevamiento automático de `content.json` (contenido v7, 2026-11-03):

| Dato | Valor |
|---|---|
| Clases publicadas | 132 (48 GOAT y **84 no-GOAT**) |
| Ejercicios dentro de las 84 clases | 643 |
| Ejercicios sin objetivo (reps/tiempo/distancia/calorías) ni timer | **8, en 5 clases** |
| Secciones sin configuración de tiempos | **4** |
| Ejercicios referenciados que no están publicados | 0 |
| Ejercicios sin imagen | 0 |
| Clases sin duración estimada | 0 |

Las 84 no-GOAT son: 7 cortas (Abdominales, Calistenia, Cardio, Full Body, Piernas), 4 Isométricos,
Movilidad, 20 Girls, 21 Heroes, 3 Open 26 y 28 WODs de feb–mar 2026.

Tareas:
1. Listar y corregir los 8 ejercicios y las 4 secciones sin tiempos.
2. Pasar cada clase por `buildTimeline` y comparar la duración resultante con
   `estimated_duration_minutes`. Revisar las que difieran más de un 25 %.
3. Abrir las clases viejas (Girls/Heroes/WODs, anteriores a v1.0) en el ejecutor y el cronómetro
   para confirmar que se ven como las GOAT nuevas: descansos entre ejercicios y rondas, sección de
   movilidad, video y notas de coach.
4. Verificar que pesos y unidades (♂/♀ en `general_notes`) estén en kg y que el `work_format` coincida
   con el título (For Time, AMRAP, EMOM).
5. Corregir en la BD de desarrollo y volver a "Publicar contenido".

### Resultado (2026-11-03)
- Las "4 secciones sin tiempos" no aparecieron con ningún criterio (toda sección tiene time cap,
  intervalo o algún descanso). El problema real eran **26 secciones de intervalo** mal resueltas:
  - Sin `interval_seconds`, el motor usaba la ventana por defecto del formato: "Every 90"" o
    "Every 2'30"" corrían con 60 s y los E2MOM de 2 ejercicios con 2 × 120 s. Se cargó la ventana
    real; en los complejos ("Every 2 min: A + B + C") se reparte entre los ejercicios, porque el
    motor da una ventana por ejercicio.
  - Sin `rest_between_rounds_seconds`, el motor sumaba 60 s por vuelta a los EMOM (ej. el EMOM
    8 min de C&J Ladder duraba 15). Ahora es 0.
  - "Voltage Shift" (2 ON / 2 OFF) y "C&J Ladder" (2 ON / 1 OFF) pasan a "Por rondas" con
    descansos explícitos.
- Los 8 ejercicios de "máximas reps" tienen ahora `suggested_timer_seconds`. Lynne lleva
  descanso de 2 min entre rondas (era 0 y el WOD dice "descanso libre").
- 23 secciones "N Rondas For Time" estaban como "Por rondas": pasan a "For Time".
- Pesos: todos en kg; lo imperial sólo aparece como aclaración en notas ("9 kg (20 lb)").
- **Duración:** sigue habiendo ~50 clases con más de 25 % de diferencia, pero no es de los datos:
  `estimated_duration_minutes` incluye explicación y transiciones, y el motor corre **una sola
  vuelta** en los AMRAP y en los For Time sin rondas (Cindy: 6 min de timeline para 20 de AMRAP).
  Las GOAT tienen el mismo comportamiento. Si se quiere arreglar, es un cambio del motor
  (repetir el AMRAP hasta el time cap), no de las clases.
- Tarea 3 (revisar a ojo en el ejecutor) **no se hizo**: el modelado de las clases viejas es el
  mismo que el de las GOAT (descansos por sección, notas de coach, video), así que no hay
  diferencias estructurales que corregir; queda para la prueba manual.

---

## Fase 3: "Cargar Datos Base"

### Situación actual
`reSeedAll()` (`seedService2.ts`) carga catálogos, los 3.242 ejercicios de `public/seed2_exercises.json`
y las plantillas **hardcodeadas** de `seedService3–6` (Open, Girls, Heroes, WODs), más imágenes,
videos y músculos. **No** incluye las clases cortas, los Isométricos ni los challenges publicados
después, y esas plantillas no tienen `global_key`, así que un "Actualizar contenido" posterior
puede **duplicarlas**.

### Propuesta
"Cargar Datos Base" = estado listo para usar, **offline** y sin duplicados:
1. Migraciones y catálogos (como hoy).
2. Biblioteca de ejercicios `seed2_exercises.json` (como hoy). Hay que verificar que no duplique los
   337 ejercicios del contenido y, si coinciden por nombre, asignarles el `global_key`.
3. **Snapshot del contenido publicado sin GOAT** (`public/base-content.json`): lo genera
   "Publicar contenido" a partir del mismo `content.json`, filtrando las clases GOAT. Se importa
   con **la misma función** que usa `contentSyncService`, así quedan `global_key`, `origin` y
   `remote_hash` y el próximo "Actualizar contenido" sólo trae lo nuevo, incluidas las GOAT.
4. Challenges (`BUILTIN_CHALLENGES` y catálogo del snapshot).
5. Retirar `seedService3–6` del flujo (quedan reemplazados por el snapshot) y revisar que
   `imageUpdateService`, `videoUpdateService` y `muscleSeedService` sigan haciendo falta.
6. **Nunca** cargar: sesiones, resultados, récords, planes, perfil, medidas, fotos ni `app_setting`
   personal.

Criterio de GOAT: nombre que empieza con `GOAT`. Mejor agregar una marca explícita en el contenido
publicado (`row.collection = 'goat'`) para no depender del nombre.

### Resultado (2026-11-03)
- **Sin `seed2_exercises.json`**: sólo 36 de sus 3.242 ejercicios coinciden con los 337 publicados
  y casi ninguno tiene imagen. Se decidió cargar sólo lo publicado. Se borraron
  `seed2_exercises.json`, `seedService*.ts`, `imageUpdateService`, `videoUpdateService` y
  `muscleSeedService` (imágenes, videos y músculos ya viajan en el contenido). Quedan en el historial
  de git si hicieran falta.
- `buildContent()` marca las GOAT con `collection: 'goat'` (campo de `RemoteClass`, fuera del hash).
  "Publicar contenido" escribe además `public/base-content.json` (84 clases, 337 ejercicios con su
  SVG, 9 challenges; ~2,6 MB) por el endpoint `/__content/base` de Vite.
- `contentSyncService.applyContent()` es la importación compartida. La carga base **no** guarda
  `content_version`, así el primer "Actualizar contenido" baja todo y sólo suma las GOAT.
- `baseContentService`: con `app_setting.base_content` vacío y la BD sin ejercicios, clases ni
  sesiones, carga el snapshot (`v<N>`); si ya había datos, marca `existing` y no hace nada. Reemplaza
  a `seed_v1_done` de localStorage (ya no existe).
- "Cargar Datos Base" se eliminó. "Limpiar base" quedó como **"Borrar todos los datos"**: borra
  todo y recarga, y el primer arranque vuelve a cargar los datos base.
- Probado en `localhost:5199` (BD vacía): carga base 84 clases / 0 GOAT / 337 ejercicios con
  imagen; después, aplicar el contenido v9 sumó 48 clases (las GOAT), 0 actualizadas, 0
  duplicados; "Borrar todos los datos" vuelve al mismo estado.
- **Al publicar contenido nuevo, commitear también `public/base-content.json`** para que el APK
  lleve el snapshot al día.

### Primer arranque
- Con la BD vacía, mostrar una pantalla de bienvenida: descargo de salud (Fase 4) y luego
  "Cargar datos base (recomendado)" / "Empezar vacío".
- Bug latente: el flag `seed_v1_done` vive en `localStorage`, lo que viola la regla del proyecto.
  Pasarlo a `app_setting`.

---

## Fase 4: Descargo de salud

- **Pantalla al primer arranque** (y cuando cambie la versión del texto), con un checkbox
  "Leí y acepto" y un botón para continuar. Se guarda en `app_setting`:
  `health_disclaimer_version = 1` y la fecha de aceptación.
- Contenido (lenguaje simple):
  - La app es una herramienta de registro y **no es asesoramiento médico ni profesional**.
  - Consultá a un médico antes de empezar, sobre todo si tenés condiciones cardíacas, lesiones,
    embarazo o más de 40 años sin actividad.
  - Pesos, tiempos y escalados son **sugerencias**; adaptalos a tu nivel.
  - Ante dolor, mareo o falta de aire, pará.
  - Menores de 18, sólo con supervisión de un adulto o entrenador.
  - Lo usás bajo tu responsabilidad; el autor no responde por lesiones.
- El mismo texto va en Acerca de (reemplaza el "Deslinde de responsabilidad" actual) y en la
  página de Términos de GitHub Pages.

---

## Fase 5: GitHub Pages (privacidad y términos)

- Carpeta `docs/` en `master`, publicada con GitHub Pages (Settings → Pages → `/docs`).
  URL: `https://nestorlesna.github.io/<repo>/`.
- Páginas:
  - `index.html`: qué es la app, link de descarga al último release, logo y link al canal.
  - `privacidad.html`: **política de privacidad**.
  - `terminos.html`: términos de uso y descargo de salud.
- Política de privacidad, puntos a cubrir:
  - Responsable: Néstor Lesna, Tacuarembó, Uruguay, y email de contacto.
  - **Se cumple la Ley N.º 18.331 de Protección de Datos Personales (Uruguay) y su Decreto
    reglamentario 414/009.**
  - La app **no recopila, transmite ni vende** datos personales: todo queda en el dispositivo.
    No hay cuentas, analíticas ni publicidad.
  - Conexiones a internet: consultar si hay versión nueva (GitHub) y descargar contenido (GitHub).
    No se envían datos del usuario.
  - Permisos: cámara/galería (fotos de progreso e imágenes de ejercicios; quedan en el
    dispositivo), internet e instalación de paquetes (sólo en la versión de GitHub).
  - Contacto por WhatsApp: si el usuario escribe, su número y su mensaje los procesa WhatsApp
    (Meta) bajo sus propios términos y el autor los usa sólo para responder.
  - Derechos de acceso, rectificación y supresión: como no hay datos en servidores, se ejercen
    borrando los datos en la app o desinstalándola, y por email.
  - Fecha de vigencia.
- Links a estas páginas desde Acerca de y en la descripción de los videos. Play va a exigir la URL
  de privacidad.

---

## Fase 6: Acerca de, licencias y open source

### Archivos en el repo
- `LICENSE`: MIT (código).
- `LICENSE-CONTENT.md`: CC BY 4.0, que cubre `public/img/**`, SVG de ejercicios, clases, challenges
  y el contenido publicado.
- `THIRD_PARTY_NOTICES.md`: generado con `npx license-checker --production` (o similar) y
  agregado al build.
- README: badge de licencia, descarga, capturas y cómo contribuir (issues).

### Acerca de (`AboutPage.tsx`)
- Logo nuevo, "FitLesUY Session Tracker" y versión.
- **Cambiar "uso estrictamente personal"** por un texto de app gratuita y abierta para la comunidad
  FitLesUY.
- **Cambiar "Todos los derechos reservados"**, porque contradice la licencia abierta, por
  "Código MIT · Contenido CC BY 4.0", con link al repo.
- Sección **"Créditos y fuentes de datos"**:
  - *Exercises Dataset* (licencia MIT, datos): usado como **referencia** de nombres, grupos
    musculares, equipamiento e instrucciones.
  - "Las imágenes y GIF de ese dataset son © Gym visual y **no** se incluyen en la app; todas las
    ilustraciones de ejercicios son propias."
- Sección **"Licencias de terceros"**: subpantalla con la lista generada (React, Capacitor,
  jeep-sqlite, sql.js, lucide, recharts, sonner, date-fns, etc. con su licencia).
- Links: Política de privacidad, Términos, Canal de YouTube, Código fuente y Enviar comentario.
- Descargo de salud (texto de la Fase 4) y "Datos y respaldo" (se mantiene).

---

## Fase 7: Enviar comentario por WhatsApp

**Opinión:** para una app de nicho promocionada en tu canal es una idea **razonable y hasta
buena**: es el canal donde la gente realmente escribe, la fricción es mínima y para un público
uruguayo es lo natural. No es loca. Hay que tener en cuenta lo siguiente:
- **Tu número queda público** (en el APK y en el repo, que es abierto). Recomiendo **WhatsApp
  Business** (gratis; puede ser el mismo número): perfil del canal, mensaje de bienvenida
  automático, respuestas rápidas y etiquetas ("bug", "idea") para ordenarte.
- Los reportes por WhatsApp llegan desordenados. El mensaje sale **pre-cargado** con lo que
  necesitás para reproducir: versión de la app, versión de Android, modelo y una plantilla
  ("¿Qué pasó? / ¿Qué esperabas?").
- **Interruptor remoto**: el destino del botón (WhatsApp, formulario o email) se lee del
  `manifest.json` del repo de contenido, así **si se desborda lo cambiás sin publicar una versión
  nueva**. Si no hay internet o no hay valor remoto, se usa el número embebido.

Implementación: `https://wa.me/598XXXXXXXX?text=<mensaje codificado>`, abierto con `@capacitor/browser`
o `window.open` (Android lo deriva a WhatsApp). Botón en Configuración y en Acerca de.
**Falta: tu número** (formato internacional, sin `+` ni espacios).

---

## Fase 8: Firma, releases y preparación para Play

### Estado verificado
- Keystore: `KEY/release.keystore`, fuera del repo (`.gitignore`). En el CI se decodifica desde
  `secrets.KEYSTORE_BASE64`.
- Certificado autofirmado: CN=Nestor Lesna, Tacuarembó, UY · RSA 2048 · SHA256withRSA ·
  **válido hasta 2053** · SHA-256 `73:B8:EF:F5:…:95:41`. Es apto como **upload key** de Play.
  Lo verifiqué sobre el APK local `android/app/release/CrossFitLes.apk` (v1.0.2); el de v1.3.1 sale
  del mismo secret.
- Auto-actualización: `useUpdateCheck` consulta `releases/latest` y descarga el primer `.apk`.
- **Pendiente:** guardar una copia del keystore **y de sus contraseñas** fuera de esta PC (gestor
  de contraseñas o un pendrive). Sin eso no se pueden publicar actualizaciones.

### Para dejar listo Play (sin publicar todavía)
- **Dos sabores** (`productFlavors`): `github` y `play`. Play **prohíbe** que una app se actualice
  sola fuera de la tienda y el permiso `REQUEST_INSTALL_PACKAGES` está restringido. El sabor `play`
  no lleva ese permiso y desactiva `useUpdateCheck` (flag de build `VITE_DISTRIBUTION=play`).
- Agregar al workflow la generación de **AAB** (`bundlePlayRelease`), como artefacto aparte.
- **targetSdk**: hoy es 34 (Capacitor 6). Play exige 35 para apps nuevas y probablemente 36 desde
  agosto de 2026 (verificar en el momento). Eso implica **subir Capacitor a 7 u 8**: es una
  tarea aparte, con su propia prueba de SQLite, cámara y filesystem.
- Material para la ficha: ícono 512, *feature graphic* 1024×500, capturas, descripción corta y
  larga, URL de privacidad (Fase 5), formulario de Data safety ("no se recopilan datos") y
  clasificación de contenido.
- Requisito de cuentas personales nuevas: **prueba cerrada con 12 testers durante 14 días**.
  Se puede reclutar del canal.

---

## Orden de ejecución sugerido

| # | Paso | Release |
|---|---|---|
| 1 | Fase 1 (renombrado, appId, íconos, compatibilidad, nombres internos) | — |
| 2 | Fase 7 (WhatsApp) y Fase 6 (Acerca de y licencias) | — |
| 3 | Fase 4 (descargo y primer arranque) | — |
| 4 | Fase 2 (revisión de clases) y "Publicar contenido" | contenido |
| 5 | Fase 3 (Cargar Datos Base con snapshot) | — |
| 6 | Release **2.0.0** (cambio de identidad = versión mayor) y migración de tu teléfono (1.7) | app |
| 7 | Fase 5 (GitHub Pages) y anuncio en el canal | — |
| 8 | Fase 1.6 (renombrar repos) y Fase 8 (sabores, AAB, SDK) cuando se decida ir a Play | app |

## Checklist de verificación antes de anunciar
- [ ] Instalación limpia en un teléfono **sin** la app vieja: bienvenida, descargo, Cargar Datos Base
      sin GOAT, sin sesiones ni perfil.
- [ ] "Actualizar contenido" después de Cargar Datos Base: trae las GOAT y **no duplica** nada.
- [ ] Backup de la app vieja importado en la nueva (con fotos y media).
- [ ] Importar una clase compartida desde la app vieja (formato `CrossFit Session Tracker`).
- [ ] La auto-actualización de 2.0.0 a 2.0.1 funciona.
- [ ] `grep -ri crossfit src android/app/src public index.html` sólo deja coincidencias justificadas
      (compatibilidad y nombres de ejercicios).
- [ ] `npm run lint` y `npm run build` sin errores.

---

## Traspaso a la próxima sesión (2026-11-03)

Orden acordado: **Fase 2 → Fase 3 → Fase 4**.

- **Fase 2 primero**: la carga base de la Fase 3 sale del contenido publicado, así que conviene
  corregir las clases antes. Las correcciones van en una **migración** (`v020_…`), igual que
  `v019_rename_benchmarks`, para que se apliquen en la BD de desarrollo (web, IndexedDB en
  `localhost:5173`) y luego se publiquen con "Publicar contenido". Para encontrar los 8 ejercicios
  y las 4 secciones sin tiempos, analizar `../CrossFitLes-content/content/content.json` con node
  (clases no-GOAT: `row.name` no empieza con `GOAT`).
- **Fase 3**: snapshot sin GOAT empaquetado en el APK, que se carga solo con la BD vacía; se elimina
  el botón "Cargar Datos Base" de `ResetSection.tsx`; revisar si "Limpiar base" sigue teniendo
  sentido; pasar `seed_v1_done` de localStorage a `app_setting`; evitar duplicados con
  `seedService3–6` y `seed2_exercises.json` (usar `global_key`).
- **Fase 4**: la pantalla de bienvenida del primer arranque muestra el descargo de salud
  (aceptación en `app_setting`) y después lanza la carga base de la Fase 3. Reemplazar el bloque
  "Deslinde de responsabilidad" de `AboutPage.tsx` por el mismo texto.
- Para probar un primer arranque **sin tocar la BD de desarrollo**, levantar dev en otro puerto
  (`npm run dev -- --port 5199 --strictPort`): IndexedDB es por origen, así que arranca vacía.
- Commits en `develop`, sin push. `BKP/Ejercicios.md` tiene cambios del usuario: no incluirlo.
