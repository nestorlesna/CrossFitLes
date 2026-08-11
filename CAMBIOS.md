# CAMBIOS.md — Curación de la base de ejercicios

**Origen:** `BKP/crossfit-backup-20260811-desdePC_previo_cowork.zip`  
**Salida:** `BKP/crossfit-backup-20260811-ejercicios-curados.zip`  
**Fecha:** 2026-08-11 08:21

## Alcance

La base tiene **3.466 ejercicios activos**, de los cuales **258** están efectivamente usados en clases, sesiones o récords personales. La curación se limitó a ese conjunto. Los ~3.208 restantes son un catálogo importado en bloque y **no fueron tocados**.

No se borró, fusionó ni creó ningún ejercicio. No se tocaron videos, imágenes, equipamiento, tags, tipos de sección ni unidades de medida.

## Resumen

| Tipo de cambio | Cantidad |
|---|---:|
| Notas técnicas | 108 |
| Músculo principal (campo) | 74 |
| Músculos | 35 |
| Dificultad | 34 |
| Descripción | 31 |
| Compuesto | 14 |
| Músculos (granular) | 2 |
| **Total de modificaciones** | **298** |
| Ejercicios afectados | 156 |

## Correcciones sistémicas

### 1. Músculos en catálogo simplificado → granular

El catálogo `muscle_group` tiene activos **los 12 nombres simplificados y los 35 granulares a la vez**, y los ejercicios usaban unos u otros sin criterio. De los 258 en alcance, **30 estaban en nomenclatura simplificada**: 28 se resolvieron al reasignar músculos con criterio propio y 2 por conversión directa con la tabla de equivalencias de `BKP/ACTUALIZO_MUSCULOS.md` §3. Ninguno de los 258 queda ya en nomenclatura simplificada.

> ⚠️ Los 12 registros simplificados siguen existiendo en el catálogo y siguen usándolos los ~3.208 ejercicios fuera de alcance. Conviene decidir en algún momento si se desactivan o si se migra toda la base.

### 2. Campo `primary_muscle_group_id` desalineado

74 ejercicios tenían el campo vacío o apuntando a un músculo distinto del marcado como `is_primary = 1` en `exercise_muscle_group`. Se realineó al primer músculo primario de cada ejercicio.

### 3. Ejercicios sin músculo primario

Tres ejercicios no tenían ningún músculo marcado como primario: **Barbell Front Squat**, **Barbell Hang Muscle Clean and Press** y **Wall Ball Shot**. Se les asignó primario y secundarios completos.

### 4. Criterio de dificultad

Se normalizó la escala, que tenía incoherencias fuertes: `Barbell Power Clean` figuraba como **Experto** mientras `Power Clean` era **Avanzado** y `Barbell Hang Power Clean` **Intermedio**. Criterio aplicado:

- **Básico** — patrón simple, sin carga overhead, sin componente pliométrico ni técnico.
- **Intermedio** — carga con barra/kettlebell, trabajo unilateral, overhead controlado, saltos.
- **Avanzado** — levantamiento olímpico completo, gimnástico de alta demanda (muscle-up, HSPU, pistol).
- **Experto** — reservado a lo que combina fuerza gimnástica máxima e inestabilidad (bar/ring muscle-up, ring HSPU).

### 5. Criterio de `is_compound`

Compuesto = el movimiento cruza más de una articulación. Se corrigieron 14 casos: sit-ups sobre GHD y colgado, wall sits, V-ups y caminata pasaron a compuestos; la flexión lateral con peso y el crunch cruzado de pie pasaron a monoarticulares.

## Nota sobre contenido reemplazado

Sólo se sobreescribió texto ya existente en **un** ejercicio: **Goblet Squat**, cuya descripción estaba cortada a media frase («Sostener una pesa al pecho (goblet) en sentadilla baja») y cuyas notas técnicas describían press que el movimiento no incluye (pertenecen a *Goblet Squat Hold Press*). Todo el resto son campos que estaban vacíos.

## Hallazgos detectados y NO corregidos

Quedan fuera del alcance acordado, pero conviene tenerlos presentes:

1. **670 filas de `exercise_muscle_group` tienen `id = NULL`** en el backup original. SQLite lo tolera porque la columna es `TEXT PRIMARY KEY` sin `NOT NULL`, así que la restauración funciona igual. Las filas que reescribí llevan UUID válido, con lo que bajaron a 557 — pero el resto sigue igual. No las toqué para no modificar ejercicios fuera de alcance.
2. **65 ejercicios tienen más de un músculo marcado como primario.** Es un patrón preexistente y consistente en toda la base (los levantamientos olímpicos suelen tener 3 o 4). No lo cambié porque parece intencional, pero si el criterio es «un solo primario» hay que definirlo y aplicarlo de una vez a toda la base.
3. **Catálogo de músculos duplicado.** Ver la sección de correcciones sistémicas: conviven los 12 nombres simplificados con los 35 granulares, todos activos.
4. **Los ~3.208 ejercicios fuera de alcance siguen vacíos**: 93 % sin descripción, 96 % sin notas técnicas, 92 % sin músculos asignados.

