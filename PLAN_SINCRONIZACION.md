# Plan: Sincronización de contenido online (GitHub + JSON)

Objetivo: que cualquier persona con el APK pueda bajar **clases, ejercicios (con SVG), catálogos,
planes y challenges** desde un repositorio público con un botón en Configuración, **sin pisar lo
que creó o modificó** y **sin tocar nunca sus datos personales** (sesiones, récords, progreso).
La importación/exportación por ZIP actual se mantiene tal cual.

Leyenda: 👤 = lo hacés vos (manual) · 💻 = código

Rama de trabajo: `feature/content-sync` (desde `develop`).

---

## Cómo funciona (resumen)

```
PC (npm run dev)                         GitHub (público)                    Teléfonos (APK)
Configuración → Publicar contenido  →    CrossFitLes-content            →    Configuración → Actualizar contenido
  escribe manifest.json +                  manifest.json                       baja manifest; si contentVersion es
  content/content.json en                  content/content.json                mayor que la local, baja content.json
  ../CrossFitLes-content                                                       y lo aplica en UNA transacción
  (después: git push)
```

### Publicaciones repetidas (cada semana, etc.)

Está pensado para publicar todas las veces que quieras:
- Cada ejercicio, clase y plan viaja con un **hash** de su contenido. El dispositivo guarda el hash
  que aplicó (`remote_hash`).
- Al publicar de nuevo: si algo cambió, `contentVersion` sube (+1). Si nada cambió, no se genera
  versión nueva ("Sin cambios desde la versión N").
- Al actualizar en el teléfono: lo **nuevo se agrega**; lo que **cambió se actualiza** (sólo si la
  persona no lo editó); lo que no cambió no se toca; lo que la persona creó o editó, nunca.
- Nunca se borra nada en los teléfonos. Si quitás algo del repo, la gente lo conserva.

### Reglas por entidad

| Entidad | Nuevo | Ya bajado, cambió en el repo | Editado por el usuario | Coincide por nombre (seed/ZIP) |
|---|---|---|---|---|
| Catálogos | Se agrega | No se toca | — | Se reutiliza (nombre UNIQUE) |
| Ejercicios (+SVG, relaciones) | Se agrega | Se actualiza | No se toca | Se adopta y actualiza |
| Clases | Se agrega | Se actualiza si **no tiene sesiones** | No se toca | Se vincula y queda como propia (no se pisa) |
| Planes | Se agrega en **borrador**, con fechas corridas a hoy | Se actualiza si sigue en borrador y sin días hechos | No se toca | Se vincula y queda como propio |
| Challenges (definiciones) | Aparece en el catálogo | Se reemplaza la definición | — | El remoto reemplaza al del APK con el mismo `code` |
| Sesiones, resultados, récords, challenges en curso, perfil | **Nunca se tocan** | | | |

"Editado por el usuario" = `user_modified = 1`, se marca al guardar desde la app (ejercicio, clase,
plan o sus días). Desactivar una clase también la protege.

---

## Fase 0 — Punto de retorno y preparación ✅

- [x] 💻 Tag `stable-pre-sync-1.2.29` sobre `master` (commit `4b0136e`), subido a GitHub.
  No empieza con `v` → no dispara el release. Para volver: `git checkout stable-pre-sync-1.2.29`.
- [x] 👤 Backup del dispositivo importado en la PC (`BKP/crossfit-backup-20261010-123208.zip`).
- [ ] 👤 Guardar ese ZIP también fuera del repo (Drive/pendrive).
- [x] 👤 Dispositivo publicador: esta PC (`npm run dev`, `localhost:5173`).
- [x] 💻 Rama `feature/content-sync`.

## Fase 1 — Warning de Node 20 en GitHub Actions ✅ (falta probar)

- [x] 💻 `.github/workflows/release-apk.yml`: `checkout@v7`, `setup-node@v7` (Node 22),
  `setup-java@v6`, `cache@v6`, `action-gh-release@v3` (todas `node24`).
