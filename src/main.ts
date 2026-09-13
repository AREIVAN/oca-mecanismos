import "./style.css";
import { KIND, tileAt } from "./content";
import {
  answer,
  continueGame,
  createGame,
  PHASE,
  randomDice,
  restoreGame,
  roll,
  type Game,
} from "./game";
import { boardCoordinates, diagram } from "./diagrams";
const root = document.querySelector<HTMLDivElement>("#app")!;
const STORAGE = "oca-mecanismos-v1";
let storageAvailable = true;
function readSaved(): Game | null {
  try {
    return restoreGame(localStorage.getItem(STORAGE));
  } catch {
    storageAvailable = false;
    return null;
  }
}
let game: Game | null = readSaved();
let count = 2;
let names = ["", "", "", ""];
let overlay = "";
let selectedTile = 1;
let rolling = false;
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function save() {
  try {
    if (game) localStorage.setItem(STORAGE, JSON.stringify(game));
    else localStorage.removeItem(STORAGE);
  } catch {
    storageAvailable = false;
  }
}
function token(i: number, small = false) {
  return `<span class="token player-${i} ${small ? "small" : ""}" aria-label="Jugador ${i + 1}">${i + 1}</span>`;
}
function header() {
  return `<header><a class="brand" href="/" aria-label="Oca, inicio"><span class="brand-mark">${diagram(KIND.FOUR)}</span><span>oca<span class="brand-dot">.</span><small>LABORATORIO DE MECANISMOS</small></span></a><div class="header-right"><span class="local-status"><i></i> MULTIJUGADOR LOCAL</span><button class="quiet" data-action="rules">Cómo jugar <span>↗</span></button></div></header>`;
}
function setup() {
  return `<main class="setup"><section class="intro"><div class="eyebrow"><span>APRENDER JUGANDO</span><span>EDICIÓN 01 / CINEMÁTICA</span></div><h1>Todo empieza<br>con un <em>movimiento.</em></h1><p>El juego de la oca, reinventado para entender los mecanismos. Lanzá los dados, resolvé los retos y llevá tu ingenio hasta la meta.</p><div class="intro-art"><div class="orbit-label">FIG. 01 — CADENA CINEMÁTICA CERRADA</div>${diagram(KIND.FOUR, "Mecanismo de cuatro barras")}<span class="art-note">4 eslabones.<br>Infinitas ganas de jugar.</span><span class="art-stamp">63<br><small>CASILLAS</small></span></div><div class="intro-facts"><span><b>02—04</b> jugadores</span><span><b>01</b> pantalla compartida</span><span><b>∞</b> curiosidad</span></div></section><section class="setup-card"><span class="eyebrow">PREPARÁ TU MESA</span><h2>¿Quiénes juegan?</h2><p>Reuní a tu equipo. El siguiente movimiento es suyo.</p><form id="setup-form"><fieldset><legend>Número de jugadores</legend><div class="counts">${[2, 3, 4].map((n) => `<button type="button" data-count="${n}" class="${n === count ? "chosen" : ""}" aria-pressed="${n === count}">${n} <span>jugadores</span></button>`).join("")}</div></fieldset><div class="name-fields">${Array.from({ length: count }, (_, i) => `<label>${token(i)}<span class="sr-only">Nombre del jugador ${i + 1}</span><input name="player-${i}" maxlength="24" placeholder="Jugador ${i + 1}" value="${esc(names[i])}" autocomplete="off"></label>`).join("")}</div><button class="primary start" type="submit">Comenzar partida <span>↗</span></button><div class="setup-foot"><span>◈</span> Sin cuentas. Sin instalaciones. A jugar.</div></form></section></main>`;
}
function board() {
  const g = game!;
  return `<section class="board-panel"><div class="panel-heading"><span><span class="live-dot"></span> TABLERO DE JUEGO</span><span>63 CASILLAS · META EXACTA</span></div><div class="board-scroll"><div class="board" aria-label="Tablero de 63 casillas en espiral">${boardCoordinates()
    .map(([x, y], i) => {
      const t = tileAt(i + 1);
      const occupants = g.players
        .map((p, index) => ({ p, index }))
        .filter(({ p }) => p.position === i + 1);
      return `<button class="tile ${t.special} ${occupants.length ? "occupied" : ""}" style="grid-column:${x + 1};grid-row:${y + 1}" data-tile="${i + 1}" aria-label="Casilla ${i + 1}: ${t.title}${occupants.length ? ". " + occupants.map(({ p }) => esc(p.name)).join(", ") : ""}"><span class="tile-number">${String(i + 1).padStart(2, "0")}</span>${diagram(t.kind)}${t.special ? `<span class="tile-label">${({ oca: "RETO", bridge: "⇄", trap: "?", inn: "PAUSA", maze: "↶ 30", dice: "⇄", death: "↶ 0", finish: "META" } as Record<string, string>)[t.special]}</span>` : ""}<span class="occupants">${occupants.map(({ index }) => token(index, true)).join("")}</span></button>`;
    })
    .join(
      "",
    )}<div class="finish-sign" aria-hidden="true"><span>META</span><b>↓</b></div><div class="board-center"><span class="eyebrow">EL INGENIO TE MUEVE</span><strong>oca<span>.</span></strong><span class="center-line"></span><p>De mecanismo a mecanismo<br>y tiro porque lo domino.</p><span class="center-mini">LABORATORIO DE CINEMÁTICA</span></div></div></div><div class="board-footer"><span class="start-label">SALIDA ↗ ${g.players.map((p, i) => (p.position === 0 ? token(i, true) : "")).join("")}</span><span>Seleccioná una casilla para explorar su mecanismo.</span></div><div class="legend"><span><i class="legend-oca"></i> Reto</span><span><i class="legend-bridge"></i> Salto</span><span><i class="legend-trap"></i> Bloqueo</span><span><i class="legend-death"></i> Retroceso</span><span>↗ Recorrido en espiral</span></div></section>`;
}
function diceFace(n: number) {
  const spots: Record<number, number[]> = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };
  return `<span class="die ${rolling ? "rolling" : ""}" role="img" aria-label="Dado: ${n}">${Array.from({ length: 9 }, (_, i) => `<i class="${spots[n].includes(i + 1) ? "pip" : ""}"></i>`).join("")}</span>`;
}
function sidebar() {
  const g = game!;
  const p = g.players[g.turn];
  return `<aside class="sidebar"><section class="turn-card"><div class="eyebrow">${g.phase === PHASE.WON ? "PARTIDA TERMINADA" : "EN MOVIMIENTO"}<span>${g.rolls} TIRADAS</span></div><div class="current-player">${token(g.turn)}<div><small>${g.phase === PHASE.WON ? "¡Ganó la partida!" : "Es tu turno,"}</small><h2>${esc(p.name)}</h2></div></div><div class="dice-tray">${(g.dice.length ? g.dice : [1, 1]).map(diceFace).join("")}</div><p class="dice-caption">${p.trapped ? "Resolvé el reto para desbloquearte." : p.skipped ? "Tu mecanismo necesita mantenimiento." : g.phase === PHASE.WON ? "El ingenio llegó a la meta." : p.position >= 60 ? "Tramo final: un dado y llegada exacta." : "Dos dados. Un nuevo movimiento."}</p><button class="primary" data-action="roll" ${g.phase !== PHASE.READY || rolling ? "disabled" : ""}>${rolling ? "Lanzando…" : p.skipped ? "Cumplir turno de espera" : "Lanzar dados"}<span>↗</span></button><span class="keyboard-hint">${g.phase === PHASE.READY ? "o presioná la barra espaciadora" : " "}</span></section><section class="players-card"><div class="section-title"><h3>La mesa</h3><span>${g.players.length} JUGADORES</span></div>${g.players.map((player, i) => `<div class="player-row ${i === g.turn ? "active" : ""}">${token(i, true)}<div class="player-info"><b>${esc(player.name)} ${i === g.turn ? "<i>●</i>" : ""}</b><small>${player.trapped ? "Bloqueado · resolver reto" : player.skipped ? "Mantenimiento pendiente" : `${player.correct} retos resueltos`}</small><div class="progress"><span class="player-${i}" style="width:${(player.position / 63) * 100}%"></span></div></div><strong>${String(player.position).padStart(2, "0")}<small>/63</small></strong></div>`).join("")}</section><section class="history-card"><div class="section-title"><h3>Bitácora</h3><span>ÚLTIMOS MOVIMIENTOS</span></div><ol>${g.log
    .slice(0, 5)
    .map(
      (l, i) =>
        `<li><span>${String(g.log.length - i).padStart(2, "0")}</span>${esc(l)}</li>`,
    )
    .join(
      "",
    )}</ol></section><button class="restart" data-action="restart">↶ Nueva partida</button></aside>`;
}
function play() {
  return `<main class="play"><div class="play-title"><div><span class="eyebrow">LA OCA DE LOS MECANISMOS</span><h1>Que empiece el movimiento<span>.</span></h1></div><span class="save-status">${storageAvailable ? "◈ Partida guardada en este navegador" : "⚠ Guardado no disponible"}</span></div><div class="game-layout">${board()}${sidebar()}</div></main>`;
}
function modalBody() {
  if (overlay === "rules")
    return `<span class="eyebrow">REGLAMENTO · ADAPTACIÓN EDUCATIVA</span><h2>De la teoría al tablero.</h2><p>De 2 a 4 personas en una misma pantalla. Gana quien llega a la casilla 63.</p><div class="rules-list"><p><b>01 / Tirada y llegada</b>Dos dados por turno; desde la casilla 60, uno. Para llegar a 63 necesitás el número exacto: si te pasás, rebotás. Se pueden compartir casillas.</p><p><b>02 / Retos · las ocas</b>5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54 y 59. Acertá una pregunta sobre el diagrama: saltás al siguiente reto y repetís turno. Desde 59 llegás a la meta. Si venías rebotando, saltás al reto anterior. Fallar termina el turno.</p><p><b>03 / Corredera · el puente</b>6 ↔ 12 y volvés a tirar.</p><p><b>04 / Taller · la posada</b>En 19 perdés tu próximo turno.</p><p><b>05 / Pozo y cárcel</b>31 y 52. Acertar la pregunta te libera y te permite tirar; fallar te bloquea hasta tu próximo intento. No hace falta otro jugador para salir.</p><p><b>06 / Manivela · el laberinto</b>En 42 retrocedés a 30 y termina tu turno.</p><p><b>07 / Transmisión · los dados</b>26 ↔ 53 y volvés a tirar.</p><p><b>08 / Movilidad cero · la muerte</b>En 58 volvés a la salida. El triángulo con base fija representa una estructura sin movimiento.</p></div><p class="rule-note">Los saltos no activan otra vez la casilla de destino. No aplicamos la salida especial de 9 en la primera tirada ni intercambio de fichas. Estas son reglas de nuestra variante educativa, no una reproducción exacta de la imagen.</p><p class="rule-note">Referencia: <a href="https://www.playspace.com/es-es/pagina/reglas-del-juego-de-la-oca" target="_blank" rel="noreferrer">reglas del juego de la oca ↗</a>. Diagramas esquemáticos, no simulaciones físicas.</p><button class="primary" data-action="close">Entendido, a jugar ↗</button>`;
  if (overlay === "tile") {
    const t = tileAt(selectedTile);
    return `<span class="eyebrow">EXPLORAR · CASILLA ${t.number}</span><h2>${t.title}</h2><div class="inspect-diagram">${diagram(t.kind, t.title)}</div><p>${t.description}</p><button class="primary" data-action="close">Volver al tablero ↗</button>`;
  }
  if (overlay === "restart")
    return `<span class="eyebrow">EMPEZAR DE NUEVO</span><h2>¿Una nueva partida?</h2><p>Se borrará el progreso de la partida actual en este navegador.</p><button class="primary" data-action="confirm-restart">Sí, preparar otra partida</button><button class="quiet full" data-action="close">Seguir jugando</button>`;
  const g = game;
  if (g?.phase === PHASE.WON)
    return `<div class="victory"><span class="eyebrow">META ALCANZADA · CASILLA 63</span><div class="trophy">✳</div><h2>¡Bien jugado,<br>${esc(g.players[g.winner!].name)}!</h2><p>El movimiento también se aprende jugando.</p><div class="win-stats"><span><b>${g.players[g.winner!].correct}</b>retos resueltos</span><span><b>${g.rolls}</b>tiradas en la mesa</span></div><button class="primary" data-action="confirm-restart">Jugar otra vez ↗</button></div>`;
  if (g?.challenge) {
    const c = g.challenge;
    const feedback = g.phase === PHASE.FEEDBACK;
    return `<span class="eyebrow">${esc(g.players[g.turn].name)} · CASILLA ${g.players[g.turn].position}</span><h2>${g.players[g.turn].trapped ? "Desbloqueá el mecanismo." : "Tu ingenio abre camino."}</h2><div class="question-diagram">${diagram(c.question.kind, "Diagrama del reto")}</div><h3 class="question-prompt">${c.question.prompt}</h3><div class="answers">${c.question.answers.map((a, i) => `<button data-answer="${i}" ${feedback ? "disabled" : ""} class="answer ${feedback && i === c.question.correct ? "correct" : ""} ${feedback && i === c.selected && !c.correct ? "incorrect" : ""}"><span>${String.fromCharCode(65 + i)}</span>${a}${feedback && i === c.question.correct ? " ✓" : ""}</button>`).join("")}</div>${feedback ? `<div class="feedback ${c.correct ? "success" : "error"}" role="status"><b>${c.correct ? "¡Correcto!" : "Esta vez no. Aprendamos por qué:"}</b><p>${c.question.explanation}</p></div><button class="primary" data-action="continue">${c.correct ? "Continuar ↗" : "Siguiente turno ↗"}</button>` : '<p class="rule-note">Conversen sobre el diagrama y elijan una respuesta.</p>'}`;
  }
  return "";
}
function render() {
  const focusKey = (document.activeElement as HTMLElement | null)?.dataset
    .action;
  const body = modalBody();
  root.innerHTML = `<div class="page ${game ? "playing" : ""}" ${body ? "inert" : ""}>${header()}${game ? play() : setup()}<footer><span>OCA. <span>Un clásico con otra mecánica.</span></span><span>HECHO PARA MENTES EN MOVIMIENTO ↗</span></footer></div><div class="sr-only" aria-live="polite">${game ? esc(game.log[0]) + ` Turno de ${esc(game.players[game.turn].name)}.` : ""}</div>${body ? `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${overlay === "rules" ? "Cómo jugar" : overlay === "tile" ? "Detalle de casilla" : "Panel de partida"}" tabindex="-1">${overlay ? '<button class="modal-close" data-action="close" aria-label="Cerrar">✕</button>' : ""}${body}</section></div>` : ""}`;
  if (body) {
    document.querySelector<HTMLElement>(".modal")?.focus();
  } else if (focusKey) {
    document.querySelector<HTMLElement>(`[data-action="${focusKey}"]`)?.focus();
  }
}
async function throwDice() {
  if (!game || game.phase !== PHASE.READY || rolling || overlay) return;
  if (game.players[game.turn].skipped) {
    game = roll(game, []);
    save();
    render();
    return;
  }
  rolling = true;
  render();
  await new Promise((r) => setTimeout(r, 650));
  game = roll(game, randomDice(game.players[game.turn].position));
  rolling = false;
  save();
  render();
}
root.addEventListener("input", (e) => {
  if (
    e.target instanceof HTMLInputElement &&
    e.target.name.startsWith("player-")
  )
    names[Number(e.target.name.split("-")[1])] = e.target.value;
});
root.addEventListener("submit", (e) => {
  e.preventDefault();
  if ((e.target as HTMLElement).id === "setup-form") {
    game = createGame(names.slice(0, count));
    save();
    render();
  }
});
root.addEventListener("click", (e) => {
  const button = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!button || button.disabled) return;
  if (button.dataset.count) {
    count = Number(button.dataset.count);
    render();
    return;
  }
  if (button.dataset.tile) {
    selectedTile = Number(button.dataset.tile);
    overlay = "tile";
    render();
    return;
  }
  if (button.dataset.answer !== undefined && game) {
    game = answer(game, Number(button.dataset.answer));
    save();
    render();
    return;
  }
  if (!button.dataset.action) return;
  switch (button.dataset.action) {
    case "rules":
      overlay = "rules";
      break;
    case "close":
      overlay = "";
      break;
    case "restart":
      if (rolling) return;
      overlay = "restart";
      break;
    case "confirm-restart":
      game = null;
      overlay = "";
      save();
      break;
    case "roll":
      void throwDice();
      return;
    case "continue":
      if (game) game = continueGame(game);
      save();
      break;
  }
  render();
});
document.addEventListener("keydown", (e) => {
  const modal = document.querySelector<HTMLElement>(".modal");
  if (e.key === "Escape" && overlay) {
    overlay = "";
    render();
    return;
  }
  if (e.key === "Tab" && modal) {
    const items = [
      ...modal.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]"),
    ];
    const first = items[0],
      last = items.at(-1);
    if (
      e.shiftKey &&
      (document.activeElement === first || document.activeElement === modal)
    ) {
      e.preventDefault();
      last?.focus();
    } else if (
      !e.shiftKey &&
      (document.activeElement === last || document.activeElement === modal)
    ) {
      e.preventDefault();
      first?.focus();
    }
    return;
  }
  if (
    e.code === "Space" &&
    !modal &&
    !(e.target instanceof HTMLInputElement) &&
    !(e.target instanceof HTMLButtonElement) &&
    !(e.target instanceof HTMLAnchorElement)
  ) {
    e.preventDefault();
    void throwDice();
  }
});
render();