> El `data.json` de salida se escribió en JSON compacto (sin indentación), por eso el ZIP pesa 2,4 MB en lugar de 10,4 MB. El contenido y el recuento de registros son equivalentes; los 289 archivos de `media/` se copiaron byte a byte sin cambios.

## Detalle por ejercicio

### 90/90 Hip Internal Rotation Lift-Off

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El torso se mantiene erguido: no ayudarse inclinándose hacia atrás. La elevación es mínima — u… |

### Ab Wheel Kneeling Rollout

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | De rodillas con la rueda abdominal en las manos, extender el cuerpo hacia adelante desplazando… |
| Notas técnicas | (vacío) | Anti-extensión puro: la lumbar no se arquea en ningún momento. Cadera y hombros avanzan juntos… |

### Alternating 90/90 Into Shin Box

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Glúteos \| S: Core/Abdominales, Isquiotibiales | P: Glúteo mayor \| S: Recto abdominal, Bíceps femoral, Glúteo medio |
| Músculo principal (campo) | Glúteos | Glúteo mayor |

### Alternating Heel Touches

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Los omóplatos quedan despegados del piso durante toda la serie: si la cabeza se apoya entre re… |

### Alternating Kettlebell Row

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Dorsales \| S: Bíceps, Trapecio, Core/Abdominales | P: Dorsal ancho \| S: Bíceps braquial, Trapecio (medio), Recto abdominal, Deltoides posterior |
| Músculo principal (campo) | Dorsales | Dorsal ancho |

### Alternating Single Arm Dumbbell Power Snatch

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Arrancada de potencia con mancuerna alternando brazos: desde el suelo o el hang, llevar la man… |
| Notas técnicas | (vacío) | La cadera hace el trabajo, el brazo sólo guía. La mancuerna sube pegada al cuerpo, no en arco.… |

### Alternating Spiderman Stretch

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Glúteos \| S: Isquiotibiales, Core/Abdominales | P: Glúteo mayor \| S: Bíceps femoral, Recto abdominal, Recto femoral |
| Músculo principal (campo) | Glúteos | Glúteo mayor |

### Assault Bike

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Cuádriceps \| S: Isquiotibiales, Glúteos, Deltoides, Pectorales | P: Recto femoral \| S: Bíceps femoral, Glúteo mayor, Deltoides anterior, Pectoral mayor, Dorsal… |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Banded Ankle Dorsiflexion Stretch

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El talón nunca se despega del suelo: ahí termina el rango útil. La banda tracciona el tobillo … |

### Bar Muscle-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Requiere una dominada estricta sólida y fondos en paralelas antes de intentarlo. El kip genera… |
| Músculo principal (campo) | (vacío) | Dorsal ancho |

### Bar Pull Up

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Dominada en barra fija: colgado con agarre prono, traccionar hasta pasar la barbilla por encim… |
| Notas técnicas | (vacío) | El recorrido válido es de codos totalmente extendidos abajo a barbilla sobre la barra arriba. … |

### Barbell Back Squat

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Barra apoyada sobre el trapecio (high bar) o sobre el deltoides posterior (low bar), nunca sob… |
| Dificultad | Básico | Intermedio |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Barbell Bench Press

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Press de banca con barra: acostado en el banco, bajar la barra controlada hasta el pecho y emp… |
| Notas técnicas | (vacío) | Escápulas retraídas y hundidas contra el banco durante toda la serie. Codos a unos 45° del tor… |

### Barbell Bent Over Row

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Remo con barra inclinado: con el torso flexionado hacia adelante y la espalda neutra, traccion… |
| Notas técnicas | (vacío) | Torso entre 45° y casi paralelo al piso, sostenido por la cadera y no por la lumbar. Tirar lle… |

### Barbell Bicep Curl

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Curl de bíceps con barra: de pie con la barra tomada en supinación al ancho de hombros, flexio… |
| Notas técnicas | (vacío) | Codos fijos junto al torso: no se van hacia adelante. Sin balancear el cuerpo ni usar la lumba… |

### Barbell Clean and Jerk

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Dos movimientos separados: la cargada termina de pie y estable antes de iniciar el envión. En … |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Barbell Deadlift

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Barra sobre el mediopié y pegada a la tibia durante todo el ascenso. Hombros apenas por delant… |
| Dificultad | Básico | Intermedio |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Barbell Front Rack Reverse Lunge

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Zancada hacia atrás con la barra en front rack: dar un paso atrás bajando la rodilla trasera h… |
| Notas técnicas | (vacío) | El paso hacia atrás es más amable con la rodilla que la zancada hacia adelante. Codos altos en… |
| Músculos | P: Recto femoral \| S: — | P: Recto femoral \| S: Glúteo mayor, Vasto lateral, Bíceps femoral, Recto abdominal, Erectores … |