- [ ] 👤 Probar con el próximo tag `vX.Y.Z` y confirmar que no hay warning y el APK se genera.

## Fase 2 — Distribución del APK ✅

- [x] Repo `CrossFitLes` público → el APK de Releases se puede bajar.
- [x] La app ya avisa de versión nueva (`useUpdateCheck` contra GitHub Releases).
- [ ] 👤 Link fijo para compartir: `https://github.com/nestorlesna/CrossFitLes/releases/latest/download/CrossFitLes.apk`
- [ ] 👤 **Nunca perder el keystore** (`KEYSTORE_BASE64` + contraseñas): sin la misma firma Android
      no deja actualizar y la gente tendría que desinstalar (perdiendo sus datos).

## Fase 3 — Repo público de contenido ✅ (falta el primer push)

- [x] 👤 Repo `nestorlesna/CrossFitLes-content` creado (público).
- [x] 💻 Clonado en `C:\DATOS\DESARROLLOS\React\CrossFitLes-content` (carpeta hermana; se puede
      cambiar con `CONTENT_REPO_DIR` en `.env`). README agregado.
- [x] 💻 Publicación generada: **versión 2** — 126 clases, 328 ejercicios (todos con SVG),
      0 planes, 9 challenges, ~3,9 MB. (La v1 no llegó a subirse: se sube directo la v2.)
- [x] 👤 Primer push (v2, 2026-10-10). Desde ahora también lo hace `.\scripts\release.ps1` (o `-ContentOnly`):
  ```
  cd C:\DATOS\DESARROLLOS\React\CrossFitLes-content
  git add -A
  git commit -m "contenido v2"
  git push -u origin main
  ```
- La app lee de `https://raw.githubusercontent.com/nestorlesna/CrossFitLes-content/main/`
  (caché ~5 min: después de un push puede tardar unos minutos en verse).

## Fase 4 — Base de datos (migración v018) ✅

- [x] 💻 `src/db/migrations/v018_content_sync.ts`: en `exercise`, `class_template`, `training_plan`
      → `global_key` (índice único), `origin`, `remote_hash`, `user_modified`. Tabla `app_setting`.
- [x] 💻 Catálogos sin columnas nuevas: se resuelven por nombre (es UNIQUE).
- [x] 💻 `user_modified = 1` en `exerciseRepo.update`, `classTemplateRepo.update`,
      `trainingPlanRepo.update/addDay/updateDay/removeDay/reorderDays/saveCustomDay`.
- [x] 💻 `src/db/repositories/appSettingRepo.ts` (versión de contenido y última sincronización en SQLite).
- [x] Backup ZIP: usa `SELECT *`, así que las columnas nuevas viajan solas; backups viejos importan igual.

## Fase 5 — Publicar ✅

- [x] 💻 `src/services/contentPublishService.ts`: asigna `global_key = id` (una vez), arma
      `content.json` (catálogos, ejercicios + relaciones + imagen embebida, clases, planes con sus
      plantillas privadas, sin estado/progreso) y `manifest.json`; sube la versión sólo si cambió algo.
- [x] 💻 Middleware de Vite (`vite.config.ts`, sólo `npm run dev`, sólo desde localhost) que escribe
      los archivos en el clon local. Si no está disponible, los descarga.
- [x] 💻 Botón "Publicar contenido" visible **sólo en `npm run dev` web** (nunca en el APK).

## Fase 6 — Actualizar contenido ✅

- [x] 💻 `src/services/contentSyncService.ts` (reglas de la tabla de arriba, todo en una transacción).
- [x] 💻 Imágenes: se guardan en `exercise_image` con clave `remote/<hash>/img/...` (y en el
      filesystem en Android); así los SVG nuevos o mejorados llegan sin sacar APK nuevo.
- [x] 💻 Compatibilidad: `manifest.format`; si es mayor al que entiende la app → "Actualizá la app".
- [x] 💻 UI: Configuración → "Contenido online" (`src/components/export/ContentSyncSection.tsx`)
      con versión local, fecha y resumen (nuevos / actualizados / no tocados).
