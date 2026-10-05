# Challenges de calistenia — catálogo para la app

## Resumen

Nueve challenges para hacer en casa, sin equipamiento (lo único que se usa es una silla firme y una toalla o colchoneta).

Hay dos tipos, y conviene modelarlos distinto en la app:

| Tipo | Cómo funciona | Challenges |
| --- | --- | --- |
| **Meta de repeticiones** | 6 semanas, 3 sesiones por semana (ej. lunes/miércoles/viernes), con series y descansos fijos. Termina en un intento final. | 100 flexiones · 200 abdominales · 200 sentadillas · 150 fondos en silla · 150 zancadas · 50 burpees |
| **Diario de 30 días** | Una tarea por día, con días de descanso intercalados. Más de hábito que de fuerza. | Plancha de 5 minutos · 30 días de abdominales · 30 días de sentadillas |

Los de meta están armados sobre el método de *hundredpushups.com* (Steve Speirs): test inicial, tres niveles, cinco series por sesión y una última serie al fallo. Los números de estas tablas son propios, generados con la fórmula de la sección siguiente, no copiados del programa original.

## Motor de progresión

No hace falta guardar una tabla por challenge y por nivel. Alcanza con una curva única y la meta de cada challenge:

```
reps_de_la_serie = round(meta × factor_sesión × factor_nivel × pct_serie)
```

**Curva de 18 sesiones** (el factor es el volumen total de la sesión como múltiplo de la meta):

| Semana | Sesión 1 | Sesión 2 | Sesión 3 | Series | Descanso |
| --- | --- | --- | --- | --- | --- |
| 1 | 0,25 | 0,33 | 0,42 | 5 | 60s |
| 2 | 0,47 | 0,53 | 0,60 | 5 | 60s |
| 3 | 0,64 | 0,72 | 0,80 | 5 | 60s |
| 4 | 0,88 | 0,99 | 1,10 | 5 | 45s |
| 5 | 1,22 | 1,36 | 1,50 | 7 | 45s |
| 6 | 1,68 | 1,85 | intento final | 9 | 60s |

**Reparto entre series** (porcentaje del volumen de la sesión):

| Series | Reparto |
| --- | --- |
| 5 | 22% · 26% · 16% · 16% · 20% |
| 7 | 15% · 17% · 13% · 13% · 10% · 10% · 22% |
| 9 | 11% · 13% · 9% · 9% · 11% · 11% · 8% · 8% · 20% |

**Niveles** (salen del test inicial): principiante ×0,55 · intermedio ×1,00 · avanzado ×1,40.

**Reglas del programa**

- La última serie siempre es al fallo: el número de la tabla es el mínimo, no el tope.
- Al terminar la semana 2, la 4 y la 5 se vuelve a hacer el test de repeticiones máximas y se recalcula el nivel. Eso es lo que hace que el programa se adapte.
- Si no se completa una sesión, se repite la semana entera antes de avanzar. Mejor repetir que lesionarse.
- Siempre un día de descanso entre sesiones del mismo grupo muscular.

## Modelo de datos sugerido

Tres entidades alcanzan para los dos tipos de challenge:

- **challenge** — id, nombre, tipo (`meta_reps` | `diario_tiempo` | `diario_reps` | `diario_circuito`), ejercicio, músculos, equipamiento, meta, duración en días, sesiones por semana, rangos del test inicial, regresión.
- **sesion** — challenge\_id, semana, día, descanso en segundos, array de reps, flag `ultima_al_fallo`, flag `final`.
- **inscripcion** — usuario\_id, challenge\_id, fecha de inicio, nivel actual, sesión actual, historial de reps reales por serie (clave para el gráfico de progreso y para el retest).

El JSON adjunto trae el catálogo completo con este formato. Guarda solo el nivel intermedio y los factores; los otros dos niveles se calculan al vuelo con la fórmula.

## Challenges de meta (6 semanas)

Todas las tablas son del **nivel intermedio**. Para principiante multiplicá por 0,55 y para avanzado por 1,40. El `+` marca la serie al fallo.

### Test inicial y regresiones

| Challenge | Equipamiento | Principiante | Intermedio | Avanzado | Versión fácil |
| --- | --- | --- | --- | --- | --- |
| 100 flexiones | ninguno | 0-5 | 6-15 | 16+ | Con rodillas apoyadas o contra la mesada |
| 200 abdominales | toalla | 0-14 | 15-30 | 31+ | Crunch corto, manos en el pecho, nunca en la nuca |
| 200 sentadillas | ninguno | 0-19 | 20-40 | 41+ | Tocar la silla con la cola y subir |
| 150 fondos en silla | silla firme | 0-7 | 8-15 | 16+ | Rodillas flexionadas, poco recorrido |
| 150 zancadas | ninguno | 0-15 | 16-34 | 35+ | Zancada estática, mano en la pared |
| 50 burpees | ninguno | 0-4 | 5-10 | 11+ | Sin salto y con paso atrás |