### Barbell Front Squat

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Codos bien altos durante todo el recorrido: si el codo cae, la barra rueda y el torso se va ad… |
| Músculos | P: — \| S: Erectores espinales, Vasto medial | P: Recto femoral \| S: Vasto lateral, Vasto medial, Glúteo mayor, Erectores espinales, Recto ab… |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Barbell Good Morning

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |
| Músculos | P: Isquiotibiales \| S: Glúteos, Dorsales, Core/Abdominales | P: Bíceps femoral \| S: Glúteo mayor, Erectores espinales, Recto abdominal |
| Músculo principal (campo) | Isquiotibiales | Bíceps femoral |

### Barbell Hang Clean

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La barra arranca colgada a la altura de la rodilla o del muslo, nunca desde el suelo. Hombros … |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Barbell Hang Clean and Jerk

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La barra arranca colgada, sin tocar el suelo entre repeticiones. Extensión de cadera explosiva… |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Barbell Hang Muscle Clean and Press

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Sin re-flexión de rodillas en ninguna de las dos fases: se sube por fuerza pura, no por veloci… |
| Dificultad | Avanzado | Intermedio |
| Músculos | P: — \| S: Tríceps braquial, Trapecio (superior), Pectoral mayor | P: Deltoides anterior \| S: Trapecio (superior), Tríceps braquial, Pectoral mayor, Glúteo mayor… |
| Músculo principal (campo) | (vacío) | Deltoides anterior |

### Barbell Hang Power Clean

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Cargada de potencia desde el hang: con la barra colgada a la altura del muslo o la rodilla, ex… |
| Notas técnicas | (vacío) | "Power" significa recibir por encima del paralelo: si hay que sentarse en la sentadilla, ya es… |

### Barbell Hang Power Cluster

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Es un hang power clean encadenado sin pausa con un thruster: la barra no se detiene en el rack… |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Barbell Hang Power Snatch

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Arrancada de potencia desde el hang: con agarre ancho y la barra colgada a la altura del muslo… |
| Notas técnicas | (vacío) | Agarre ancho de arrancada, hasta donde la movilidad de hombro lo permita. La barra viaja pegad… |

### Barbell High Hang Power Clean

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Avanzado | Intermedio |

### Barbell Low Hang Power Clean

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Avanzado | Intermedio |

### Barbell Lunge

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Paso largo para que la rodilla delantera no pase la punta del pie. Torso erguido: la barra obl… |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Barbell Muscle Snatch

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Sin re-flexión de rodillas: la barra llega arriba por fuerza de hombro y trapecio, no por velo… |
| Dificultad | Avanzado | Intermedio |

### Barbell Overhead Squat

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Sentadilla completa con la barra sostenida overhead con agarre ancho de arrancada y los codos … |
| Notas técnicas | (vacío) | Hombros activos empujando la barra al techo durante todo el recorrido. La barra va sobre la mi… |
| Dificultad | Intermedio | Avanzado |

### Barbell Power Clean

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Cargada de potencia desde el suelo: tirar la barra con una extensión explosiva de cadera y rec… |
| Notas técnicas | (vacío) | Primer tirón lento y paciente: hombros sobre la barra, cadera y hombros suben juntos. La acele… |
| Dificultad | Experto | Avanzado |

### Barbell Power Snatch

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Arrancada de potencia desde el suelo: con agarre ancho, llevar la barra desde el piso hasta ov… |
| Notas técnicas | (vacío) | La barra describe una trayectoria pegada al cuerpo, nunca en arco hacia afuera. Extensión comp… |
| Dificultad | Experto | Avanzado |

### Barbell Push Jerk

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Envión de potencia: desde el front rack, dip y extensión explosiva de piernas para lanzar la b… |
| Notas técnicas | (vacío) | La diferencia con el push press es la re-flexión: acá se baja activamente bajo la barra en vez… |

### Barbell Push Press

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Press de hombros con impulso de piernas: desde el front rack, hacer un dip corto de rodillas y… |
| Notas técnicas | (vacío) | El dip es corto (10-15 cm) y estrictamente vertical: el torso no se inclina hacia adelante. Lo… |
| Dificultad | Básico | Intermedio |

### Barbell Romanian Deadlift

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Peso muerto rumano: partiendo de pie con la barra en las manos, hacer una bisagra de cadera ll… |
| Notas técnicas | (vacío) | No es un deadlift desde el suelo: el rango termina donde la espalda deja de estar neutra, norm… |
| Dificultad | Básico | Intermedio |
| Músculo principal (campo) | Bíceps femoral | Glúteo mayor |

### Barbell Shrug

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Trapecio \| S: Antebrazos, Deltoides | P: Trapecio (superior) \| S: Flexores antebrazo, Deltoides anterior, Romboides |
| Músculo principal (campo) | Trapecio | Trapecio (superior) |

