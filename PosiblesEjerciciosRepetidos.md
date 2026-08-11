# Posibles ejercicios repetidos

Análisis generado a partir del backup `BKP/crossfit-backup-20260810-205051.zip` (export 2026-08-10). Se compararon los nombres de los 263 ejercicios que están usados en al menos una clase, buscando coincidencias exactas (mismo nombre normalizado) y coincidencias por similitud de texto (tokens en común + distancia de edición).

> Esta es una lista de **candidatos**. Antes de fusionar dos ejercicios revisá que realmente sean el mismo movimiento — variantes con nombre parecido (ej. "Barbell Power Clean" vs "Barbell Hang Power Clean") pueden ser ejercicios legítimamente distintos.

Para fusionar dos ejercicios: **Configuración → Gestión de datos → Migrar / fusionar ejercicios**. Reasigna automáticamente las clases, sesiones y récords del ejercicio origen al destino, y elimina el origen.

## 1. Duplicado exacto (mismo nombre normalizado)

| Ejercicio | Clases donde aparece |
|---|---|
| Hanging Toes to Bar | GOAT 02/04/2026, GOAT 13/04/2026, GOAT 15/07/2026, GOAT 20/07/2026, WOD 03 Mar 2026, WOD 11 Mar 2026, WOD 18 Mar 2026 — C&J Ladder, WOD 19 Feb 2026 — Legs & Lungs, WOD 20 Mar 2026 — Luke, WOD 24 Feb 2026 — Cold Fusion |
| Hanging Toes-to-Bar | GOAT 25/05/2026 |
| | |

## 2. Candidatos con alta probabilidad de ser el mismo ejercicio

Selección manual sobre el listado de similitud (sección 3), filtrando las variantes de técnica que son ejercicios legítimamente distintos.

| Ejercicio A | Ejercicio B | Motivo |
|---|---|---|
| Bodyweight Push Up | Push-up | Mismo ejercicio, nombre genérico vs. con calificador |
| Hollow Rock | Hollow Body Rock | Mismo movimiento, nombre abreviado vs. completo |
| Scapular Push-Up | Scapular Push-ups dinámicos | Mismo ejercicio; el segundo nombre está en español |
| Side Plank | Side Plank con carga | Variante con peso del mismo ejercicio; nombre en español |

**Nota de idioma:** "Side Plank con carga" y "Scapular Push-ups dinámicos" son las únicas dos entradas con texto en español — el resto de los nombres de ejercicio está en inglés. Conviene unificar el idioma al fusionar o renombrar.

## 3. Candidatos a revisar manualmente (familias de variantes con nombre parecido)

Estos grupos comparten prefijo/palabras pero suelen ser variantes técnicas distintas (distinta altura de "hang", con/sin barra, etc.). Fusionarlos o no depende del criterio del catálogo:

- **Clean/Snatch con barra:** Barbell Power Clean, Barbell Hang Power Clean, Barbell High Hang Power Clean, Barbell Low Hang Power Clean, Barbell Hang Clean, Barbell Squat Clean, Barbell Power Snatch, Barbell Hang Power Snatch, Barbell Muscle Snatch
- **Sled:** Sled Push & Pull, Sled Push, Sled Pull
- **Wall Sit:** Wall Sit, Dumbbell Wall Sit, Single-Leg Wall Sit, Wall Sit with Leg Extension
- **Box Jump:** Box Jump, Box Jump-Over *(son ejercicios distintos, pero se confunden fácil)*
- **Stretches "Standing":** Standing Quad Stretch, Standing Hamstring Stretch, Standing Biceps Stretch *(distinto músculo cada uno — no son duplicados)*
- **Good Morning:** Kettlebell Good Morning, Kettlebell Good Morning to Squat, Barbell Good Morning

## 4. Listado completo de candidatos por similitud (para referencia)

Columnas *jaccard* (tokens en común) y *ratio* (similitud de texto), ambas de 0 a 1 — más alto = más parecido.

