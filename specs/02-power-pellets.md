# SPEC 02 — Power pellets y fantasmas comestibles

> **Estado:** Aprobado  
> **Depende de:** SPEC 01  
> **Fecha:** 2026-10-31  
> **Objetivo:** Añadir cuatro power pellets que permitan a Pac-Man devorar fantasmas temporalmente y enviarlos de regreso a su caja.

## Alcance

**Incluye:**

- Un pellet en cada esquina transitable: `(1,1)`, `(26,1)`, `(26,29)` y `(1,29)`, en lugar del punto habitual.
- Cada pellet concede 50 puntos y activa el poder durante 360 fotogramas; comer otro reinicia ese plazo.
- Mientras dura el poder, los fantasmas fuera de la caja son grises, se mueven a `0,075` celdas por fotograma y eligen rutas que maximicen su distancia por caminos a Pac-Man.
- Devorar un fantasma concede 200 puntos. Este vuelve caminando a su posición inicial en la caja, representado solo por ojos inofensivos.
- Tras llegar, espera al menos 120 fotogramas **y** hasta que termine el poder antes de iniciar su salida. Los fantasmas que no hayan sido devorados conservan su secuencia de salida.
- Perder una vida cancela el poder, pero no repone los pellets consumidos. Una partida nueva repone los cuatro.

**Fuera de alcance:** multiplicadores por fantasmas consecutivos, destellos al terminar el poder y persistencia entre partidas.

## Modelo de datos

- `src/js/maze.js` incorporará el valor `4` para un power pellet en las cuatro celdas indicadas.
- `game.grid` seguirá siendo la copia consumible de `MAZE`; `game.dotsRemaining` contará puntos normales y pellets para determinar la victoria.
- `game.fotogramasPoderRestantes` guardará el tiempo de poder.
- Cada fantasma añadirá un estado de regreso a la caja y el fotograma de llegada necesario para controlar su espera.

## Plan de implementación

1. En `src/js/maze.js` y `src/js/game.js`, incorporar los cuatro pellets, su consumo, sus 50 puntos y su participación en la condición de victoria.
2. En `src/js/game.js`, añadir la duración del poder, la colisión que concede 200 puntos y la ruta de regreso del fantasma por la puerta hasta su posición inicial. Los ojos no causarán daño ni podrán devorarse de nuevo.
3. Integrar la espera de 120 fotogramas y el fin del poder con la salida existente. Añadir la huida y velocidad reducida de los fantasmas comestibles, asegurando que los cambios de velocidad no los dejen desalineados con la cuadrícula.
4. En `src/js/render.js`, dibujar pellets más grandes, fantasmas comestibles grises y ojos durante el regreso.

Cada paso debe mantener el juego ejecutable abriendo `src/index.html`.

## Criterios de aceptación

- [ ] Cada partida nueva muestra exactamente cuatro pellets en las coordenadas indicadas.
- [ ] Cada pellet suma 50 puntos, desaparece al comerse y activa o renueva 360 fotogramas de poder.
- [ ] Los fantasmas comestibles son grises, huyen y se mueven a `0,075` celdas por fotograma; después recuperan color, conducta y velocidad normales.
- [ ] Devorar un fantasma suma 200 puntos y sus ojos regresan a la caja sin dañar a Pac-Man.
- [ ] El fantasma devorado no inicia su salida hasta haber esperado 120 fotogramas desde su llegada **y** haber terminado el poder.
- [ ] Perder una vida cancela el poder sin restaurar pellets; reiniciar la partida restaura los cuatro.
- [ ] La victoria exige consumir tanto los puntos normales como los pellets.
- [ ] El juego se puede jugar desde `src/index.html` sin errores en la consola.

## Decisiones tomadas y descartadas

- **Sí:** regreso caminando como ojos, en lugar de retorno instantáneo.
- **Sí:** huida gris a velocidad `0,075`, en lugar de mantener la conducta habitual o usar el azul clásico.
- **Sí:** 200 puntos fijos por fantasma, sin multiplicador.
- **Sí:** esperar tanto los 120 fotogramas como el fin del poder antes de volver a salir.

## Riesgos

- Cambiar de `0,1` a `0,075` celdas por fotograma puede dejar a un fantasma entre centros de celda. El movimiento deberá ajustarse al centro antes de decidir un giro.
- El regreso debe considerar la puerta y el túnel en la búsqueda de rutas para no dejar fantasmas atrapados.

## Qué **no** está incluido en esta especificación

- Multiplicadores por fantasmas consecutivos.
- Destellos al terminar el poder.
- Persistencia entre partidas.
