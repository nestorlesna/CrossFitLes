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

### Alternating Kettlebell Clean and Press (`alternating-kettlebell-clean-and-press.svg`) — 2026-09-28

- **Frames usados:** 6 — bisagra con la kettlebell entre las piernas, tirón con cadera extendida, rack en el hombro, dip de rodillas, press overhead bloqueado y bajada al rack; el clean y el press son dos movimientos encadenados y con menos frames se perdía la transición por el rack.
- **Dificultad:** vista frontal con un solo brazo cargado; el giro de la kettlebell alrededor de la muñeca y la alternancia de brazo no se pueden mostrar con un stick figure, así que el dibujo siempre usa el brazo derecho y el cambio de lado queda sólo en la descripción del ejercicio.
- **Mejora pendiente / a revisar:** revisar visualmente en el navegador el crossfade entre frames y las alturas de cabeza/cadera (el frame de bisagra y el de pie no tienen el mismo largo de pierna exacto).

### Kettlebell Upright Row (`kettlebell-upright-row.svg`) — 2026-10-03

- **Frames usados:** 6 — kettlebell abajo, a la cadera, al pecho, al mentón con codos altos, y dos de bajada; el recorrido vertical de las manos y la apertura de los codos se leen bien con ese ritmo.
- **Dificultad:** en vista frontal los codos que suben y se abren son lo esencial, pero el stick figure no distingue agarre ni muñecas; la kettlebell se resuelve con un círculo y un asa simple.
- **Mejora pendiente / a revisar:** revisar visualmente en el navegador que codos y manos no se crucen en el frame superior.

### Barbell Deadlift to Knee Height (`barbell-deadlift-to-knee-height.svg`) — 2026-10-03

- **Frames usados:** 5 — piso, subida, altura de rodilla con pausa (marcas de tensión), bajada y vuelta al piso; el ejercicio es corto y la pausa es la parte clave.
- **Dificultad:** de frente no se ve la inclinación del torso ni la posición de hombros sobre la barra, que es lo que se corrige en este ejercicio; sólo se sugiere con la altura de cabeza y cadera.
- **Mejora pendiente / a revisar:** probar una vista lateral para mostrar el ángulo de espalda; revisar en el navegador las alturas de piernas entre frames.

### Bodyweight Bench Dip (`bench-dip.svg`) — 2026-10-04

- **Frames usados:** 6 — arriba con brazos extendidos, dos de bajada, abajo con codos a 90°, y dos de subida (simétricos a los de bajada); la fórmula de §5a de `CREO_CLASE.md` con N=6 (ciclo de 8s). Se generó con un script que interpola la pose entre "arriba" y "abajo", así los frames de subida repiten los de bajada.
- **Dificultad:** vista lateral con la silla detrás de la figura: el brazo que se dobla hacia atrás queda pegado al asiento y al torso, y a escala chica el codo se confunde con la mano. Se resolvió con un círculo oscuro en el codo y la silla en un tono más apagado que la figura. Las piernas flexionadas (rodillas a 90°) evitan que una pierna estirada tape la cadera.
- **Mejora pendiente / a revisar:** viewBox `240x180` (como `bodyweight-push-up.svg`) en vez del `200x230` de la guía, porque el movimiento es horizontal. No se dibuja la variante con piernas extendidas ni con los pies elevados.

### Wall Walk (`wall-walk.svg`) — 2026-10-07

- **Frames usados:** 8 — plancha con pies en la base de la pared, pies suben (cuerpo horizontal), tres posiciones intermedias mientras las manos caminan hacia la pared (cadera sube), vertical con pecho a la pared, y una bajada controlada; ciclo de 10.4s (fórmula §5a). Se generó con un script a partir de (posición de manos, altura de pies) con largo de cuerpo constante, así la figura no se deforma entre frames.
- **Dificultad:** en vista lateral el avance de las manos es lo esencial pero se pierde si los frames no mantienen el largo del cuerpo; cuerpo recto (sin pique de cadera) para simplificar.
- **Mejora pendiente / a revisar:** revisar en el navegador que cabeza y manos no se crucen en los frames casi verticales; no se dibuja la variante con pique de cadera.