| Ejercicio A | Clases A | Ejercicio B | Clases B | jaccard | ratio |
|---|---|---|---|---|---|
| Barbell Hang Power Clean | CrossFit Hero: DT, GOAT 13/07/2026 | Barbell Low Hang Power Clean | GOAT 13/07/2026 | 0.80 | 0.86 |
| Barbell Hang Power Clean | CrossFit Hero: DT, GOAT 13/07/2026 | Barbell High Hang Power Clean | GOAT 13/07/2026 | 0.80 | 0.83 |
| Barbell Clean and Jerk | CrossFit Girl: Grace, GOAT 20/07/2026, WOD 20 Mar 2026 — Luke | Barbell Hang Clean and Jerk | WOD 18 Mar 2026 — C&J Ladder | 0.80 | 0.81 |
| Barbell Power Snatch | Clase GOAT 22/04/2026, CrossFit Girl: Amanda, CrossFit Girl: Isabel, GOAT 22/04/2026 | Barbell Hang Power Snatch | GOAT 30/07/2026, WOD 11 Mar 2026, WOD 12 Feb 2026, WOD 18 Feb 2026 — Row & Snatch | 0.75 | 0.80 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Barbell Hang Power Clean | CrossFit Hero: DT, GOAT 13/07/2026 | 0.75 | 0.79 |
| Barbell High Hang Power Clean | GOAT 13/07/2026 | Barbell Low Hang Power Clean | GOAT 13/07/2026 | 0.67 | 0.86 |
| Barbell Hang Power Clean | CrossFit Hero: DT, GOAT 13/07/2026 | Barbell Hang Clean | WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge | 0.75 | 0.75 |
| Barbell Sumo Deadlift High Pull | CrossFit Hero: Tyler, GOAT 10/08/2026 | Kettlebell Sumo Deadlift High Pull | GOAT 28/03/2026 | 0.67 | 0.82 |
| Barbell Hang Power Clean | CrossFit Hero: DT, GOAT 13/07/2026 | Barbell Hang Power Cluster | WOD 10 Mar 2026 — Voltage Shift | 0.60 | 0.81 |
| Bodyweight Push Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Hero: JT, CrossFit Hero: McGhee, CrossFit Hero: Murph, WOD 04 Mar 2026 B — Dark Pulse, WOD 12 Mar 2026 — Siege Protocol, WOD 16 Mar 2026 — Open 26.3 | Bodyweight Handstand Push-Up | CrossFit Girl: Diane, CrossFit Girl: Mary, CrossFit Hero: JT, CrossFit Hero: Nate, WOD 17 Feb 2026 — Shoulder Crusher, WOD 20 Feb 2026 — The Seven, WOD 27 Feb 2026 — Holleyman | 0.75 | 0.64 |
| Barbell Hang Power Snatch | GOAT 30/07/2026, WOD 11 Mar 2026, WOD 12 Feb 2026, WOD 18 Feb 2026 — Row & Snatch | Barbell Hang Power Cluster | WOD 10 Mar 2026 — Voltage Shift | 0.60 | 0.77 |
| Bodyweight Squat | CrossFit Girl: Amanda, CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Girl: Grace, CrossFit Girl: Isabel, CrossFit Girl: Karen, CrossFit Girl: Mary, CrossFit Hero: Garrett, CrossFit Hero: Jason, CrossFit Hero: Murph, CrossFit Open 26.1, CrossFit Open 26.3 | Bodyweight Pistol Squat | CrossFit Girl: Mary | 0.67 | 0.70 |
| Barbell Clean and Jerk | CrossFit Girl: Grace, GOAT 20/07/2026, WOD 20 Mar 2026 — Luke | Kettlebell Clean and Jerk | WOD 04 Mar 2026 A — Ground Assault | 0.60 | 0.76 |
| Barbell Hang Power Clean | CrossFit Hero: DT, GOAT 13/07/2026 | Barbell Hang Power Snatch | GOAT 30/07/2026, WOD 11 Mar 2026, WOD 12 Feb 2026, WOD 18 Feb 2026 — Row & Snatch | 0.60 | 0.76 |
| Hollow Rock | GOAT 20/04/2026, WOD 04 Mar 2026 B — Dark Pulse | Hollow Body Rock | GOAT 30/03/2026 | 0.67 | 0.69 |
| Hollow Hold Pass | GOAT 20/04/2026 | Hollow Hold | GOAT 13/07/2026, Isometrico-1 | 0.67 | 0.69 |
| Hanging Knees to Elbows | CrossFit Hero: Stephen, GOAT 15/04/2026, WOD 20 Feb 2026 — The Seven | Strict Knees to Elbows | GOAT 15/07/2026, GOAT 25/07/2026 | 0.60 | 0.74 |
| Kettlebell Good Morning to Squat | GOAT 01/06/2026, GOAT 01/08/2026, GOAT 20/07/2026, GOAT 25/05/2026, GOAT 25/07/2026, GOAT 27/07/2026 | Kettlebell Good Morning | GOAT 13/06/2026, GOAT 30/07/2026 | 0.60 | 0.72 |
| Sled Push & Pull | GOAT 13/06/2026, GOAT 23/05/2026, GOAT 25/07/2026, GOAT 30/05/2026 | Sled Pull | GOAT 01/08/2026 | 0.67 | 0.64 |
| Sled Push & Pull | GOAT 13/06/2026, GOAT 23/05/2026, GOAT 25/07/2026, GOAT 30/05/2026 | Sled Push | GOAT 01/08/2026 | 0.67 | 0.64 |
| Kettlebell Swing | CrossFit Girl: Eva, CrossFit Girl: Helen, CrossFit Hero: Hansen, CrossFit Hero: Nate, GOAT 13/07/2026, GOAT 15/07/2026, WOD 06 Mar 2026 — Whitten, WOD 13 Mar 2026 — Mogadishu Mile, WOD 17 Mar 2026, WOD 20 Feb 2026 — The Seven, WOD 20 Mar 2026 — Luke, WOD 26 Feb 2026 | American Kettlebell Swing | GOAT 13/04/2026 | 0.67 | 0.64 |
| Barbell Deadlift | CrossFit Girl: Diane, CrossFit Girl: Linda, CrossFit Hero: DT, CrossFit Hero: McGhee, CrossFit Hero: Mr. Joshua, CrossFit Hero: Stephen, GOAT 02/04/2026, GOAT 13/07/2026, GOAT 30/07/2026, WOD 17 Feb 2026 — Shoulder Crusher, WOD 20 Feb 2026 — The Seven | Barbell Romanian Deadlift | WOD 26 Feb 2026 | 0.67 | 0.64 |
| Barbell Overhead Squat | CrossFit Girl: Nancy, CrossFit Hero: Josh, GOAT 25/04/2026 | Overhead Squat | GOAT 30/03/2026 | 0.67 | 0.64 |
| Barbell Bench Press | CrossFit Girl: Linda, CrossFit Girl: Lynne | Dumbbell Bench Press | GOAT 28/03/2026, WOD 18 Feb 2026 — Row & Snatch | 0.50 | 0.80 |
| Weighted Box Step-Up | WOD 17 Mar 2026 | Box Step-Up | GOAT 25/05/2026, GOAT 27/07/2026 | 0.75 | 0.55 |
| Dumbbell Bench Press | GOAT 28/03/2026, WOD 18 Feb 2026 — Row & Snatch | Dumbbell Push Press | GOAT 01/04/2026, GOAT 27/07/2026 | 0.50 | 0.80 |
| Towel Isometric Row | Isometrico-3 | Towel Isometric Curl | Isometrico-3 | 0.50 | 0.80 |
| Barbell Hang Clean and Jerk | WOD 18 Mar 2026 — C&J Ladder | Dumbbell Hang Clean and Push Jerk | GOAT 22/07/2026 | 0.57 | 0.73 |
| Barbell Bench Press | CrossFit Girl: Linda, CrossFit Girl: Lynne | Barbell Push Press | Clase GOAT 22/04/2026, CrossFit Hero: Danny, GOAT 22/04/2026, WOD 19 Feb 2026 — Legs & Lungs | 0.50 | 0.79 |
| Barbell Push Press | Clase GOAT 22/04/2026, CrossFit Hero: Danny, GOAT 22/04/2026, WOD 19 Feb 2026 — Legs & Lungs | Dumbbell Push Press | GOAT 01/04/2026, GOAT 27/07/2026 | 0.50 | 0.79 |
| Dumbbell Bicep Curl | WOD 16 Feb 2026 — Fran's Revenge | Barbell Bicep Curl | GOAT 15/04/2026, GOAT 23/05/2026 | 0.50 | 0.79 |
| Box Jump-Over | Clase GOAT 22/04/2026, CrossFit Open 26.1, GOAT 01/06/2026, GOAT 16/05/2026, GOAT 22/04/2026, WOD 10 Feb 2026, WOD 24 Feb 2026 — Cold Fusion | Box Jump | CrossFit Girl: Kelly, CrossFit Hero: Danny, CrossFit Hero: McGhee, GOAT 10/08/2026, GOAT 25/05/2026, WOD 06 Mar 2026 — Whitten, WOD 11 Mar 2026, WOD 17 Mar 2026 | 0.67 | 0.62 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Barbell Low Hang Power Clean | GOAT 13/07/2026 | 0.60 | 0.68 |
| Bodyweight Handstand Push-Up | CrossFit Girl: Diane, CrossFit Girl: Mary, CrossFit Hero: JT, CrossFit Hero: Nate, WOD 17 Feb 2026 — Shoulder Crusher, WOD 20 Feb 2026 — The Seven, WOD 27 Feb 2026 — Holleyman | Ring Handstand Push-Up | CrossFit Hero: Garrett | 0.60 | 0.68 |
| Bodyweight Push Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Hero: JT, CrossFit Hero: McGhee, CrossFit Hero: Murph, WOD 04 Mar 2026 B — Dark Pulse, WOD 12 Mar 2026 — Siege Protocol, WOD 16 Mar 2026 — Open 26.3 | Bodyweight Sit Up | CrossFit Girl: Angie, CrossFit Girl: Annie, CrossFit Girl: Bárbara, CrossFit Hero: Michael, CrossFit Hero: Mr. Joshua, WOD 03 Mar 2026, WOD 11 Mar 2026, WOD 17 Mar 2026 | 0.50 | 0.78 |
| Barbell Push Jerk | CrossFit Hero: DT, WOD 19 Feb 2026 — Legs & Lungs | Barbell Push Press | Clase GOAT 22/04/2026, CrossFit Hero: Danny, GOAT 22/04/2026, WOD 19 Feb 2026 — Legs & Lungs | 0.50 | 0.78 |
| Barbell Hang Clean and Jerk | WOD 18 Mar 2026 — C&J Ladder | Barbell Hang Clean | WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge | 0.60 | 0.67 |
| Barbell Hang Clean and Jerk | WOD 18 Mar 2026 — C&J Ladder | Barbell Hang Muscle Clean and Press | WOD 12 Mar 2026 — Siege Protocol | 0.57 | 0.69 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Barbell High Hang Power Clean | GOAT 13/07/2026 | 0.60 | 0.66 |
| Med-Ball Box Step-Over | CrossFit Open 26.1 | Kettlebell Box Step-Over | GOAT 13/04/2026 | 0.50 | 0.75 |
| Barbell Bench Press | CrossFit Girl: Linda, CrossFit Girl: Lynne | Barbell Strict Press | WOD 25 Feb 2026 — Supernova | 0.50 | 0.75 |
| Yoga Push-Up | GOAT 02/04/2026, GOAT 08/06/2026, GOAT 15/07/2026, GOAT 20/07/2026 | Push-up | GOAT 13/06/2026 | 0.67 | 0.58 |
| Banded Ankle Dorsiflexion Stretch | GOAT 20/04/2026 | Half-Kneeling Ankle Dorsiflexion Stretch | GOAT 01/06/2026 | 0.50 | 0.75 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Power Clean | GOAT 25/05/2026, GOAT 30/07/2026 | 0.67 | 0.58 |
| Hollow Hold | GOAT 13/07/2026, Isometrico-1 | Dynamic Hollow Hold | GOAT 13/07/2026, GOAT 20/07/2026 | 0.67 | 0.58 |
| Barbell Hang Clean | WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge | Barbell Low Hang Power Clean | GOAT 13/07/2026 | 0.60 | 0.64 |
| Squat Thoracic Rotation | GOAT 28/05/2026, GOAT 30/07/2026 | Quadruped Thoracic Rotation | GOAT 01/08/2026 | 0.50 | 0.74 |
| Barbell Good Morning | GOAT 15/04/2026, GOAT 30/05/2026 | Kettlebell Good Morning | GOAT 13/06/2026, GOAT 30/07/2026 | 0.50 | 0.74 |
| Standing Biceps Stretch | Clase GOAT 22/04/2026, GOAT 01/06/2026, GOAT 06/05/2026, GOAT 13/04/2026, GOAT 15/04/2026, GOAT 16/05/2026, GOAT 20/04/2026, GOAT 22/04/2026, GOAT 23/05/2026, GOAT 25/04/2026, GOAT 25/05/2026, GOAT 28/05/2026 | Standing Quad Stretch | Isometrico-2, Isometrico-4 | 0.50 | 0.74 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Barbell Squat Clean | CrossFit Hero: Badger, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 18 Mar 2026 — C&J Ladder | 0.50 | 0.74 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Barbell Hang Clean | WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge | 0.50 | 0.74 |
| Barbell Squat Clean | CrossFit Hero: Badger, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 18 Mar 2026 — C&J Ladder | Barbell Hang Clean | WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge | 0.50 | 0.74 |
| Barbell Back Squat | GOAT 10/08/2026, GOAT 20/07/2026, GOAT 27/07/2026, WOD 09 Mar 2026 — Open 26.2, WOD 12 Feb 2026, WOD 17 Feb 2026 — Shoulder Crusher, WOD 19 Mar 2026 — Gravity Shift | Barbell Front Squat | GOAT 01/08/2026, GOAT 06/05/2026, GOAT 20/04/2026, GOAT 25/05/2026, GOAT 25/07/2026, WOD 04 Mar 2026 A — Ground Assault, WOD 10 Feb 2026, WOD 24 Feb 2026 — Cold Fusion | 0.50 | 0.74 |
| Dumbbell Push Press | GOAT 01/04/2026, GOAT 27/07/2026 | Single-Arm Dumbbell Push Press | Clase GOAT 22/04/2026, GOAT 22/04/2026 | 0.60 | 0.63 |
| Kettlebell Front Squat | GOAT 08/06/2026, WOD 13 Mar 2026 — Mogadishu Mile | Barbell Front Squat | GOAT 01/08/2026, GOAT 06/05/2026, GOAT 20/04/2026, GOAT 25/05/2026, GOAT 25/07/2026, WOD 04 Mar 2026 A — Ground Assault, WOD 10 Feb 2026, WOD 24 Feb 2026 — Cold Fusion | 0.50 | 0.73 |
| Dumbbell Devil's Press | WOD 04 Mar 2026 B — Dark Pulse, WOD 10 Mar 2026 — Voltage Shift | Dumbbell Bench Press | GOAT 28/03/2026, WOD 18 Feb 2026 — Row & Snatch | 0.50 | 0.73 |
| Barbell Back Squat | GOAT 10/08/2026, GOAT 20/07/2026, GOAT 27/07/2026, WOD 09 Mar 2026 — Open 26.2, WOD 12 Feb 2026, WOD 17 Feb 2026 — Shoulder Crusher, WOD 19 Mar 2026 — Gravity Shift | Back Squat | GOAT 13/04/2026, GOAT 30/03/2026 | 0.67 | 0.56 |
| Barbell Hang Clean | WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge | Barbell High Hang Power Clean | GOAT 13/07/2026 | 0.60 | 0.62 |
| Hollow Rock | GOAT 20/04/2026, WOD 04 Mar 2026 B — Dark Pulse | Weighted Hollow Rock | GOAT 13/04/2026 | 0.67 | 0.55 |
| Wall Ball Shot | CrossFit Girl: Karen, CrossFit Girl: Kelly, CrossFit Open 26.1, GOAT 01/08/2026, GOAT 02/04/2026, GOAT 08/06/2026, GOAT 25/04/2026, GOAT 30/07/2026, WOD 12 Mar 2026 — Siege Protocol, WOD 18 Feb 2026 — Row & Snatch, WOD 20 Mar 2026 — Luke, WOD 27 Feb 2026 — Holleyman | Wall Ball Run | GOAT 22/07/2026 | 0.50 | 0.71 |
| Barbell Power Snatch | Clase GOAT 22/04/2026, CrossFit Girl: Amanda, CrossFit Girl: Isabel, GOAT 22/04/2026 | Barbell Muscle Snatch | GOAT 01/04/2026, GOAT 08/06/2026, WOD 11 Mar 2026 | 0.50 | 0.71 |
| Seated Quad Stretch | Clase GOAT 22/04/2026, GOAT 01/06/2026, GOAT 06/05/2026, GOAT 13/04/2026, GOAT 15/04/2026, GOAT 16/05/2026, GOAT 20/04/2026, GOAT 22/04/2026, GOAT 23/05/2026, GOAT 25/04/2026, GOAT 25/05/2026, GOAT 28/05/2026 | Standing Quad Stretch | Isometrico-2, Isometrico-4 | 0.50 | 0.71 |
| Wall Shoulder CAR | GOAT 25/04/2026 | Wall Shoulder Stretch | GOAT 25/07/2026, GOAT 30/07/2026 | 0.50 | 0.71 |
| Kettlebell Jumping Lunge | GOAT 13/06/2026 | Jumping Lunge | GOAT 27/07/2026 | 0.67 | 0.54 |
| Push-up | GOAT 13/06/2026 | Tempo Push-Up | Isometrico-3 | 0.67 | 0.54 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Barbell Power Snatch | Clase GOAT 22/04/2026, CrossFit Girl: Amanda, CrossFit Girl: Isabel, GOAT 22/04/2026 | 0.50 | 0.70 |
| Barbell Push Press | Clase GOAT 22/04/2026, CrossFit Hero: Danny, GOAT 22/04/2026, WOD 19 Feb 2026 — Legs & Lungs | Barbell Strict Press | WOD 25 Feb 2026 — Supernova | 0.50 | 0.70 |
| Plank Hold | Clase GOAT 22/04/2026, GOAT 22/04/2026, Isometrico-1 | Scapular Plank Hold | Isometrico-3 | 0.67 | 0.53 |
| Bar Pull Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Girl: Fran, CrossFit Girl: Helen, CrossFit Girl: Jackie, CrossFit Girl: Lynne, CrossFit Girl: Mary, CrossFit Girl: Nicole, CrossFit Hero: Badger, CrossFit Hero: Daniel, CrossFit Hero: Danny, CrossFit Hero: Erin, CrossFit Hero: Garrett, CrossFit Hero: Josh, CrossFit Hero: Joshie, CrossFit Hero: Murph, CrossFit Open 26.2, GOAT 08/06/2026, GOAT 25/04/2026, WOD 09 Mar 2026 — Open 26.2, WOD 12 Mar 2026 — Siege Protocol, WOD 20 Feb 2026 — The Seven | Bar Muscle-Up | WOD 19 Mar 2026 — Gravity Shift | 0.50 | 0.69 |
| Barbell Overhead Squat | CrossFit Girl: Nancy, CrossFit Hero: Josh, GOAT 25/04/2026 | Barbell Front Squat | GOAT 01/08/2026, GOAT 06/05/2026, GOAT 20/04/2026, GOAT 25/05/2026, GOAT 25/07/2026, WOD 04 Mar 2026 A — Ground Assault, WOD 10 Feb 2026, WOD 24 Feb 2026 — Cold Fusion | 0.50 | 0.68 |
| Hanging Toes to Bar | GOAT 02/04/2026, GOAT 13/04/2026, GOAT 15/07/2026, GOAT 20/07/2026, WOD 03 Mar 2026, WOD 11 Mar 2026, WOD 18 Mar 2026 — C&J Ladder, WOD 19 Feb 2026 — Legs & Lungs, WOD 20 Mar 2026 — Luke, WOD 24 Feb 2026 — Cold Fusion | Single-Leg Toes-to-Bar | GOAT 27/07/2026 | 0.50 | 0.68 |
| Dumbbell Devil's Press | WOD 04 Mar 2026 B — Dark Pulse, WOD 10 Mar 2026 — Voltage Shift | Dumbbell Push Press | GOAT 01/04/2026, GOAT 27/07/2026 | 0.50 | 0.68 |
| Hanging Toes-to-Bar | GOAT 25/05/2026 | Single-Leg Toes-to-Bar | GOAT 27/07/2026 | 0.50 | 0.68 |
| Barbell Hang Power Cluster | WOD 10 Mar 2026 — Voltage Shift | Barbell Low Hang Power Clean | GOAT 13/07/2026 | 0.50 | 0.68 |
| GHD Sit-Up | CrossFit Hero: Hansen, CrossFit Hero: Stephen, WOD 16 Feb 2026 — Fran's Revenge | Weighted Sit-Up | GOAT 06/05/2026 | 0.50 | 0.67 |
| Wall Lat Stretch | GOAT 13/06/2026, GOAT 25/04/2026, GOAT 28/05/2026 | Wall Shoulder Stretch | GOAT 25/07/2026, GOAT 30/07/2026 | 0.50 | 0.67 |
| Partner Wall Ball Sit-Up | GOAT 15/04/2026, GOAT 22/07/2026 | Partner Wall Ball Over Bar | GOAT 06/05/2026, GOAT 22/07/2026 | 0.43 | 0.73 |
| Barbell Hang Power Cluster | WOD 10 Mar 2026 — Voltage Shift | Barbell High Hang Power Clean | GOAT 13/07/2026 | 0.50 | 0.66 |
| Standing Biceps Stretch | Clase GOAT 22/04/2026, GOAT 01/06/2026, GOAT 06/05/2026, GOAT 13/04/2026, GOAT 15/04/2026, GOAT 16/05/2026, GOAT 20/04/2026, GOAT 22/04/2026, GOAT 23/05/2026, GOAT 25/04/2026, GOAT 25/05/2026, GOAT 28/05/2026 | Standing Hamstring Stretch | Isometrico-2, Isometrico-4 | 0.50 | 0.65 |
| Standing Quad Stretch | Isometrico-2, Isometrico-4 | Standing Hamstring Stretch | Isometrico-2, Isometrico-4 | 0.50 | 0.65 |
| Bar Pull Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Girl: Fran, CrossFit Girl: Helen, CrossFit Girl: Jackie, CrossFit Girl: Lynne, CrossFit Girl: Mary, CrossFit Girl: Nicole, CrossFit Hero: Badger, CrossFit Hero: Daniel, CrossFit Hero: Danny, CrossFit Hero: Erin, CrossFit Hero: Garrett, CrossFit Hero: Josh, CrossFit Hero: Joshie, CrossFit Hero: Murph, CrossFit Open 26.2, GOAT 08/06/2026, GOAT 25/04/2026, WOD 09 Mar 2026 — Open 26.2, WOD 12 Mar 2026 — Siege Protocol, WOD 20 Feb 2026 — The Seven | Chest-to-Bar Pull-Up | CrossFit Open 26.2, WOD 09 Mar 2026 — Open 26.2, WOD 10 Feb 2026, WOD 12 Mar 2026 — Siege Protocol, WOD 16 Feb 2026 — Fran's Revenge, WOD 25 Feb 2026 — Supernova | 0.60 | 0.55 |
| Bodyweight Sit Up | CrossFit Girl: Angie, CrossFit Girl: Annie, CrossFit Girl: Bárbara, CrossFit Hero: Michael, CrossFit Hero: Mr. Joshua, WOD 03 Mar 2026, WOD 11 Mar 2026, WOD 17 Mar 2026 | Weighted Sit-Up | GOAT 06/05/2026 | 0.50 | 0.65 |
| Barbell Hang Power Snatch | GOAT 30/07/2026, WOD 11 Mar 2026, WOD 12 Feb 2026, WOD 18 Feb 2026 — Row & Snatch | Barbell Low Hang Power Clean | GOAT 13/07/2026 | 0.50 | 0.64 |
| Dumbbell Wall Sit | GOAT 15/04/2026 | Wall Sit | GOAT 15/07/2026, Isometrico-2 | 0.67 | 0.47 |
| Barbell Overhead Squat | CrossFit Girl: Nancy, CrossFit Hero: Josh, GOAT 25/04/2026 | Barbell Back Squat | GOAT 10/08/2026, GOAT 20/07/2026, GOAT 27/07/2026, WOD 09 Mar 2026 — Open 26.2, WOD 12 Feb 2026, WOD 17 Feb 2026 — Shoulder Crusher, WOD 19 Mar 2026 — Gravity Shift | 0.50 | 0.64 |
| Half Kneeling Hip Flexor Stretch | Clase GOAT 22/04/2026, GOAT 01/06/2026, GOAT 06/05/2026, GOAT 13/04/2026, GOAT 15/04/2026, GOAT 16/05/2026, GOAT 20/04/2026, GOAT 22/04/2026, GOAT 23/05/2026, GOAT 25/04/2026, GOAT 25/05/2026, GOAT 28/05/2026 | Half-Kneeling Ankle Dorsiflexion Stretch | GOAT 01/06/2026 | 0.43 | 0.70 |
| Dumbbell Front Rack Lunge | WOD 04 Mar 2026 B — Dark Pulse, WOD 19 Feb 2026 — Legs & Lungs | Barbell Front Rack Reverse Lunge | GOAT 27/07/2026, GOAT 28/05/2026 | 0.50 | 0.63 |
| Supine Abdominal Stretch | Clase GOAT 22/04/2026, GOAT 01/06/2026, GOAT 06/05/2026, GOAT 13/04/2026, GOAT 15/04/2026, GOAT 16/05/2026, GOAT 20/04/2026, GOAT 22/04/2026, GOAT 23/05/2026, GOAT 25/04/2026, GOAT 25/05/2026, GOAT 28/05/2026 | Supine Figure-4 Stretch | Isometrico-1, Isometrico-2, Isometrico-4 | 0.50 | 0.63 |
| Barbell Hang Power Snatch | GOAT 30/07/2026, WOD 11 Mar 2026, WOD 12 Feb 2026, WOD 18 Feb 2026 — Row & Snatch | Barbell High Hang Power Clean | GOAT 13/07/2026 | 0.50 | 0.62 |
| Dumbbell Front Rack Lunge | WOD 04 Mar 2026 B — Dark Pulse, WOD 19 Feb 2026 — Legs & Lungs | Dumbbell Front Raise | GOAT 28/03/2026 | 0.40 | 0.72 |
| Yoga Push-Up | GOAT 02/04/2026, GOAT 08/06/2026, GOAT 15/07/2026, GOAT 20/07/2026 | Tempo Push-Up | Isometrico-3 | 0.50 | 0.62 |
| Mountain Climbers | Abdominales intenso- 1, GOAT 06/05/2026, Isometrico-4 | Cross Body Mountain Climbers | GOAT 06/05/2026 | 0.50 | 0.61 |
| Scapular Push-Up | GOAT 01/04/2026, GOAT 01/06/2026, GOAT 13/04/2026, GOAT 15/07/2026, GOAT 22/07/2026, GOAT 23/05/2026 | Push-up | GOAT 13/06/2026 | 0.67 | 0.44 |
| Farmer's Carry | Clase GOAT 22/04/2026, GOAT 22/04/2026, GOAT 28/03/2026 | Kettlebell Farmer Carry | GOAT 01/08/2026, GOAT 16/05/2026, GOAT 23/05/2026, GOAT 25/07/2026, GOAT 30/05/2026 | 0.67 | 0.43 |
| Bird Dog Crunch | GOAT 01/06/2026, GOAT 20/07/2026 | Bird Dog Hold | Isometrico-1 | 0.50 | 0.60 |
| Barbell Hang Clean and Jerk | WOD 18 Mar 2026 — C&J Ladder | Kettlebell Clean and Jerk | WOD 04 Mar 2026 A — Ground Assault | 0.50 | 0.59 |
| Med-Ball Box Step-Over | CrossFit Open 26.1 | Wall Ball Box Over | GOAT 28/05/2026 | 0.50 | 0.59 |
| Barbell Squat Clean | CrossFit Hero: Badger, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 18 Mar 2026 — C&J Ladder | Barbell Front Squat | GOAT 01/08/2026, GOAT 06/05/2026, GOAT 20/04/2026, GOAT 25/05/2026, GOAT 25/07/2026, WOD 04 Mar 2026 A — Ground Assault, WOD 10 Feb 2026, WOD 24 Feb 2026 — Cold Fusion | 0.50 | 0.58 |
| Band External Rotation | GOAT 01/04/2026, GOAT 22/07/2026 | High Pull + External Rotation | GOAT 01/04/2026 | 0.40 | 0.67 |
| Scapular Push-Up | GOAT 01/04/2026, GOAT 01/06/2026, GOAT 13/04/2026, GOAT 15/07/2026, GOAT 22/07/2026, GOAT 23/05/2026 | Yoga Push-Up | GOAT 02/04/2026, GOAT 08/06/2026, GOAT 15/07/2026, GOAT 20/07/2026 | 0.50 | 0.56 |
| Scapular Push-Up | GOAT 01/04/2026, GOAT 01/06/2026, GOAT 13/04/2026, GOAT 15/07/2026, GOAT 22/07/2026, GOAT 23/05/2026 | Tempo Push-Up | Isometrico-3 | 0.50 | 0.56 |
| Bodyweight Push Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Hero: JT, CrossFit Hero: McGhee, CrossFit Hero: Murph, WOD 04 Mar 2026 B — Dark Pulse, WOD 12 Mar 2026 — Siege Protocol, WOD 16 Mar 2026 — Open 26.3 | Yoga Push-Up | GOAT 02/04/2026, GOAT 08/06/2026, GOAT 15/07/2026, GOAT 20/07/2026 | 0.50 | 0.56 |
| Barbell Hang Power Clean | CrossFit Hero: DT, GOAT 13/07/2026 | Barbell Hang Clean and Jerk | WOD 18 Mar 2026 — C&J Ladder | 0.50 | 0.56 |
| Kettlebell Push-Up | WOD 13 Mar 2026 — Mogadishu Mile | Tempo Push-Up | Isometrico-3 | 0.50 | 0.56 |
| Bodyweight Push Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Hero: JT, CrossFit Hero: McGhee, CrossFit Hero: Murph, WOD 04 Mar 2026 B — Dark Pulse, WOD 12 Mar 2026 — Siege Protocol, WOD 16 Mar 2026 — Open 26.3 | Push-up | GOAT 13/06/2026 | 0.67 | 0.39 |
| Kettlebell Push-Up | WOD 13 Mar 2026 — Mogadishu Mile | Push-up | GOAT 13/06/2026 | 0.67 | 0.39 |
| Weighted Box Step-Up | WOD 17 Mar 2026 | Weighted Sit-Up | GOAT 06/05/2026 | 0.40 | 0.65 |
| Band External Rotation | GOAT 01/04/2026, GOAT 22/07/2026 | Wall Shoulder External Rotation | Clase GOAT 22/04/2026, GOAT 22/04/2026 | 0.40 | 0.65 |
| Barbell Muscle Snatch | GOAT 01/04/2026, GOAT 08/06/2026, WOD 11 Mar 2026 | Barbell Hang Power Snatch | GOAT 30/07/2026, WOD 11 Mar 2026, WOD 12 Feb 2026, WOD 18 Feb 2026 — Row & Snatch | 0.40 | 0.64 |
| Burpee Over the Bar | CrossFit Open 26.3, GOAT 13/07/2026, GOAT 25/05/2026, GOAT 30/03/2026, WOD 16 Mar 2026 — Open 26.3 | Burpee to Bar | GOAT 20/04/2026 | 0.40 | 0.63 |
| Single-Leg V-Up | GOAT 15/04/2026 | Single-Leg Wall Sit | GOAT 01/08/2026 | 0.40 | 0.63 |
| Bodyweight Sit Up | CrossFit Girl: Angie, CrossFit Girl: Annie, CrossFit Girl: Bárbara, CrossFit Hero: Michael, CrossFit Hero: Mr. Joshua, WOD 03 Mar 2026, WOD 11 Mar 2026, WOD 17 Mar 2026 | GHD Sit-Up | CrossFit Hero: Hansen, CrossFit Hero: Stephen, WOD 16 Feb 2026 — Fran's Revenge | 0.50 | 0.53 |
| Barbell Squat Clean | CrossFit Hero: Badger, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 18 Mar 2026 — C&J Ladder | Barbell Back Squat | GOAT 10/08/2026, GOAT 20/07/2026, GOAT 27/07/2026, WOD 09 Mar 2026 — Open 26.2, WOD 12 Feb 2026, WOD 17 Feb 2026 — Shoulder Crusher, WOD 19 Mar 2026 — Gravity Shift | 0.50 | 0.53 |
| Toe Touch Sit-Up | GOAT 01/06/2026, GOAT 28/03/2026 | Toe Touch Crunch | GOAT 25/05/2026 | 0.40 | 0.63 |
| Goblet Squat Hold Press | GOAT 25/04/2026 | Goblet Squat | GOAT 30/05/2026 | 0.50 | 0.52 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Barbell Hang Power Cluster | WOD 10 Mar 2026 — Voltage Shift | 0.40 | 0.62 |
| Half Kneeling Thoracic Rotation | GOAT 13/04/2026 | Quadruped Thoracic Rotation | GOAT 01/08/2026 | 0.40 | 0.61 |
| Wall Ball Shot | CrossFit Girl: Karen, CrossFit Girl: Kelly, CrossFit Open 26.1, GOAT 01/08/2026, GOAT 02/04/2026, GOAT 08/06/2026, GOAT 25/04/2026, GOAT 30/07/2026, WOD 12 Mar 2026 — Siege Protocol, WOD 18 Feb 2026 — Row & Snatch, WOD 20 Mar 2026 — Luke, WOD 27 Feb 2026 — Holleyman | Wall Ball Box Over | GOAT 28/05/2026 | 0.40 | 0.61 |
| Barbell Clean and Jerk | CrossFit Girl: Grace, GOAT 20/07/2026, WOD 20 Mar 2026 — Luke | Dumbbell Hang Clean and Push Jerk | GOAT 22/07/2026 | 0.43 | 0.58 |
| Bodyweight Push Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Hero: JT, CrossFit Hero: McGhee, CrossFit Hero: Murph, WOD 04 Mar 2026 B — Dark Pulse, WOD 12 Mar 2026 — Siege Protocol, WOD 16 Mar 2026 — Open 26.3 | Kettlebell Push-Up | WOD 13 Mar 2026 — Mogadishu Mile | 0.50 | 0.50 |
| Bodyweight Push Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Hero: JT, CrossFit Hero: McGhee, CrossFit Hero: Murph, WOD 04 Mar 2026 B — Dark Pulse, WOD 12 Mar 2026 — Siege Protocol, WOD 16 Mar 2026 — Open 26.3 | Tempo Push-Up | Isometrico-3 | 0.50 | 0.50 |
| Barbell Overhead Squat | CrossFit Girl: Nancy, CrossFit Hero: Josh, GOAT 25/04/2026 | Barbell Squat Clean | CrossFit Hero: Badger, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 18 Mar 2026 — C&J Ladder | 0.50 | 0.50 |
| Barbell Hang Power Snatch | GOAT 30/07/2026, WOD 11 Mar 2026, WOD 12 Feb 2026, WOD 18 Feb 2026 — Row & Snatch | Barbell Hang Clean | WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge | 0.40 | 0.60 |
| Side Plank con carga | GOAT 30/03/2026 | Side Plank | Isometrico-1 | 0.50 | 0.50 |
| Scapular Push-Up | GOAT 01/04/2026, GOAT 01/06/2026, GOAT 13/04/2026, GOAT 15/07/2026, GOAT 22/07/2026, GOAT 23/05/2026 | Scapular Push-ups dinámicos | GOAT 13/04/2026 | 0.40 | 0.59 |
| Barbell Clean and Jerk | CrossFit Girl: Grace, GOAT 20/07/2026, WOD 20 Mar 2026 — Luke | Barbell Push Jerk | CrossFit Hero: DT, WOD 19 Feb 2026 — Legs & Lungs | 0.40 | 0.59 |
| Barbell Squat Clean | CrossFit Hero: Badger, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 18 Mar 2026 — C&J Ladder | Barbell Hang Power Clean | CrossFit Hero: DT, GOAT 13/07/2026 | 0.40 | 0.58 |
| Half Kneeling Thoracic Rotation | GOAT 13/04/2026 | Squat Thoracic Rotation | GOAT 28/05/2026, GOAT 30/07/2026 | 0.40 | 0.58 |
| Dumbbell Wall Sit | GOAT 15/04/2026 | Single-Leg Wall Sit | GOAT 01/08/2026 | 0.40 | 0.58 |
| Barbell Power Snatch | Clase GOAT 22/04/2026, CrossFit Girl: Amanda, CrossFit Girl: Isabel, GOAT 22/04/2026 | Barbell Hang Power Cluster | WOD 10 Mar 2026 — Voltage Shift | 0.40 | 0.58 |
| Barbell Hang Power Cluster | WOD 10 Mar 2026 — Voltage Shift | Barbell Hang Clean | WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge | 0.40 | 0.58 |
| Barbell Bent Over Row | WOD 04 Mar 2026 B — Dark Pulse | Barbell Upright Row | WOD 04 Mar 2026 B — Dark Pulse, WOD 25 Feb 2026 — Supernova | 0.40 | 0.57 |
| Single-Leg V-Up | GOAT 15/04/2026 | Single-Leg Calf Raise | GOAT 13/06/2026 | 0.40 | 0.57 |
| Partner Wall Ball Over Bar | GOAT 06/05/2026, GOAT 22/07/2026 | Wall Ball Box Over | GOAT 28/05/2026 | 0.50 | 0.46 |
| Barbell Power Clean | CrossFit Girl: Elizabeth, CrossFit Girl: Linda, CrossFit Open 26.3, GOAT 01/06/2026, GOAT 20/04/2026, WOD 03 Mar 2026, WOD 16 Feb 2026 — Fran's Revenge, WOD 16 Mar 2026 — Open 26.3, WOD 19 Feb 2026 — Legs & Lungs, WOD 27 Feb 2026 — Holleyman | Barbell Hang Power Snatch | GOAT 30/07/2026, WOD 11 Mar 2026, WOD 12 Feb 2026, WOD 18 Feb 2026 — Row & Snatch | 0.40 | 0.56 |
| Wall Ball Box Over | GOAT 28/05/2026 | Wall Ball Run | GOAT 22/07/2026 | 0.40 | 0.56 |
| Bodyweight Push Up | CrossFit Girl: Angie, CrossFit Girl: Bárbara, CrossFit Girl: Chelsea, CrossFit Girl: Cindy, CrossFit Hero: JT, CrossFit Hero: McGhee, CrossFit Hero: Murph, WOD 04 Mar 2026 B — Dark Pulse, WOD 12 Mar 2026 — Siege Protocol, WOD 16 Mar 2026 — Open 26.3 | Scapular Push-Up | GOAT 01/04/2026, GOAT 01/06/2026, GOAT 13/04/2026, GOAT 15/07/2026, GOAT 22/07/2026, GOAT 23/05/2026 | 0.50 | 0.44 |
| Kettlebell Push-Up | WOD 13 Mar 2026 — Mogadishu Mile | Scapular Push-Up | GOAT 01/04/2026, GOAT 01/06/2026, GOAT 13/04/2026, GOAT 15/07/2026, GOAT 22/07/2026, GOAT 23/05/2026 | 0.50 | 0.44 |
| Kettlebell Push-Up | WOD 13 Mar 2026 — Mogadishu Mile | Yoga Push-Up | GOAT 02/04/2026, GOAT 08/06/2026, GOAT 15/07/2026, GOAT 20/07/2026 | 0.50 | 0.44 |
| V-Up | GOAT 01/06/2026, GOAT 27/07/2026, GOAT 30/05/2026 | Push-up | GOAT 13/06/2026 | 0.50 | 0.43 |
| Sally Up Sally Down | GOAT 15/04/2026 | Plank Up-Down | GOAT 13/04/2026 | 0.50 | 0.42 |
| Wall Sit | GOAT 15/07/2026, Isometrico-2 | Single-Leg Wall Sit | GOAT 01/08/2026 | 0.50 | 0.42 |
| Dual Dumbbell Snatch with Burpee | GOAT 25/04/2026 | Dumbbell Burpee Snatch | GOAT 28/05/2026 | 0.60 | 0.31 |
| Kettlebell Snatch | WOD 17 Mar 2026 | Snatch | GOAT 08/06/2026 | 0.50 | 0.35 |
| Weighted Hollow Rock | GOAT 13/04/2026 | Hollow Body Rock | GOAT 30/03/2026 | 0.50 | 0.35 |
| Wall Sit with Leg Extension | GOAT 25/04/2026 | Single-Leg Wall Sit | GOAT 01/08/2026 | 0.50 | 0.33 |
| Hollow Hold Pass | GOAT 20/04/2026 | Dynamic Hollow Hold | GOAT 13/07/2026, GOAT 20/07/2026 | 0.50 | 0.32 |
| Spiderman Stretch Rotation | GOAT 10/08/2026, GOAT 15/04/2026, GOAT 20/07/2026 | Alternating Spiderman Stretch | GOAT 01/08/2026 | 0.50 | 0.28 |
| Weighted Bird Dog | GOAT 20/04/2026 | Bird Dog Hold | Isometrico-1 | 0.50 | 0.24 |
| Weighted Bird Dog | GOAT 20/04/2026 | Bird Dog Crunch | GOAT 01/06/2026, GOAT 20/07/2026 | 0.50 | 0.12 |
