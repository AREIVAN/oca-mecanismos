import {
  GEESE,
  QUESTIONS,
  questionFor,
  tileAt,
  type Question,
} from "./content";
export const PHASE = {
  READY: "ready",
  QUESTION: "question",
  FEEDBACK: "feedback",
  WON: "won",
} as const;
export type Phase = (typeof PHASE)[keyof typeof PHASE];
export interface Player {
  name: string;
  position: number;
  skipped: number;
  trapped: boolean;
  correct: number;
  attempts: number;
}
export interface Challenge {
  question: Question;
  destination: number;
  correct: boolean | null;
  selected: number | null;
}
export interface Game {
  version: 1;
  players: Player[];
  turn: number;
  phase: Phase;
  dice: number[];
  rolls: number;
  log: string[];
  challenge: Challenge | null;
  winner: number | null;
}
export function createGame(names: string[]): Game {
  if (names.length < 2 || names.length > 4)
    throw new Error("Se necesitan de 2 a 4 jugadores.");
  return {
    version: 1,
    players: names.map((name, i) => ({
      name: name.trim().slice(0, 24) || `Jugador ${i + 1}`,
      position: 0,
      skipped: 0,
      trapped: false,
      correct: 0,
      attempts: 0,
    })),
    turn: 0,
    phase: PHASE.READY,
    dice: [],
    rolls: 0,
    log: ["El laboratorio está abierto. ¡Comienza la partida!"],
    challenge: null,
    winner: null,
  };
}
function note(g: Game, message: string) {
  g.log = [message, ...g.log].slice(0, 40);
}
function win(g: Game) {
  g.winner = g.turn;
  g.phase = PHASE.WON;
  note(g, `¡${g.players[g.turn].name} llegó a la meta!`);
}
function challenge(g: Game, destination: number) {
  const p = g.players[g.turn];
  g.challenge = {
    question: questionFor(tileAt(p.position).kind, p.attempts++),
    destination,
    correct: null,
    selected: null,
  };
  g.phase = PHASE.QUESTION;
}
function next(g: Game) {
  g.challenge = null;
  g.phase = PHASE.READY;
  g.turn = (g.turn + 1) % g.players.length;
  if (g.players[g.turn].trapped) challenge(g, g.players[g.turn].position);
}
export function roll(g: Game, dice: number[]): Game {
  if (g.phase !== PHASE.READY) return g;
  const s = structuredClone(g);
  const p = s.players[s.turn];
  if (p.skipped > 0) {
    p.skipped--;
    note(s, `${p.name} cumple su turno de mantenimiento.`);
    next(s);
    return s;
  }
  const count = p.position >= 60 ? 1 : 2;
  if (
    dice.length !== count ||
    dice.some((d) => !Number.isInteger(d) || d < 1 || d > 6)
  )
    throw new Error("Tirada inválida");
  s.dice = dice;
  s.rolls++;
  const total = dice.reduce((a, b) => a + b, 0);
  let target = p.position + total;
  let backwards = false;
  if (target > 63) {
    target = 126 - target;
    backwards = true;
  }
  p.position = target;
  note(
    s,
    `${p.name} sacó ${dice.join(" + ")}${backwards ? " y rebotó" : ""}: casilla ${target}.`,
  );
  if (target === 63) {
    win(s);
    return s;
  }
  const tile = tileAt(target);
  if (tile.special === "oca") {
    const dest = backwards
      ? ([...GEESE].reverse().find((n) => n < target) ?? 0)
      : (GEESE.find((n) => n > target) ?? 63);
    challenge(s, dest);
    return s;
  }
  if (tile.special === "bridge" || tile.special === "dice") {
    p.position =
      tile.special === "bridge"
        ? target === 6
          ? 12
          : 6
        : target === 26
          ? 53
          : 26;
    note(s, `${tile.title}: ${p.name} salta a ${p.position} y vuelve a tirar.`);
    return s;
  }
  if (tile.special === "trap") {
    p.trapped = true;
    challenge(s, target);
    return s;
  }
  if (tile.special === "inn") {
    p.skipped = 1;
    note(s, `${p.name} pierde su próximo turno en el taller.`);
  }
  if (tile.special === "maze") {
    p.position = 30;
    note(s, `${p.name} vuelve a la casilla 30 por la manivela.`);
  }
  if (tile.special === "death") {
    p.position = 0;
    note(s, `Movilidad cero: ${p.name} vuelve a la salida.`);
  }
  next(s);
  return s;
}
export function answer(g: Game, index: number): Game {
  if (
    g.phase !== PHASE.QUESTION ||
    !g.challenge ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= g.challenge.question.answers.length
  )
    return g;
  const s = structuredClone(g);
  s.challenge!.selected = index;
  s.challenge!.correct = index === s.challenge!.question.correct;
  s.phase = PHASE.FEEDBACK;
  return s;
}
export function continueGame(g: Game): Game {
  if (g.phase !== PHASE.FEEDBACK || !g.challenge) return g;
  const s = structuredClone(g);
  const p = s.players[s.turn];
  const c = s.challenge!;
  if (c.correct) {
    p.correct++;
    p.trapped = false;
    p.position = c.destination;
    note(
      s,
      `${p.name} resolvió el reto. ${p.position === 63 ? "¡Meta!" : "Puede volver a tirar."}`,
    );
    s.challenge = null;
    s.phase = PHASE.READY;
    if (p.position === 63) win(s);
  } else {
    note(
      s,
      `${p.name} no acertó. ${p.trapped ? "Sigue bloqueado hasta resolver un reto." : "Permanece en su casilla."}`,
    );
    next(s);
  }
  return s;
}
export function randomDice(position: number): number[] {
  return Array.from({ length: position >= 60 ? 1 : 2 }, () => {
    const a = new Uint32Array(1);
    do {
      crypto.getRandomValues(a);
    } while (a[0] >= 4294967292);
    return (a[0] % 6) + 1;
  });
}
export function restoreGame(raw: string | null): Game | null {
  if (!raw) return null;
  try {
    const g: unknown = JSON.parse(raw);
    if (typeof g !== "object" || g === null) return null;
    const s = g as Game;
    if (
      s.version !== 1 ||
      !Array.isArray(s.players) ||
      s.players.length < 2 ||
      s.players.length > 4 ||
      !Number.isInteger(s.turn) ||
      s.turn < 0 ||
      s.turn >= s.players.length ||
      !Object.values(PHASE).includes(s.phase)
    )
      return null;
    if (
      !s.players.every(
        (p) =>
          p &&
          typeof p.name === "string" &&
          p.name.length <= 24 &&
          Number.isInteger(p.position) &&
          p.position >= 0 &&
          p.position <= 63 &&
          Number.isInteger(p.skipped) &&
          p.skipped >= 0 &&
          p.skipped <= 1 &&
          typeof p.trapped === "boolean" &&
          Number.isInteger(p.correct) &&
          p.correct >= 0 &&
          Number.isInteger(p.attempts) &&
          p.attempts >= 0,
      )
    )
      return null;
    if (
      !Number.isInteger(s.rolls) ||
      s.rolls < 0 ||
      !Array.isArray(s.log) ||
      s.log.length > 40 ||
      !s.log.every((l) => typeof l === "string") ||
      !Array.isArray(s.dice) ||
      s.dice.length > 2 ||
      !s.dice.every((d) => Number.isInteger(d) && d >= 1 && d <= 6)
    )
      return null;
    if (s.phase === PHASE.WON) {
      if (s.winner !== s.turn || s.players[s.turn].position !== 63) return null;
    } else if (s.winner !== null) return null;
    if (s.phase === PHASE.QUESTION || s.phase === PHASE.FEEDBACK) {
      const c = s.challenge;
      if (
        !c ||
        !Number.isInteger(c.destination) ||
        c.destination < 0 ||
        c.destination > 63
      )
        return null;
      const q = QUESTIONS.find((q) => q.id === c.question?.id);
      if (!q) return null;
      c.question = q;
      if (
        s.phase === PHASE.QUESTION &&
        (c.correct !== null || c.selected !== null)
      )
        return null;
      if (
        s.phase === PHASE.FEEDBACK &&
        (typeof c.correct !== "boolean" ||
          !Number.isInteger(c.selected) ||
          c.selected === null ||
          c.selected < 0 ||
          c.selected >= q.answers.length ||
          c.correct !== (c.selected === q.correct))
      )
        return null;
    } else if (s.challenge !== null) return null;
    return s;
  } catch {
    return null;
  }
}