### Weighted Lunge (`weighted-lunge.svg`) — 2026-10-07

- **Frames usados:** 6 — de pie, paso largo, bajando, abajo (rodilla trasera cerca del piso), subiendo y empuje de vuelta; ciclo de 7.8s (fórmula §5a). Vista lateral mirando a la derecha (en vez de frontal como el SVG viejo de 3 frames, que no mostraba el paso). Generado con IK de 2 huesos (muslo=pierna=50) a partir de posición de cadera y tobillos.
- **Dificultad:** en vista lateral las dos mancuernas se superponen; se dibuja un solo brazo con una mancuerna (rect). Talón trasero levantado (apoyo en punta) para que se lea la zancada.
- **Mejora pendiente / a revisar:** revisar en el navegador el solapamiento de la rodilla trasera con la línea de suelo en el frame 4; no cubre la variante con paso atrás ni caminando.

### ⚠️ Error de codificación al generar SVG con script (2026-10-07) — Wall Walk y Weighted Lunge

- **Síntoma:** el SVG "no se ve" (imagen rota) aunque el diseño sea correcto.
- **Causa:** el script Python escribía el archivo con `open(path,'w')`; en Windows eso usa cp1252, no UTF-8. Los comentarios con tildes/símbolos (`45°`, `posición`) quedaron como bytes inválidos y el navegador rechaza el XML ("invalid token").
- **Solución:** escribir siempre con `open(path,'w',encoding='utf-8')`. Alternativa: no poner tildes ni `°` en los comentarios del SVG.
- **Verificación obligatoria tras generar un SVG:** `python -c "import xml.dom.minidom as m; m.parse('archivo.svg')"` debe terminar sin error. No dar el SVG por bueno sin esto.

### Barbell Push Press (`barbell-push-press.svg`) — 2026-10-07

- **Frames usados:** 8 — rack frontal, inicio del dip, dip abajo, empuje de piernas, extensión con la barra al mentón, press intermedio, bloqueo arriba y bajada controlada; ciclo de 10.4s (fórmula §5a). Regenera el SVG viejo de 3 frames, que no mostraba el empuje de piernas ni el recorrido de la barra. Generado con script (IK de 2 huesos para piernas y codos) para mantener el largo de los segmentos constante.
- **Dificultad:** en vista frontal la barra cruza la cara en los frames de press; se dibuja detrás de la figura y no tapa la cabeza. Los codos sólo se marcan (círculo) en los frames con brazo doblado.
- **Mejora pendiente / a revisar:** revisar en el navegador el cruce barra/cabeza en los frames 5-6; una vista lateral mostraría mejor el ligero retroceso de la cabeza.

### Squat to Stand (`squat-to-stand.svg`) — 2026-10-07

- **Frames usados:** 6 — de pie, flexión con piernas rectas, bajada en cuclillas, cuclillas abajo con pecho arriba, subida de cadera y de pie; ciclo de 7.8s (fórmula §5a). Vista lateral mirando a la derecha, generada con script (IK de 2 huesos para la pierna).
- **Dificultad:** las manos siempre agarran la punta de los pies, así que el brazo se dibuja recto hasta el pie y el tronco cambia de ángulo entre frames; en la cuclilla profunda la rodilla y el brazo se superponen.
- **Mejora pendiente / a revisar:** revisar en el navegador el solape rodilla/brazo en los frames 3-4 y la altura de cadera en la cuclilla; se dibuja una sola pierna.

### Barbell High Hang Squat Clean (`barbell-high-hang-squat-clean.svg`) — 2026-10-07

- **Frames usados:** 8 — hang alto, carga de cadera, extensión triple, tirón alto con codos arriba, caída bajo la barra, recepción en sentadilla, subida y de pie en rack; ciclo de 10.4s (fórmula §5a). Vista frontal, generada con script (IK de piernas y codos).
- **Dificultad:** en vista frontal no se ve la inclinación del torso ni el rebote de cadera; el cambio de ancho de pies (más abiertos en la recepción) es lo que marca la caída bajo la barra.
- **Mejora pendiente / a revisar:** revisar el crossfade en el navegador; una vista lateral mostraría mejor la extensión de cadera. Sin videos cargados (no se encontró URL de YouTube validable).