### 100 flexiones seguidas

| Semana | Día | Series | Descanso | Total |
| --- | --- | --- | --- | --- |
| 1 | 1 | 6 - 6 - 4 - 4 - 5+ | 60s | 25 |
| 1 | 2 | 7 - 9 - 5 - 5 - 7+ | 60s | 33 |
| 1 | 3 | 9 - 11 - 7 - 7 - 8+ | 60s | 42 |
| 2 | 1 | 10 - 12 - 8 - 8 - 9+ | 60s | 47 |
| 2 | 2 | 12 - 14 - 8 - 8 - 11+ | 60s | 53 |
| 2 | 3 | 13 - 16 - 10 - 10 - 12+ | 60s | 61 |
| 3 | 1 | 14 - 17 - 10 - 10 - 13+ | 60s | 64 |
| 3 | 2 | 16 - 19 - 12 - 12 - 14+ | 60s | 73 |
| 3 | 3 | 18 - 21 - 13 - 13 - 16+ | 60s | 81 |
| 4 | 1 | 19 - 23 - 14 - 14 - 18+ | 45s | 88 |
| 4 | 2 | 22 - 26 - 16 - 16 - 20+ | 45s | 100 |
| 4 | 3 | 24 - 29 - 18 - 18 - 22+ | 45s | 111 |
| 5 | 1 | 18 - 21 - 16 - 16 - 12 - 12 - 27+ | 45s | 122 |
| 5 | 2 | 20 - 23 - 18 - 18 - 14 - 14 - 30+ | 45s | 137 |
| 5 | 3 | 22 - 26 - 20 - 20 - 15 - 15 - 33+ | 45s | 151 |
| 6 | 1 | 18 - 22 - 15 - 15 - 18 - 18 - 13 - 13 - 34+ | 60s | 166 |
| 6 | 2 | 20 - 24 - 17 - 17 - 20 - 20 - 15 - 15 - 37+ | 60s | 185 |
| 6 | 3 | Intento final: 100 seguidas | - | 100 |

### 200 abdominales y 200 sentadillas

Misma meta, misma tabla. Si se hacen los dos a la vez, conviene alternar los días.

| Semana | Día | Series | Descanso | Total |
| --- | --- | --- | --- | --- |
| 1 | 1 | 11 - 13 - 8 - 8 - 10+ | 60s | 50 |
| 1 | 2 | 15 - 17 - 11 - 11 - 13+ | 60s | 67 |
| 1 | 3 | 18 - 22 - 13 - 13 - 17+ | 60s | 83 |
| 2 | 1 | 21 - 24 - 15 - 15 - 19+ | 60s | 94 |
| 2 | 2 | 23 - 28 - 17 - 17 - 21+ | 60s | 106 |
| 2 | 3 | 26 - 31 - 19 - 19 - 24+ | 60s | 119 |
| 3 | 1 | 28 - 33 - 20 - 20 - 26+ | 60s | 127 |
| 3 | 2 | 32 - 37 - 23 - 23 - 29+ | 60s | 144 |
| 3 | 3 | 35 - 42 - 26 - 26 - 32+ | 60s | 161 |
| 4 | 1 | 39 - 46 - 28 - 28 - 35+ | 45s | 176 |
| 4 | 2 | 44 - 51 - 32 - 32 - 40+ | 45s | 199 |
| 4 | 3 | 48 - 57 - 35 - 35 - 44+ | 45s | 219 |
| 5 | 1 | 37 - 41 - 32 - 32 - 24 - 24 - 54+ | 45s | 244 |
| 5 | 2 | 41 - 46 - 35 - 35 - 27 - 27 - 60+ | 45s | 271 |
| 5 | 3 | 45 - 51 - 39 - 39 - 30 - 30 - 66+ | 45s | 300 |
| 6 | 1 | 37 - 44 - 30 - 30 - 37 - 37 - 27 - 27 - 67+ | 60s | 336 |
| 6 | 2 | 41 - 48 - 33 - 33 - 41 - 41 - 30 - 30 - 74+ | 60s | 371 |
| 6 | 3 | Intento final: 200 seguidas | - | 200 |

### 150 fondos en silla y 150 zancadas

En zancadas el número es el total: 150 son 75 por pierna.