### Barbell Squat Clean

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Cargada completa: desde el suelo, tirar la barra con extensión explosiva de cadera y recibirla… |
| Notas técnicas | (vacío) | Recibir en el fondo de la sentadilla con los codos altos y el torso vertical. La subida es un … |
| Dificultad | Experto | Avanzado |
| Músculo principal (campo) | Recto femoral | Glúteo mayor |

### Barbell Strict Press

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Sin ayuda de piernas: rodillas bloqueadas de principio a fin. Abdomen y glúteos apretados para… |
| Dificultad | Básico | Intermedio |
| Músculo principal (campo) | (vacío) | Deltoides anterior |

### Barbell Sumo Deadlift High Pull

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Postura sumo amplia con las puntas de los pies hacia afuera. El tirón alto arranca recién cuan… |
| Músculo principal (campo) | (vacío) | Trapecio (superior) |

### Barbell Thruster

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Thruster con barra: sentadilla frontal completa encadenada sin pausa con un push press, llevan… |
| Notas técnicas | (vacío) | Es un movimiento único, no dos: la barra sale hacia arriba con el impulso de la subida de la s… |

### Barbell Upright Row

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Codos siempre por encima de las muñecas y liderando el tirón. No subir más allá de la altura d… |
| Músculo principal (campo) | (vacío) | Trapecio (superior) |

### Bear Crawl Hold

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Core/Abdominales \| S: Deltoides, Cuádriceps | P: Recto abdominal \| S: Deltoides anterior, Recto femoral, Oblicuo externo |
| Músculo principal (campo) | Core/Abdominales | Recto abdominal |

### Bent-Over Dumbbell Lateral Raise

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Deltoides \| S: Trapecio, Dorsales | P: Deltoides posterior \| S: Trapecio (medio), Romboides, Dorsal ancho |
| Músculo principal (campo) | Deltoides | Deltoides posterior |

### Bodyweight Burpee

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Burpee: desde de pie, bajar al suelo hasta que el pecho y los muslos toquen, volver a los pies… |
| Notas técnicas | (vacío) | Pecho y muslos al piso en la parte baja; extensión completa de cadera y salto en la parte alta… |
| Dificultad | Intermedio | Básico |

### Bodyweight Glute Bridge

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Puente de glúteos: acostado boca arriba con las rodillas flexionadas y los pies apoyados, elev… |
| Notas técnicas | (vacío) | La extensión viene del glúteo, no de la lumbar: apretar la cola arriba y evitar arquear la esp… |

### Bodyweight Handstand Push-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Colocar las manos algo más anchas que los hombros y formar un trípode con la cabeza al bajar. … |
| Músculo principal (campo) | (vacío) | Deltoides anterior |

### Bodyweight Hollow Body Hold

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Isométrico de hollow: boca arriba, despegar hombros y piernas del suelo formando una "banana" … |
| Notas técnicas | (vacío) | La lumbar NUNCA se despega del piso. Si se arquea, subir más las piernas o flexionar las rodil… |

### Bodyweight Pistol Squat

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Sentadilla a una pierna: bajar sobre una sola pierna hasta la profundidad completa mientras la… |
| Notas técnicas | (vacío) | Talón de la pierna de apoyo siempre en el piso. Brazos al frente como contrapeso. Progresión: … |

### Bodyweight Push Up

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Flexión de brazos: en plancha alta con las manos bajo los hombros, bajar el cuerpo en bloque h… |
| Notas técnicas | (vacío) | Codos a unos 45° del torso, nunca abiertos en cruz. El cuerpo se mueve como una tabla: la cade… |

### Bodyweight Sit Up

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Abdominal completo: acostado boca arriba con las rodillas flexionadas, elevar el torso hasta q… |
| Notas técnicas | (vacío) | Recorrido completo, no es un crunch: los omóplatos despegan del piso y el torso llega vertical… |

### Bodyweight Squat

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Sentadilla con peso corporal: bajar flexionando cadera y rodillas hasta pasar la paralela mant… |
| Notas técnicas | (vacío) | Rodillas siguiendo la línea de los pies, sin colapsar hacia adentro. Talones siempre apoyados.… |

### Bodyweight Walking Lunge

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Zancada caminando: avanzar dando pasos largos bajando la rodilla trasera hasta rozar el suelo,… |
| Notas técnicas | (vacío) | Paso lo bastante largo para que la rodilla delantera no pase la punta del pie. Torso erguido, … |