- [x] 💻 **Challenges**: `content.json` lleva las definiciones de `BUILTIN_CHALLENGES`
      (`src/data/challenges.ts`). El dispositivo las guarda en `app_setting.challenge_catalog` y
      `getChallenges()` / `getChallenge()` combinan las del APK con las remotas (por `code`). Las
      de un tipo que la app no sabe ejecutar se descartan. El progreso de cada challenge no viaja.
      **Para sumar un challenge nuevo**: agregarlo en `src/data/challenges.ts`, `npm run dev` →
      Publicar contenido → push. Llega a todos sin sacar APK (si es `meta_reps` o `daily`).

## Fase 7 — Extras (después)

- [ ] 💻 Chequeo automático al abrir la app (1 vez por día) que sólo avise "Hay contenido nuevo".
- [ ] 💻 "Restaurar original" en un ejercicio/clase editado.
- [ ] 💻 Badge "Oficial" en lo que vino del repo (`origin = 'remote'`).
- [ ] 💻 `content.json` hoy pesa ~3,8 MB (1,5 MB son SVG). Si crece mucho: partir en archivos o
      publicar sin indentar.

## Fase 8 — Pruebas

Hechas (2026-10-10) en la PC con el clon local (`VITE_CONTENT_BASE_URL=/__content/raw`):
- [x] Base del publicador (`localhost:5173`): migración v18 OK; "Actualizar" → **0 cambios**
      (no toca nada propio).
- [x] Base distinta (`127.0.0.1:5173`, otro origen = otra base): quedan 328 ejercicios sin
      duplicados, todos con SVG visible, 126 clases, 414 secciones y 1582 ejercicios de sección
      (idéntico al publicado), 0 referencias rotas. Segunda vez → "Ya tenés el contenido al día".
- [x] Publicación v2 (con 9 challenges): en la otra base sólo llegaron "9 challenges nuevos";
      ejercicios y clases sin cambios (los hashes coinciden) → la actualización es incremental.
- [x] Un challenge que existe sólo en el remoto aparece en el catálogo y su detalle funciona.
- [x] `tsc` y `npm run lint` sin errores.

Pendientes:
- [ ] 👤 **Android real**: instalar el APK nuevo en un teléfono sin datos → Actualizar → ver clases e imágenes.
- [ ] 👤 **Usuario con datos**: editar un ejercicio bajado, publicar un cambio de ese ejercicio y de
      otro → actualizar → el editado no cambia, el otro sí; sesiones y récords intactos.
- [ ] 👤 **Sin internet** → mensaje "Sin conexión a internet" y nada cambia.
- [ ] 👤 Merge `feature/content-sync` → `develop` → `master`, tag `v1.3.0` → release del APK.

## Fase 9 — Operación habitual

Publicar contenido nuevo (cada semana o cuando quieras):
1. 👤 `npm run dev` → crear/editar clases y ejercicios en la PC.
2. 👤 Configuración → Contenido online → **Publicar contenido** (muestra versión, cantidades y tamaño).
3. 👤 En `CrossFitLes-content`: `git add -A && git commit -m "contenido vN" && git push`.
4. 👤 Avisar: "Configuración → Actualizar contenido".

Probar antes del push (opcional): levantar el dev server con `VITE_CONTENT_BASE_URL=/__content/raw`
y abrir `http://127.0.0.1:5173` (otra base de datos) → Actualizar contenido.

Sacar versión nueva de la app:
1. 👤 Merge a `master`, tag `vX.Y.Z` → el workflow publica el APK (la app avisa sola).
2. 👤 Si un cambio de formato es incompatible, subir `CONTENT_FORMAT` en `src/services/contentFormat.ts`.

## Rollback

- Código: `git checkout stable-pre-sync-1.2.29` (o el APK del release `v1.2.29`).
- Datos de un dispositivo: importar el backup ZIP completo.
- Contenido: revertir el commit en `CrossFitLes-content` y volver a publicar (versión mayor).