| Semana | Día | Series | Descanso | Total |
| --- | --- | --- | --- | --- |
| 1 | 1 | 8 - 10 - 6 - 6 - 8+ | 60s | 38 |
| 1 | 2 | 11 - 13 - 8 - 8 - 10+ | 60s | 50 |
| 1 | 3 | 14 - 16 - 10 - 10 - 13+ | 60s | 63 |
| 2 | 1 | 16 - 18 - 11 - 11 - 14+ | 60s | 70 |
| 2 | 2 | 17 - 21 - 13 - 13 - 16+ | 60s | 80 |
| 2 | 3 | 20 - 23 - 14 - 14 - 18+ | 60s | 89 |
| 3 | 1 | 21 - 25 - 15 - 15 - 19+ | 60s | 95 |
| 3 | 2 | 24 - 28 - 17 - 17 - 22+ | 60s | 108 |
| 3 | 3 | 26 - 31 - 19 - 19 - 24+ | 60s | 119 |
| 4 | 1 | 29 - 34 - 21 - 21 - 26+ | 45s | 131 |
| 4 | 2 | 33 - 39 - 24 - 24 - 30+ | 45s | 150 |
| 4 | 3 | 36 - 43 - 26 - 26 - 33+ | 45s | 164 |
| 5 | 1 | 27 - 31 - 24 - 24 - 18 - 18 - 40+ | 45s | 182 |
| 5 | 2 | 31 - 35 - 27 - 27 - 20 - 20 - 45+ | 45s | 205 |
| 5 | 3 | 34 - 38 - 29 - 29 - 22 - 22 - 50+ | 45s | 224 |
| 6 | 1 | 28 - 33 - 23 - 23 - 28 - 28 - 20 - 20 - 50+ | 60s | 253 |
| 6 | 2 | 31 - 36 - 25 - 25 - 31 - 31 - 22 - 22 - 56+ | 60s | 279 |
| 6 | 3 | Intento final: 150 seguidas | - | 150 |

### 50 burpees seguidos

Es el más duro de todos porque suma cardio. Si cuesta, bajar a 2 sesiones por semana y estirar el programa a 9 semanas.

| Semana | Día | Series | Descanso | Total |
| --- | --- | --- | --- | --- |
| 1 | 1 | 3 - 3 - 2 - 2 - 2+ | 60s | 12 |
| 1 | 2 | 4 - 4 - 3 - 3 - 3+ | 60s | 17 |
| 1 | 3 | 5 - 5 - 3 - 3 - 4+ | 60s | 20 |
| 2 | 1 | 5 - 6 - 4 - 4 - 5+ | 60s | 24 |
| 2 | 2 | 6 - 7 - 4 - 4 - 5+ | 60s | 26 |
| 2 | 3 | 7 - 8 - 5 - 5 - 6+ | 60s | 31 |
| 3 | 1 | 7 - 8 - 5 - 5 - 6+ | 60s | 31 |
| 3 | 2 | 8 - 9 - 6 - 6 - 7+ | 60s | 36 |
| 3 | 3 | 9 - 10 - 6 - 6 - 8+ | 60s | 39 |
| 4 | 1 | 10 - 11 - 7 - 7 - 9+ | 45s | 44 |
| 4 | 2 | 11 - 13 - 8 - 8 - 10+ | 45s | 50 |
| 4 | 3 | 12 - 14 - 9 - 9 - 11+ | 45s | 55 |
| 5 | 1 | 9 - 10 - 8 - 8 - 6 - 6 - 13+ | 45s | 60 |
| 5 | 2 | 10 - 12 - 9 - 9 - 7 - 7 - 15+ | 45s | 69 |
| 5 | 3 | 11 - 13 - 10 - 10 - 8 - 8 - 16+ | 45s | 76 |
| 6 | 1 | 9 - 11 - 8 - 8 - 9 - 9 - 7 - 7 - 17+ | 60s | 85 |
| 6 | 2 | 10 - 12 - 8 - 8 - 10 - 10 - 7 - 7 - 18+ | 60s | 90 |
| 6 | 3 | Intento final: 50 seguidos | - | 50 |

## Challenges diarios (30 días)

### Plancha de 5 minutos

A partir del día 15 el objetivo se parte en series con 30s de descanso. El día 30 es el único que exige el aguante de corrido.

| Día | Objetivo | Series | Día | Objetivo | Series |
| --- | --- | --- | --- | --- | --- |
| 1 | 20s | 20s | 16 | 110s | 55 + 55 |
| 2 | 20s | 20s | 17 | 120s | 60 + 60 |
| 3 | 30s | 30s | 18 | 130s | 65 + 65 |
| 4 | 30s | 30s | 19 | 140s | 70 + 70 |
| 5 | 40s | 40s | 20 | Descanso | - |
| 6 | Descanso | - | 21 | 150s | 75 + 75 |
| 7 | 45s | 45s | 22 | 165s | 83 + 82 |
| 8 | 45s | 45s | 23 | 180s | 90 + 90 |
| 9 | 60s | 60s | 24 | 195s | 65 + 65 + 65 |
| 10 | 60s | 60s | 25 | 210s | 70 + 70 + 70 |
| 11 | 70s | 70s | 26 | 225s | 75 + 75 + 75 |
| 12 | 80s | 80s | 27 | Descanso | - |
| 13 | Descanso | - | 28 | 240s | 80 + 80 + 80 |
| 14 | 90s | 90s | 29 | 270s | 90 + 90 + 90 |
| 15 | 100s | 50 + 50 | 30 | 300s | 1 sola serie |