### Box Jump

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Aterrizar suave y con las rodillas alineadas, nunca colapsando hacia adentro. Extender la cade… |
| Dificultad | Básico | Intermedio |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Box Jump-Over

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El estándar habitual no exige extensión de cadera arriba del box, sólo pasar al otro lado. Alt… |
| Dificultad | Básico | Intermedio |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Burpee Broad Jump

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Cuádriceps \| S: Glúteos, Pectorales, Core/Abdominales, Pantorrillas | P: Recto femoral \| S: Glúteo mayor, Pectoral mayor, Recto abdominal, Gastrocnemio (gemelos) |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Burpee Over the Bar

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Pecho y muslos al piso en cada repetición. El salto lateral es más rápido y económico que el f… |

### Burpee to Bar

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La repetición termina cuando ambas manos tocan la barra, no antes. Colocarse a una distancia f… |

### Chest-to-Bar Pull-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El contacto es del pecho (clavícula o debajo), no del mentón: exige tirar más atrás, no sólo m… |
| Músculo principal (campo) | (vacío) | Dorsal ancho |

### Core Overhead Hold with Side Bend

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El brazo que sostiene el peso queda bloqueado y perpendicular al piso durante toda la serie. L… |
| Compuesto | Sí | No |

### Couch Stretch

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Cadera en retroversión (cola metida) y glúteo del lado estirado apretado: sin eso, el estirami… |

### Cross Body Mountain Climbers

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La cadera se mantiene baja y estable, sin rebotar hacia arriba. La rodilla cruza hacia el codo… |

### Cuban Press

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### Dead Bug Hold with Dumbbell

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La zona lumbar permanece pegada al piso durante toda la isometría. Los brazos quedan perpendic… |

### Dead Bug with Band Resistance

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Core/Abdominales \| S: Glúteos | P: Recto abdominal \| S: Glúteo mayor, Dorsal ancho |
| Músculo principal (campo) | Core/Abdominales | Recto abdominal |

### Double Dumbbell Overhead Walking Lunge

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Zancada caminando con dos mancuernas sostenidas overhead con los brazos bloqueados, bajando la… |
| Notas técnicas | (vacío) | Hombros activos empujando las mancuernas al techo. El torso se mantiene vertical: cualquier in… |

### Double Under

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El giro sale de las muñecas, no de los brazos: los codos quedan cerca del cuerpo. Salto pequeñ… |
| Compuesto | No | Sí |
| Músculo principal (campo) | (vacío) | Gastrocnemio (gemelos) |

### Dual Dumbbell Snatch with Burpee

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Pecho al piso en el burpee, con las mancuernas como apoyo de las manos. El snatch arranca reci… |

### Dumbbell Bench Press

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Escápulas retraídas contra el banco o el piso. Las mancuernas bajan a la altura del pecho con … |
| Músculo principal (campo) | (vacío) | Pectoral mayor |

### Dumbbell Bicep Curl

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Codos fijos junto al torso. Supinar la muñeca al subir para completar la contracción. Bajada l… |
| Músculo principal (campo) | (vacío) | Bíceps braquial |

### Dumbbell Burpee Snatch

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Avanzado | Intermedio |

### Dumbbell Devil's Press

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Es un burpee seguido de un snatch doble, sin soltar las mancuernas. Al levantarse, la extensió… |
| Músculo principal (campo) | (vacío) | Deltoides anterior |

### Dumbbell Front Rack Lunge

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Mancuernas apoyadas en los hombros, codos altos para que el torso no se vaya adelante. Paso la… |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Dumbbell Front Raise

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Deltoides anterior \| S: Trapecio (superior) | P: Deltoides anterior \| S: Trapecio (superior), Deltoides lateral |

### Dumbbell Hang Clean and Push Jerk

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Avanzado | Intermedio |

### Dumbbell One-Arm Overhead Lunge

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El brazo queda bloqueado y perpendicular al piso durante toda la zancada, con el bíceps junto … |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Dumbbell Overhead Hold

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Codos bloqueados y hombros activos empujando hacia arriba. Costillas hacia abajo y glúteos apr… |

### Dumbbell Split Clean

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La recepción en tijera se define en el aire, no al aterrizar: los dos pies tocan el piso a la … |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Dumbbell Thruster

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Mancuernas apoyadas sobre los hombros con los codos ligeramente adelante. Sentadilla completa … |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Dumbbell Wall Sit

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Espalda completamente pegada a la pared y rodillas en 90°. Las mancuernas cuelgan a los costad… |
| Compuesto | No | Sí |

### Farmer's Carry

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### GHD Back Extension

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Subir hasta alinear el torso con las piernas, sin hiperextender la lumbar. El movimiento es de… |
| Compuesto | No | Sí |
| Músculo principal (campo) | (vacío) | Erectores espinales |

### GHD Sit-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Movimiento de alto riesgo si se abusa: introducirlo con volúmenes muy bajos (5-10 repeticiones… |
| Compuesto | No | Sí |
| Músculo principal (campo) | (vacío) | Recto abdominal |

### Goblet Squat

