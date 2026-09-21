# SVG_MEJORAS.md
## Registro de dificultades y mejoras al dibujar SVG animados de ejercicios

Este archivo acumula, ejercicio por ejercicio, qué costó representar bien en el stick figure y qué
quedó pendiente de mejorar. Se completa una entrada cada vez que se crea un SVG nuevo (ver
`BKP/CREO_CLASE.md` §5b) usando el patrón de 5-10 fotogramas de §5a.

El objetivo es que la futura pasada de actualización de los 308 SVG viejos (todavía en el patrón
fijo de 3 frames, ver `BKP/CREO_CLASE.md` §5c) parta de casos concretos y patrones repetidos, en vez
de rehacer el criterio desde cero.

---

## Cómo agregar una entrada

Una entrada por ejercicio nuevo, en orden cronológico (más reciente al final), con este formato:

```
### <Nombre del ejercicio> (`archivo.svg`) — YYYY-MM-DD

- **Frames usados:** N — motivo
- **Dificultad:** qué fue difícil de representar (plano de movimiento, rotación, equipo que tapa
  la figura, orientación, etc.)
- **Mejora pendiente / a revisar:** qué quedó imperfecto o qué probar la próxima vez
```

---

## Entradas

### Half-Kneeling Windmill Rotation and Side Bend (`half-kneeling-windmill-rotation-and-side-bend.svg`) — 2026-09-16

- **Frames usados:** 6 — el movimiento tiene 3 fases claras (rotación de torso, flexión lateral,
  retorno) y no necesita más detalle que eso; con 6 alcanza para leer cada fase sin saturar.
- **Dificultad:** el plano de movimiento es rotacional (torso girando sobre el eje vertical) y
  lateral (side bend) a la vez, algo que un stick figure de frente no puede mostrar con precisión
  real — se resolvió desplazando la posición de hombro/cabeza/brazo en cada frame para sugerir el
  giro y la inclinación, en vez de rotar la figura en 3D. Las piernas (posición de media rodilla)
  se mantienen fijas en los 6 frames porque no cambian durante el movimiento.
- **Mejora pendiente / a revisar:** la lectura del "lado" (derecha vs izquierda) no queda clara
  sólo con el SVG — depende del `coach_notes` de cada `section_exercise` (§6.1 de `CREO_CLASE.md`).
  Si se repite este patrón (windmill, rotaciones con side bend), considerar invertir el dibujo en
  un segundo SVG para el lado contrario en vez de reusar el mismo archivo para ambos lados.
- **Corrección 2026-09-16 (2da pasada):** los desplazamientos de hombro/cabeza entre frames eran
  demasiado chicos (8-10px) y el brazo de apoyo cruzaba el torso; se rehizo con desplazamientos
  mucho más grandes (30-70px) para que cada fotograma se lea claramente distinto.
- **Corrección 2026-09-16 (3ra pasada, bug real de animación):** seguía viéndose mal — "todo el
  recorrido" pintado a la vez y el frame 1 tardando en desaparecer. Causa real: los `@keyframes`
  de los frames 2-6 (copiados tal cual del ejemplo de §5a de `CREO_CLASE.md`) no tenían un punto
  `0%` explícito, así que el navegador arrancaba esos frames desde la opacidad computada normal
  (`1`) en vez de `0`, y recién fundían hacia 0 al llegar a su primer punto declarado — los 6 frames
  quedaban visibles al mismo tiempo al iniciar cada ciclo. Se corrigió agregando `0%{opacity:0}`
  explícito a cada keyframe salvo el del frame 1 (que legítimamente empieza visible).
- **Corrección 2026-09-16 (4ta pasada, hueco entre frame 1 y frame 2):** con el bug anterior ya
  resuelto, seguía viéndose un parpadeo — el tren superior desaparecía una fracción de segundo al
  pasar del frame 1 al frame 2 (sólo se veían las piernas fijas). Causa: el punto donde `sh1` llega
  a 0 (`13.3%`) no coincidía con el punto donde `sh2` empieza a subir de 0 (`16.7%`) — quedaba un
  hueco de 3.3% del ciclo con todo en opacity 0. Se corrigió realineando **todos** los keyframes
  para que el fin del fundido de salida de cada frame sea exactamente el mismo número que el
  inicio del fundido de entrada del siguiente (traspaso continuo, sin hueco ni superposición,
  salvo el empalme intencional frame6→frame1 en el loop). También se corrigió el ejemplo de la
  guía (§5a de `CREO_CLASE.md`), que tenía este mismo desalineamiento. Lección: cualquier SVG
  nuevo con más de 3 frames tiene que revisarse visualmente en el navegador (no alcanza con que el
  XML sea válido) porque estos bugs de timing no se detectan leyendo el código superficialmente —
  conviene verificar a mano que cada punto de "fin de fundido" de un frame sea igual al "inicio de
  fundido" del siguiente antes de dar el SVG por terminado.

### Dumbbell Reverse Lunge (`dumbbell-reverse-lunge.svg`) — 2026-09-19

- **Frames usados:** 6 — de pie, despegue del pie de atrás, apoyo de punta, posición baja, empuje y retorno; cubre las fases del paso atrás sin saturar.
- **Dificultad:** vista lateral con un solo brazo visible por figura (mancuerna en el costado); el paso hacia atrás se sugiere sólo con la posición de pies y rodillas.
- **Mejora pendiente / a revisar:** falta revisarlo visualmente en el navegador (timing de crossfade con solape del 12 % del slot); no distingue entre pierna derecha e izquierda.

### Barbell Inverted Row (`barbell-inverted-row.svg`) — 2026-09-21

- **Frames usados:** 6 — colgado, inicio de retracción escapular, tracción media, pecho a la barra, y las dos fases de descenso; sin frame extra porque el cuerpo es una línea rígida que sólo pivota sobre los talones.
- **Dificultad:** vista lateral; la barra se ve de canto (círculo) y el cuerpo ocupa sólo la mitad inferior del cuadro, quedando espacio vacío arriba. El codo se sugiere doblado hacia atrás/abajo.
- **Mejora pendiente / a revisar:** subir la barra y agrandar la figura para aprovechar el cuadro; revisar visualmente el crossfade en el navegador.

### Dumbbell Farmer Hold (`dumbbell-farmer-hold.svg`) — 2026-09-21

- **Frames usados:** 5 — mancuernas en el piso, media subida, de pie, sostén con hombros atrás y bajada; el ciclo muestra levantar y sostener porque el hold en sí casi no tiene movimiento.
- **Dificultad:** un isométrico no se anima; la "tensión" se sugiere con tres trazos cortos junto a cada mancuerna en el frame de sostén y hombros ligeramente más altos.
- **Mejora pendiente / a revisar:** las alturas de la figura entre frames de bisagra y de pie no coinciden del todo (piernas de largo distinto); revisar visualmente en el navegador.
