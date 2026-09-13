import { describe, it, expect } from "vitest";
import {
  answer,
  continueGame,
  createGame,
  PHASE,
  restoreGame,
  roll,
  type Game,
} from "./game";
import { boardCoordinates } from "./diagrams";
import { GEESE, QUESTIONS, tileAt } from "./content";
const start = () => createGame(["Ana", "Luis"]);
function at(position: number) {
  const g = start();
  g.players[0].position = position;
  return g;
}
function correct(g: Game) {
  return continueGame(answer(g, g.challenge!.question.correct));
}
function wrong(g: Game) {
  return continueGame(answer(g, (g.challenge!.question.correct + 1) % 3));
}
describe("mesa y turnos", () => {
  it("acepta 2–4 jugadores y normaliza nombres", () => {
    expect(createGame(["  ", "Luis"]).players[0].name).toBe("Jugador 1");
    expect(createGame(["a", "b", "c", "d"]).players).toHaveLength(4);
    expect(() => createGame(["a"])).toThrow();
    expect(() => createGame(["a", "b", "c", "d", "e"])).toThrow();
  });
  it("avanza sin mutar el estado anterior", () => {
    const g = start();
    const n = roll(g, [1, 1]);
    expect(g.players[0].position).toBe(0);
    expect(n.players[0].position).toBe(2);
    expect(n.turn).toBe(1);
  });
  it("valida dados", () => {
    expect(() => roll(start(), [7, 1])).toThrow();
    expect(() => roll(start(), [1])).toThrow();
    expect(() => roll(at(60), [1, 1])).toThrow();
  });
  it("permite compartir casillas", () => {
    const g = start();
    g.players[1].position = 2;
    expect(roll(g, [1, 1]).players.map((p) => p.position)).toEqual([2, 2]);
  });
  it("repite el ciclo con cuatro jugadores", () => {
    let g = createGame(["a", "b", "c", "d"]);
    for (let i = 0; i < 4; i++) g = roll(g, [1, 1]);
    expect(g.turn).toBe(0);
    expect(g.players.every((p) => p.position === 2)).toBe(true);
  });
});
describe("casillas especiales", () => {
  it.each([
    [0, 3, 3, 12],
    [8, 2, 2, 6],
    [20, 3, 3, 53],
    [47, 3, 3, 26],
  ])("resuelve un salto desde %i sin bucle", (pos, a, b, dest) => {
    const g = roll(at(pos), [a, b]);
    expect(g.players[0].position).toBe(dest);
    expect(g.turn).toBe(0);
    expect(g.phase).toBe(PHASE.READY);
  });
  it("hace un solo salto de oca al acertar y mantiene turno", () => {
    const g = correct(roll(start(), [2, 3]));
    expect(g.players[0].position).toBe(9);
    expect(g.players[0].correct).toBe(1);
    expect(g.challenge).toBeNull();
    expect(g.turn).toBe(0);
  });
  it("falla un reto y termina el turno", () => {
    const g = wrong(roll(start(), [2, 3]));
    expect(g.players[0].position).toBe(5);
    expect(g.turn).toBe(1);
  });
  it("bloquea las tiradas y cambios de respuesta durante el reto", () => {
    const g = roll(start(), [2, 3]);
    expect(roll(g, [6, 6])).toBe(g);
    const f = answer(g, 0);
    expect(answer(f, 1)).toBe(f);
    expect(answer(g, 99)).toBe(g);
  });
  it("salta exactamente un turno por la posada", () => {
    let g = roll(at(17), [1, 1]);
    expect(g.players[0].skipped).toBe(1);
    g = roll(g, [1, 1]);
    expect(g.turn).toBe(0);
    g = roll(g, []);
    expect(g.turn).toBe(1);
    expect(g.players[0].skipped).toBe(0);
    expect(g.players[0].position).toBe(19);
  });
  it.each([31, 52])("permite salir de bloqueo %i acertando", (position) => {
    const g = correct(roll(at(position - 2), [1, 1]));
    expect(g.players[0].trapped).toBe(false);
    expect(g.turn).toBe(0);
    expect(g.phase).toBe(PHASE.READY);
  });
  it("reintenta un bloqueo fallado al regresar el turno", () => {
    let g = wrong(roll(at(29), [1, 1]));
    expect(g.players[0].trapped).toBe(true);
    g = roll(g, [1, 1]);
    expect(g.turn).toBe(0);
    expect(g.phase).toBe(PHASE.QUESTION);
    g = correct(g);
    expect(g.players[0].trapped).toBe(false);
    expect(g.phase).toBe(PHASE.READY);
  });
  it("no entra en un bucle si todos están bloqueados", () => {
    let g = wrong(roll(at(29), [1, 1]));
    g.players[1].position = 50;
    g = wrong(roll(g, [1, 1]));
    for (let i = 0; i < 8; i++) g = wrong(g);
    expect(g.phase).toBe(PHASE.QUESTION);
    expect(g.players.every((p) => p.trapped)).toBe(true);
  });
  it("manivela retrocede a 30", () => {
    const g = roll(at(40), [1, 1]);
    expect(g.players[0].position).toBe(30);
    expect(g.turn).toBe(1);
  });
  it("movilidad cero devuelve a salida", () => {
    const g = roll(at(56), [1, 1]);
    expect(g.players[0].position).toBe(0);
    expect(g.turn).toBe(1);
  });
});
describe("meta y rebotes", () => {
  it("gana con llegada exacta y no permite seguir tirando", () => {
    const g = roll(at(60), [3]);
    expect(g.phase).toBe(PHASE.WON);
    expect(g.winner).toBe(0);
    expect(roll(g, [1])).toBe(g);
  });
  it("rebota el exceso", () => {
    const g = roll(at(62), [3]);
    expect(g.players[0].position).toBe(61);
    expect(g.winner).toBeNull();
  });
  it("resuelve ocas hacia atrás después del rebote", () => {
    const g = correct(roll(at(62), [5]));
    expect(g.players[0].position).toBe(54);
  });
  it("gana desde el último reto", () => {
    const g = correct(roll(at(57), [1, 1]));
    expect(g.players[0].position).toBe(63);
    expect(g.winner).toBe(0);
  });
});
describe("persistencia y contenido", () => {
  it("restaura partidas y rechaza datos corruptos", () => {
    expect(restoreGame(JSON.stringify(start()))).toEqual(start());
    for (const data of ["null", "{}", "oops", '{"version":1}', "[]"])
      expect(restoreGame(data)).toBeNull();
  });
  it("restaura preguntas pendientes y feedback", () => {
    const g = roll(start(), [2, 3]);
    expect(restoreGame(JSON.stringify(g))).toEqual(g);
    const a = answer(g, 1);
    expect(restoreGame(JSON.stringify(a))).toEqual(a);
  });
  it("rechaza posiciones, ganador y respuestas inválidas", () => {
    const g = start();
    g.players[0].position = 100;
    expect(restoreGame(JSON.stringify(g))).toBeNull();
    const a = start();
    a.winner = 0;
    expect(restoreGame(JSON.stringify(a))).toBeNull();
    const b = answer(roll(start(), [2, 3]), 1);
    b.challenge!.correct = !b.challenge!.correct;
    expect(restoreGame(JSON.stringify(b))).toBeNull();
  });
  it("cada casilla tiene mecanismo y cada pregunta una respuesta válida", () => {
    for (let n = 1; n <= 63; n++) {
      expect(tileAt(n).kind).toBeTruthy();
    }
    expect(GEESE).toHaveLength(13);
    for (const q of QUESTIONS) {
      expect(q.answers[q.correct]).toBeTruthy();
      expect(q.explanation.length).toBeGreaterThan(20);
    }
  });
  it("el tablero tiene 63 casillas únicas y adyacentes, sin invadir el centro", () => {
    const cells = boardCoordinates();
    expect(cells).toHaveLength(63);
    expect(new Set(cells.map((c) => c.join(","))).size).toBe(63);
    for (let i = 1; i < cells.length; i++)
      expect(
        Math.abs(cells[i][0] - cells[i - 1][0]) +
          Math.abs(cells[i][1] - cells[i - 1][1]),
      ).toBe(1);
    expect(cells.some(([x, y]) => x >= 2 && x <= 5 && y >= 2 && y <= 5)).toBe(
      false,
    );
  });
});

describe("partidas completas", () => {
  it("termina 60 partidas reproducibles sin salir del tablero", () => {
    let seed = 92817;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let run = 0; run < 60; run++) {
      let g = createGame(["a", "b", "c", "d"].slice(0, 2 + (run % 3)));
      for (let step = 0; step < 3000 && g.phase !== PHASE.WON; step++) {
        if (g.phase === PHASE.QUESTION) {
          g = answer(
            g,
            random() < 0.8
              ? g.challenge!.question.correct
              : (g.challenge!.question.correct + 1) % 3,
          );
        } else if (g.phase === PHASE.FEEDBACK) {
          g = continueGame(g);
        } else {
          const p = g.players[g.turn];
          g = roll(
            g,
            Array.from(
              { length: p.position >= 60 ? 1 : 2 },
              () => Math.floor(random() * 6) + 1,
            ),
          );
        }
        expect(
          g.players.every((p) => p.position >= 0 && p.position <= 63),
        ).toBe(true);
        expect(restoreGame(JSON.stringify(g))).not.toBeNull();
      }
      expect(g.phase).toBe(PHASE.WON);
    }
  });
});