| Campo | Antes | Después |
|---|---|---|
| Descripción | Sostener una pesa al pecho (goblet) en sentadilla baja | Sentadilla sosteniendo una kettlebell o mancuerna contra el pecho en posición de copa (goblet)… |
| Notas técnicas | Mantener la profundidad de la sentadilla durante todos los press. Torso erguido y core firme. … | El peso al frente actúa como contrapeso y permite bajar más con el torso vertical. Codos por d… |
| Dificultad | Intermedio | Básico |
| Músculos (granular) | P: Cuádriceps \| S: Glúteos, Deltoides, Core/Abdominales | P: Recto femoral \| S: Glúteo mayor, Deltoides anterior, Recto abdominal |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Goblet Squat Hold Press

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La profundidad de la sentadilla se mantiene durante todos los press: la cadera no sube. Torso … |

### Half Kneeling Hip Flexor & Hamstring Dynamic Stretch

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Glúteos \| S: Isquiotibiales, Cuádriceps, Core/Abdominales | P: Glúteo mayor \| S: Bíceps femoral, Recto femoral, Recto abdominal |
| Músculo principal (campo) | Glúteos | Glúteo mayor |

### Hanging Knees to Elbows

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El movimiento nace de la retracción escapular y la compresión del abdomen, no del balanceo. La… |
| Compuesto | No | Sí |
| Músculo principal (campo) | (vacío) | Recto abdominal |

### Hanging Toes to Bar

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Escápulas activas al iniciar cada repetición: sin eso no hay recorrido. En kipping, alternar a… |
| Compuesto | No | Sí |
| Músculo principal (campo) | (vacío) | Recto abdominal |

### High Pull + External Rotation

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### Hip Rotations in Squat

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### Hollow Hold Pass

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La posición hollow no se pierde durante el pase: la lumbar sigue pegada al piso. El peso pasa … |

### Hollow Rock

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El balanceo viene de la tensión del cuerpo entero, no de flexionar la cadera. La posición holl… |
| Músculo principal (campo) | (vacío) | Recto abdominal |

### Inchworm

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Piernas lo más rectas posible al apoyar las manos; flexionar la rodilla sólo lo necesario. Al … |

### Jump Rope

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Saltos bajos y al frente del cuerpo, aterrizando sobre el metatarso. Las muñecas hacen el giro… |

### Jumping Lunge

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Cuádriceps \| S: Glúteos, Isquiotibiales | P: Recto femoral \| S: Glúteo mayor, Bíceps femoral, Gastrocnemio (gemelos) |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Kettlebell Clean and Jerk

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | En el clean, la kettlebell "rueda" alrededor de la mano hasta apoyarse en el antebrazo: no deb… |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Kettlebell Farmer Carry

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Trapecio \| S: Antebrazos, Core/Abdominales, Cuádriceps | P: Trapecio (superior) \| S: Flexores antebrazo, Recto abdominal, Erectores espinales, Recto fe… |
| Músculo principal (campo) | Trapecio | Trapecio (superior) |

### Kettlebell Front Squat

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La kettlebell descansa sobre el antebrazo con el codo pegado a las costillas, no colgando de l… |
| Dificultad | Básico | Intermedio |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Kettlebell Ground-to-Overhead

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Estándar libre: puede resolverse con snatch o con clean + jerk. La cadera genera la potencia e… |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Kettlebell Push-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Las kettlebells deben estar estables antes de empezar: asas alineadas y base firme. El mayor r… |
| Músculo principal (campo) | (vacío) | Pectoral mayor |

### Kettlebell Snatch

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La clave es "atravesar" la mano: rotar la muñeca a tiempo para que la campana se apoye suave e… |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Kettlebell Swing

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Swing ruso de kettlebell: con una bisagra de cadera, balancear la pesa entre las piernas y pro… |
| Notas técnicas | (vacío) | Es una bisagra de cadera, no una sentadilla: la pesa pasa alta entre las piernas, cerca de la … |

### Kettlebell Windmill

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Core/Abdominales \| S: Deltoides, Isquiotibiales, Glúteos | P: Oblicuo externo \| S: Deltoides anterior, Bíceps femoral, Glúteo mayor, Recto abdominal |
| Músculo principal (campo) | Core/Abdominales | Oblicuo externo |

### Lateral Lunge

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La pierna que no trabaja queda completamente extendida con el pie apoyado. La cadera va hacia … |

### Med-Ball Box Step-Over

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Balón firme contra el pecho, sin apoyarlo en el muslo para ayudarse. Pie completamente apoyado… |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Mountain Climbers

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### Nordic Hamstring Curl

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El valor está en la fase excéntrica: bajar lo más lento posible y frenar la caída con los isqu… |
| Músculo principal (campo) | (vacío) | Bíceps femoral |

### Partner Wall Ball Over Bar

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Coordinar el ritmo con el compañero antes de empezar. El lanzamiento sale de la extensión de p… |

### Partner Wall Ball Sit-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El pase se hace en el punto alto del sit-up, con el torso ya vertical. Recorrido completo del … |

