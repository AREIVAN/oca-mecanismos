export const KIND = {
  LINK: "link",
  FOUR: "four",
  REVOLUTE: "revolute",
  SLIDER: "slider",
  CRANK: "crank",
  RIGID: "rigid",
} as const;
export type Kind = (typeof KIND)[keyof typeof KIND];
export const GEESE = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];
export interface Tile {
  number: number;
  title: string;
  kind: Kind;
  special: string;
  description: string;
}
export interface Question {
  id: string;
  kind: Kind;
  prompt: string;
  answers: string[];
  correct: number;
  explanation: string;
}
export const QUESTIONS: Question[] = [
  {
    id: "four-links",
    kind: KIND.FOUR,
    prompt: "¿Cuántos eslabones tiene este mecanismo, incluyendo el bastidor?",
    answers: ["Tres", "Cuatro", "Cinco"],
    correct: 1,
    explanation:
      "Son cuatro: el bastidor fijo y los tres eslabones móviles. El bastidor también cuenta como eslabón.",
  },
  {
    id: "four-pairs",
    kind: KIND.FOUR,
    prompt: "¿Qué tipo de pares conectan los eslabones en los cuatro círculos?",
    answers: ["Pares prismáticos", "Uniones rígidas", "Pares de revolución"],
    correct: 2,
    explanation:
      "Cada círculo representa un par de revolución: permite rotación relativa entre dos eslabones.",
  },
  {
    id: "four-ground",
    kind: KIND.FOUR,
    prompt: "¿Qué representa el eslabón inferior con apoyos rayados?",
    answers: ["El bastidor fijo", "Una corredera", "Un quinto eslabón"],
    correct: 0,
    explanation:
      "Los apoyos rayados identifican el bastidor, que permanece fijo y sirve de referencia al movimiento.",
  },
  {
    id: "four-mobility",
    kind: KIND.FOUR,
    prompt:
      "En una configuración regular, ¿cuántos grados de libertad tiene este cuatro barras plano?",
    answers: ["Cuatro", "Dos", "Uno"],
    correct: 2,
    explanation:
      "Para esta cadena plana de cuatro eslabones y cuatro pares de revolución: M = 3(4 − 1) − 2(4) = 1, fuera de configuraciones singulares.",
  },
  {
    id: "link",
    kind: KIND.LINK,
    prompt: "En el modelo cinemático, ¿qué se supone acerca de este eslabón?",
    answers: [
      "Que es rígido",
      "Que siempre está fijo",
      "Que debe ser circular",
    ],
    correct: 0,
    explanation:
      "Un eslabón se modela como un cuerpo rígido. Puede estar fijo o moverse y no necesita tener forma de barra.",
  },
  {
    id: "link-distance",
    kind: KIND.LINK,
    prompt:
      "¿Qué ocurre con la distancia entre los dos extremos de un eslabón rígido?",
    answers: ["Cambia al girar", "Permanece constante", "Siempre vale cero"],
    correct: 1,
    explanation:
      "La distancia entre puntos de un mismo cuerpo rígido permanece constante, aunque el cuerpo se traslade o gire.",
  },
  {
    id: "rev",
    kind: KIND.REVOLUTE,
    prompt: "¿Qué movimiento relativo permite este par de revolución plano?",
    answers: [
      "Giro alrededor de su eje",
      "Traslación libre en dos ejes",
      "Ningún movimiento",
    ],
    correct: 0,
    explanation:
      "El par de revolución permite un giro relativo y restringe las dos traslaciones relativas en el plano.",
  },
  {
    id: "rev-dof",
    kind: KIND.REVOLUTE,
    prompt: "¿Cuántos grados de libertad relativos permite este par plano?",
    answers: ["Tres", "Uno", "Dos"],
    correct: 1,
    explanation:
      "Un par de revolución plano tiene un grado de libertad relativo: el ángulo de giro.",
  },
  {
    id: "slide",
    kind: KIND.SLIDER,
    prompt: "¿Qué movimiento permite el bloque dentro de esta guía?",
    answers: [
      "Giro libre",
      "Traslación a lo largo de la guía",
      "Movimiento en cualquier dirección",
    ],
    correct: 1,
    explanation:
      "El par prismático permite una traslación relativa a lo largo de la guía e impide el giro relativo.",
  },
  {
    id: "slide-dof",
    kind: KIND.SLIDER,
    prompt: "¿Cómo se llama el par cinemático entre la corredera y su guía?",
    answers: ["Revolución", "Esférico", "Prismático"],
    correct: 2,
    explanation:
      "Se llama par prismático. En el plano permite un único grado de libertad de traslación.",
  },
  {
    id: "crank",
    kind: KIND.CRANK,
    prompt: "¿Qué distingue a una manivela de un balancín?",
    answers: [
      "Puede completar una vuelta de 360°",
      "Nunca gira",
      "Siempre se desplaza en línea recta",
    ],
    correct: 0,
    explanation:
      "Una manivela puede completar vueltas respecto del bastidor; un balancín oscila en un intervalo angular. No toda barra es una manivela.",
  },
  {
    id: "rigid",
    kind: KIND.RIGID,
    prompt:
      "Este triángulo articulado tiene su base fija. ¿Puede deformarse sin cambiar la longitud de las barras?",
    answers: [
      "Sí, tiene dos grados de libertad",
      "No, es una estructura rígida",
      "Sí, gira libremente",
    ],
    correct: 1,
    explanation:
      "Un triángulo no degenerado con barras rígidas y base fija tiene movilidad nula. Una placa libre, en cambio, sí puede moverse: no representa inmovilidad por sí sola.",
  },
];
const ordinary = [KIND.LINK, KIND.REVOLUTE, KIND.FOUR, KIND.SLIDER];
const names: Record<Kind, string> = {
  link: "Eslabón",
  four: "Cuatro barras",
  revolute: "Par de revolución",
  slider: "Par prismático",
  crank: "Manivela",
  rigid: "Estructura rígida",
};
export function tileAt(number: number): Tile {
  let kind: Kind = ordinary[(number - 1 + 4) % 4];
  let title = names[kind];
  let special = "";
  let description =
    "Casilla de estudio. Observá su diagrama; no tiene penalización.";
  if (GEESE.includes(number)) {
    kind = KIND.FOUR;
    title = "Reto cinemático";
    special = "oca";
    description =
      "Acertá la pregunta para saltar al siguiente reto y volver a tirar. Si fallás, te quedás aquí y termina tu turno. El salto no encadena otro reto.";
  }
  if ([6, 12].includes(number)) {
    kind = KIND.SLIDER;
    title = "Corredera";
    special = "bridge";
    description =
      "De corredera a corredera: 6 ↔ 12 y volvés a tirar. El destino no vuelve a activar el salto.";
  }
  if (number === 19) {
    kind = KIND.LINK;
    title = "Taller · posada";
    special = "inn";
    description = "Parada de mantenimiento: perdés tu próximo turno.";
  }
  if (number === 31 || number === 52) {
    kind = number === 31 ? KIND.REVOLUTE : KIND.SLIDER;
    title = number === 31 ? "Pozo · atasco" : "Cárcel · bloqueo";
    special = "trap";
    description =
      "Respondé para desbloquear el mecanismo y tirar. Si fallás, podés intentarlo en tu próximo turno con otra pregunta. No dependés de que otro jugador llegue.";
  }
  if (number === 42) {
    kind = KIND.CRANK;
    title = "Manivela · laberinto";
    special = "maze";
    description =
      "Una vuelta de más: retrocedés a la casilla 30 y termina tu turno.";
  }
  if ([26, 53].includes(number)) {
    kind = KIND.REVOLUTE;
    title = "Transmisión · dados";
    special = "dice";
    description =
      "De transmisión a transmisión: 26 ↔ 53 y volvés a tirar. No se encadenan los saltos.";
  }
  if (number === 58) {
    kind = KIND.RIGID;
    title = "Movilidad cero";
    special = "death";
    description =
      "Una estructura triangular con base fija no tiene movilidad: volvés a la salida.";
  }
  if (number === 63) {
    kind = KIND.FOUR;
    title = "Meta";
    special = "finish";
    description =
      "Llegá con la tirada exacta. Si te pasás, rebotás hacia atrás. También podés ganar resolviendo el reto de la casilla 59.";
  }
  return { number, kind, title, special, description };
}
export function questionFor(kind: Kind, seed: number): Question {
  const pool = QUESTIONS.filter((q) => q.kind === kind);
  return pool[seed % pool.length];
}
