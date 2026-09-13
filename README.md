# OCA · Laboratorio de mecanismos

MVP educativo del juego de la oca para **2 a 4 jugadores locales**, en una pantalla compartida. Interfaz en español, tablero espiral de 63 casillas y diagramas SVG propios.

## Ejecutar

Requiere Node.js 22.12+ (verificado con Node 24).

```sh
npm ci
npm run dev
```

Abrir la dirección que imprime Vite (habitualmente http://localhost:5173). Para validación sin generar archivos de producción:

```sh
npm run check
```

**No se ejecutó ni se configuró un build**, por instrucción del proyecto. La aplicación está disponible localmente; subir el código a GitHub no equivale a desplegar un sitio público.

## Incluye

- Selección de 2, 3 o 4 participantes y nombres personalizables.
- Dados aleatorios con Web Crypto, animación y protección contra doble tirada.
- Motor de juego independiente de la interfaz, con pruebas automatizadas.
- Casillas con eslabones, cuatro barras y pares cinemáticos.
- Retos de opción múltiple con explicación didáctica y discusión oral sugerida.
- Posiciones, bloqueos, mantenimiento, turnos extra, rebotes y victoria.
- Bitácora y progreso individual.
- Guardado automático local, incluyendo pregunta pendiente y respuesta revelada.
- Diseño responsive, navegación por teclado, foco dentro de diálogos y movimiento reducido.
- Sin cuentas, backend, telemetría ni multijugador por Internet.

## Variante de reglas

Hay distintas reglas tradicionales. Esta adaptación hace explícitas sus decisiones y evita bloqueos dependientes de otro jugador.

| Casilla                                                | Efecto                                                                                                                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ocas: 5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59 | Acertar un reto permite saltar a la siguiente oca y repetir turno. Fallar finaliza el turno. Desde 59, acertar lleva a 63. Tras un rebote el salto es hacia la oca anterior. |
| Corredera: 6 y 12                                      | Intercambio 6 ↔ 12 y turno extra.                                                                                                                                            |
| Taller: 19                                             | Pierde un turno futuro.                                                                                                                                                      |
| Transmisión: 26 y 53                                   | Intercambio 26 ↔ 53 y turno extra.                                                                                                                                           |
| Pozo: 31 / cárcel: 52                                  | Pregunta al llegar y en cada turno bloqueado. Acertar libera y permite tirar; fallar pasa el turno. Las preguntas del mismo tipo rotan por intento.                          |
| Manivela: 42                                           | Regresa a 30 y pasa el turno.                                                                                                                                                |
| Movilidad cero: 58                                     | Regresa a la salida.                                                                                                                                                         |
| Meta: 63                                               | Llegada exacta; el exceso rebota.                                                                                                                                            |

Se usan dos dados hasta 59 y uno desde 60. Los saltos no reactivan su destino, las fichas pueden compartir casilla y no hay salida especial por sacar 9 en la primera tirada. Estas diferencias se explican también en **Cómo jugar**.

## Contenido y alcance

Los diagramas son esquemáticos, no simulaciones físicas. Se usa un triángulo articulado **con base fija** para representar movilidad nula; una placa libre no sería una representación correcta. Los diagramas específicos de clase aún no fueron proporcionados: el MVP usa ejemplos propios introductorios.

Las preguntas sobre cuatro barras asumen configuración plana regular, sin singularidades. El banco inicial contiene 12 preguntas; 8 se usan en los retos de oca, pozo y cárcel, y 4 quedan disponibles para ampliar el contenido. Editar `src/content.ts` para cambiar preguntas, respuestas y descripciones.

No se copió el arte ni se interpretaron las instrucciones de la imagen como órdenes para el desarrollo.

### Referencias

- [Reglas de la oca, Playspace](https://www.playspace.com/es-es/pagina/reglas-del-juego-de-la-oca): referencia tradicional; las adaptaciones están documentadas arriba.
- [Carnegie Mellon: Basic Kinematics of Constrained Rigid Bodies](https://www.cs.cmu.edu/~rapidproto/mechanisms/chpt4.html): movilidad y pares cinemáticos.
- [Carnegie Mellon: Planar Linkages](https://www.cs.cmu.edu/~rapidproto/mechanisms/chpt5.html): cuatro barras, manivelas y balancines.

## Arquitectura

- `src/game.ts`: estado serializable y transiciones puras; ninguna dependencia del DOM.
- `src/content.ts`: casillas, tipos de mecanismo y preguntas.
- `src/diagrams.ts`: SVG y coordenadas del tablero.
- `src/main.ts`: interfaz, eventos, teclado y persistencia.
- `src/style.css`: sistema visual y adaptación a tamaños de pantalla.
- `src/game.test.ts`: pruebas de reglas, contenido y guardado.

Stack verificado contra los proyectos locales **minisumo web** y **web 6gdl**: Vite + TypeScript. No se incorpora Three.js porque no hace falta un motor 3D para este tablero 2D. Tipografías de Google Fonts con fallback local; si no hay red, la partida sigue funcionando una vez cargada la aplicación.

## Próximos pasos fuera del MVP

Validar las preguntas con el docente y sustituir ejemplos por los diagramas de clase; ampliar el banco de retos; elegir alojamiento si se requiere una URL pública. Multijugador remoto y simulación dinámica quedan fuera del alcance actual.