### Pigeon Pose

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### Plank Hold

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Cadera alineada con hombros y talones: ni hundida ni levantada. Codos (o manos) directamente b… |

### Plank Shoulder Taps

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Core/Abdominales \| S: Deltoides, Pectorales | P: Recto abdominal \| S: Oblicuo externo, Deltoides anterior, Pectoral mayor |
| Músculo principal (campo) | Core/Abdominales | Recto abdominal |

### Power Clean

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Recto femoral \| S: Glúteo mayor, Trapecio (superior), Deltoides anterior, Recto abdominal | P: Recto femoral \| S: Glúteo mayor, Trapecio (superior), Deltoides anterior, Recto abdominal, … |

### Quadruped Rock Back

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La espalda se mantiene neutra: el rango termina justo antes de que la lumbar se redondee. El m… |

### Quadruped Thoracic Rotation

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Trapecio \| S: Dorsales, Core/Abdominales | P: Trapecio (medio) \| S: Dorsal ancho, Oblicuo externo, Romboides |
| Músculo principal (campo) | Trapecio | Trapecio (medio) |

### Reverse Snow Angels

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Los brazos se mantienen extendidos y apenas despegados del piso durante todo el barrido. El pe… |

### Ring Dip

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Las anillas suman inestabilidad: primero dominar el fondo en paralelas. Bajar hasta que el hom… |
| Dificultad | Intermedio | Avanzado |
| Músculo principal (campo) | (vacío) | Tríceps braquial |

### Ring Handstand Push-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Sólo después de dominar el HSPU estricto en pared. Las anillas exigen estabilizar en tres plan… |
| Músculo principal (campo) | (vacío) | Deltoides anterior |

### Ring Row

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Remo en anillas: colgado de las anillas con el cuerpo en línea recta e inclinado hacia atrás, … |
| Notas técnicas | (vacío) | El cuerpo se mantiene rígido como una tabla: la cadera no se hunde. Cuanto más horizontal el c… |

### Ring Strict Muscle Up

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | Muscle-up estricto en anillas: desde el colgado y sin impulso de piernas, traccionar hasta el … |
| Notas técnicas | (vacío) | Sin kip: todo es fuerza. Requiere dominadas estrictas hasta el esternón y fondos en anillas só… |

### Rope Climb

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La subida es de piernas, no de brazos: aprender bien la pinza (J-hook o wrap) antes de sumar v… |
| Músculo principal (campo) | (vacío) | Dorsal ancho |

### Rowing

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Dorsales \| S: Cuádriceps, Glúteos, Bíceps | P: Dorsal ancho \| S: Recto femoral, Glúteo mayor, Bíceps braquial, Erectores espinales, Trapec… |
| Músculo principal (campo) | Dorsales | Dorsal ancho |

### Running

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Cuádriceps \| S: Isquiotibiales, Glúteos, Pantorrillas | P: Recto femoral \| S: Bíceps femoral, Glúteo mayor, Gastrocnemio (gemelos), Sóleo |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Russian Twist

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### Sally Up Sally Down

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El desafío es el tiempo bajo tensión, no la velocidad: la posición baja se sostiene sin rebota… |

### Sandbag Carry

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Core/Abdominales \| S: Antebrazos, Trapecio, Cuádriceps | P: Recto abdominal \| S: Flexores antebrazo, Trapecio (superior), Recto femoral, Erectores espi… |
| Músculo principal (campo) | Core/Abdominales | Recto abdominal |

### Scapular Wall Slides

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Espalda baja, omóplatos, codos y dorso de las manos en contacto con la pared durante todo el r… |

### Shuttle Run

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La clave es la desaceleración: bajar la cadera y frenar con pasos cortos antes de tocar la lín… |

### Side Plank

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### Single-Arm Dumbbell Push Press

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El dip es corto y vertical, sin inclinar el torso hacia el lado cargado. La mancuerna sube ali… |
| Dificultad | Básico | Intermedio |

### Single-Leg Dumbbell Romanian Deadlift

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Isquiotibiales \| S: Glúteos, Core/Abdominales | P: Bíceps femoral \| S: Glúteo mayor, Erectores espinales, Recto abdominal, Glúteo medio |
| Músculo principal (campo) | Isquiotibiales | Bíceps femoral |

### Single-Leg Toes-to-Bar

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Core/Abdominales \| S: Dorsales, Antebrazos | P: Recto abdominal \| S: Oblicuo externo, Dorsal ancho, Flexores antebrazo |
| Músculo principal (campo) | Core/Abdominales | Recto abdominal |

### Single-Leg V-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La pierna que sube se mantiene recta; la que queda abajo, apoyada y activa. El movimiento nace… |
| Compuesto | No | Sí |

### Single-Leg Wall Sit