### 30 días de sentadillas

Volumen diario creciente, repartido en 4 series (hasta 120 reps) o 5 series (de ahí en adelante). Descanso de 45s entre series, 60s en la segunda mitad.

| Día | Total | Series | Día | Total | Series |
| --- | --- | --- | --- | --- | --- |
| 1 | 20 | 5-5-5-5 | 16 | 100 | 25-25-25-25 |
| 2 | 25 | 7-6-6-6 | 17 | 110 | 29-27-27-27 |
| 3 | 30 | 9-7-7-7 | 18 | 120 | 30-30-30-30 |
| 4 | 35 | 11-8-8-8 | 19 | 130 | 26 × 5 |
| 5 | Descanso | - | 20 | Descanso | - |
| 6 | 40 | 10-10-10-10 | 21 | 140 | 28 × 5 |
| 7 | 45 | 12-11-11-11 | 22 | 150 | 30 × 5 |
| 8 | 50 | 14-12-12-12 | 23 | 160 | 32 × 5 |
| 9 | 55 | 16-13-13-13 | 24 | 180 | 36 × 5 |
| 10 | Descanso | - | 25 | Descanso | - |
| 11 | 60 | 15-15-15-15 | 26 | 190 | 38 × 5 |
| 12 | 70 | 19-17-17-17 | 27 | 200 | 40 × 5 |
| 13 | 80 | 20-20-20-20 | 28 | 220 | 44 × 5 |
| 14 | 90 | 24-22-22-22 | 29 | 240 | 48 × 5 |
| 15 | Descanso | - | 30 | 250 | 50 × 5 |

### 30 días de abdominales

Este es un circuito, no un ejercicio solo: sirve para probar que el modelo de datos soporte varios ejercicios por día. Todos los días de la misma semana son iguales. Los días 7, 14, 21 y 28 son de descanso activo (caminata de 20 minutos).

| Semana (días) | Vueltas | Crunch | Bicicleta (por lado) | Elevación de piernas | Plancha | Descanso entre ejercicios |
| --- | --- | --- | --- | --- | --- | --- |
| 1 (1-6) | 2 | 12 | 10 | 8 | 20s | 45s |
| 2 (8-13) | 3 | 15 | 12 | 10 | 30s | 40s |
| 3 (15-20) | 3 | 20 | 15 | 12 | 40s | 35s |
| 4 (22-27, 29) | 4 | 22 | 18 | 15 | 50s | 30s |
| Día 30 | 5 | 25 | 20 | 18 | 60s | 30s |

Entre vuelta y vuelta, 60s de descanso.

## Qué conviene que haga la app

- Timer de descanso automático entre series, con aviso sonoro. Es lo que más se usa en este tipo de programa.
- Registrar las reps reales de cada serie, no solo si se completó. Sin eso no hay retest ni gráfico de progreso.
- Pantalla de retest al terminar las semanas 2, 4 y 5, que recalcula el nivel.
- Botón de "no pude completar": en vez de marcar fracaso, reprograma la semana entera.
- Racha de días para los challenges diarios, y aviso si se saltean dos días seguidos.

## Seguridad

Agregá una advertencia al inicio de cada challenge: técnica antes que número, y parar ante dolor articular (no muscular). Los días de descanso son parte del programa, no opcionales. Quien tenga una lesión previa o esté volviendo a entrenar debería consultar antes de arrancar.

## Fuentes consultadas

- hundredpushups.com — el programa de 6 semanas de Steve Speirs, con test inicial, tres columnas por nivel, 5 series y descansos decrecientes. También existen las variantes de 200 abdominales, 200 sentadillas y 20 dominadas del mismo autor.
- Los challenges diarios de plancha de 30 días publicados por Healthline, la Universidad de British Columbia y Realbuzz, que coinciden en arrancar en 20s, terminar en 300s e intercalar días de descanso.
- La app "Just 6 Weeks" como referencia de catálogo: usa 11 programas con la misma lógica (flexiones, abdominales, sentadillas, dominadas, plancha, fondos, elevaciones de piernas, zancadas, burpees, soga).

Las tablas de este documento son generadas con la fórmula propia de la sección "Motor de progresión"; siguen el método pero no reproducen los números de ninguna de esas fuentes.
