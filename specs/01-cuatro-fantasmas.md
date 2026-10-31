# SPEC 01 — Cuatro fantasmas con conductas distintas

> **Estado:** Aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-10-30
> **Objetivo:** Incorporar cuatro fantasmas que salgan escalonadamente y actúen como cazador, emboscador, patrullero y errático.

## Alcance

**Incluye:**

- Cuatro fantasmas visibles.
- Una conducta diferenciada para cada fantasma.
- Salida escalonada del recinto central.
- Restablecimiento de posiciones, recorrido y tiempos al perder una vida.

**Fuera de alcance (para futuras especificaciones):**

- Cambios en vidas, puntuación o puntos.
- Cambios en el laberinto o en la velocidad de Pac-Man.
- Guardado de partidas.
- Nuevos modos de juego.

## Modelo de datos

`GHOST_STARTS` en `src/js/maze.js` tendrá cuatro entradas ordenadas como cazador, emboscador, patrullero y errático. Cada entrada tendrá un tipo y un retraso de salida de 0, 120, 240 o 360 fotogramas.

Cada elemento de `game.ghosts` conservará posición, dirección y velocidad, y añadirá un estado de salida (`espera`, `salida` o `activo`). La partida contará los fotogramas transcurridos desde el inicio o desde la última pérdida de vida.

El patrullero conservará el índice de su siguiente esquina.

## Plan de implementación

1. Ampliar las posiciones iniciales a cuatro fantasmas en `src/js/maze.js`. Mantener el juego ejecutable mientras los nuevos fantasmas usan temporalmente el movimiento existente.
2. Añadir en `src/js/game.js` la espera escalonada y una salida dirigida hasta `(13, 11)`, fuera del recinto. Reiniciar la secuencia al perder una vida.
3. Hacer que el cazador elija una ruta transitable más corta hacia la celda actual de Pac-Man, considerando la puerta y el túnel.
4. Hacer que el emboscador busque una celda hasta cuatro posiciones por delante de Pac-Man. Si está bloqueada, retroceder por esa trayectoria hasta encontrar un objetivo transitable.
5. Hacer que el patrullero visite cíclicamente las esquinas transitables `(1, 1)`, `(26, 1)`, `(26, 29)` y `(1, 29)`.
6. Hacer que el errático elija salidas válidas al azar, evitando dar media vuelta salvo en callejones. Conservar en `src/js/render.js` un color diferente para cada fantasma.

Todos conservarán la velocidad actual de fantasma. Las decisiones de ruta se tomarán en celdas alineadas, sin atravesar paredes.

## Criterios de aceptación

- [ ] Al iniciar hay exactamente cuatro fantasmas, cada uno con un color distinto.
- [ ] Sale un fantasma al inicio y los demás aproximadamente cada 120 fotogramas de juego.
- [ ] Los cuatro alcanzan la zona exterior del recinto sin quedar atrapados.
- [ ] El cazador busca rutas válidas hacia Pac-Man.
- [ ] El emboscador apunta a una posición situada delante de Pac-Man.
- [ ] El patrullero recorre las cuatro esquinas en orden cíclico.
- [ ] El errático elige salidas válidas al azar.
- [ ] Perder una vida restablece las posiciones, el recorrido de patrulla y la secuencia de salida.
- [ ] Los puntos, las tres vidas, los choques, la victoria, la derrota y el reinicio siguen funcionando.
- [ ] `src/index.html` se puede jugar sin errores en la consola del navegador.

## Decisiones tomadas y descartadas

- **Sí:** cuatro conductas: cazador, emboscador, patrullero y errático. Permiten distinguir el comportamiento de cada fantasma.
- **Sí:** salida escalonada cada 120 fotogramas. Reduce la presión inicial y reutiliza el bucle de juego existente.
- **Sí:** el cazador usa la ruta más corta y la velocidad actual. Su agresividad procede de sus decisiones, no de una ventaja de velocidad.
- **Sí:** el emboscador apunta cuatro celdas por delante de Pac-Man. Es una regla concreta y verificable.
- **Sí:** el patrullero visita cuatro esquinas en ciclo. Su recorrido es predecible y diferente de las otras conductas.
- **No:** aumentar la velocidad del cazador. No forma parte de esta especificación.
- **No:** modificar vidas, puntuación, laberinto o guardado. Se conservan las reglas actuales.

## Riesgos

| Riesgo                                                                | Mitigación                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Un objetivo del emboscador puede caer en una pared.                   | Retroceder por la trayectoria hasta encontrar una celda transitable.             |
| La ruta más corta puede ignorar el túnel o la puerta.                 | Incluir las reglas existentes de túnel y puerta en la búsqueda de rutas.         |
| Los fantasmas pueden salir simultáneamente por reinicios incorrectos. | Reiniciar explícitamente el contador y el estado de salida al perder una vida.   |
| La salida basada en fotogramas depende de la frecuencia de refresco.  | Documentar que 120 fotogramas equivalen aproximadamente a dos segundos a 60 FPS. |

## Qué **no** está incluido en esta especificación

- Cambios en las vidas, la puntuación o los puntos.
- Cambios en el laberinto o en la velocidad de Pac-Man.
- Guardado de partidas.
- Nuevos modos de juego.