| Campo | Antes | Después |
|---|---|---|
| Compuesto | No | Sí |
| Músculos (granular) | P: Cuádriceps \| S: Core/Abdominales, Glúteos | P: Recto femoral \| S: Recto abdominal, Glúteo mayor |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### SkiErg

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Dorsales \| S: Tríceps, Core/Abdominales, Deltoides | P: Dorsal ancho \| S: Tríceps braquial, Recto abdominal, Deltoides anterior, Erectores espinales |
| Músculo principal (campo) | Dorsales | Dorsal ancho |

### Sled Pull

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Isquiotibiales \| S: Glúteos, Trapecio, Antebrazos | P: Bíceps femoral \| S: Glúteo mayor, Trapecio (medio), Dorsal ancho, Flexores antebrazo |
| Músculo principal (campo) | Isquiotibiales | Bíceps femoral |

### Sled Push

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Cuádriceps \| S: Glúteos, Deltoides | P: Recto femoral \| S: Glúteo mayor, Deltoides anterior, Gastrocnemio (gemelos), Recto abdominal |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Sled Push & Pull

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Cuádriceps \| S: Glúteos, Isquiotibiales, Dorsales, Core/Abdominales | P: Recto femoral \| S: Glúteo mayor, Bíceps femoral, Dorsal ancho, Recto abdominal |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Snatch Grip Deadlift

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Bíceps femoral \| S: Glúteo mayor, Recto femoral, Dorsal ancho, Trapecio (superior) | P: Bíceps femoral \| S: Glúteo mayor, Erectores espinales, Recto femoral, Dorsal ancho, Trapeci… |

### Spiderman Stretch Rotation

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La mano de apoyo queda alineada con el pie delantero. La rotación viene de la columna torácica… |

### Standing Cross Crunch

| Campo | Antes | Después |
|---|---|---|
| Compuesto | Sí | No |

### Strict Knees to Elbows

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Avanzado | Intermedio |

### Superband Shoulder Dislocates

| Campo | Antes | Después |
|---|---|---|
| Descripción | (vacío) | De pie con una banda elástica tomada con agarre bien ancho y los brazos extendidos, pasar la b… |
| Notas técnicas | (vacío) | Los codos permanecen completamente extendidos: si se doblan, cerrar menos el agarre. Movimient… |

### V-Up

| Campo | Antes | Después |
|---|---|---|
| Compuesto | No | Sí |

### Walking

| Campo | Antes | Después |
|---|---|---|
| Compuesto | No | Sí |
| Músculos | P: Cuádriceps \| S: Pantorrillas | P: Recto femoral \| S: Gastrocnemio (gemelos), Glúteo mayor, Sóleo |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Wall Ball Shot

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La sentadilla debe pasar la paralela en cada repetición y el balón tocar el target: los dos es… |
| Dificultad | Básico | Intermedio |
| Músculos | P: — \| S: Tríceps braquial, Recto abdominal, Vasto lateral | P: Recto femoral \| S: Glúteo mayor, Deltoides anterior, Tríceps braquial, Recto abdominal, Vas… |
| Músculo principal (campo) | (vacío) | Recto femoral |

### Wall Lat Stretch

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La inclinación es lateral y limpia: el torso no rota. Brazo extendido y hombro relajado, sin e… |

### Wall Shoulder CAR

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | CAR = rotación articular controlada: el movimiento es lento y activo, buscando el rango máximo… |

### Wall Shoulder External Rotation

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El codo no se despega de la pared ni baja de la altura del hombro. La rotación es del hombro, … |

### Wall Shoulder Stretch

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Deltoides \| S: Pectorales | P: Pectoral mayor \| S: Deltoides anterior, Pectoral menor |
| Músculo principal (campo) | Deltoides | Pectoral mayor |

### Wall Sit with Leg Extension

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La cadera no sube al extender la pierna: la posición de 90° se mantiene en la pierna de apoyo.… |
| Compuesto | No | Sí |

### Wall Squat Hold

| Campo | Antes | Después |
|---|---|---|
| Dificultad | Intermedio | Básico |

### Weighted Bird Dog

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | La cadera se mantiene nivelada: nada de rotar al extender. El brazo y la pierna llegan a la lí… |

### Weighted Box Step-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | Pie completamente apoyado en el box y empuje desde el talón. Subir sin impulso de la pierna de… |
| Músculo principal (campo) | (vacío) | Glúteo mayor |

### Weighted Lunge

| Campo | Antes | Después |
|---|---|---|
| Músculos | P: Cuádriceps \| S: Glúteos, Isquiotibiales, Core/Abdominales | P: Recto femoral \| S: Glúteo mayor, Bíceps femoral, Recto abdominal, Vasto lateral |
| Músculo principal (campo) | Cuádriceps | Recto femoral |

### Weighted Sit-Up

| Campo | Antes | Después |
|---|---|---|
| Notas técnicas | (vacío) | El peso se sostiene firme contra el pecho o bloqueado overhead, sin usarlo para generar impuls… |
| Compuesto | No | Sí |
